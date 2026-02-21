import { Cacheable } from "@mern/cache";
import { sessions } from "@mern/database";
import { eq } from "drizzle-orm";
import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

export class SessionService {
  private constructor() {}

  @Cacheable({
    key: CacheKeys.sessions.byId,
    ttl: "oneDay",
    tags: [
      CacheTags.sessions.all,
      (_, id) => CacheTags.sessions.byId(id),
      CacheTags.sessions.byUserId,
    ],
  })
  static async findById(_userId: string, id: string) {
    return db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });
  }
}
