# Scraping Utils

Zero dependency library that offers simple queue that is handy when scraping websites.

Features:
- retrying on errors (`withRetry`)
- definining minimum and maximum time of a message to be processed (`withMinProcessingTime`, `withMaxProcessingTime`)
  - minimum time is handy if you want to slow down scraping
- parallelism can be configured (`parallelLimit`)

## Installation

```
npm install @satankebab/scraping-utils;
```

## Queues - basic usage
```ts
import fetch from 'node-fetch'
import { createQueue, Subscriber } from "@satankebab/scraping-utils"

type Message = {
  url: string
}


// Create a new queue
const queue = createQueue<Message>({
  parallelLimit: 1
})

// Add some items to the queue
queue.enqueue({
  url: 'https://fsharpforfunandprofit.com/',
})
queue.enqueue({
  url: 'https://github.com/gcanti/fp-ts',
})

// Define our 'crawler' (observer)
const crawler: Subscriber<Message> = {
  // For each message, call this function
  next: (message) => fetch(message.url).then(response => {
    console.log("Uhuu, response from ", message.url, ' is ', response.status)
  }),
  // When there is an error, we want to be notified about it along with the original message that caused the error.
  error: (error, message) => {
    console.error(`Upps, could not process ${message.url}, error: `, error)
  },
  // When we are done, the queue will call this function.
  complete: () => {
    console.log("We are done, all urls crawled!")
  }
}

// Let's start the processing by subscribing to the queue
queue.subscribe(crawler);

// Output:
/*
Uhuu, response from  https://fsharpforfunandprofit.com/  is  200
Uhuu, response from  https://github.com/gcanti/fp-ts  is  200
We are done, all urls crawled!
*/
```

## Modifying crawlers

### Retrying on errors - `withRetry`

In case that crawler's `next` function throws an error, we would like to try the same message later again.
To do this, we can use `withRetry` wrapper that adds this functionality to our crawler.

First of all, we need to slightly adjust our message type by adding property `attempt`:
```ts
type Message = {
  url: string
  attempt: number
}
```

and then wrap the crawler with `withRetry` like this:
```ts
const crawlerWithRetry = withRetry(queue, 3)(crawler)
```

A full example:
```ts
import fetch from 'node-fetch'
import { createQueue, Subscriber, withRetry } from "@satankebab/scraping-utils"


// Change the type of Message
type Message = {
  url: string
  attempt: number
}

const queue = createQueue<Message>()

queue.enqueue({
  url: 'https://fsharpforfunandprofit.com/',
  attempt: 0,
})
queue.enqueue({
  url: 'https://github.com/gcanti/fp-ts',
  attempt: 0,
})

const crawler: Subscriber<Message> = {
  next: (message) => fetch(message.url).then(response => {
    // Let's fake some errors
    if (message.attempt < 3 && message.url === 'https://fsharpforfunandprofit.com/') {
      console.error(`Throwing an error for the ${message.attempt}nth time`)
      throw new Error(`Ha! I failed to fetch ${message.url}`)
    }
    console.log("Uhuu, response from ", message.url, ' is ', response.status, `(attempt: ${message.attempt})`)
  }),
  error: (error, message) => {
    console.error(`Upps, could not process ${message.url}, error: `, error)
  },
  complete: () => {
    console.log("We are done, all urls crawled!")
  }
}

// Wrap crawler with `withRetry`
const crawlerWithRetry = withRetry(queue, 3)(crawler)

queue.subscribe(crawlerWithRetry);

// Output:
/*
Throwing an error for the 0nth time
Uhuu, response from  https://github.com/gcanti/fp-ts  is  200 (attempt: 0)
Throwing an error for the 1nth time
Throwing an error for the 2nth time
Uhuu, response from  https://fsharpforfunandprofit.com/  is  200 (attempt: 3)
We are done, all urls crawled!
*/
```


### Controlling the "processing" speed - `withMinProcessingTime` and `withMaxProcessingTime`

```ts
import fetch from 'node-fetch'
import {
  pipe,
  delay,
  createQueue,
  Subscriber,
  withMaxProcessingTime,
  withMinProcessingTime,
  withRetry,
} from '@satankebab/scraping-utils'


// Let's create our queue
type Message = {
  url: string
  attempt: number
}

const queue = createQueue<Message>()

// Add some items to the queue
queue.enqueue({
  url: 'https://fsharpforfunandprofit.com/',
  attempt: 0,
})

const logWithTime = (...messages) => console.log(new Date().toTimeString(), ...messages)

// Define our 'crawler'
const crawler: Subscriber<Message> = {
  // For each message, call this function
  next: async (message) => {
    // Let's slow down the first two attempts
    if (message.url === 'https://fsharpforfunandprofit.com/' && message.attempt < 2) {
      logWithTime('Waiting for: fsharpforfunandprofit (30s), attempt:', message.attempt)
      await delay(30000)
    }
    const response = await fetch(message.url)
    logWithTime("Uhuu, response from ", message.url, ' is ', response.status, ', attempt:', message.attempt)
  },
  // When there is an error, we want to be notified about it along with the original message that caused the error.
  error: (error, message) => {
    console.error(`Upps, could not process ${message.url}, error: `, error)
  },
  // When we are done, the queue will call this function.
  complete: () => {
    logWithTime("We are done, all urls crawled!")
  }
}


const enhancedCrawler: Subscriber<Message> = pipe(
  crawler,
  withMinProcessingTime(5 * 1000),
  withMaxProcessingTime(20 * 1000),
  withRetry(queue, 3),
)


// Let's start the processing by subscribing to the queue
queue.subscribe(enhancedCrawler);

// Output:
/*
21:19:13 GMT+0100 (Central European Standard Time) Waiting for: fsharpforfunandprofit (30s), attempt: 0
21:19:33 GMT+0100 (Central European Standard Time) Waiting for: fsharpforfunandprofit (30s), attempt: 1
// NOTE 1*
21:19:45 GMT+0100 (Central European Standard Time) Uhuu, response from  https://fsharpforfunandprofit.com/  is  200 , attempt: 0
21:19:54 GMT+0100 (Central European Standard Time) Uhuu, response from  https://fsharpforfunandprofit.com/  is  200 , attempt: 2
21:19:58 GMT+0100 (Central European Standard Time) We are done, all urls crawled!
// NOTE 2*
21:20:06 GMT+0100 (Central European Standard Time) Uhuu, response from  https://fsharpforfunandprofit.com/  is  200 , attempt: 1
*/
```

> **NOTE 1 & NOTE 2** - currently there is no option to cancel already pending promises.

