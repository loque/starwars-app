import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  MetricReport,
  MetricReportDocument,
  MetricReportInsert,
  RequestMetric,
  RequestMetricDocument,
  RequestMetricDto,
} from "./metrics.entities";
import { Model, Types } from "mongoose";

@Injectable()
export class MetricsStore {
  private readonly logger = new Logger(MetricsStore.name);

  constructor(
    @InjectModel(RequestMetric.name)
    private readonly requestMetricModel: Model<RequestMetricDocument>,
    @InjectModel(MetricReport.name)
    private readonly metricReportModel: Model<MetricReportDocument>,
  ) {}

  async batchInsertMetrics(metrics: RequestMetricDto[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      const reqMetrics = metrics.map(
        (metric) =>
          ({
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

  async fetchMetrics(after?: Types.ObjectId): Promise<RequestMetricDocument[]> {
    const query = after ? { _id: { $gt: after } } : {};
    try {
      return await this.requestMetricModel.find(query).exec();
    } catch (error) {
      this.logger.error("Failed to fetch metrics", error);
      return [];
    }
  }

  async fetchLastReport(): Promise<MetricReportDocument | null> {
    try {
      const report = await this.metricReportModel
        .findOne()
        .sort({ createdAt: -1 })
        .exec();
      return report || null;
    } catch (error) {
      this.logger.error("Failed to fetch last report", error);
      return null;
    }
  }

  async insertReport(input: MetricReportInsert): Promise<void> {
    const report = new this.metricReportModel(input);
    await report.save();
  }

  async deleteOldMetrics(olderThanDate: Date): Promise<number> {
    try {
      const result = await this.requestMetricModel.deleteMany({
        createdAt: { $lt: olderThanDate },
      });
      const deletedCount = result.deletedCount ?? 0;
      this.logger.log(
        `Deleted ${deletedCount} metrics older than ${olderThanDate.toISOString()}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error("Failed to delete old metrics", error);
      return 0;
    }
  }

  async deleteOldReports(olderThanDate: Date): Promise<number> {
    try {
      const result = await this.metricReportModel.deleteMany({
        createdAt: { $lt: olderThanDate },
      });
      const deletedCount = result.deletedCount ?? 0;
      this.logger.log(
        `Deleted ${deletedCount} reports older than ${olderThanDate.toISOString()}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error("Failed to delete old reports", error);
      return 0;
    }
  }

  async getMetricsCount(): Promise<number> {
    try {
      return await this.requestMetricModel.countDocuments();
    } catch (error) {
      this.logger.error("Failed to count metrics", error);
      return 0;
    }
  }

  async getReportsCount(): Promise<number> {
    try {
      return await this.metricReportModel.countDocuments();
    } catch (error) {
      this.logger.error("Failed to count reports", error);
      return 0;
    }
  }
}
