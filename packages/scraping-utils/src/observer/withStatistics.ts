import { BasicQueue, Subscriber } from "../queue/createQueue";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

export type StatisticsReport = {
  messagesCount: number;
  errorsCount: number;
  inProgressCount: number;
  errorRate: number;
  intervalMs: number;
  queueSize: number;
};

export type StatisticsReportHanlder = (
  statisticsReport: StatisticsReport
) => void;

/**
 * It calls onStatisticsReport every intervalMs miliseconds with a statistics report object.
 *
 * Note: Make sure that onStatisticsReport never throws an error. The possible errors are not handled by this wrapper in any manner.
 */
export const withStatistics =
  (
    queue: BasicQueue<any>,
    onStatisticsReport: StatisticsReportHanlder,
    intervalMs: number = DEFAULT_INTERVAL_MS
  ) =>
  <Payload extends PersistedPayload, PersistedPayload = Payload>(
    observer: Subscriber<Payload, PersistedPayload>
  ): Subscriber<Payload, PersistedPayload> => {
    let messagesCount = 0;
    let inProgressCount = 0;
    let errorsCount = 0;
    let interval: NodeJS.Timer | undefined = undefined;

    const report = () => {
      onStatisticsReport({
        intervalMs,
        messagesCount,
        errorsCount,
        errorRate: messagesCount ? errorsCount / messagesCount : 0,
        inProgressCount: inProgressCount,
        queueSize: queue.getQueue().length,
      });
      messagesCount = 0;
      errorsCount = 0;
    };

    const startInterval = () => {
      if (interval) return;
      interval = setInterval(report, intervalMs);
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
        messagesCount++;
        inProgressCount++;
        return new Promise<void>((resolve, reject) => {
          observer
            .next(payload)
            .then(resolve)
            .catch(reject)
            .finally(() => {
              inProgressCount--;
            });
        });
      },
      error: (...args) => {
        startInterval();
        errorsCount++;
        return observer.error(...args);
      },
      complete: () => {
        stopInterval();
        return observer.complete();
      },
    };
  };
