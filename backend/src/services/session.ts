import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, type NewSession, type Session } from "../db/schema/index.js";
import { Cacheable } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";
import { Cache } from "../utils/cache.js";

export class SessionService {
  private constructor() {}

  @Cacheable("session", "oneHour")
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
    await Cache.set("session", "oneWeek", data, session?.userId!, data.id!);
    return session!;
  }

  static async deleteById(id: string, tx: DbInstance = db): Promise<void> {
    const [session] = await tx
      .delete(sessions)
      .where(eq(sessions.id, id))
      .returning();

    if (session) {
      await Cache.invalidate(["user"], session.userId, session.id);
    }
  }
}
