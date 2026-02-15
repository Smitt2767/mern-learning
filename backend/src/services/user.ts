import { type UserStatus } from "@mern/shared";
import { eq, getTableColumns } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../db/index.js";
import { users, type NewUser, type User } from "../db/schema/index.js";
import { CacheInvalidate, Cacheable } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";

export type SessionUser = Omit<User, "password">;

const { password: _, ...userColumnsWithoutPassword } = getTableColumns(users);

export class UserService {
  private constructor() {}

  static async findByEmail(email: string, tx: DbInstance = db) {
    return tx.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  @Cacheable({
    key: CacheKeys.users.byId,
    ttl: "oneHour",
    tags: [CacheTags.users.all, CacheTags.users.byId],
  })
  static async findById(id: string) {
    const [user] = await db
      .select(userColumnsWithoutPassword)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  static async create(data: NewUser, tx: DbInstance = db) {
    const [user] = await tx.insert(users).values(data).returning();
    return user!;
  }

  @CacheInvalidate({ tags: [CacheTags.users.byId] })
  static async updateStatus(
    id: string,
    status: UserStatus,
    tx: DbInstance = db,
  ) {
    await tx
      .update(users)
      .set({
        status,
        deactivatedAt: status === "inactive" ? new Date() : null,
      })
      .where(eq(users.id, id));
  }

  @CacheInvalidate({ tags: [CacheTags.users.byId] })
  static async updatePassword(
    id: string,
    password: string,
    tx: DbInstance = db,
  ) {
    await tx.update(users).set({ password }).where(eq(users.id, id));
  }

  @CacheInvalidate({ tags: [CacheTags.users.byId] })
  static async updateProfileImage(
    id: string,
    profileImage: string,
    tx: DbInstance = db,
  ) {
    await tx.update(users).set({ profileImage }).where(eq(users.id, id));
  }
}
