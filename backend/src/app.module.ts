import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SwapiService } from "./swapi/swapi.service";
import { SwapiModule } from "./swapi/swapi.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [SwapiModule, RedisModule],
  controllers: [AppController],
  providers: [AppService, SwapiService],
})
export class AppModule {}
