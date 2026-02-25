import { generateCacheTag } from "@mern/cache";

// Tag names must be consistent across all services that share the same Redis.
// auth-server, main-server, and admin-server all share one Redis instance.

export const CacheTags = {
  users: {
    all: () => generateCacheTag("users"),
    byId: (userId: string) => generateCacheTag("users", userId),
  },
  roles: {
    byId: (roleId: string) => generateCacheTag("roles", roleId),
  },
  sessions: {
    all: () => generateCacheTag("sessions"),
    byId: (sessionId: string) => generateCacheTag("sessions", sessionId),
    byUserId: (userId: string) => generateCacheTag("users", userId, "sessions"),
  },
  orgs: {
    byOrgId: (orgId: string) => generateCacheTag("orgs", orgId),
    byUserId: (userId: string) => generateCacheTag("users", userId, "orgs"),
    roleById: (roleId: string) => generateCacheTag("orgs", "roles", roleId),
  },
} as const;
