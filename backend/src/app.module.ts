import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { RedisModule } from "@nestjs-modules/ioredis";
import { SwapiModule } from "./swapi/swapi.module";
import { CacheModule } from "./cache/cache.module";
import { MetricsModule } from "./metrics/metrics.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueryStat, HourlyStat } from "./metrics/metrics.entities";
import { env } from "./env";

const REDIS_URL = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;
const POSTGRES_URL = `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: POSTGRES_URL,
      entities: [QueryStat, HourlyStat],
      synchronize: env.NODE_ENV !== "production",
      logging: env.NODE_ENV === "development",
    }),
    BullModule.forRoot({
      redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
    }),
    RedisModule.forRoot({
      type: "single",
      url: REDIS_URL,
    }),
    CacheModule,
    SwapiModule,
    MetricsModule,
  ],
})
export class AppModule {}
