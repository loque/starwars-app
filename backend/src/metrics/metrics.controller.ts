import { Controller, Get } from "@nestjs/common";
import { MetricsStore } from "./metrics.store";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsStore: MetricsStore) {}

  @Get("report")
  async getReport() {
    const report = await this.metricsStore.fetchLastReport();
    if (!report) return null;
    const {
      totalRequests,
      avgResponseTime,
      topQueries,
      hourlyDistribution,
      createdAt,
    } = report;
    return {
      totalRequests,
      avgResponseTime,
      topQueries,
      hourlyDistribution,
      createdAt,
    };
  }
}
