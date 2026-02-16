import { generateTag } from "./index.js";

export const CacheTags = {
  users: {
    all: () => generateTag("users"),
    byId: (userId: string) => generateTag("users", userId),
  },
  sessions: {
    all: () => generateTag("sessions"),
    byId: (sessionId: string) => generateTag("sessions", sessionId),
    byUserId: (userId: string) => generateTag("users", userId, "sessions"),
  },
} as const;
