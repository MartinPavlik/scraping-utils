import { Subscriber } from "../queue/createQueue";
import { delay } from "../utils/delay";

type Handler<Payload> = (payload: Payload) => Promise<void>;

const ensureMinProcessingTime =
  (timeMs: number) =>
  <Payload extends PersistedPayload, PersistedPayload = Payload>(
    handler: Handler<Payload>
  ) =>
  (payload: Payload) =>
    Promise.all([handler(payload), delay(timeMs)])
      // Return undefined to satisfy next signature Promise<void>
      .then(() => {});

/**
 * If processing of the message takes less than @param timeMs,
 * then it will take exactly @param timeMs
 */
export const withMinProcessingTime =
  (timeMs: number) =>
  <Payload extends PersistedPayload, PersistedPayload = Payload>(
    observer: Subscriber<Payload, PersistedPayload>
  ): Subscriber<Payload, PersistedPayload> => ({
    next: ensureMinProcessingTime(timeMs)(observer.next),
    error: observer.error,
    complete: observer.complete,
  });
