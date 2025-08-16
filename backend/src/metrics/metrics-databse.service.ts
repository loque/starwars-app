import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { QueryMetric } from "./metrics.service";
import { QueryStat, HourlyStat } from "./metrics.entities";

@Injectable()
export class MetricsDatabaseService {
  private readonly logger = new Logger(MetricsDatabaseService.name);

  constructor(
    @InjectRepository(QueryStat)
    private readonly queryStatRepository: Repository<QueryStat>,
    @InjectRepository(HourlyStat)
    private readonly hourlyStatRepository: Repository<HourlyStat>,
  ) {}

  async batchInsertMetrics(metrics: QueryMetric[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      // Group metrics by endpoint+query for aggregation
      const aggregated = this.aggregateMetrics(metrics);

      // Upsert aggregated data
      for (const stat of aggregated) {
        await this.upsertQueryStat(stat);
      }

      // Update hourly stats
      const hourlyStats = this.aggregateHourlyStats(metrics);
      for (const hourlyStat of hourlyStats) {
        await this.upsertHourlyStat(hourlyStat);
      }

      this.logger.log(`Processed ${metrics.length} metrics`);
    } catch (error) {
      this.logger.error("Failed to batch insert metrics", error);
    }
  }

  private aggregateMetrics(metrics: QueryMetric[]): Partial<QueryStat>[] {
    const groups = new Map<string, QueryMetric[]>();

    metrics.forEach((metric) => {
      const key = `${metric.endpoint}:${metric.query}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    });

    return Array.from(groups.entries()).map(([key, groupMetrics]) => {
      const [endpoint, query] = key.split(":", 2);
      const totalResponseTime = groupMetrics.reduce(
        (sum, m) => sum + m.responseTime,
        0,
      );

      return {
        endpoint,
        query,
        count: groupMetrics.length,
        totalResponseTime,
        avgResponseTime: totalResponseTime / groupMetrics.length,
      };
    });
  }

  private aggregateHourlyStats(metrics: QueryMetric[]): Partial<HourlyStat>[] {
    const hourlyGroups = new Map<string, number>();

    metrics.forEach((metric) => {
      const date = new Date(metric.timestamp);
      const key = `${date.getHours()}:${date.toISOString().split("T")[0]}`;
      hourlyGroups.set(key, (hourlyGroups.get(key) || 0) + 1);
    });

    return Array.from(hourlyGroups.entries()).map(([key, count]) => {
      const [hour, date] = key.split(":", 2);
      return {
        hour: parseInt(hour, 10),
        date,
        requestCount: count,
      };
    });
  }

  private async upsertQueryStat(stat: Partial<QueryStat>): Promise<void> {
    const existingRecord = await this.queryStatRepository.findOne({
      where: {
        endpoint: stat.endpoint,
        query: stat.query,
      },
    });

    if (existingRecord) {
      // Update existing record accumulating values
      const newCount = existingRecord.count + (stat.count || 0);
      const newTotalResponseTime =
        Number(existingRecord.totalResponseTime) +
        (stat.totalResponseTime || 0);
      const newAvgResponseTime =
        newCount > 0 ? newTotalResponseTime / newCount : 0;

      await this.queryStatRepository.update(existingRecord.id, {
        count: newCount,
        totalResponseTime: newTotalResponseTime,
        avgResponseTime: newAvgResponseTime,
      });
    } else {
      await this.queryStatRepository.insert(stat);
    }
  }

  private async upsertHourlyStat(stat: Partial<HourlyStat>): Promise<void> {
    const existingRecord = await this.hourlyStatRepository.findOne({
      where: {
        hour: stat.hour,
        date: stat.date,
      },
    });

    if (existingRecord) {
      // Update existing record by accumulating values
      const newRequestCount =
        existingRecord.requestCount + (stat.requestCount || 0);

      await this.hourlyStatRepository.update(existingRecord.id, {
        requestCount: newRequestCount,
      });
    } else {
      // Insert new record
      await this.hourlyStatRepository.insert(stat);
    }
  }
}
