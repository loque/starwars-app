import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.API_PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error("Error starting the application:", error);
  process.exit(1);
});
