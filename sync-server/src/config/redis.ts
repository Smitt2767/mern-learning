import { Logger } from "@mern/logger";
import { Redis } from "ioredis";
import { env } from "@mern/env";

/**
 * Plain connection options — passed to QueueRegistry / BullMQ so that
 * it constructs its own ioredis clients internally.
 *
 * Passing a bare options object (instead of a `Redis` instance) prevents
 * the `exactOptionalPropertyTypes` type error that surfaces when pnpm
 * resolves two different ioredis patch versions across workspace packages.
 */
export const redisConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
} as const;

/**
 * Shared Redis client — used only for health checks and graceful shutdown.
 * BullMQ workers/queues/scheduler get their own connections via
 * `redisConnectionOptions` above.
 */
export const redis = new Redis({
  ...redisConnectionOptions,
  maxRetriesPerRequest: null, // Required by BullMQ workers
  retryStrategy(times: number) {
    if (times > 5) {
      Logger.error("Redis max retries reached, giving up");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => {
  Logger.success("Redis connected");
});

redis.on("error", (err: Error) => {
  Logger.error(`Redis error: ${err.message}`);
});
