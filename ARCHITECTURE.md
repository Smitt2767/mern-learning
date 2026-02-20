# Project Architecture

> **For AI assistants:** Read this file before starting any cross-service or multi-package task. It contains the full implemented structure, package APIs, DB schema, and inter-service communication map — so you do not need to re-explore the codebase from scratch.

---

## Workspace Layout

Managed with **pnpm workspaces**. Root `pnpm-workspace.yaml` defines:

```
packages/*       → shared packages (@mern/*)
auth-server      → Express 5 REST API
sync-server      → BullMQ background worker
admin            → React 19 frontend
```

> Note: There is no `backend/` or `frontend/` directory. The correct names are `auth-server` and `admin`.

---

## Services

| Service | Filter Name | Port | Role |
|---|---|---|---|
| `admin` | `--filter admin` | 3000 | React 19 + TanStack Start/Router frontend |
| `auth-server` | `--filter auth-server` | 5000 | Express 5 REST API — auth, sessions, OAuth |
| `sync-server` | `--filter sync-server` | — | BullMQ background worker + cron scheduler (single instance) |

### admin (`admin/`)

- **Stack:** React 19.2, TanStack Router v1, TanStack Query, Vite 7, Tailwind CSS 4, Vitest, Base UI, Lucide
- **Routing:** File-based via TanStack Router (`admin/src/routes/`)
- **Env validation:** `@t3-oss/env-core` + Zod, prefix `VITE_`
- **Path alias:** `@/*` → `./src/*`
- **Key files:**
  - `admin/src/routes/__root.tsx` — Root layout
  - `admin/src/routes/index.tsx` — Home page
  - `admin/src/env.ts` — Environment config
  - `admin/src/router.tsx` — Router setup

### auth-server (`auth-server/`)

- **Stack:** Express 5.2, TypeScript 5.9, Drizzle ORM, PostgreSQL, ioredis, JWT, bcryptjs
- **Base class:** Extends `BaseServer` from `@mern/server`
- **Key files:**
  - `auth-server/src/server.ts` — AuthServer class
  - `auth-server/src/config/env.ts` — Zod-validated env vars
  - `auth-server/src/routes/auth.ts` — Auth routes
  - `auth-server/src/routes/user.ts` — User routes
  - `auth-server/src/controllers/auth/` — One file per action
  - `auth-server/src/services/` — user, session, account, password-reset
  - `auth-server/src/utils/oauth/` — base, github, google

**API Routes:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/signin` | No | Login (email + password) |
| POST | `/api/auth/signout` | Yes | Logout |
| GET | `/api/auth/signin/:provider` | No | OAuth redirect (github/google) |
| GET | `/api/auth/callback/:provider` | No | OAuth callback |
| POST | `/api/auth/forgot-password` | No | Request password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| POST | `/api/auth/change-password` | Yes | Change password |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/user/profile` | Yes | Get own user profile |

**Rate limits (per endpoint):**
- signup: 5/60min, signin: 10/15min, signout: 30/15min
- oauth: 20/15min, forgot-password: 3/60min
- change-password: 10/15min, profile: 30/15min

### sync-server (`sync-server/`)

- **Stack:** BullMQ 5.56, Drizzle ORM, PostgreSQL, ioredis, TypeScript
- **Purpose:** Single-instance background service; never run multiple copies
- **Key files:**
  - `sync-server/src/server.ts` — SyncServer class
  - `sync-server/src/cron/index.ts` — Cron job registration
  - `sync-server/src/workers/maintenance.ts` — Worker processor registration
  - `sync-server/src/jobs/purge-expired-sessions.ts`
  - `sync-server/src/jobs/purge-expired-tokens.ts`

**Scheduled cron jobs (midnight UTC daily):**
| Job | Action |
|---|---|
| `PURGE_EXPIRED_SESSIONS` | Deletes sessions where `expiresAt < now()` |
| `PURGE_EXPIRED_TOKENS` | Deletes expired rows from `password_reset_tokens` + `email_verifications` (transactional) |

All job executions are logged to the `job_records` DB table.

---

## Shared Packages (`packages/`)

| Package | Description |
|---|---|
| `@mern/core` | Source-of-truth: types, constants, Zod schemas |
| `@mern/database` | Drizzle ORM schema, table definitions, helpers |
| `@mern/logger` | Pretty console logger (Node ANSI + browser CSS) |
| `@mern/cache` | Redis caching layer with `@Cacheable`/`@CacheInvalidate` decorators |
| `@mern/server` | BaseServer class, middleware factories, Jwt, Password, Cookie, AppError |
| `@mern/queue` | BullMQ queue/worker/scheduler + typed job system + JobRecordService |

### @mern/core (`packages/core/`)

