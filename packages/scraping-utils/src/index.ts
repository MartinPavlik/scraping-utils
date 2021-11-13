import { Page } from 'puppeteer';
import { createQueue, Subscriber, BasicQueue, PartialSubscriber } from "./queue/createQueue"
import { withRetry } from "./observer/withRetry"
import { withMaxProcessingTime, isTimeoutError } from "./observer/withMaxProcessingTime"
import { withMinProcessingTime  } from "./observer/withMinProcessingTime"
import { pipe } from './utils/pipe';
import { delay } from './utils/delay';
import { runPuppeteerQueue } from './runner/runPuppeteerQueue';
import { runBasicQueue } from './runner/runBasicQueue';
import { StatisticsConfig } from './runner/shared';
import { StatisticsReport, StatisticsReportHanlder, withStatistics } from './observer/withStatistics';
import { withPuppeteerPage } from './observer/withPuppeteerPage';
import { identity } from './utils/identity';

export {
  createQueue,
  delay,
  identity,
  isTimeoutError,
  pipe,
  runBasicQueue,
  runPuppeteerQueue,
  withMaxProcessingTime,
  withMinProcessingTime,
  withPuppeteerPage,
  withRetry,
  withStatistics,
}

export type {
  BasicQueue,
  Page,
  PartialSubscriber,
  StatisticsConfig,
  StatisticsReport,
  StatisticsReportHanlder,
  Subscriber,
}
