import { PayloadWithAttempt } from "../observer/withRetry";
import { identity } from "../utils/identity";
import { pipe, Subscriber, withRetry } from "../";
import { withMaxProcessingTime } from "../observer/withMaxProcessingTime";
import { withMinProcessingTime } from "../observer/withMinProcessingTime";
import { PayloadWithPage, withPuppeteerPage, PuppeteerNodeLaunchOptions } from "../observer/withPuppeteerPage";
import { BasicQueue, PartialSubscriber } from "../queue/createQueue";
import { withStatistics } from "../observer/withStatistics";
import { StatisticsConfig } from "./shared";

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
}: {
  queue: BasicQueue<Omit<Payload, 'page'> & PersistedPayload>;
  crawler: PartialSubscriber<Payload, PersistedPayload>;
  maxProcessingTime?: number;
  minProcessingTime?: number;
  retryAttempts?: number;
  puppeteerLaunchOptions?: PuppeteerNodeLaunchOptions;
  statistics?: StatisticsConfig;
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
    statistics ? withStatistics(queue, statistics.onStatisticsReport, statistics.intervalMs) : identity,
  )

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
