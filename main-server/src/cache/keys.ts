import { generateCacheKey } from "@mern/cache";

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
    byUserId: (userId: string) => generateCacheKey("users", userId, "orgs"),
    membersByOrgId: (orgId: string) =>
      generateCacheKey("orgs", orgId, "members"),
    roleById: (roleId: string) => generateCacheKey("orgs", "roles", roleId),
  },
} as const;
