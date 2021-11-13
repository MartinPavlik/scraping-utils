import { BasicQueue, Subscriber } from "../queue/createQueue";

export interface PayloadWithAttempt {
  attempt: number;
}
/**
 * On error, it sends a message back to queue if it hasn't failed more than @param retryCount times.
 */
export const withRetry =
  (queue: BasicQueue<any>, retryCount: number) =>
  <
    Payload extends PersistedPayload,
    PersistedPayload extends PayloadWithAttempt
  >(
    observer: Subscriber<Payload, PersistedPayload>
  ): Subscriber<Payload, PersistedPayload> => ({
    next: observer.next,
    error: (error: Error, message: PersistedPayload) => {
      if (message.attempt < retryCount) {
        queue.enqueue({
          ...message,
          attempt: message.attempt + 1,
        });
        return;
      }
      observer.error(error, message);
    },
    complete: () => observer.complete(),
  });
