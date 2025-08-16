import * as z from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.coerce.number().min(1).max(65535).default(3000),
  POSTGRES_USER: z.string().min(2).max(100),
  POSTGRES_PASSWORD: z.string().min(6).max(100),
  POSTGRES_DB: z.string().min(2).max(100),
  POSTGRES_PORT: z.coerce.number().min(1).max(65535),
  REDIS_HOST: z.string().min(2).max(100),
  REDIS_PORT: z.coerce.number().min(1).max(65535),
});

export const env = envSchema.parse(process.env);
