# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (webpack mode) at localhost:3000
pnpm dev:turbo    # Start dev server (turbopack mode)
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm format       # Prettier format all ts/tsx/md/json
pnpm clean        # Remove .next and node_modules
```

Package manager: **pnpm 8+** (required). Node 18+ required.

## Architecture Overview

### BFF (Backend-for-Frontend) Pattern
The browser **never talks to Laravel directly**. All API calls go same-origin to Next.js:
- Auth endpoints: `/api/auth/login`, `/api/auth/me`, `/api/auth/lark/callback`, `/api/auth/logout`
- All other API: `/api/proxy/[...path]` — the catch-all proxy handler at `src/app/api/proxy/[...path]/route.ts`

The proxy reads the `AUTH_COOKIE_NAME` httpOnly cookie for the Bearer token and forwards `Cookie` headers (minus the auth cookie) to Laravel. The browser never sees the raw Bearer token. Laravel URL is configured via `LARAVEL_API_URL` (server-side) or `NEXT_PUBLIC_LARAVEL_API_URL`.

### HTTP Client
`src/shared/lib/api-client/axios.ts` exports `laravelApi` — an Axios instance with `baseURL: ''` (same-origin). All feature code uses this; never use a direct-to-Laravel URL from the client. Interceptors automatically:
- Transform outgoing request data to **snake_case** (FormData is passed through as-is)
- Transform incoming response data to **camelCase**

### Route Groups
```
src/app/
  (public)/login/          # Unauthenticated: Lark OAuth + email/password login
  (authenticated)/dashboard/ # All authenticated pages; layout includes sidebar + BottomNav
  api/auth/                # Auth Route Handlers
  api/proxy/[...path]/     # Laravel proxy Route Handler
  auth/callback/           # Lark OAuth redirect handler
```

### Middleware / Route Protection
`src/proxy.ts` (exported and used by `middleware.ts`) guards `/dashboard` routes:
1. Checks for `AUTH_COOKIE_NAME` cookie; redirects to `/login` if missing
2. Calls `/api/auth/me` to validate the session
3. Checks `accessStatus === 'granted'`; non-granted users without an allowed path are redirected to `/dashboard`

### Feature Module Pattern
```
src/features/<feature>/
  hooks/      # TanStack Query hooks (useXxx)
  components/ # Feature-specific UI
  lib/        # Pure helpers, URL param utils
  stores/     # Zustand stores scoped to the feature
  types/      # Feature-specific TypeScript types
  data/       # Mock data / static constants
  index.ts    # Public exports
```

### State Management
- **TanStack Query** — all server state. Query keys are co-located in each feature's hook file (e.g. `CLAIM_QUERY_KEYS`).
- **Zustand** — client-only state. Auth store at `src/shared/stores/auth-store.ts` (persisted + encrypted via `secure-storage.ts`); UI store at `src/shared/stores/ui-store.ts`.
- `useAuth()` hook (`src/shared/hooks/useAuth.ts`) is the canonical way to get the current user — it syncs TanStack Query with the Zustand store and handles 401 redirects automatically.

### RBAC / Role System
Role slugs are defined in `src/shared/constants/roles.ts`:
- `top_management` (canonical) / `super_admin` (legacy alias)
- `hr_admin`, `hod`, `staff`

Role-gated UI helpers live in `src/shared/lib/role-utils.ts` (`canSeeSettingsNav`, `canSeeOnboardingAdmin`, `isTopManagement`, etc.). Always pass **both** `profile.role` (from the profile API) and `user.roles` (Spatie array from `/me`) to these helpers.

### UI Components
shadcn/ui primitives live in `src/components/ui/`. App-specific shared components (logo, nav, theme toggle) are in `src/components/shared/`. The authenticated shell uses a collapsible sidebar (`SidebarProvider`) on desktop and `BottomNav` on mobile.

## Environment Variables

```env
NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8000  # Used as fallback; prefer LARAVEL_API_URL server-side
LARAVEL_API_URL=http://localhost:8000              # Server-only (proxy Route Handler)
BFF_INTERNAL_SECRET=...                            # Internal BFF secret
NEXT_PUBLIC_LARK_APP_ID=...                        # Lark OAuth App ID
NEXT_PUBLIC_LARK_REDIRECT_URI=...                  # Lark OAuth redirect URI
NEXT_PUBLIC_AUTH_STORE_SECRET=...                  # 32+ char key for encrypted Zustand storage
```

## File Placement Rules

- New routes/layouts → `src/app/...`
- Feature logic → `src/features/<feature>/...`
- Shared cross-feature logic → `src/shared/...`
- Reusable UI primitives → `src/components/ui/...`
- App-specific shared components → `src/components/shared/...`

## Definition of Done

- Code follows the `src/features` pattern
- `pnpm lint` passes
- New environment variables are added to `.env.example`
- `src/shared/constants/roles.ts` is the single source of truth for role slugs — do not hardcode role strings elsewhere
