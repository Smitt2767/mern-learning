Create a new API route for the backend.

Route: $ARGUMENTS

## Architecture

- **Controllers** orchestrate the request flow: validate input, call services, handle transactions, set cookies, return response
- **Services** are a pure data access layer — they ONLY interact with the database. No business logic, no req/res
- **Services** accept an optional `tx?: DbInstance` param (from `backend/src/types/index.ts`) so they work inside transactions or standalone (defaults to `db`)
- **DB transactions** are called from the controller, passing `tx` to each service call
- All utility/service classes use **static methods only** with **private constructors** (no instantiation)

## Steps

1. **Zod validation schema** in `packages/shared/src/schemas/` — export from `packages/shared/src/schemas/index.ts` and `packages/shared/src/index.ts`, then build: `pnpm --filter @mern/shared build`
2. **Service methods** in `backend/src/services/` — each method accepts `(data, tx?: DbInstance)`, uses `(tx ?? db)` for queries. Import `DbInstance` from `../types/index.js`
3. **Controller function** in `backend/src/controllers/<domain>/<action>.ts`:
   - Validate with `schema.parse(req.body)` — ZodError auto-caught by `globalErrorHandler`
   - Call services for DB operations, use `db.transaction()` when multiple writes are needed
   - Use `AppError` static factories for errors (`badRequest`, `unauthorized`, `notFound`, etc.)
   - Catch Postgres unique constraint violations (code `23505`) and re-throw as `AppError.badRequest`
4. **Wire controller** in `backend/src/controllers/<domain>/index.ts` — import and assign as static property on the controller class
5. **Route** in `backend/src/routes/<domain>.ts` — add rate limiting with `RateLimit({ windowMin, limit })` where appropriate
6. **Register route** in `backend/src/server.ts` → `routes()` method: `this.app.use("/api/<domain>", router)`

## Response format

```ts
// Success
res.status(200).json({ success: true, message: "...", data: { ... } });

// Error (thrown, caught by globalErrorHandler)
throw AppError.badRequest("...");   // 400
throw AppError.unauthorized("..."); // 401
throw AppError.notFound("...");     // 404
```

## Available utilities

- `Password` — `hash(password)`, `compare(plain, hashed)` — `backend/src/utils/password.ts`
- `Jwt` — `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)`, `getRefreshTokenExpiresAt()` — `backend/src/utils/jwt.ts`
- `Cookie` — `set(res, name, value, options?)`, `get(req, name)`, `delete(res, name, options?)` — `backend/src/utils/cookie.ts`
- `AppError` — `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `tooMany()`, `internal()` — `backend/src/utils/app-error.ts`
- `RateLimit({ windowMin, limit })` — `backend/src/middleware/rate-limit.ts`

## Key conventions

- ESM modules — all imports use `.js` extension
- TypeScript strict mode with `exactOptionalPropertyTypes`
- Use `null` (not `undefined`) for nullable DB fields
- Drizzle ORM with `snake_case` casing — camelCase in code, snake_case in DB
- Schema types: `$inferSelect` for reads, `$inferInsert` for writes (e.g. `User`, `NewUser`)
- Always use `pnpm`, never npm or yarn
