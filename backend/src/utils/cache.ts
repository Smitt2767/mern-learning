import { Logger } from "@mern/logger";
import redis, {
  CACHE_TIMES,
  generateCacheKey,
  type CacheTime,
} from "../config/redis.js";

export class Cache {
  private constructor() {}

  static async get<T>(prefix: string, ...args: string[]): Promise<T | null> {
    const key = generateCacheKey(prefix, ...args);

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

  static async set<T>(
    prefix: string,
    ttl: CacheTime,
    value: T,
    ...args: string[]
  ): Promise<void> {
    if (value === null || value === undefined) return;

    const key = generateCacheKey(prefix, ...args);

    try {
      await redis.set(key, JSON.stringify(value), "EX", CACHE_TIMES[ttl]);
    } catch (err) {
      Logger.error(
        `Cache write failed for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  static async invalidate(
    prefixes: string[],
    ...args: string[]
  ): Promise<void> {
    try {
      const keys = prefixes.map((prefix) => generateCacheKey(prefix, ...args));
      await redis.del(...keys);
    } catch (err) {
      Logger.error(`Cache invalidation failed: ${(err as Error).message}`);
    }
  }
}
