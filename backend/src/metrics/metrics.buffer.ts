import { Injectable, Logger } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bullmq";
import type Redis from "ioredis";
import { METRICS_QUEUE, MetricsJob } from "./metrics.constants";
import { RequestMetricDto } from "./metrics.entities";

@Injectable()
export class MetricsBuffer {
  private readonly logger = new Logger(MetricsBuffer.name);
  private readonly BATCH_KEY = "metrics:batch";

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue(METRICS_QUEUE) private readonly queue: Queue,
  ) {}

  async addMetric(metric: RequestMetricDto): Promise<void> {
    try {
      await this.redis.lpush(this.BATCH_KEY, JSON.stringify(metric));

      // Schedule processing job if not already scheduled
      const pendingJobs = await this.queue.getWaiting();
      if (pendingJobs.length === 0) {
        await this.queue.add(
          MetricsJob.PROCESS_BATCH,
          {},
          {
            delay: 10_000,
            removeOnComplete: 5,
            removeOnFail: 3,
          },
        );
      }
    } catch (error) {
      this.logger.error("Failed to record metric", error);
    }
  }

  async getBatchedMetrics(): Promise<RequestMetricDto[]> {
    try {
      // Atomic: prevents losing metrics added between read and delete
      const results = await this.redis
        .multi()
        .lrange(this.BATCH_KEY, 0, -1)
        .del(this.BATCH_KEY)
        .exec();

      if (!results || results.length === 0) {
        return [];
      }

      const [rangeResult] = results;
      if (rangeResult[0] !== null || !Array.isArray(rangeResult[1])) {
        this.logger.warn("Failed to retrieve metrics from Redis");
        return [];
      }

      const rawMetrics = rangeResult[1] as string[];
      return rawMetrics
        .map((raw) => {
          try {
            return JSON.parse(raw) as RequestMetricDto;
          } catch {
            return null;
          }
        })
        .filter((metric): metric is RequestMetricDto => metric !== null);
    } catch (error) {
      this.logger.error("Failed to get batched metrics", error);
      return [];
    }
  }
}
