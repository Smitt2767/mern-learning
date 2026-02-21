import { generateCacheTag } from "@mern/cache";

// Tag names must match auth-server exactly — both services share the same Redis instance.
export const CacheTags = {
  users: {
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
} as const;
