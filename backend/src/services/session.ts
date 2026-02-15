import { eq } from "drizzle-orm";
import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../db/index.js";
import { sessions, type NewSession, type Session } from "../db/schema/index.js";
import { CacheInvalidate, Cacheable } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";

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
  static async findById(
    _userId: string,
    id: string,
  ): Promise<Session | undefined> {
    return db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });
  }

  static async create(data: NewSession, tx: DbInstance = db): Promise<Session> {
    const [session] = await tx.insert(sessions).values(data).returning();
    return session!;
  }

  @CacheInvalidate({ tags: [CacheTags.sessions.byId] })
  static async deleteById(id: string, tx: DbInstance = db): Promise<void> {
    await tx.delete(sessions).where(eq(sessions.id, id)).returning();
  }
}
