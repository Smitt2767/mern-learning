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
    // admin-server shares the same DB as auth-server, so it can validate
    // sessions directly without owning the session lifecycle.
    findSession: (userId, sessionId) =>
      SessionService.findById(userId, sessionId),
    findUser: async (userId) => {
      const user = await UserService.findById(userId);
      if (!user) return null;

      const role = user.roleId ? await RoleService.findById(user.roleId) : null;

      return { ...user, role };
    },
    // admin-server does not issue or delete sessions — auth-server owns them.
    deleteSession: async () => {},
  });

const rateLimit: ReturnType<typeof createRateLimiter> =
  createRateLimiter(redis);

export { authenticate, authorize, rateLimit };
