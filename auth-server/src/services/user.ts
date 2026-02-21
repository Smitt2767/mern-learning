import { type SessionUser, type UserStatus } from "@mern/core";
import { eq, getTableColumns } from "drizzle-orm";

import { CacheInvalidate, Cacheable } from "@mern/cache";
import { users, type DbInstance, type NewUser } from "@mern/database";
import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

export type { SessionUser };

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

  @CacheInvalidate({ tags: [CacheTags.users.byId] })
  static async markEmailVerified(id: string, tx: DbInstance = db) {
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, id));
  }
}
