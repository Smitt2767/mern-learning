import type { Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";

interface RateLimitOptions {
  /** Time window in minutes. */
  windowMin: number;
  /** Maximum number of requests per window. */
  limit: number;
  /** Custom error message sent on 429 responses. */
  message?: string | Record<string, unknown>;
  /** Custom key generator — defaults to `req.user.id` or `req.ip`. */
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates a rate-limiting middleware backed by Redis.
 *
 * @example
 * import { RateLimit } from "../middleware/rate-limit.js";
 *
 * // Per-route usage
 * router.post("/login", RateLimit({ windowMin: 15, limit: 10 }), login);
 * router.post("/forgot-password", RateLimit({ windowMin: 60, limit: 5 }), forgotPassword);
 * router.get("/products", RateLimit({ windowMin: 1, limit: 200 }), getProducts);
 *
 * // Apply to an entire router
 * router.use(RateLimit({ windowMin: 1, limit: 100 }));
 */
export function RateLimit(options: RateLimitOptions): RequestHandler {
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
        // Normalize to avoid double slashes from Express sub-router mounting
        const path = `${req.baseUrl}${req.path}`.replace(/\/+/g, "/");
        const route = `${req.method}:${path}`;

        // Key on user ID only — including IP here would let users bypass
        // limits by rotating IPs (VPN, proxies, etc.)
        if (req.user?.id) {
          return `${route}:user:${req.user.id}`;
        }

        // For anonymous requests, IP is the only identifier available.
        // Be mindful of shared IPs (NAT, proxies) — keep anonymous limits generous.
        return `${route}:ip:${req.ip ?? "unknown"}`;
      }),
  };

  return rateLimit(config);
}