**Constants:**
- `USER_ROLES` — `["admin", "user"]`
- `USER_STATUSES` — `["active", "inactive", "suspended"]`
- `ACCOUNT_PROVIDERS` — `["credentials", "github", "google"]`
- `JOB_NAMES` — discriminator enum for all jobs
- `JOB_STATUSES` — `["waiting", "active", "completed", "failed", "delayed", "paused"]`
- `ERROR_CODES` — application error code constants

**Types:** `User`, `Account`, `Session`, `JobDataMap`, `JobResultMap`, `JobName`

**Schemas (Zod):** `loginSchema`, `signupSchema`, and all other API input schemas

**Job names defined:**
```
SEND_WELCOME_EMAIL, SEND_EMAIL_VERIFICATION, SEND_PASSWORD_RESET_EMAIL
PURGE_EXPIRED_SESSIONS, PURGE_EXPIRED_TOKENS
```

### @mern/database (`packages/database/`)

**Drizzle ORM schema** — single source of truth for all table definitions.

**Helpers:** `id()` (UUID PK), `createdAt()`, `updatedAt()`

**Scripts:** `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:drop`

### @mern/server (`packages/server/`)

**Exports:**
- `BaseServer` — abstract class; auth-server and future servers extend this
- `createAuthMiddleware()` — JWT authentication middleware factory
- `createRateLimiter()` — Redis-backed rate limiter factory
- `createErrorHandler()` — global Express error handler
- `Jwt` — sign/verify with typed payloads
- `Password` — bcryptjs hash/compare wrapper
- `Cookie` — httpOnly cookie management
- `AppError` — custom error class with HTTP status codes

### @mern/queue (`packages/queue/`)

**Exports:**
- `QueueRegistry` — initialize all queues/workers/scheduler together
- `QueueManager` — per-queue management
- `WorkerManager` — register typed job processors
- `Scheduler` — add cron jobs (BullMQ repeatable)
- `JobRecordService` — persist job execution to `job_records` table
- `TypedProcessor<JobName>` — typed processor function type
- `JOB_QUEUE_MAP` — maps each job name to its queue name
- `QUEUE_NAME`, `QUEUE_NAMES` — queue name enum/array

**Init pattern:**
```typescript
QueueRegistry.init({ connection, db, enableWorkers: true, enableScheduler: true });
WorkerManager.register({ [JOB_NAME.PURGE_EXPIRED_SESSIONS]: handler });
Scheduler.addCron({ name, jobName, data, cron: "0 0 * * *", tz: "UTC" });
```

### @mern/cache (`packages/cache/`)

- `Cache.init(redis)` — called once in auth-server startup
- `Cache.get/set/del` — static Redis wrappers
- `@Cacheable` / `@CacheInvalidate` — method decorators
- `generateCacheKey(...parts)` → `"part1:part2:..."`
- `generateCacheTag(...parts)` → `"tag:part1:part2:..."`

### @mern/logger (`packages/logger/`)

```typescript
Logger.debug("msg")    // Cyan
Logger.info("msg")     // Blue
Logger.success("msg")  // Green
Logger.warn("msg")     // Yellow
Logger.error("msg")    // Red
```

Timestamps format: `YYYY-MM-DD HH:MM:SS.mmm`

---

## Database Schema

All tables defined in `packages/database/src/schema.ts` (or per-table files). Uses PostgreSQL via Drizzle ORM.

```
users
├── id (UUID PK), firstName, lastName, email (UNIQUE)
├── password (nullable — null for OAuth-only users)
├── profileImage, role (enum), status (enum)
├── emailVerifiedAt, lastLoginAt, deactivatedAt
├── createdAt, updatedAt
└── Relations → accounts (1:N), sessions (1:N),
                email_verifications (1:N), password_reset_tokens (1:N)

accounts                          (FK → users.id CASCADE)
├── id, userId, provider (enum), providerAccountId
├── UNIQUE(provider, providerAccountId)
└── createdAt, updatedAt

sessions                          (FK → users.id CASCADE)
├── id, userId, refreshToken (UNIQUE)
├── userAgent, ipAddress, expiresAt
└── createdAt
  Indexes: userId, expiresAt

email_verifications               (FK → users.id CASCADE)
├── id, userId, token (UNIQUE), expiresAt
└── createdAt
  Indexes: userId, token

password_reset_tokens             (FK → users.id CASCADE)
├── id, userId, token (UNIQUE)
├── expiresAt, usedAt
└── createdAt
  Indexes: userId, token

job_records                       (standalone — no FK relations)
├── id, bullJobId, queueName, jobName (enum)
├── status (enum), attempts, maxAttempts
├── data (JSONB), result (JSONB), error, errorStack
├── scheduledFor, processedAt, completedAt, failedAt
└── createdAt, updatedAt
  Indexes: bullJobId, queueName, jobName, status, (jobName+status)
```

