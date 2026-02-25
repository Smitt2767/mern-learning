import {
  authorize,
  createAuthMiddleware,
  createAuthorizeOrg,
  createRateLimiter,
} from "@mern/server";

import redis from "../config/redis.js";
import { OrganizationService } from "../services/organization.js";
import { RoleService } from "../services/role.js";
import { SessionService } from "../services/session.js";
import { UserService } from "../services/user.js";

// main-server validates sessions but never issues or deletes them.
// deleteSession is a no-op — auth-server owns the session lifecycle.
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
    deleteSession: async () => {},
  });

const authorizeOrg: ReturnType<typeof createAuthorizeOrg> = createAuthorizeOrg({
  findOrgBySlug: (slug) => OrganizationService.findBySlug(slug),
  findMember: (orgId, userId) => OrganizationService.findMember(orgId, userId),
  findRoleWithPermissions: (roleId) =>
    OrganizationService.findOrgRoleWithPermissions(roleId),
});

const rateLimit: ReturnType<typeof createRateLimiter> =
  createRateLimiter(redis);

export { authenticate, authorize, authorizeOrg, rateLimit };
