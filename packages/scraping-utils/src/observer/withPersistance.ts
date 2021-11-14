import { Storage } from "../storage/shared";
import { BasicQueue, Subscriber } from "../queue/createQueue";

const DEFAULT_INTERVAL_MS = 60 * 1000;

export const persistQueuePayloads =
  <Payload>(storage: Storage<Payload>) =>
  async (queue: BasicQueue<Payload>) =>
    storage.write(queue.getQueue());

export const loadQueuePayloads = <Payload>(
  storage: Storage<Payload>
): Promise<Payload[]> => storage.read();

export const loadQueuePayloadsOr =
  <Payload>(storage: Storage<Payload>) =>
  async (initialPayloads: Payload[]) => {
    const payloads = await loadQueuePayloads(storage);
    if (!payloads || !payloads.length) return initialPayloads;
    return payloads;
  };

export const clearQueuePayloads = (storage: Storage<any>): Promise<void> =>
  storage.clear();

export const withPersistance =
  <PersistedPayload>(
    storage: Storage<PersistedPayload>,
    queue: BasicQueue<PersistedPayload>,
    intervalMs: number = DEFAULT_INTERVAL_MS
  ) =>
  <Payload extends PersistedPayload>(
    observer: Subscriber<Payload, PersistedPayload>
  ): Subscriber<Payload, PersistedPayload> => {
    let interval: NodeJS.Timer | undefined = undefined;

    const persist = () => {
      persistQueuePayloads(storage)(queue);
    };

    const startInterval = () => {
      if (interval) return;
      interval = setInterval(persist, intervalMs);
    };

    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
      }
      interval = undefined;
    };

    return {
      next: (payload: Payload) => {
        startInterval();
        return observer.next(payload);
      },
      error: (...args) => {
        startInterval();
        return observer.error(...args);
      },
      complete: async () => {
        stopInterval();
        // TODO - there might be an issue when the queue is being written to a file and this calls clearQueuePayloads...
        await clearQueuePayloads(storage);
        return observer.complete();
      },
    };
  };
