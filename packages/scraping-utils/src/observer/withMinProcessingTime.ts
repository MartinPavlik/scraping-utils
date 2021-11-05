import { Subscriber } from "../queue/createQueue";
import { delay } from '../utils/delay';

/**
 * If processing of the message takes less than @param timeMs,
 * then it will take exactly @param timeMs
 */
 export const withMinProcessingTime = (timeMs: number) => <ParentT>(
  observer: Subscriber<ParentT>
): Subscriber<ParentT> => ({
  next: (message: ParentT) =>
    Promise.all([observer.next(message), delay(timeMs)])
      // Return undefined to satisfy next signature Promise<void>
      .then(() => {}),
  error: observer.error,
  complete: observer.complete,
});