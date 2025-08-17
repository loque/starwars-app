import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { MetricsService } from "./metrics.service";
import { MetricsQueue } from "./metrics.queue";
import { MetricsInterceptor } from "./metrics.interceptor";
import { MetricsDatabaseService } from "./metrics-databse.service";
import { METRICS_QUEUE } from "./metrics.constants";
import { MongooseModule } from "@nestjs/mongoose";
import { RequestMetric, RequestMetricSchema } from "./metrics.entities";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestMetric.name, schema: RequestMetricSchema },
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
  providers: [
    MetricsService,
    MetricsQueue,
    MetricsDatabaseService,
    MetricsInterceptor,
  ],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}
