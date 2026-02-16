import { CacheInvalidate, Cacheable } from "@mern/cache";
import { sessions, type DbInstance, type NewSession } from "@mern/database";
import { eq } from "drizzle-orm";
import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

export class SessionService {
  private constructor() {}

  @Cacheable({
    key: CacheKeys.sessions.byId,
    ttl: "oneDay",
    tags: [
      CacheTags.sessions.all,
      (_, id) => CacheTags.sessions.byId(id),
      CacheTags.sessions.byUserId,
    ],
  })
  static async findById(_userId: string, id: string) {
    return db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });
  }

  static async create(data: NewSession, tx: DbInstance = db) {
    const [session] = await tx.insert(sessions).values(data).returning();
    return session!;
  }

  @CacheInvalidate({ tags: [CacheTags.sessions.byId] })
  static async deleteById(id: string, tx: DbInstance = db) {
    await tx.delete(sessions).where(eq(sessions.id, id)).returning();
  }

  @CacheInvalidate({ tags: [CacheTags.sessions.byUserId] })
  static async deleteByUserId(userId: string, tx: DbInstance = db) {
    await tx.delete(sessions).where(eq(sessions.userId, userId));
  }

  @CacheInvalidate({ tags: [CacheTags.sessions.byId] })
  static async rotate(oldSessionId: string, newSession: NewSession) {
    return db.transaction(async (tx) => {
      await SessionService.deleteById(oldSessionId, tx);
      return SessionService.create(newSession, tx);
    });
  }
}
