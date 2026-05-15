# FlowOffice

HR management platform — attendance, leave, and claims management for teams.

## Structure

```
apps/
  frontend/   → Next.js 16 (React 19, TypeScript, TanStack Query, Zustand)
  backend/    → Laravel 12 (PHP 8.2+, Sanctum, Spatie Permission, Supabase PostgreSQL)
```

The browser communicates exclusively with the Next.js frontend. All backend calls are proxied server-side via `/api/proxy/[...path]` — the Laravel API is never exposed directly to the client.

## Prerequisites

- Node.js 18+, pnpm 8+
- PHP 8.2+, Composer 2+
- Docker (for local database)

## Quick Start

```bash
# Install JS dependencies
pnpm install

# Install PHP dependencies
cd apps/backend && composer install && cd ../..

# Start database
pnpm run docker:up

# Copy backend env
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — fill in DB, Supabase, app key

# Run migrations
cd apps/backend && php artisan key:generate && php artisan migrate && cd ../..

# Start both frontend + backend
pnpm run dev:all
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000

## Dev Commands

```bash
pnpm run dev:frontend     # Next.js only
pnpm run dev:backend      # Laravel only
pnpm run dev:queue        # Laravel queue worker
pnpm run dev:all          # Frontend + backend concurrently

pnpm run build            # Production build (frontend)
pnpm run lint             # ESLint (frontend)
pnpm run lint:backend     # Pint formatter (backend)
pnpm run test:backend     # PHPUnit

pnpm run docker:up        # Start Docker services
pnpm run docker:down      # Stop Docker services
```

## Docs

- [Frontend](apps/frontend/CLAUDE.md) — routes, state management, RBAC helpers, env vars
- [Backend](apps/backend/CLAUDE.md) — module structure, auth flow, policies, API format

## Deployment

Both apps deploy to Vercel:

| Project | Vercel Root Dir | Runtime |
|---------|----------------|---------|
| `flow-office` | `apps/frontend` | Next.js |
| `flow-office-backend` | `apps/backend` | vercel-php |

Push to `main` triggers auto-deploy on both projects.
