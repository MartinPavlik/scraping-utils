import { Subscriber } from "../queue/createQueue";

export class TimeoutError extends Error {
  isTimeoutError: boolean;
  constructor(message: string) {
    super(message);
    this.isTimeoutError = true;
  }
}

export const isTimeoutError = (error: Error & { isTimeoutError?: boolean }) =>
  Boolean(error.isTimeoutError);

type Handler<Payload> = (payload: Payload) => Promise<void>;

const limitMaxProcessingTime =
  (timeoutMs: number) =>
  <Payload extends PersistedPayload, PersistedPayload = Payload>(
    handler: Handler<Payload>
  ) =>
  (payload: Payload) =>
    new Promise<void>((resolve, reject) => {
      /*
    This could be easier to write with Promise.race like this:
      Promise.race([
        observer.next(message),
        delay(timeoutMs).then(() => {
          console.log('race delay throwing an error...')
          throw new TimeoutError('Processing timeouted');
        }),
      ]),
    But the issue is that the timoutMs can be quite big and the delay promise
    could be left hanging for a long time...
    */
      let resolved = false;
      const onTimeout = () => {
        if (!resolved) {
          reject(new TimeoutError("Processing timeouted"));
        }
      };

      const timeout = setTimeout(onTimeout, timeoutMs);
      handler(payload)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          resolved = true;
          clearTimeout(timeout);
        });
    });

/**
 * If processing of the message takes longer than @param timoutMs,
 * then error will be thrown.
 *
 * Note: it does not cancel the processing of the message (because of JS...)
 */
export const withMaxProcessingTime =
  (timeoutMs: number) =>
  <Payload extends PersistedPayload, PersistedPayload = Payload>(
    observer: Subscriber<Payload, PersistedPayload>
  ): Subscriber<Payload, PersistedPayload> => ({
    next: limitMaxProcessingTime(timeoutMs)(observer.next),
    error: observer.error,
    complete: observer.complete,
  });
