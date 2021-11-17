import {
  createQueue,
  PartialSubscriber,
  runPuppeteerQueue,
} from "@satankebab/scraping-utils";
import { Page } from "puppeteer";

const crawlSomething = async () => {
  // Define a shape of a data we want to store in our queue
  type Payload = {
    url: string;
    attempt: number;
  };

  // Create a queue
  const queue = createQueue<Payload>({
    parallelLimit: 1,
  });

  // Add some initial items to the queue
  queue.enqueue({
    url: "https://fsharpforfunandprofit.com/",
    attempt: 0,
  });
  queue.enqueue({
    url: "https://github.com/gcanti/fp-ts",
    attempt: 0,
  });
  queue.enqueue({
    url: "https://elm-lang.org/",
    attempt: 0,
  });
  queue.enqueue({
    url: "https://github.com/Effect-TS/core",
    attempt: 0,
  });

  type PayloadWithPage = Payload & {
    page: Page;
  };

  const crawler: PartialSubscriber<PayloadWithPage, Payload> = {
    // For each payload, call this function
    next: async ({ url, page }) => {
      console.log("Crawling :", url);
      const response = await page.goto(url).then((r) => r.text());
      console.log(
        "response (first 100 chars):",
        response.slice(0, 100),
        "\n\n\n"
      );
    },
    // When there is an error, we want to be notified about it along with the original payload that caused the error.
    error: (_, payload) => {
      console.error(
        `Upps, could not process ${payload.url}`,
        `attempt: ${payload.attempt}`
      );
    },
  };

  // Consume payloads from the queue and resolve when the queue is empty
  await runPuppeteerQueue({
    queue,
    crawler,
    // Max time in ms crawler's next function can be processing (timeouting crawling that takes too long)
    maxProcessingTime: 2 * 60 * 1000,
    // Min time in ms crawler's next function can be processing (slowing down crawling that is too fast)
    minProcessingTime: 5 * 1000,
    // How many numbers do we want to try the same payload until we call crawler's .error method
    retryAttempts: 2,
    // Options that are directly passed to puppeteer's .launch method
    puppeteerLaunchOptions: { headless: true },
  });

  console.log("We are done!");
};

crawlSomething();
