/**
 * @FinalMessageType the message type that is sent to next (after all transformations have been applied)
 * @QueueMessageType the message type that is saved in the queue (before all transformations)
 */
export type Subscriber<
  Payload extends PersistedPayload,
  PersistedPayload = Payload
> = {
  next: (message: Payload) => Promise<void>;
  error: (error: Error, message: PersistedPayload) => void;
  complete: () => void;
};

export type PartialSubscriber<
  Payload extends PersistedPayload,
  PersistedPayload = Payload
> = Partial<Subscriber<Payload, PersistedPayload>>;

export type BasicQueue<PersistedPayload> = {
  enqueue: (message: PersistedPayload) => void;
  subscribe: (subscriber: Subscriber<PersistedPayload>) => void;
  getQueue: () => PersistedPayload[];
};

export type QueueConfig = {
  parallelLimit?: number;
};

const defaultConfig = {
  parallelLimit: 1,
};

export function createQueue<PersistedPayload>(
  config: QueueConfig = {}
): BasicQueue<PersistedPayload> {
  const { parallelLimit } = {
    ...defaultConfig,
    ...config,
  };

  if (parallelLimit < 1) {
    throw new Error("Parallel limit must be higher than 0");
  }

  const subscribers: Subscriber<PersistedPayload>[] = [];

  let internalQueue: PersistedPayload[] = [];
  let runningCount = 0;

  const dispatch = () => {
    if (!internalQueue.length) {
      return;
    }

    runningCount++;
    let [message, ...nextInternalQueue] = internalQueue;
    internalQueue = nextInternalQueue;
    Promise.allSettled([
      ...subscribers.map((subscriber) =>
        subscriber.next(message).catch((error: Error) => {
          subscriber.error(error, message);
          throw error;
        })
      ),
    ]).finally(() => {
      runningCount--;
      tryToRun();
    });
  };

  const tryToRun = () => {
    if (runningCount >= parallelLimit) return;
    if (!subscribers.length) {
      return;
    }
    if (!internalQueue.length && !runningCount) {
      subscribers.forEach((subscriber) => subscriber.complete());
      return;
    }
    if (!internalQueue.length) {
      return;
    }

    const freeSlots = parallelLimit - runningCount;

    new Array(freeSlots).fill(0).forEach(dispatch);
  };

  return {
    enqueue: (message: PersistedPayload) => {
      internalQueue = [...internalQueue, message];
      tryToRun();
    },
    subscribe: (subscriber: Subscriber<PersistedPayload>) => {
      subscribers.push(subscriber);
      tryToRun();
    },
    getQueue: () => internalQueue,
  };
}
