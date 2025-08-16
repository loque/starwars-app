import { Processor, Process } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { MetricsDatabaseService } from "./metrics-databse.service";
import { METRICS_QUEUE, MetricsJob } from "./metrics.constants";

@Processor(METRICS_QUEUE)
@Injectable()
export class MetricsProcessor {
  private readonly logger = new Logger(MetricsProcessor.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly databaseService: MetricsDatabaseService,
  ) {}

  @Process(MetricsJob.PROCESS_BATCH)
  async processBatchedMetrics(): Promise<void> {
    try {
      const metrics = await this.metricsService.getBatchedMetrics();
      if (metrics.length > 0) {
        await this.databaseService.batchInsertMetrics(metrics);
        this.logger.log(`Processed batch of ${metrics.length} metrics`);
      }
    } catch (error) {
      this.logger.error("Failed to process batched metrics", error);
      throw error;
    }
  }
}
