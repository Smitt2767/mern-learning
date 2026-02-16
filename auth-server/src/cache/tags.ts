import { generateCacheTag } from "@mern/cache";

export const CacheTags = {
  users: {
    all: () => generateCacheTag("users"),
    byId: (userId: string) => generateCacheTag("users", userId),
  },
  sessions: {
    all: () => generateCacheTag("sessions"),
    byId: (sessionId: string) => generateCacheTag("sessions", sessionId),
    byUserId: (userId: string) => generateCacheTag("users", userId, "sessions"),
  },
} as const;
