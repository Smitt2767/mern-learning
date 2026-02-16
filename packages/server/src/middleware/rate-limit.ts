import type { Request, RequestHandler } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Redis } from "ioredis";
import RedisStore from "rate-limit-redis";

export interface RateLimitOptions {
  /** Time window in minutes. */
  windowMin: number;
  /** Maximum number of requests per window. */
  limit: number;
  /** Custom error message sent on 429 responses. */
  message?: string | Record<string, unknown>;
  /** Custom key generator — defaults to `req.user.id` or `req.ip`. */
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(redis: Redis) {
  return function RateLimit(options: RateLimitOptions): RequestHandler {
    const config: Parameters<typeof rateLimit>[0] = {
      windowMs: options.windowMin * 60 * 1000,
      max: options.limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: options.message ?? {
        error: "Too many requests, try again later",
      },
      store: new RedisStore({
        prefix: "ratelimit:api:",
        sendCommand: (...args: string[]) =>
          redis.call(...(args as [string, ...string[]])) as Promise<
            boolean | number | string | (boolean | number | string)[]
          >,
      }),
      keyGenerator:
        options.keyGenerator ??
        ((req: Request) => {
          const path = `${req.baseUrl}${req.path}`.replace(/\/+/g, "/");
          const route = `${req.method}:${path}`;

          if (req.user?.id) {
            return `${route}:user:${req.user.id}`;
          }

          return `${route}:ip:${ipKeyGenerator(req.ip ?? "unknown")}`;
        }),
    };

    return rateLimit(config);
  };
}
