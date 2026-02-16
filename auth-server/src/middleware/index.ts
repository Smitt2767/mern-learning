import {
  authorize,
  createAuthMiddleware,
  createRateLimiter,
} from "@mern/server";

import redis from "../config/redis.js";
import { SessionService } from "../services/session.js";
import { UserService } from "../services/user.js";

const authenticate: ReturnType<typeof createAuthMiddleware> =
  createAuthMiddleware({
    findSession: (userId, sessionId) =>
      SessionService.findById(userId, sessionId),
    findUser: (userId) => UserService.findById(userId),
    deleteSession: (sessionId) => SessionService.deleteById(sessionId),
  });

const rateLimit: ReturnType<typeof createRateLimiter> =
  createRateLimiter(redis);

export { authenticate, authorize, rateLimit };
