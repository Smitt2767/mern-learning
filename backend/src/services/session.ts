import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, type NewSession, type Session } from "../db/schema/index.js";
import { Cacheable } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";
import { Cache } from "../utils/cache.js";

export class SessionService {
  private constructor() {}

  @Cacheable("session", "oneWeek")
  static async findByUserId(userId: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .limit(1);
    return session ?? null;
  }

  static async create(data: NewSession, tx: DbInstance = db): Promise<Session> {
    const [session] = await tx.insert(sessions).values(data).returning();
    Cache.set("session", "oneWeek", data.userId);
    return session!;
  }
}
