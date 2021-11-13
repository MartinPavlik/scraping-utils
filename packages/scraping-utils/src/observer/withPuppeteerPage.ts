import { Subscriber } from "../queue/createQueue";
import puppeteer, {
  Page,
  Browser,
  PuppeteerNodeLaunchOptions,
} from "puppeteer";

export type { PuppeteerNodeLaunchOptions };

export interface PayloadWithPage {
  page: Page;
}

/**
 * Returns a new observer that receives a new puppeteer page as a part of the message. The pages is closed when the .next method resolves.
 *
 * Note - it is important to call .complete at the end of scraping to destroy the created browser.
 *
 * @param launchOptions Generic launch options that are passed directly to puppeteer while launching a new browser.
 */
export const withPuppeteerPage =
  (launchOptions?: PuppeteerNodeLaunchOptions) =>
  <
    Payload extends PersistedPayload & PayloadWithPage,
    PersistedPayload = Payload
  >(
    // Observer must know that he will recieve 'page' in its payload already
    observer: Subscriber<Payload, PersistedPayload> //: Subscriber<Omit<Payload, 'page'>, PersistedPayload>
  ): Subscriber<Omit<Payload, "page"> & PersistedPayload, PersistedPayload> => {
    let browser: Browser | undefined;
    let initializingPromise: Promise<void> | undefined;

    /**
     * If there is a launched browser, it calls .close on it.
     */
    const destroyBrowser = async (): Promise<void> => {
      if (browser) {
        await browser.close();
        browser = undefined;
      }
    };

    const getBrowser = async (): Promise<Browser> => {
      // This trick ensures that 1 withPuppeteerPage will create only 1 instance of a browser
      if (initializingPromise) {
        await initializingPromise;
      }
      if (!browser) {
        initializingPromise = new Promise((resolve) => {
          puppeteer.launch(launchOptions).then((result) => {
            console.log("ppt launched!");
            browser = result;
            resolve();
          });
        });

        await initializingPromise;
      }
      if (!browser) {
        throw new Error("Can not initialized puppeteer browser");
      }
      return browser;
    };

    const createPage = async (): Promise<Page> => {
      const browser = await getBrowser();
      return browser.newPage();
    };

    return {
      next: (message: Omit<Payload, "page">) =>
        Promise.resolve(createPage()).then((page) =>
          observer
            .next({
              ...message,
              page,
            } as any) // TODO - get rid of any
            .finally(async () => {
              await page.close();
            })
        ),
      error: observer.error,
      complete: () => {
        destroyBrowser();
        observer.complete();
      },
    };
  };
