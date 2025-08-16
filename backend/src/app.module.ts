import { Module } from "@nestjs/common";
import { RedisModule } from "@nestjs-modules/ioredis";
import { SwapiModule } from "./swapi/swapi.module";
import { CacheModule } from "./cache/cache.module";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL =
  process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

@Module({
  imports: [
    RedisModule.forRoot({
      type: "single",
      url: REDIS_URL,
    }),
    CacheModule,
    SwapiModule,
  ],
})
export class AppModule {}
