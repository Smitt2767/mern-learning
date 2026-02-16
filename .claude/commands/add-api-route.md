Create a new API route for the backend.

Route: $ARGUMENTS

## Architecture

- **Controllers** orchestrate the request flow: validate input, call services, handle transactions, set cookies, return response
- **Services** are a pure data access layer — they ONLY interact with the database. No business logic, no req/res
- **Services** accept an optional `tx: DbInstance = db` param (from `backend/src/types/index.ts`) so they work inside transactions or standalone
- **DB transactions** are called from the controller via `db.transaction(async (tx) => { ... })`, passing `tx` to each service call
- All utility/service classes use **static methods only** with **private constructors** (no instantiation)

## Steps

### 1. Zod validation schema

Create `packages/core/src/schemas/<domain>.ts`:

```ts
import { z } from "zod";

export const <action>Schema = z.object({
  // define fields...
});

export type <Action>Input = z.infer<typeof <action>Schema>;
```

Export from `packages/core/src/schemas/index.ts`:

```ts
export { <action>Schema, type <Action>Input } from "./<domain>.js";
```

Export from `packages/core/src/index.ts`:

```ts
export { <action>Schema, type <Action>Input } from "./schemas/index.js";
```

Build: `pnpm --filter @mern/core build`

### 2. DB schema (if new table needed)

Create `backend/src/db/schema/<domain>.ts`:

```ts
import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { users } from "./users.js";

export const <domain> = pgTable(
  "<domain_snake_case>",
  {
    id,
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // ...fields
    createdAt,
    updatedAt,
  },
  (table) => [
    index("idx_<domain>_user_id").on(table.userId),
  ],
);

export const <domain>Relations = relations(<domain>, ({ one }) => ({
  user: one(users, { fields: [<domain>.userId], references: [users.id] }),
}));

export type <Domain> = typeof <domain>.$inferSelect;
export type New<Domain> = typeof <domain>.$inferInsert;
```

Export from `backend/src/db/schema/index.ts`:

```ts
export { <domain>, <domain>Relations, type <Domain>, type New<Domain> } from "./<domain>.js";
```

Generate & run migration: `pnpm --filter backend db:generate && pnpm --filter backend db:migrate`

### 3. Cache keys & tags

**`backend/src/cache/keys.ts`** — add a new section:

```ts
import { generateCacheKey } from "./index.js";

export const CacheKeys = {
  // existing...
  <domain>: {
    byId: (id: string) => generateCacheKey("<domain>", id),
    // e.g. byUserId: (userId: string) => generateCacheKey("users", userId, "<domain>"),
  },
} as const;
```

**`backend/src/cache/tags.ts`** — add a new section:

```ts
import { generateTag } from "./index.js";

export const CacheTags = {
  // existing...
  <domain>: {
    all: () => generateTag("<domain>"),
    byId: (id: string) => generateTag("<domain>", id),
    // relationship tags:
    // byUserId: (userId: string) => generateTag("users", userId, "<domain>"),
  },
} as const;
```

**TTLs** — use `CacheTime` constants from `backend/src/config/redis.ts` → `CACHE_TIMES`:

| Key              | Seconds   |
| ---------------- | --------- |
| `oneMinute`      | 60        |
| `fiveMinutes`    | 300       |
| `fifteenMinutes` | 900       |
| `oneHour`        | 3,600     |
| `sixHours`       | 21,600    |
| `twelveHours`    | 43,200    |
| `oneDay`         | 86,400    |
| `oneWeek`        | 604,800   |
| `twoWeeks`       | 1,209,600 |
| `oneMonth`       | 2,592,000 |

### 4. Service

Create `backend/src/services/<domain>.ts`:

