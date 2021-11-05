/**
 * @FinalMessageType the message type that is sent to next (after all transformations have been applied)
 * @QueueMessageType the message type that is saved in the queue (before all transformations)
 */
export type Subscriber<
  FinalMessageType,
  QueueMessageType = FinalMessageType
> = {
  next: (message: FinalMessageType) => Promise<void>;
  error: (error: Error, message: QueueMessageType) => void;
  complete: () => void;
};

export type BasicQueue<QueueMessageType> = {
  enqueue: (message: QueueMessageType) => void;
  subscribe: (subscriber: Subscriber<QueueMessageType>) => void;
  getQueue: () => QueueMessageType[];
};

export type QueueConfig = {
  parallelLimit?: number
}

const defaultConfig = {
  parallelLimit: 1
}

/**
 * Allows only 1 messsage to be processed at once.
 */
export function createQueue<QueueMessageType>(config: QueueConfig = {}): BasicQueue<QueueMessageType> {
  const {
    parallelLimit
  } = {
    ...defaultConfig,
    ...config,
  }
  
  if (parallelLimit < 1) {
    throw new Error('Parallel limit must be higher than 0')
  }

  const subscribers: Subscriber<QueueMessageType>[] = [];

  let internalQueue: QueueMessageType[] = [];
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
  }

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
    enqueue: (message: QueueMessageType) => {
      internalQueue = [...internalQueue, message];
      tryToRun();
    },
    subscribe: (subscriber: Subscriber<QueueMessageType>) => {
      subscribers.push(subscriber);
      tryToRun();
    },
    getQueue: () => internalQueue,
  };
}
