import { Inject, Injectable } from "@nestjs/common";
import type { RedisClientType } from "redis";

@Injectable()
export class RedisService {
  constructor(
    @Inject("REDIS_CLIENT") private readonly client: RedisClientType,
  ) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const json = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, json, { EX: ttlSeconds });
    } else {
      await this.client.set(key, json);
    }
  }

  /**
   * If hit, returns cached. If miss, runs fetcher, stores, then returns.
   */
  async wrap<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    // Note that we are caching null and undefined values as well.
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
