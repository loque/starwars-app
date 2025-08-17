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

  combineTopQueries(
    newTopQueries: TopQuery[],
    previousTopQueries: TopQuery[],
    totalRequests: number,
  ): TopQuery[] {
    const queryMap = new Map<
      string,
      { count: number; endpoint: string; query: string }
    >();

    // Add previous queries
    previousTopQueries.forEach((query) => {
      const key = `${query.endpoint}:${query.query}`;
      queryMap.set(key, {
        count: query.count,
        endpoint: query.endpoint,
        query: query.query,
      });
    });

    // Add new queries (combine counts if they exist)
    newTopQueries.forEach((query) => {
      const key = `${query.endpoint}:${query.query}`;
      const existing = queryMap.get(key);
      if (existing) {
        existing.count += query.count;
      } else {
        queryMap.set(key, {
          count: query.count,
          endpoint: query.endpoint,
          query: query.query,
        });
      }
    });

    // Convert back to TopQuery array with updated percentages
    return Array.from(queryMap.values())
      .map((item) => ({
        endpoint: item.endpoint,
        query: item.query,
        count: item.count,
        percentage: Math.round((item.count / totalRequests) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }

  combineHourlyDistribution(
    newDistribution: HourlyDistribution[],
    previousDistribution: HourlyDistribution[],
  ): HourlyDistribution[] {
    const hourMap = new Map<number, number>();

    // Add previous distribution
    previousDistribution.forEach(({ hour, count }) => {
      hourMap.set(hour, count);
    });

    // Add new distribution (combine counts)
    newDistribution.forEach(({ hour, count }) => {
      const existing = hourMap.get(hour) || 0;
      hourMap.set(hour, existing + count);
    });

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

    // Calculate accumulated stats
    const newRequestsCount = newMetrics.length;
    const previousTotalRequests = lastReport?.totalRequests || 0;
    const totalRequests = newRequestsCount + previousTotalRequests;

    // Calculate weighted average response time
    const newTotalResponseTime = newMetrics.reduce(
      (sum, m) => sum + m.responseTime,
      0,
    );
    const previousAvgResponseTime = lastReport?.avgResponseTime || 0;
    const previousTotalResponseTime =
      previousTotalRequests * previousAvgResponseTime;
    const avgResponseTime =
      (newTotalResponseTime + previousTotalResponseTime) / totalRequests;

    // Combine top queries from new metrics with previous report
    const allTopQueries = this.combineTopQueries(
      this.calculateTopQueries(newMetrics),
      lastReport?.topQueries || [],
      totalRequests,
    );

    // Combine hourly distribution
    const newHourlyDistribution = this.calculateHourlyDistribution(newMetrics);
    const combinedHourlyDistribution = this.combineHourlyDistribution(
      newHourlyDistribution,
      lastReport?.hourlyDistribution || [],
    );

    const lastProcessedMetric = newMetrics[newMetrics.length - 1];

    await this.store.insertReport({
      lastProcessedMetricId: lastProcessedMetric._id,
      totalRequests,
      avgResponseTime,
      topQueries: allTopQueries,
      hourlyDistribution: combinedHourlyDistribution,
    });

    this.logger.log(
      `Generated report processing ${newRequestsCount} new metrics, total: ${totalRequests}, cursor: ${lastProcessedMetric.id}`,
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
