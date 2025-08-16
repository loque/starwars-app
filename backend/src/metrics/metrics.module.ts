import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { MetricsService } from "./metrics.service";
import { MetricsProcessor } from "./metrics.processor";
import { MetricsInterceptor } from "./metrics.interceptor";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueryStat, HourlyStat } from "./metrics.entities";
import { MetricsDatabaseService } from "./metrics-databse.service";
import { METRICS_QUEUE } from "./metrics.constants";

@Module({
  imports: [
    TypeOrmModule.forFeature([QueryStat, HourlyStat]),
    BullModule.registerQueue({
      name: METRICS_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    }),
  ],
  providers: [
    MetricsService,
    MetricsProcessor,
    MetricsDatabaseService,
    MetricsInterceptor,
  ],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}
