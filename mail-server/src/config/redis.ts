import { Logger } from "@mern/logger";
import { Redis } from "ioredis";
import { env } from "./env.js";

/**
 * Redis client for mail-server's BullMQ worker.
 *
 * IMPORTANT: `maxRetriesPerRequest: null` is required by BullMQ.
 * BullMQ uses blocking Redis commands (BRPOP etc.) that have no timeout,
 * and ioredis's default retry limit breaks them.  Without this setting
 * the worker will throw an error on startup.
 */
const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // ← BullMQ requirement
  retryStrategy(times: number) {
    if (times > 10) {
      Logger.error("[Redis] Max retries exceeded, stopping reconnect");
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 3_000);
    Logger.info(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
});

redis.on("connect", () => Logger.success("[Redis] Connected"));
redis.on("error", (err: Error) => Logger.error("[Redis] Error:", err.message));

export default redis;
