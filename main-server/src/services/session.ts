import { CacheInvalidate, Cacheable } from "@mern/cache";
import { sessions } from "@mern/database";
import { eq } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

// main-server validates sessions but never creates, rotates, or deletes them.
// All session lifecycle operations are owned by auth-server.

export class SessionService {
  private constructor() {}

  @Cacheable({
    key: CacheKeys.sessions.byId,
    ttl: "oneDay",
    tags: [CacheTags.sessions.all, CacheTags.sessions.byUserId],
  })
  static async findById(_userId: string, id: string) {
    return db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });
  }

  @CacheInvalidate({ tags: [CacheTags.sessions.byId] })
  static async deleteById(id: string) {
    await db.delete(sessions).where(eq(sessions.id, id)).returning();
  }
}
