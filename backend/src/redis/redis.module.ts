import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { createClient, type RedisClientType } from "redis";

@Global()
@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: async (): Promise<RedisClientType> => {
        const url =
          process.env.REDIS_URL ||
          `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;
        const client = createClient({ url });
        client.on("error", (err: unknown) =>
          console.error("[redis] error", err),
        );
        await client.connect();
        return client;
      },
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
