import { CacheInvalidate, Cacheable } from "@mern/cache";
import { type UserStatus } from "@mern/core";
import { roles, users } from "@mern/database";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

const { password: _, ...userColumnsWithoutPassword } = getTableColumns(users);

export class UserService {
  private constructor() {}

  // Used by the authenticate middleware — cached so the hot path stays fast.
  @Cacheable({
    key: CacheKeys.users.byId,
    ttl: "oneHour",
    tags: [CacheTags.users.byId],
  })
  static async findById(id: string) {
    const [user] = await db
      .select(userColumnsWithoutPassword)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  // Used by admin list endpoint — not cached, includes basic role info.
  static async findAll({ page, limit }: { page: number; limit: number }) {
    const offset = (page - 1) * limit;

    const [rows, [countResult]] = await Promise.all([
      db.query.users.findMany({
        columns: { password: false },
        with: {
          role: { columns: { id: true, name: true, isSystem: true } },
        },
        orderBy: (u, { desc: d }) => [d(u.createdAt)],
        limit,
        offset,
      }),
      db.select({ total: count() }).from(users),
    ]);

    return {
      users: rows,
      total: Number(countResult?.total ?? 0),
      page,
      limit,
    };
  }

  @CacheInvalidate({ tags: [CacheTags.users.byId] })
  static async assignRole(id: string, roleId: string | null): Promise<void> {
    await db.update(users).set({ roleId }).where(eq(users.id, id));
  }

  @CacheInvalidate({ tags: [CacheTags.users.byId] })
  static async updateStatus(id: string, status: UserStatus): Promise<void> {
    await db
      .update(users)
      .set({
        status,
        deactivatedAt: status === "inactive" ? new Date() : null,
      })
      .where(eq(users.id, id));
  }

  // Direct DB query for admin detail endpoint — includes role info without
  // password. Not cached since admin reads don't need sub-millisecond latency.
  static async findByIdForAdmin(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { password: false },
      with: {
        role: {
          columns: { id: true, name: true, description: true, isSystem: true },
        },
      },
    });
  }
}
