Create a new API route for the backend.

Route: $ARGUMENTS

## Architecture

- **Controllers** orchestrate the request flow: validate input, call services, handle transactions, set cookies, return response
- **Services** are a pure data access layer — they ONLY interact with the database. No business logic, no req/res
- **Services** accept an optional `tx?: DbInstance` param (from `backend/src/types/index.ts`) so they work inside transactions or standalone (defaults to `db`)
- **DB transactions** are called from the controller, passing `tx` to each service call
- All utility/service classes use **static methods only** with **private constructors** (no instantiation)

## Steps

### 1. Zod validation schema

- Create in `packages/shared/src/schemas/<domain>.ts`
- Export from `packages/shared/src/schemas/index.ts` and `packages/shared/src/index.ts`
- Build: `pnpm --filter @mern/shared build`

### 2. Cache keys, tags & TTLs

Before writing services, define the caching layer:

**Cache keys** in `backend/src/cache/keys.ts` — add a new section to the `CacheKeys` object:

```ts
// Use generateCacheKey for deterministic key generation
export const CacheKeys = {
  // existing...
  <domain>: {
    byId: (id: string) => generateCacheKey("<domain>", id),
    // add more granular keys as needed
  },
} as const;
```

**Cache tags** in `backend/src/cache/tags.ts` — add a new section to the `CacheTags` object:

```ts
// Use generateTag for tag generation
export const CacheTags = {
  // existing...
  <domain>: {
    all: () => generateTag("<domain>"),
    byId: (id: string) => generateTag("<domain>", id),
    // add relationship tags as needed, e.g.:
    // byUserId: (userId: string) => generateTag("users", userId, "<domain>"),
  },
} as const;
```

**TTLs** — use constants from `backend/src/config/redis.ts` → `CACHE_TIMES`:
`oneMinute | fiveMinutes | fifteenMinutes | oneHour | sixHours | twelveHours | oneDay | oneWeek | twoWeeks | oneMonth`

### 3. Service methods

Create `backend/src/services/<domain>.ts`:

```ts
import { db } from "../db/index.js";
import type { DbInstance } from "../types/index.js";
import { Cacheable, CacheInvalidate } from "../decorators/cache.js";
import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";

export class <Domain>Service {
  private constructor() {}

  // READ — use @Cacheable decorator
  @Cacheable({
    key: CacheKeys.<domain>.byId,
    ttl: "oneHour", // pick appropriate TTL from CACHE_TIMES
    tags: [CacheTags.<domain>.all, CacheTags.<domain>.byId],
  })
  static async findById(id: string): Promise<...> {
    // NOTE: @Cacheable methods must NOT accept tx param (cached reads bypass DB)
  }

  // WRITE — use @CacheInvalidate decorator
  @CacheInvalidate({
    tags: [CacheTags.<domain>.byId], // invalidate specific tags
  })
  static async update(id: string, data: ..., tx: DbInstance = db): Promise<void> {
    // first arg passed to tag functions for key generation
  }

  // Non-cached queries (e.g. used only during creation) — no decorator
  static async findByEmail(email: string, tx: DbInstance = db): Promise<...> {
    // ...
  }
}
```

**Caching rules:**

- `@Cacheable` — on **read** methods that are called frequently. Do NOT add `tx` param to cached methods
- `@CacheInvalidate` — on **write/delete** methods. Tags/keys receive the method args for dynamic generation
- Methods used only inside transactions or during creation can skip caching
- The `key` function and `tags` array functions receive the **same args** as the decorated method
- When a tag function needs a different arg position, use `(_firstArg, secondArg) => CacheTags...byId(secondArg)`

### 4. Controller function

Create `backend/src/controllers/<domain>/<action>.ts`:

- Validate with `schema.parse(req.body)` — ZodError auto-caught by `globalErrorHandler`
- Call services for DB operations, use `db.transaction()` when multiple writes are needed
- Use `AppError` static factories for errors (`badRequest`, `unauthorized`, `notFound`, etc.)
- Catch Postgres unique constraint violations (code `23505`) and re-throw as `AppError.badRequest`

