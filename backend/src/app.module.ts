import { Module } from "@nestjs/common";
import { RedisModule as IORedisModule } from "@nestjs-modules/ioredis";
import { SwapiModule } from "./swapi/swapi.module";
import { RedisModule } from "./redis/redis.module";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL =
  process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

@Module({
  imports: [
    SwapiModule,
    IORedisModule.forRoot({
      type: "single",
      url: REDIS_URL,
    }),
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
