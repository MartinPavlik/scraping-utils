import fetch from 'node-fetch'
import { createQueue, Subscriber, withRetry } from ".."


// Let's create our queue
type Payload = {
  url: string
  attempt: number
}

const queue = createQueue<Payload>()

// Add some items to the queue
queue.enqueue({
  url: 'https://fsharpforfunandprofit.com/',
  attempt: 0,
})
queue.enqueue({
  url: 'https://github.com/gcanti/fp-ts',
  attempt: 0,
})

// Define our 'crawler'
const crawler: Subscriber<Payload> = {
  // For each payload, call this function
  next: (payload) => fetch(payload.url).then(response => {
    // Let's fake some errors
    if (payload.attempt < 3 && payload.url === 'https://fsharpforfunandprofit.com/') {
      console.error(`Throwing an error for the ${payload.attempt}nth time`)
      throw new Error(`Ha! I failed to fetch ${payload.url}`)
    }
    console.log("Uhuu, response from ", payload.url, ' is ', response.status, `(attempt: ${payload.attempt})`)
  }),
  // When there is an error, we want to be notified about it along with the original payload that caused the error.
  error: (error, payload) => {
    console.error(`Upps, could not process ${payload.url}, error: `, error)
  },
  // When we are done, the queue will call this function.
  complete: () => {
    console.log("We are done, all urls crawled!")
  }
}

const crawlerWithRetry = withRetry(queue, 3)(crawler)

// Let's start the processing by subscribing to the queue
queue.subscribe(crawlerWithRetry);

// Output:
/*
Uhuu, response from  https://fsharpforfunandprofit.com/  is  200
Uhuu, response from  https://github.com/gcanti/fp-ts  is  200
We are done, all urls crawled!
*/