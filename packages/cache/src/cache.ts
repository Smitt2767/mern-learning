import { Logger } from "@mern/logger";
import type { Redis } from "ioredis";
import { CACHE_TIMES, type CacheTime } from "./constants.js";

export class Cache {
  private static client: Redis;

  private constructor() {}

  static init(redisClient: Redis): void {
    Cache.client = redisClient;
  }

  private static getClient(): Redis {
    if (!Cache.client) {
      throw new Error("Cache.init() must be called before using Cache");
    }
    return Cache.client;
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await Cache.getClient().get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (err) {
      Logger.error(
        `Cache read failed for key "${key}": ${(err as Error).message}`,
      );
    }

    return null;
  }

  static async set<T>(key: string, value: T, ttl: CacheTime): Promise<void> {
    if (value === null || value === undefined) return;

    try {
      await Cache.getClient().set(
        key,
        JSON.stringify(value),
        "EX",
        CACHE_TIMES[ttl],
      );
    } catch (err) {
      Logger.error(
        `Cache write failed for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  static async setTagged<T>(
    key: string,
    value: T,
    ttl: CacheTime,
    tags: string[],
  ): Promise<void> {
    try {
      const client = Cache.getClient();
      const pipeline = client.pipeline();
      pipeline.set(key, JSON.stringify(value), "EX", CACHE_TIMES[ttl]);
      for (const tag of tags) {
        pipeline.sadd(tag, key);
        pipeline.expire(tag, CACHE_TIMES[ttl]);
      }
      await pipeline.exec();
    } catch (err) {
      Logger.error(
        `Cache tagged write failed for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  static async invalidate(...keys: string[]): Promise<void> {
    try {
      await Cache.getClient().del(...keys);
    } catch (err) {
      Logger.error(`Cache invalidation failed: ${(err as Error).message}`);
    }
  }

  static async invalidateByTag(...tags: string[]): Promise<void> {
    try {
      const client = Cache.getClient();
      const pipeline = client.pipeline();
      const keys = (
        await Promise.all(tags.map((t) => client.smembers(t)))
      ).flat();
      if (keys.length) keys.forEach((k) => pipeline.del(k));
      tags.forEach((t) => pipeline.del(t));
      await pipeline.exec();
    } catch (err) {
      Logger.error(`Cache tag invalidation failed: ${(err as Error).message}`);
    }
  }
}
