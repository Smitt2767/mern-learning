# MERN Learning Project

## Project Structure
- Monorepo managed with pnpm workspaces
- `backend/` - Express.js 5 + TypeScript API server
- `frontend/` - React 19 + TanStack Start/Router + Tailwind CSS
- `packages/` - Shared packages (future)

## Commands
- **Backend dev**: `pnpm --filter backend dev` (runs on port 5000)
- **Frontend dev**: `pnpm --filter frontend dev` (runs on port 3000)
- **Build**: `pnpm --filter <workspace> build`
- **Test frontend**: `pnpm --filter frontend test`
- **Lint**: `pnpm --filter frontend lint`
- **Format**: `pnpm --filter frontend check`

## Conventions
- Always use `pnpm`, never npm or yarn
- Use TypeScript strict mode everywhere
- Backend uses ESNext modules with NodeNext resolution
- Frontend uses path alias `@/*` for `./src/*`
- Environment variables validated with `@t3-oss/env-core` + Zod
- Frontend env vars must be prefixed with `VITE_`

## Code Style
- Use functional components in React
- Use Express 5 patterns in backend
- Prefer Zod for all validation
