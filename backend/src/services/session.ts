import { db } from "../db/index.js";
import { sessions, type NewSession, type Session } from "../db/schema/index.js";

import type { DbInstance } from "../types/index.js";

export class SessionService {
  private constructor() {}

  static async create(data: NewSession, tx: DbInstance = db): Promise<Session> {
    const [session] = await tx.insert(sessions).values(data).returning();
    return session!;
  }
}
