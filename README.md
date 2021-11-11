# Scraping Utils

Set of utils and queues to make web scraping easy. 

Features:
- automatic retrying on errors
- definining minimum and maximum time of a message to be processed
- parallelism can be configured

## Installation

```
npm install @satankebab/scraping-utils;
```

## Example usage
```ts
import { Page, createQueue, PartialSubscriber, runPuppeteerQueue } from "@satankebab/scraping-utils"

const crawlSomething = async () => {
  // Define a shape of the data we want to store in our queue
  type Payload = {
    url: string
    attempt: number
  }
  
  // Create a queue
  const queue = createQueue<Payload>({
    parallelLimit: 2
  })
  
  // Add some initial items to the queue
  queue.enqueue({
    url: 'https://fsharpforfunandprofit.com/',
    attempt: 0,
  })
  queue.enqueue({
    url: 'https://github.com/gcanti/fp-ts',
    attempt: 0,
  })
  queue.enqueue({
    url: 'https://elm-lang.org/',
    attempt: 0,
  })
  queue.enqueue({
    url: 'https://github.com/Effect-TS/core',
    attempt: 0,
  })
  
  // Define our 'crawler' and the type of the payload with puppeteer page
  type PayloadWithPage = Payload & {
    page: Page,
  }
  const crawler: PartialSubscriber<PayloadWithPage, Payload> = {
    // For each payload, call this function
    next: async ({ page, url }) => {
      await page.goto(url);
      console.log('The first 100 chars from response:', (await page.content()).slice(0, 100))
      // You can call queue.enqueue here to add more items to crawl here, for example:
      if (url === 'https://github.com/Effect-TS/core') {
        queue.enqueue({
          url: 'https://github.com/Effect-TS/monocle',
          attempt: 0,
        })
      }
    },
    // When there is an error, we want to be notified about it along with the original payload that caused the error.
    error: (error, payload) => {
      console.error(`Upps, could not process ${payload.url}, error: `, error, `, attempt: ${payload.attempt}`)
    },
  }
  
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
    puppeteerLaunchOptions: { headless: false } 
  })

  console.log('We are done!')
}


crawlSomething()
```
