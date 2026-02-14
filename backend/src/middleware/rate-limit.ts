import type { Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";

interface RateLimitOptions {
  /** Time window in minutes. */
  windowMin: number;
  /** Maximum number of requests per window. */
  max: number;
  /** Custom error message sent on 429 responses. */
  message?: string | Record<string, unknown>;
  /** Custom key generator — defaults to `req.ip`. */
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates a rate-limiting middleware backed by Redis.
 *
 * @example
 * import { RateLimit } from "../middleware/rate-limit.js";
 *
 * // Per-route usage
 * router.post("/login", RateLimit({ windowMin: 15, max: 10 }), login);
 * router.post("/forgot-password", RateLimit({ windowMin: 60, max: 5 }), forgotPassword);
 * router.get("/products", RateLimit({ windowMin: 1, max: 200 }), getProducts);
 *
 * // Apply to an entire router
 * router.use(RateLimit({ windowMs: 1, max: 100 }));
 */
export function RateLimit(options: RateLimitOptions): RequestHandler {
  const config: Parameters<typeof rateLimit>[0] = {
    windowMs: options.windowMin * 60 * 1000,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message ?? {
      error: "Too many requests, try again later",
    },
    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        redis.call(...(args as [string, ...string[]])) as Promise<
          boolean | number | string | (boolean | number | string)[]
        >,
    }),
  };

  if (options.keyGenerator) {
    config.keyGenerator = options.keyGenerator;
  }

  return rateLimit(config);
}
