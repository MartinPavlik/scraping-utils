import { PayloadWithAttempt } from "src/observer/withRetry";
import { pipe, Subscriber, withRetry } from "../";
import { withMaxProcessingTime } from "../observer/withMaxProcessingTime";
import { withMinProcessingTime } from "../observer/withMinProcessingTime";
import { BasicQueue, PartialSubscriber } from "../queue/createQueue";
import { identity } from "../utils/identity";

export const runBasicQueue = async <
  Payload extends PersistedPayload,
  PersistedPayload extends PayloadWithAttempt
>({
  queue,
  crawler,
  maxProcessingTime,
  minProcessingTime,
  retryAttempts = 1,
}: {
  queue: BasicQueue<Payload & PersistedPayload>;
  crawler: PartialSubscriber<Payload, PersistedPayload>;
  maxProcessingTime?: number;
  minProcessingTime?: number;
  retryAttempts?: number;
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
    withRetry(queue, retryAttempts)
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
