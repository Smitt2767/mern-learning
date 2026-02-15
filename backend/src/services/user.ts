import { type UserStatus } from "@mern/shared";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users, type NewUser, type User } from "../db/schema/index.js";
import type { DbInstance } from "../types/index.js";

export class UserService {
  private constructor() {}

  static async findByEmail(
    email: string,
    tx: DbInstance = db,
  ): Promise<User | undefined> {
    return tx.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  static async create(data: NewUser, tx: DbInstance = db): Promise<User> {
    const [user] = await tx.insert(users).values(data).returning();
    return user!;
  }

  static async updateStatus(
    id: string,
    status: UserStatus,
    tx: DbInstance = db,
  ): Promise<void> {
    await tx
      .update(users)
      .set({
        status,
        deactivatedAt: status === "inactive" ? new Date() : null,
      })
      .where(eq(users.id, id));
  }
}
