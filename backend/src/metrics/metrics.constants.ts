export const METRICS_QUEUE = "metrics-processing";

export enum MetricsJob {
  PROCESS_BATCH = "process-batch",
  GENERATE_REPORT = "generate-report",
  CLEANUP_OLD_DATA = "cleanup-old-data",
}