```ts
import { eq } from "drizzle-orm";
import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../db/index.js";
import { <domain>, type <Domain>, type New<Domain> } from "../db/schema/index.js";
import { CacheInvalidate, Cacheable } from "../decorators/cache.js";
import type { DbInstance } from "../types/index.js";

export class <Domain>Service {
  private constructor() {}

  // READ — cached, no tx param
  @Cacheable({
    key: CacheKeys.<domain>.byId,
    ttl: "oneHour",
    tags: [CacheTags.<domain>.all, CacheTags.<domain>.byId],
  })
  static async findById(id: string): Promise<<Domain> | undefined> {
    return db.query.<domain>.findFirst({
      where: eq(<domain>.id, id),
    });
  }

  // WRITE — invalidate cache, accepts tx
  @CacheInvalidate({
    tags: [CacheTags.<domain>.byId],
  })
  static async update(id: string, data: Partial<New<Domain>>, tx: DbInstance = db): Promise<<Domain>> {
    const [updated] = await tx
      .update(<domain>)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(<domain>.id, id))
      .returning();
    return updated!;
  }

  // CREATE — no caching (only called during creation)
  static async create(data: New<Domain>, tx: DbInstance = db): Promise<<Domain>> {
    const [record] = await tx.insert(<domain>).values(data).returning();
    return record!;
  }

  @CacheInvalidate({
    tags: [CacheTags.<domain>.byId],
  })
  static async deleteById(id: string, tx: DbInstance = db): Promise<void> {
    await tx.delete(<domain>).where(eq(<domain>.id, id));
  }
}
```

**Caching rules:**

- `@Cacheable` — **read** methods called frequently. **Never** add `tx` param — cached reads bypass the DB
- `@CacheInvalidate` — **write/delete** methods. Tags/keys receive the **same args** as the method
- The tag functions in the `tags` array get called with the method args — use positional arrow functions when the tag needs a specific arg: `(_first, second) => CacheTags.<domain>.byId(second)`
- Methods only called during creation/in transactions can skip decorators entirely

### 5. Controller function

Create `backend/src/controllers/<domain>/<action>.ts`:

```ts
import { <action>Schema } from "@mern/core";
import type { Request, Response } from "express";

import { db } from "../../db/index.js";
import { <Domain>Service } from "../../services/<domain>.js";
import { AppError } from "../../utils/app-error.js";

export async function <action>(req: Request, res: Response): Promise<void> {
  // 1. Validate input — ZodError auto-caught by globalErrorHandler
  const input = <action>Schema.parse(req.body);

  // 2. Business checks
  const existing = await <Domain>Service.findById(req.params.id);
  if (!existing) {
    throw AppError.notFound("<Domain> not found");
  }

  // 3. Single write — no transaction needed
  const result = await <Domain>Service.update(existing.id, input);

  // 4. Multiple writes — use transaction
  // try {
  //   const result = await db.transaction(async (tx) => {
  //     const a = await <Domain>Service.create({ ... }, tx);
  //     const b = await OtherService.create({ ... }, tx);
  //     return { a, b };
  //   });
  // } catch (error: unknown) {
  //   if (error instanceof Error && "code" in error && (error as Record<string, unknown>).code === "23505") {
  //     throw AppError.badRequest("Duplicate entry");
  //   }
  //   throw error;
  // }

  res.status(200).json({
    success: true,
    message: "...",
    data: { result },
  });
}
```

**Error factories:**

| Method                         | Status |
| ------------------------------ | ------ |
| `AppError.badRequest("...")`   | 400    |
| `AppError.unauthorized("...")` | 401    |
| `AppError.forbidden("...")`    | 403    |
| `AppError.notFound("...")`     | 404    |
| `AppError.tooMany("...")`      | 429    |
| `AppError.internal("...")`     | 500    |

### 6. Wire controller

`backend/src/controllers/<domain>/index.ts`:

```ts
import { <action> } from "./<action>.js";
// import more actions...

export class <Domain>Controller {
  static <action> = <action>;
}
```

### 7. Route file

Create/update `backend/src/routes/<domain>.ts`:

