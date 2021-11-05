import fetch from 'node-fetch'
import { withMaxProcessingTime } from '../observer/withMaxProcessingTime'
import { withMinProcessingTime } from '../observer/withMinProcessingTime'
import { pipe } from '../utils/pipe'
import { delay } from '../utils/delay';
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

const logWithTime = (...messages) => console.log(new Date().toTimeString(), ...messages)

// Define our 'crawler'
const crawler: Subscriber<Payload> = {
  // For each payload, call this function
  next: async (payload) => {
    if (payload.url === 'https://fsharpforfunandprofit.com/' && payload.attempt < 2) {
      logWithTime('Waiting for: fsharpforfunandprofit (30s), attempt:', payload.attempt)
      await delay(30000)
    }
    const response = await fetch(payload.url)
    logWithTime("Uhuu, response from ", payload.url, ' is ', response.status, ', attempt:', payload.attempt)
  },
  // When there is an error, we want to be notified about it along with the original payload that caused the error.
  error: (error, payload) => {
    console.error(`Upps, could not process ${payload.url}, error: `, error)
  },
  // When we are done, the queue will call this function.
  complete: () => {
    logWithTime("We are done, all urls crawled!")
  }
}


const enhancedCrawler: Subscriber<Payload> = pipe(
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

// NOTE 1 & 2
// 