import { generateCacheKey } from "@mern/cache";

// Key names must match auth-server exactly — both services share the same Redis instance.
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
} as const;
