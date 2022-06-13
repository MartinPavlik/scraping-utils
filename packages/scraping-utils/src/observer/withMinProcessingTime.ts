import { Subscriber } from "../queue/createQueue";
import { delay } from "../utils/delay";

type Handler<Payload> = (payload: Payload) => Promise<void>;

export const ensureMinProcessingTime =
  (timeMs: number) =>
  <Payload extends PersistedPayload, PersistedPayload = Payload>(
    handler: Handler<Payload>
  ) =>
  (payload: Payload) =>
    Promise.all([
      handler(payload)
        // This little trick ensures that even if the handler errors,
        // it will still wait for timeMs ms.
        .then((result) => ({
          result,
          isOk: true as const,
        }))
        .catch((error) => ({
          error,
          isOk: false as const,
        })),
      delay(timeMs),
    ]).then(([handlerResult]) => {
      if (!handlerResult.isOk) {
        throw handlerResult.error;
      }
      return handlerResult.result;
    });

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
