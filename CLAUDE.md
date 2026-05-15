# CLAUDE.md — FlowOffice Monorepo

## Structure

```
apps/
  frontend/   → Next.js 16 (React 19, TypeScript, TanStack Query, Zustand)
  backend/    → Laravel 12 (PHP 8.2+, Sanctum, Spatie Permission, Supabase PostgreSQL)
```

The frontend is a **pnpm workspace member**. The backend is PHP — it lives in the monorepo for co-location but is **not** a pnpm workspace member.

## How They Connect (BFF Pattern)

The browser **never talks to Laravel directly**. All API calls go same-origin to Next.js:
- Auth endpoints: `/api/auth/login`, `/api/auth/me`, `/api/auth/lark/callback`, `/api/auth/logout`
- All other API: `/api/proxy/[...path]` → proxied to Laravel

The proxy reads an httpOnly cookie for the Bearer token and forwards it to Laravel. Laravel URL is configured via `LARAVEL_API_URL` (server-side env var in the frontend).

## Commands

```bash
# Frontend
pnpm run dev:frontend     # Next.js dev server at localhost:3000
pnpm run build            # Production build

# Backend
pnpm run dev:backend      # Laravel dev (server + queue + logs + Vite)
pnpm run test:backend     # PHPUnit tests
pnpm run lint:backend     # Pint formatter

# Both
pnpm run dev:all          # Run frontend + backend concurrently

# Docker (backend)
pnpm run docker:up        # docker compose up -d
pnpm run docker:down      # docker compose down
```

## Stack-Specific Docs

- **Frontend**: See `apps/frontend/CLAUDE.md` for route groups, feature module pattern, state management, RBAC helpers, UI components, and env vars.
- **Backend**: See `apps/backend/CLAUDE.md` for module structure, authentication flow, Spatie RBAC, domain rules, API response format, and Supabase config.

## RBAC (shared across both stacks)

Role slugs: `top_management`, `hr_admin`, `hod`, `staff`

- Frontend: role helpers in `apps/frontend/src/shared/lib/role-utils.ts` and constants in `apps/frontend/src/shared/constants/roles.ts`
- Backend: Spatie Permission, policies in `apps/backend/app/Policies/`, role middleware

## Package Managers

- **Frontend**: pnpm 8+ (required), Node 18+
- **Backend**: Composer 2+, PHP 8.2+
