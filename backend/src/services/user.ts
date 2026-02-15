import { type UserStatus } from "@mern/shared";
import { eq, getTableColumns } from "drizzle-orm";

import { db } from "../db/index.js";
import { users, type NewUser, type User } from "../db/schema/index.js";
import { Cacheable } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";
import { Cache } from "../utils/cache.js";

export type SessionUser = Omit<User, "password">;

const { password: _, ...userColumnsWithoutPassword } = getTableColumns(users);

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

  @Cacheable("user", "oneHour")
  static async findById(id: string): Promise<SessionUser | undefined> {
    const [user] = await db
      .select(userColumnsWithoutPassword)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
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

    await Cache.invalidate(["user"], id);
  }
}
