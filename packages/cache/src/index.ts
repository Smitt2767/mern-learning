export { Cache } from "./cache.js";
export { Cacheable, CacheInvalidate } from "./decorators.js";
export { type CacheTime } from "./constants.js";

export function generateCacheTag(...parts: string[]): string {
  return `tag:${parts.join(":")}`;
}

export function generateCacheKey(...parts: string[]): string {
  return parts.join(":");
}
