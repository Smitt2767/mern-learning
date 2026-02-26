import { generateCacheKey } from "@mern/cache";

// Key names must match auth-server and main-server exactly —
// all services share the same Redis instance.
export const CacheKeys = {
  users: {
    byId: (userId: string) => generateCacheKey("users", userId),
  },
  roles: {
    byId: (roleId: string) => generateCacheKey("roles", roleId),
  },
  sessions: {
    byId: (userId: string, sessionId: string) =>
      generateCacheKey("users", userId, "sessions", sessionId),
  },
  orgs: {
    bySlug: (slug: string) => generateCacheKey("orgs", "slug", slug),
    membersByOrgId: (orgId: string) =>
      generateCacheKey("orgs", orgId, "members"),
  },
} as const;
