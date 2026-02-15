import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, type NewSession, type Session } from "../db/schema/index.js";
import { CacheInvalidate } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";
import { Cache } from "../utils/cache.js";

export class SessionService {
  private constructor() {}

  static async create(data: NewSession, tx: DbInstance = db): Promise<Session> {
    const [session] = await tx.insert(sessions).values(data).returning();
    await Cache.set("session", "oneWeek", data, data.id!);
    return session!;
  }

  @CacheInvalidate("session")
  static async deleteById(id: string, tx: DbInstance = db): Promise<void> {
    await tx.delete(sessions).where(eq(sessions.id, id));
  }
}