```ts
import express, { type Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { RateLimit } from "../middleware/rate-limit.js";
import { <Domain>Controller } from "../controllers/<domain>/index.js";

export const router: Router = express.Router();

// Public route
router
  .route("/")
  .post(RateLimit({ windowMin: 15, limit: 10 }), <Domain>Controller.<action>);

// Protected route
router
  .route("/:id")
  .get(
    RateLimit({ windowMin: 15, limit: 30 }),
    authenticate,
    <Domain>Controller.<action>,
  );

// Role-restricted route
router
  .route("/:id")
  .delete(
    RateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    authorize("ADMIN"),
    <Domain>Controller.<action>,
  );
```

**Rate limit guidelines:**

| Route type            | windowMin | limit |
| --------------------- | --------- | ----- |
| Public write (signup) | 60        | 5     |
| Public write (login)  | 15        | 10    |
| Protected read        | 15        | 30    |
| Protected write       | 15        | 10    |
| Sensitive action      | 60        | 5     |

**Middleware order:** `RateLimit` → `authenticate` → `authorize(...)` → `Controller.handler`

### 8. Register route in server

`backend/src/server.ts` → inside `routes()` method:

```ts
import { router as <domain>Router } from "./routes/<domain>.js";

// inside routes():
this.app.use("/api/<domain>", <domain>Router);
```

---

## Quick reference

### Available utilities

| Utility        | Methods                                                                                                                                        | Path                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `Password`     | `hash(password)`, `compare(plain, hashed)`                                                                                                     | `backend/src/utils/password.ts`        |
| `Jwt`          | `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)`, `getRefreshTokenExpiresAt()` | `backend/src/utils/jwt.ts`             |
| `Cookie`       | `set(res, name, value, options?)`, `get(req, name)`, `delete(res, name, options?)`                                                             | `backend/src/utils/cookie.ts`          |
| `AppError`     | `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `tooMany()`, `internal()`                                                       | `backend/src/utils/app-error.ts`       |
| `Cache`        | `get(key)`, `set(key, value, ttl)`, `setTagged(key, value, ttl, tags)`, `invalidate(...keys)`, `invalidateByTag(...tags)`                      | `backend/src/cache/index.ts`           |
| `RateLimit`    | `RateLimit({ windowMin, limit })`                                                                                                              | `backend/src/middleware/rate-limit.ts` |
| `authenticate` | JWT + session validation middleware                                                                                                            | `backend/src/middleware/auth.ts`       |
| `authorize`    | `authorize(...roles)` — role-based access control                                                                                              | `backend/src/middleware/auth.ts`       |

### Decorators

| Decorator                            | Usage                                                    | Path                              |
| ------------------------------------ | -------------------------------------------------------- | --------------------------------- |
| `@Cacheable({ key, ttl, tags? })`    | Auto-cache read results in Redis with tag-based grouping | `backend/src/decorators/cache.ts` |
| `@CacheInvalidate({ keys?, tags? })` | Auto-invalidate cache after mutations                    | `backend/src/decorators/cache.ts` |

### Key conventions

- ESM modules — all imports use `.js` extension even for `.ts` source files
- TypeScript strict mode with `exactOptionalPropertyTypes`
- Use `null` (not `undefined`) for nullable DB fields — matches Drizzle's output
- Drizzle ORM with automatic `snake_case` casing — write camelCase in code, stored as snake_case in DB
- Schema types: `$inferSelect` for reads, `$inferInsert` for writes (e.g. `User`, `NewUser`)
- Always use `pnpm`, never npm or yarn
- `req.user` is typed as `SessionUser` (User without `password`) — available after `authenticate`
- `req.sessionId` is typed as `string | undefined` — available after `authenticate`
- Unique constraint violations from Postgres have error code `"23505"` — always catch and re-throw as `AppError.badRequest`
- `@Cacheable` methods must NOT accept `tx` — cached reads always go directly to DB on cache miss
- `@CacheInvalidate` methods should accept `tx: DbInstance = db` — writes may run inside transactions
