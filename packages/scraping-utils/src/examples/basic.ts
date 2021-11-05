import fetch from 'node-fetch'
import { createQueue, Subscriber } from "../queue/createQueue"

// Let's create our queue
type Payload = {
  url: string
}

const queue = createQueue<Payload>()

// Add some items to the queue
queue.enqueue({
  url: 'https://fsharpforfunandprofit.com/',
})
queue.enqueue({
  url: 'https://github.com/gcanti/fp-ts',
})

// Define our 'crawler'
const crawler: Subscriber<Payload> = {
  // For each payload, call this function
  next: (payload) => fetch(payload.url).then((response) => {
    console.log("Uhuu, response from ", payload.url, ' is ', response.status)
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

// Let's start the processing by subscribing to the queue
queue.subscribe(crawler);

// Output:
/*
Uhuu, response from  https://fsharpforfunandprofit.com/  is  200
Uhuu, response from  https://github.com/gcanti/fp-ts  is  200
We are done, all urls crawled!
*/