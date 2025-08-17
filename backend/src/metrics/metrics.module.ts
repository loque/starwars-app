import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { MetricsService } from "./metrics.service";
import { MetricsBuffer } from "./metrics.buffer";
import { MetricsInterceptor } from "./metrics.interceptor";
import { MetricsStore } from "./metrics.store";
import { METRICS_QUEUE } from "./metrics.constants";
import { MongooseModule } from "@nestjs/mongoose";
import {
  RequestMetric,
  RequestMetricSchema,
  MetricReport,
  MetricReportSchema,
} from "./metrics.entities";
import { MetricsController } from "./metrics.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestMetric.name, schema: RequestMetricSchema },
      { name: MetricReport.name, schema: MetricReportSchema },
    ]),
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
  providers: [MetricsService, MetricsInterceptor, MetricsBuffer, MetricsStore],
  exports: [MetricsInterceptor, MetricsBuffer],
  controllers: [MetricsController],
})
export class MetricsModule {}
