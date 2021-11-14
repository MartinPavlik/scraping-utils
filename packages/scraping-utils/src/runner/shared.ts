import { Storage } from "../storage/shared";
import { StatisticsReportHanlder } from "../observer/withStatistics";

export type StatisticsConfig = {
  onStatisticsReport: StatisticsReportHanlder;
  intervalMs?: number;
};

export type PersistanceConfig<Payload> = {
  storage: Storage<Payload>;
  initialPayloads?: Payload[];
  intervalMs?: number;
};
