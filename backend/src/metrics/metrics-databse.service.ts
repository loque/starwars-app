import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  RequestMetric,
  RequestMetricDocument,
  RequestMetricDto,
} from "./metrics.entities";
import { Model } from "mongoose";
import { nanoid } from "nanoid";

@Injectable()
export class MetricsDatabaseService {
  private readonly logger = new Logger(MetricsDatabaseService.name);

  constructor(
    @InjectModel(RequestMetric.name)
    private readonly requestMetricModel: Model<RequestMetricDocument>,
  ) {}

  async batchInsertMetrics(metrics: RequestMetricDto[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      const reqMetrics = metrics.map(
        (metric) =>
          ({
            id: nanoid(),
            endpoint: metric.endpoint,
            query: metric.query,
            responseTime: metric.responseTime,
            statusCode: metric.statusCode,
            createdAt: new Date(metric.timestamp),
          }) satisfies RequestMetric,
      );

      await this.requestMetricModel.insertMany(reqMetrics);

      this.logger.log(`Processed ${metrics.length} metrics`);
    } catch (error) {
      this.logger.error("Failed to batch insert metrics", error);
    }
  }
}
