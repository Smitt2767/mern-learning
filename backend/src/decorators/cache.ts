import { Logger } from "@mern/logger";
import redis, {
  CACHE_TIMES,
  generateCacheKey,
  type CacheTime,
} from "../config/redis.js";

/**
 * Caches the return value of a method in Redis.
 *
 * Builds a cache key from `prefix` + stringified method arguments.
 * On cache hit, returns the cached value without calling the method.
 * On cache miss, calls the method, stores the result, and returns it.
 *
 * Falls through to the real method if Redis is unavailable.
 *
 * @example
 * class ProductService {
 *   @Cacheable("product", "oneHour")
 *   async getById(id: string) {
 *     return db.select().from(products).where(eq(products.id, id));
 *   }
 * }
 */
export function Cacheable(prefix: string, ttl: CacheTime) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = generateCacheKey(
        prefix,
        propertyKey,
        ...args.map(String)
      );

      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        Logger.error(
          `Cache read failed for key "${cacheKey}": ${(err as Error).message}`
        );
      }

      const result = await originalMethod.apply(this, args);

      if (result !== null && result !== undefined) {
        try {
          await redis.set(
            cacheKey,
            JSON.stringify(result),
            "EX",
            CACHE_TIMES[ttl]
          );
        } catch (err) {
          Logger.error(
            `Cache write failed for key "${cacheKey}": ${(err as Error).message}`
          );
        }
      }

      return result;
    };
  };
}

/**
 * Invalidates (deletes) cache entries after the decorated method executes.
 *
 * Builds keys from each prefix + stringified method arguments,
 * so use the same prefix/args shape as the corresponding @Cacheable.
 *
 * @example
 * class ProductService {
 *   @CacheInvalidate("product", "products:list")
 *   async update(id: string, data: UpdateProduct) {
 *     return db.update(products).set(data).where(eq(products.id, id));
 *   }
 * }
 */
export function CacheInvalidate(...prefixes: string[]) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      const argParts = args.map(String);

      try {
        const keys = prefixes.map((prefix) =>
          generateCacheKey(prefix, propertyKey, ...argParts)
        );
        await redis.del(...keys);
      } catch (err) {
        Logger.error(
          `Cache invalidation failed: ${(err as Error).message}`
        );
      }

      return result;
    };
  };
}
