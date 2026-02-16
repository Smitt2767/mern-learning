import { generateCacheKey } from "@mern/cache";

export const CacheKeys = {
  users: {
    byId: (userId: string) => generateCacheKey("users", userId),
  },
  sessions: {
    byId: (userId: string, sessionId: string) =>
      generateCacheKey("users", userId, "sessions", sessionId),
  },
  oauth: {
    state: (state: string) => generateCacheKey("oauth", "state", state),
  },
} as const;
