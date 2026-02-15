import { Logger } from "@mern/logger";
import redis, {
  CACHE_TIMES,
  generateCacheKey,
  type CacheTime,
} from "../config/redis.js";

/**
 * Cache utility class for interacting with Redis.
 * Provides static methods for getting, setting, and invalidating cache entries.
 */
export class Cache {
  // Prevent instantiation
  private constructor() {}

  /**
   * Retrieve an item from the cache and parse it as type T.
   *
   * @template T The expected return type.
   * @param {string} prefix - The cache key prefix.
   * @param {...string[]} args - Additional arguments for the cache key.
   * @returns {Promise<T | null>} The cached value parsed as type T, or null if not found or on error.
   *
   * @example
   * // Retrieve user with id="abc123" from cache
   * const user = await Cache.get<User>("user", "abc123");
   *
   * @example
   * // Retrieve a cached array of post ids
   * const postIds = await Cache.get<string[]>("posts", "recent");
   */
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

  /**
   * Store an item in the cache with a given TTL.
   *
   * @template T The value type to cache.
   * @param {string} prefix - The cache key prefix.
   * @param {CacheTime} ttl - The cache expiration time key.
   * @param {T} value - The value to cache.
   * @param {...string[]} args - Additional arguments for the cache key.
   * @returns {Promise<void>}
   *
   * @example
   * // Cache a user object using id as the key and a one hour TTL
   * await Cache.set<User>("user", "oneHour", user, user.id);
   *
   * @example
   * // Cache a list of numbers with a "tenMinutes" TTL
   * await Cache.set<number[]>("numbers", "tenMinutes", [1,2,3], "my-key");
   */
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

  /**
   * Invalidate (delete) cache entries for the given prefixes and arguments.
   *
   * @param {string[]} prefixes - List of cache key prefixes to invalidate.
   * @param {...string[]} args - Additional arguments used in the cache keys.
   * @returns {Promise<void>}
   *
   * @example
   * // Invalidate cache for a single user by id
   * await Cache.invalidate(["user"], "abc123");
   *
   * @example
   * // Invalidate multiple related caches with shared arguments
   * await Cache.invalidate(["user", "user:posts"], "abc123");
   *
   * @example
   * // Invalidate cache for a specific user's post by both user id and post id
   * await Cache.invalidate(["user:post"], "abc123", "post42");
   */
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
