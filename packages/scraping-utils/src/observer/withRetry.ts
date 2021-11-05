import { BasicQueue, Subscriber } from "../queue/createQueue";

interface WithRetryMessage {
  attempt: number;
}
/**
 * On error, it sends a message back to queue if it hasn't failed more than @param retryCount times.
 */
export const withRetry = (queue: BasicQueue<any>, retryCount: number) => <
  ParentT extends WithRetryMessage
>(
  observer: Subscriber<ParentT>
) => ({
  next: (message: ParentT) => {
    return observer.next(message);
  },
  error: (error: Error, message: ParentT) => {
    if (message.attempt < retryCount) {
      queue.enqueue({
        ...message,
        attempt: message.attempt + 1,
      });
      return
    }
    observer.error(error, message);
  },
  complete: () => observer.complete(),
});