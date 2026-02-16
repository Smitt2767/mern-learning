import { Logger } from "@mern/logger";
import { Redis } from "ioredis";
import { env } from "./env.js";

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
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

export const CACHE_TIMES = {
  oneMinute: 60,
  fiveMinutes: 60 * 5,
  fifteenMinutes: 60 * 15,
  oneHour: 60 * 60,
  sixHours: 60 * 60 * 6,
  twelveHours: 60 * 60 * 12,
  oneDay: 60 * 60 * 24,
  oneWeek: 60 * 60 * 24 * 7,
  twoWeeks: 60 * 60 * 24 * 14,
  oneMonth: 60 * 60 * 24 * 30,
} as const;

export type CacheTime = keyof typeof CACHE_TIMES;

export default redis;
