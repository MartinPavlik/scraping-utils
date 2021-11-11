import { Page } from 'puppeteer';
import { createQueue, Subscriber, BasicQueue, PartialSubscriber } from "./queue/createQueue"
import { withRetry } from "./observer/withRetry"
import { withMaxProcessingTime, isTimeoutError } from "./observer/withMaxProcessingTime"
import { withMinProcessingTime  } from "./observer/withMinProcessingTime"
import { pipe } from './utils/pipe';
import { delay } from './utils/delay';
import { runPuppeteerQueue } from './runner/runPuppeteerQueue';

export {
  createQueue,
  withRetry,
  withMinProcessingTime,
  isTimeoutError,
  withMaxProcessingTime,
  delay,
  pipe,
  runPuppeteerQueue,
}

export type {
  Subscriber,
  PartialSubscriber,
  BasicQueue,
  Page,
}