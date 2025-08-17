import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { RedisModule } from "@nestjs-modules/ioredis";
import { SwapiModule } from "./swapi/swapi.module";
import { CacheModule } from "./cache/cache.module";
import { MetricsModule } from "./metrics/metrics.module";
import { MongooseModule } from "@nestjs/mongoose";

import { env } from "./env";

const MONGO_URL = `mongodb://${env.MONGO_USER}:${env.MONGO_PASSWORD}@${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_DB}?authSource=admin`;
const REDIS_URL = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URL),
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
