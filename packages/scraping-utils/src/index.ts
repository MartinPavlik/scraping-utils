import { Page } from "puppeteer";
import {
  createQueue,
  Subscriber,
  BasicQueue,
  PartialSubscriber,
  QueueConfig,
} from "./queue/createQueue";
import { withRetry } from "./observer/withRetry";
import {
  withMaxProcessingTime,
  isTimeoutError,
} from "./observer/withMaxProcessingTime";
import { withMinProcessingTime } from "./observer/withMinProcessingTime";
import { pipe } from "./utils/pipe";
import { delay } from "./utils/delay";
import { runPuppeteerQueue } from "./runner/runPuppeteerQueue";
import { runBasicQueue } from "./runner/runBasicQueue";
import { StatisticsConfig } from "./runner/shared";
import {
  StatisticsReport,
  StatisticsReportHanlder,
  withStatistics,
} from "./observer/withStatistics";
import { withPuppeteerPage } from "./observer/withPuppeteerPage";
import { identity } from "./utils/identity";
import { Storage } from "./storage/shared";
import { createLocalStorage } from "./storage/localStorage";
import { withPersistance } from "./observer/withPersistance";

export {
  createLocalStorage,
  createQueue,
  delay,
  identity,
  isTimeoutError,
  pipe,
  runBasicQueue,
  runPuppeteerQueue,
  withMaxProcessingTime,
  withMinProcessingTime,
  withPersistance,
  withPuppeteerPage,
  withRetry,
  withStatistics,
};

export type {
  BasicQueue,
  Page,
  PartialSubscriber,
  QueueConfig,
  StatisticsConfig,
  StatisticsReport,
  StatisticsReportHanlder,
  Storage,
  Subscriber,
};
