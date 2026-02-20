# MERN Learning Project

## Project Architecture Reference
Full architecture documentation is in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
**Read it before starting any cross-service or multi-package task** — it covers all implemented services, shared packages, DB schema, API routes, inter-service communication, and environment variables.

## Project Structure
- Monorepo managed with pnpm workspaces
- `auth-server/` - Express.js 5 + TypeScript API server (port 5000)
- `admin/` - React 19 + TanStack Start/Router + Tailwind CSS (port 3000)
- `sync-server/` - BullMQ background worker + cron scheduler
- `packages/` - Shared packages: `@mern/core`, `@mern/database`, `@mern/logger`, `@mern/cache`, `@mern/server`, `@mern/queue`

## Commands
- **Auth-server dev**: `pnpm --filter auth-server dev` (runs on port 5000)
- **Admin dev**: `pnpm --filter admin dev` (runs on port 3000)
- **Sync-server dev**: `pnpm --filter sync-server dev`
- **All services**: `pnpm dev` (parallel)
- **Build**: `pnpm --filter <workspace> build`
- **Test admin**: `pnpm --filter admin test`
- **Lint**: `pnpm --filter admin lint`
- **Format**: `pnpm --filter admin check`
- **DB studio**: `pnpm --filter auth-server db:studio`
- **DB migrate**: `pnpm --filter auth-server db:migrate`

## Conventions
- Always use `pnpm`, never npm or yarn
- Use TypeScript strict mode everywhere
- All servers use ESNext modules with NodeNext resolution
- Admin uses path alias `@/*` for `./src/*`
- Environment variables validated with `@t3-oss/env-core` + Zod in every service
- Admin env vars must be prefixed with `VITE_`
- Internal workspace dependencies use `workspace:^` protocol

## Code Style
- Use functional components in React
- Use Express 5 patterns in auth-server (extends `BaseServer` from `@mern/server`)
- Prefer Zod for all validation
- All new job types must be registered in `@mern/core` (`JOB_NAMES`, `JobDataMap`, `JobResultMap`)
- All DB table changes go in `@mern/database`; run `db:generate` + `db:migrate` after schema changes
