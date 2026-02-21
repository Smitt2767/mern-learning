import {
  authorize,
  createAuthMiddleware,
  createRateLimiter,
} from "@mern/server";

import redis from "../config/redis.js";
import { RoleService } from "../services/role.js";
import { SessionService } from "../services/session.js";
import { UserService } from "../services/user.js";

const authenticate: ReturnType<typeof createAuthMiddleware> =
  createAuthMiddleware({
    findSession: (userId, sessionId) =>
      SessionService.findById(userId, sessionId),
    findUser: async (userId) => {
      const user = await UserService.findById(userId);
      if (!user) return null;

      const role = user.roleId
        ? await RoleService.findWithPermissions(user.roleId)
        : null;

      return { ...user, role };
    },
    deleteSession: (sessionId) => SessionService.deleteById(sessionId),
  });

const rateLimit: ReturnType<typeof createRateLimiter> =
  createRateLimiter(redis);

export { authenticate, authorize, rateLimit };
