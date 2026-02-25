import { Cacheable } from "@mern/cache";
import { users } from "@mern/database";
import { eq, getTableColumns } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

const { password: _, ...userColumnsWithoutPassword } = getTableColumns(users);

// main-server reads users for auth context resolution only.
// Profile mutations live here in the future — for now read-only.

export class UserService {
  private constructor() {}

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
}
