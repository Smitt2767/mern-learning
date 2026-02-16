import { Logger } from "@mern/logger";
import redis, { CACHE_TIMES, type CacheTime } from "../config/redis.js";

export function generateTag(...parts: string[]): string {
  return `tag:${parts.join(":")}`;
}

export function generateCacheKey(...parts: string[]): string {
  return parts.join(":");
}

/**
 * Utility class for managing cache entries in Redis.
 *
 * Provides static methods for retrieving, saving, and invalidating cache data,
 * always using standard cache key patterns and TTLs as defined in the project.
 */
export class Cache {
  // Prevent instantiation
  private constructor() {}

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
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
      await redis.set(key, JSON.stringify(value), "EX", CACHE_TIMES[ttl]);
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
      const pipeline = redis.pipeline();
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
      await redis.del(...keys);
    } catch (err) {
      Logger.error(`Cache invalidation failed: ${(err as Error).message}`);
    }
  }

  static async invalidateByTag(...tags: string[]): Promise<void> {
    try {
      const pipeline = redis.pipeline();
      const keys = (
        await Promise.all(tags.map((t) => redis.smembers(t)))
      ).flat();
      if (keys.length) keys.forEach((k) => pipeline.del(k));
      tags.forEach((t) => pipeline.del(t));
      await pipeline.exec();
    } catch (err) {
      Logger.error(`Cache tag invalidation failed: ${(err as Error).message}`);
    }
  }
}
