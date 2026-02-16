import { Logger } from "@mern/logger";
import type { CacheTime } from "./constants.js";
import { Cache } from "./cache.js";

interface CacheableOptions<TArgs extends unknown[]> {
  key: (...args: TArgs) => string;
  tags?: Array<(...args: TArgs) => string>;
  ttl: CacheTime;
}

export function Cacheable<TArgs extends unknown[]>({
  key: keyFn,
  ttl,
  tags,
}: CacheableOptions<TArgs>) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: TArgs) => unknown;

    descriptor.value = async function (...args: TArgs) {
      const cacheKey = keyFn(...args);

      try {
        const cached = await Cache.get<any>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (err) {
        Logger.error(
          `Cache read failed for key "${cacheKey}": ${(err as Error).message}`,
        );
      }

      const result = await originalMethod.apply(this, args);

      if (result !== null && result !== undefined) {
        try {
          if (tags) {
            await Cache.setTagged(
              cacheKey,
              result,
              ttl,
              tags.map((tag) => tag(...args)),
            );
          } else {
            await Cache.set(cacheKey, result, ttl);
          }
        } catch (err) {
          Logger.error(
            `Cache write failed for key "${cacheKey}": ${(err as Error).message}`,
          );
        }
      }

      return result;
    };
  };
}

interface CacheInvalidateOptions<TArgs extends unknown[]> {
  keys?: Array<(...args: TArgs) => string>;
  tags?: Array<(...args: TArgs) => string>;
}

export function CacheInvalidate<TArgs extends unknown[]>({
  keys: keyFns = [],
  tags: tagFns = [],
}: CacheInvalidateOptions<TArgs>) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: TArgs) => unknown;

    descriptor.value = async function (...args: TArgs) {
      const result = await originalMethod.apply(this, args);

      try {
        const computedKeys = keyFns.map((fn) => fn(...args));
        const computedTags = tagFns.map((fn) => fn(...args));

        await Promise.all([
          computedKeys.length && Cache.invalidate(...computedKeys),
          computedTags.length && Cache.invalidateByTag(...computedTags),
        ]);
      } catch (err) {
        Logger.error(`Cache invalidation failed: ${(err as Error).message}`);
      }

      return result;
    };
  };
}
