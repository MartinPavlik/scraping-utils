import { PayloadWithAttempt } from "../observer/withRetry";
import { identity } from "../utils/identity";
import { pipe, Subscriber, withRetry } from "../";
import { withMaxProcessingTime } from "../observer/withMaxProcessingTime";
import { withMinProcessingTime } from "../observer/withMinProcessingTime";
import {
  PayloadWithPage,
  withPuppeteerPage,
  PuppeteerNodeLaunchOptions,
} from "../observer/withPuppeteerPage";
import { BasicQueue, PartialSubscriber } from "../queue/createQueue";
import { withStatistics } from "../observer/withStatistics";
import { PersistanceConfig, StatisticsConfig } from "./shared";
import {
  loadQueuePayloadsOr,
  withPersistance,
} from "../observer/withPersistance";

export const runPuppeteerQueue = async <
  Payload extends PersistedPayload & PayloadWithPage,
  PersistedPayload extends PayloadWithAttempt
>({
  queue,
  crawler,
  maxProcessingTime,
  minProcessingTime,
  retryAttempts = 1,
  puppeteerLaunchOptions = {},
  statistics,
  persistance,
}: {
  queue: BasicQueue<Omit<Payload, "page"> & PersistedPayload>;
  crawler: PartialSubscriber<Payload, PersistedPayload>;
  maxProcessingTime?: number;
  minProcessingTime?: number;
  retryAttempts?: number;
  puppeteerLaunchOptions?: PuppeteerNodeLaunchOptions;
  statistics?: StatisticsConfig;
  persistance?: PersistanceConfig<Omit<Payload, "page"> & PersistedPayload>;
}): Promise<void> => {
  const unitSubscriber: Subscriber<any, any> = {
    next: () => Promise.resolve(),
    error: () => {},
    complete: () => {},
  };

  const finalCrawler = pipe(
    {
      ...unitSubscriber,
      ...crawler,
    },
    maxProcessingTime ? withMaxProcessingTime(maxProcessingTime) : identity,
    minProcessingTime ? withMinProcessingTime(minProcessingTime) : identity,
    withPuppeteerPage(puppeteerLaunchOptions),
    withRetry(queue, retryAttempts),
    statistics
      ? withStatistics(
          queue,
          statistics.onStatisticsReport,
          statistics.intervalMs
        )
      : identity,
    persistance
      ? withPersistance(persistance.storage, queue, persistance.intervalMs)
      : identity
  );

  if (persistance) {
    const payloads = await loadQueuePayloadsOr(persistance.storage)(
      persistance.initialPayloads || []
    );

    payloads.forEach(queue.enqueue);
  }

  queue.subscribe(finalCrawler);

  // Wait for the queue to finish, then resolve
  return new Promise((complete) => {
    // Resolve the wrapping promise on completion so we can await for the queue to finish...
    queue.subscribe({
      ...unitSubscriber,
      complete: () => complete(),
    });
  });
};
