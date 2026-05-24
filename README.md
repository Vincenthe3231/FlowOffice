# FlowOffice

Production-ready HR management platform — attendance (GPS + face verification), leave management, expense claims (multi-level approval), audit trail, and RBAC for teams.

## Quick Start (Docker)

```bash
git clone <your-repo-url> && cd FlowOffice

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Edit .env files — fill in APP_KEY, database credentials, etc.
# Then generate Laravel app key:
cd apps/backend && php artisan key:generate && cd ../..

# Start everything
docker compose up
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000

## Quick Start (Local)

```bash
# Install dependencies
pnpm install
cd apps/backend && composer install && cd ../..

# Copy and configure env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
cd apps/backend && php artisan key:generate && php artisan migrate --seed && cd ../..

# Start both apps
pnpm run dev:all
```

## Structure

```
apps/
  frontend/   → Next.js 16 (React 19, TypeScript, TanStack Query, Zustand)
  backend/    → Laravel 12 (PHP 8.2+, Sanctum, Spatie Permission, PostgreSQL)
```

The browser communicates exclusively with the Next.js frontend. All backend calls are proxied server-side via `/api/proxy/[...path]` — the Laravel API is never exposed directly to the client.

## Feature Flags

All modules are enabled by default. Set any flag to `"false"` in `apps/frontend/.env.local` to disable:

| Flag | Module | Default |
|------|--------|---------|
| `NEXT_PUBLIC_FEATURE_ATTENDANCE` | GPS + face-verified attendance | `true` |
| `NEXT_PUBLIC_FEATURE_CLAIMS` | Expense claims with multi-level approval | `true` |
| `NEXT_PUBLIC_FEATURE_LEAVE` | Leave management + approval pipeline | `true` |
| `NEXT_PUBLIC_FEATURE_ONBOARDING` | Employee onboarding flow | `true` |
| `NEXT_PUBLIC_FEATURE_OVERTIME` | Overtime request management | `true` |
| `NEXT_PUBLIC_FEATURE_REPORTS` | Analytics & reports | `true` |
| `NEXT_PUBLIC_FEATURE_NOTIFICATIONS` | In-app notifications | `true` |
| `NEXT_PUBLIC_FEATURE_SHIFT` | Shift scheduling | `true` |

## Demo Mode

Set `DEMO_MODE=true` in `apps/backend/.env` and `NEXT_PUBLIC_DEMO_MODE=true` in `apps/frontend/.env.local` to run a read-only demo instance. All POST/PUT/DELETE requests return 403 (except login/logout). A banner displays at the top of the UI.

To seed realistic demo data:

```bash
cd apps/backend
SEED_DEMO_DATA=true php artisan db:seed --class=DemoSeeder
```

## Dev Commands

```bash
pnpm run dev:frontend     # Next.js only
pnpm run dev:backend      # Laravel only
pnpm run dev:all          # Frontend + backend concurrently

pnpm run build            # Production build (frontend)
pnpm run lint             # ESLint (frontend)
pnpm run lint:backend     # Pint formatter (backend)
pnpm run test:backend     # PHPUnit
```

## Prerequisites

- Node.js 18+, pnpm 8+
- PHP 8.2+, Composer 2+
- PostgreSQL 15+ (or Docker)

## Deployment

| Platform | Frontend | Backend |
|----------|----------|---------|
| Docker | `docker compose up` | Included |
| Vercel | Root dir: `apps/frontend` | vercel-php runtime |
| Render | Static site or Node | `apps/backend/Dockerfile` |

## Docs

- [Frontend](apps/frontend/CLAUDE.md) — routes, state management, RBAC helpers, env vars
- [Backend](apps/backend/CLAUDE.md) — module structure, auth flow, policies, API format

## License

See [LICENSE](LICENSE) for commercial license terms.
