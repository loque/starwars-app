import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue, Process, Processor } from "@nestjs/bull";
import type { Job, Queue } from "bullmq";
import { METRICS_QUEUE, MetricsJob } from "./metrics.constants";
import { MetricsBuffer } from "./metrics.buffer";
import { MetricsStore } from "./metrics.store";
import {
  HourlyDistribution,
  RequestMetricDocument,
  TopQuery,
} from "./metrics.entities";

@Processor(METRICS_QUEUE)
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectQueue(METRICS_QUEUE) private readonly queue: Queue,
    private readonly buffer: MetricsBuffer,
    private readonly store: MetricsStore,
  ) {}

  async onModuleInit() {
    await this.queue.add(
      MetricsJob.GENERATE_REPORT,
      {},
      { repeat: { every: 5 * 60 * 1000 } }, // every 5 minutes
    );

    await this.queue.add(
      MetricsJob.CLEANUP_OLD_DATA,
      { olderThanDays: 7 },
      { repeat: { every: 24 * 60 * 60 * 1000 } }, // every 24 hours
    );
  }

  @Process(MetricsJob.PROCESS_BATCH)
  async processBatchedMetrics(): Promise<void> {
    try {
      const metrics = await this.buffer.getBatchedMetrics();
      if (metrics.length > 0) {
        await this.store.batchInsertMetrics(metrics);
        this.logger.log(`Processed batch of ${metrics.length} metrics`);
      }
    } catch (error) {
      this.logger.error("Failed to process batched metrics", error);
      throw error;
    }
  }

  calculateTopQueries(metrics: RequestMetricDocument[]): TopQuery[] {
    const queryCount = new Map<string, number>();

    metrics.forEach((metric) => {
      const key = `${metric.endpoint}:${metric.query}`;
      queryCount.set(key, (queryCount.get(key) || 0) + 1);
    });

    const totalQueries = metrics.length;
    return Array.from(queryCount.entries())
      .map(([key, count]) => {
        const [endpoint, query] = key.split(":", 2);
        return {
          endpoint,
          query,
          count,
          percentage: Math.round((count / totalQueries) * 100 * 100) / 100,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }

  calculateHourlyDistribution(
    metrics: RequestMetricDocument[],
  ): HourlyDistribution[] {
    const hourMap = new Map<number, number>();

    for (const metric of metrics) {
      const hour = metric.createdAt.getHours();
      const count = hourMap.get(hour) || 0;
      hourMap.set(hour, count + 1);
    }

    return Array.from(hourMap.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));
  }

  @Process(MetricsJob.GENERATE_REPORT)
  async generateReport(): Promise<void> {
    this.logger.log("Generating report");
    const lastReport = await this.store.fetchLastReport();

    const newMetrics = await this.store.fetchMetrics(
      lastReport?.lastProcessedMetricId,
    );

    if (newMetrics.length === 0) {
      this.logger.log("No new metrics to process");
      return;
    }

    const totalRequests = newMetrics.length;
    const avgResponseTime =
      newMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const topQueries = this.calculateTopQueries(newMetrics);
    const hourlyDistribution = this.calculateHourlyDistribution(newMetrics);

    const lastProcessedMetric = newMetrics[newMetrics.length - 1];

    await this.store.insertReport({
      lastProcessedMetricId: lastProcessedMetric._id,
      totalRequests,
      avgResponseTime,
      topQueries,
      hourlyDistribution,
    });

    this.logger.log(
      `Generated report processing ${totalRequests} new metrics, cursor: ${lastProcessedMetric.id}`,
    );
  }

  @Process(MetricsJob.CLEANUP_OLD_DATA)
  async cleanupOldData(job: Job): Promise<void> {
    const { olderThanDays } = job.data as { olderThanDays: number };
    this.logger.log(
      `Starting cleanup of data older than ${olderThanDays} days`,
    );

    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Get counts before cleanup for logging
      const initialMetricsCount = await this.store.getMetricsCount();
      const initialReportsCount = await this.store.getReportsCount();

      this.logger.log(
        `Before cleanup: ${initialMetricsCount} metrics, ${initialReportsCount} reports`,
      );

      // Delete old data
      const deletedMetrics = await this.store.deleteOldMetrics(cutoffDate);
      const deletedReports = await this.store.deleteOldReports(cutoffDate);

      // Get counts after cleanup
      const finalMetricsCount = await this.store.getMetricsCount();
      const finalReportsCount = await this.store.getReportsCount();

      this.logger.log(
        `Cleanup completed: deleted ${deletedMetrics} metrics and ${deletedReports} reports. ` +
          `Remaining: ${finalMetricsCount} metrics, ${finalReportsCount} reports`,
      );
    } catch (error) {
      this.logger.error("Failed to cleanup old data", error);
      throw error;
    }
  }
}
