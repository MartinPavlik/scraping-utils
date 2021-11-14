import { pipe, Subscriber, withRetry } from "../";
import { withMaxProcessingTime } from "../observer/withMaxProcessingTime";
import { withMinProcessingTime } from "../observer/withMinProcessingTime";
import {
  loadQueuePayloadsOr,
  withPersistance,
} from "../observer/withPersistance";
import { PayloadWithAttempt } from "../observer/withRetry";
import { withStatistics } from "../observer/withStatistics";
import { BasicQueue, PartialSubscriber } from "../queue/createQueue";
import { identity } from "../utils/identity";
import { PersistanceConfig, StatisticsConfig } from "./shared";

export const runBasicQueue = async <
  PersistedPayload extends PayloadWithAttempt
>({
  queue,
  crawler,
  maxProcessingTime,
  minProcessingTime,
  retryAttempts = 1,
  statistics,
  persistance,
}: {
  queue: BasicQueue<PersistedPayload>;
  crawler: PartialSubscriber<PersistedPayload>;
  maxProcessingTime?: number;
  minProcessingTime?: number;
  retryAttempts?: number;
  statistics?: StatisticsConfig;
  persistance?: PersistanceConfig<PersistedPayload>;
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
