import { StatisticsReportHanlder } from "../observer/withStatistics";

export type StatisticsConfig = {
  onStatisticsReport: StatisticsReportHanlder;
  intervalMs?: number;
};
