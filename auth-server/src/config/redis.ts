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

export default redis;
