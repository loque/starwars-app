import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SwapiService } from "./swapi.service";
import { SwapiController } from "./swapi.controller";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [
    HttpModule.register({
      baseURL: "https://www.swapi.tech/api",
      timeout: 10_000,
    }),
    MetricsModule,
  ],
  providers: [SwapiService],
  exports: [SwapiService],
  controllers: [SwapiController],
})
export class SwapiModule {}