---

## Inter-Service Communication

```
┌─────────────────────────────┐
│        admin (port 3000)    │
│  React 19 + TanStack Router │
└──────────┬──────────────────┘
           │ HTTP REST
           │ VITE_SERVER_URL (default: http://localhost:5000)
           ▼
┌─────────────────────────────┐
│    auth-server (port 5000)  │
│  Express 5 + JWT + Sessions │
└──────┬────────────┬─────────┘
       │            │
       ▼            ▼
  PostgreSQL      Redis
  (Drizzle ORM)   (ioredis)
       ▲            ▲
       │            │
┌──────┴────────────┴─────────┐
│       sync-server           │
│  BullMQ Workers + Cron      │
│  Connects to same DB+Redis  │
└─────────────────────────────┘
```

**Rules:**
- `admin` communicates with `auth-server` only via HTTP
- `auth-server` and `sync-server` share the same PostgreSQL database and Redis instance
- `sync-server` never calls `auth-server` HTTP endpoints — it reads/writes DB directly
- No gRPC or message bus — Redis is used only for BullMQ queues and cache/rate-limiting

---

## Environment Variables

### admin
```
VITE_SERVER_URL=http://localhost:5000
```

### auth-server
```
NODE_ENV=development|production|test
SERVER_PORT=5000
SERVER_URL=http://localhost:5000          # Must be valid URL
FRONTEND_URL=http://localhost:3000        # CORS allow-list
DB_HOST=localhost  DB_PORT=5432
DB_USERNAME=<required>  DB_PASSWORD=<required>  DB_NAME=<required>
REDIS_HOST=localhost  REDIS_PORT=6379  REDIS_PASSWORD=<optional>
JWT_ACCESS_SECRET=<required, min 32 chars>
JWT_REFRESH_SECRET=<required, min 32 chars>
JWT_ACCESS_TOKEN_EXPIRY_SECONDS=10080    # 7 days
JWT_REFRESH_TOKEN_EXPIRY_SECONDS=43200   # 30 days
GITHUB_CLIENT_ID=<required>  GITHUB_CLIENT_SECRET=<required>
GOOGLE_CLIENT_ID=<required>  GOOGLE_CLIENT_SECRET=<required>
```

### sync-server
```
NODE_ENV=development|production|test
DB_HOST=localhost  DB_PORT=5432
DB_USERNAME=<required>  DB_PASSWORD=<required>  DB_NAME=<required>
REDIS_HOST=<required>  REDIS_PORT=<required>  REDIS_PASSWORD=<optional>
```

---

## Key Patterns & Conventions

| Pattern | Detail |
|---|---|
| Auth tokens | JWT access (7d) + refresh (30d), stored in httpOnly cookies |
| Session storage | `sessions` table — one row per active refresh token |
| OAuth | Redirect → External → Callback → upsert account → issue tokens |
| Rate limiting | Redis-backed, per-endpoint, via `createRateLimiter()` in `@mern/server` |
| Env validation | `@t3-oss/env-core` + Zod in every service; fails fast on startup |
| Internal deps | `workspace:^` protocol in package.json |
| Module system | All services: `"type": "module"`, ESNext + NodeNext resolution |
| Job deduplication | BullMQ repeatable jobs deduplicate by `(jobName + cron pattern)` — safe to restart |
| Error handling | `AppError` → global `createErrorHandler()` middleware |
| DB migrations | Drizzle Kit — run `db:generate` then `db:migrate` (or `db:push` in dev) |

---

## Commands Reference

```bash
# Dev (individual)
pnpm --filter admin dev
pnpm --filter auth-server dev
pnpm --filter sync-server dev

# Dev (all in parallel)
pnpm dev

# Build
pnpm --filter admin build
pnpm --filter auth-server build
pnpm --filter sync-server build
pnpm build                          # all in parallel

# Database (run against auth-server or packages/database)
pnpm --filter auth-server db:generate
pnpm --filter auth-server db:migrate
pnpm --filter auth-server db:push
pnpm --filter auth-server db:studio

# Test / Lint / Format (admin only)
pnpm --filter admin test
pnpm --filter admin lint
pnpm --filter admin check
```

---

## What Is NOT Implemented Yet

- Email sending (mail-server) — `SEND_WELCOME_EMAIL`, `SEND_EMAIL_VERIFICATION`, `SEND_PASSWORD_RESET_EMAIL` job names exist in `@mern/core` but no mail-server workspace exists yet
- Email verification flow (tokens table exists, controller not wired)
- Any admin UI pages beyond the home page stub
