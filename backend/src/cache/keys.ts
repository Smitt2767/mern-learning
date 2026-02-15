import { generateCacheKey } from "./index.js";

export const CacheKeys = {
  users: {
    byId: (userId: string) => generateCacheKey("users", userId),
  },
  sessions: {
    byId: (userId: string, sessionId: string) =>
      generateCacheKey("users", userId, "sessions", sessionId),
  },
} as const;