### 5. Wire controller

In `backend/src/controllers/<domain>/index.ts` — import and assign as static property:

```ts
import { <action> } from "./<action>.js";

export class <Domain>Controller {
  static <action> = <action>;
}
```

### 6. Route

Create/update `backend/src/routes/<domain>.ts`:

```ts
import express, { type Router } from "express";
import { RateLimit } from "../middleware/rate-limit.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { <Domain>Controller } from "../controllers/<domain>/index.js";

export const router: Router = express.Router();

// Public route — rate limit only
router
  .route("/<path>")
  .post(RateLimit({ windowMin: 15, limit: 10 }), <Domain>Controller.<action>);

// Protected route — rate limit + auth
router
  .route("/<path>")
  .get(
    RateLimit({ windowMin: 15, limit: 30 }),
    authenticate,
    <Domain>Controller.<action>,
  );

// Role-restricted route — rate limit + auth + authorize
router
  .route("/<path>")
  .delete(
    RateLimit({ windowMin: 15, limit: 10 }),
    authenticate,
    authorize("ADMIN"),
    <Domain>Controller.<action>,
  );
```

**Rate limit guidelines:**

| Route type          | windowMin | limit |
|---------------------|-----------|-------|
| Public write (signup)| 60       | 5     |
| Public write (login) | 15       | 10    |
| Protected read       | 15       | 30    |
| Protected write      | 15       | 10    |
| Sensitive action     | 60       | 5     |

**Middleware order:** `RateLimit` → `authenticate` → `authorize(...)` → `Controller.handler`

### 7. Register route

In `backend/src/server.ts` → `routes()` method:

```ts
this.app.use("/api/<domain>", <domain>Router);
```

## Response format

```ts
// Success
res.status(200).json({ success: true, message: "...", data: { ... } });

// Error (thrown, caught by globalErrorHandler)
throw AppError.badRequest("...");   // 400
throw AppError.unauthorized("..."); // 401
throw AppError.forbidden("...");    // 403
throw AppError.notFound("...");     // 404
```

## Available utilities

- `Password` — `hash(password)`, `compare(plain, hashed)` — `backend/src/utils/password.ts`
- `Jwt` — `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)`, `getRefreshTokenExpiresAt()` — `backend/src/utils/jwt.ts`
- `Cookie` — `set(res, name, value, options?)`, `get(req, name)`, `delete(res, name, options?)` — `backend/src/utils/cookie.ts`
- `AppError` — `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `tooMany()`, `internal()` — `backend/src/utils/app-error.ts`
- `Cache` — `get(key)`, `set(key, value, ttl)`, `setTagged(key, value, ttl, tags)`, `invalidate(...keys)`, `invalidateByTag(...tags)` — `backend/src/cache/index.ts`
- `RateLimit({ windowMin, limit })` — `backend/src/middleware/rate-limit.ts`
- `authenticate` — JWT + session validation middleware — `backend/src/middleware/auth.ts`
- `authorize(...roles)` — role-based access control — `backend/src/middleware/auth.ts`

## Decorators

- `@Cacheable({ key, ttl, tags? })` — auto-cache method results in Redis with tag-based grouping — `backend/src/decorators/cache.ts`
- `@CacheInvalidate({ keys?, tags? })` — auto-invalidate cache after mutations — `backend/src/decorators/cache.ts`

## Key conventions

- ESM modules — all imports use `.js` extension
- TypeScript strict mode with `exactOptionalPropertyTypes`
- Use `null` (not `undefined`) for nullable DB fields
- Drizzle ORM with `snake_case` casing — camelCase in code, snake_case in DB
- Schema types: `$inferSelect` for reads, `$inferInsert` for writes (e.g. `User`, `NewUser`)
- Always use `pnpm`, never npm or yarn
- `@Cacheable` methods should NOT accept `tx` param — cached reads go directly to DB on cache miss
- `@CacheInvalidate` methods should accept `tx: DbInstance = db` — writes may run inside transactions
