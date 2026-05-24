# CLAUDE.md — FlowOffice Monorepo

## Structure

```
apps/
  frontend/   → Next.js 16 (React 19, TypeScript, TanStack Query, Zustand)
  backend/    → Laravel 12 (PHP 8.2+, Sanctum, Spatie Permission, Supabase PostgreSQL)
              → Modules: Attendance, Leave, Claims, Overtime, Shift (+ Shared/)
              → Jobs: CheckEmergencyLeaveSla, CheckOvertimeSla (queue-based SLA enforcement)
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

## Data Propagation & Consistency Gotchas

### Leave Quota Denormalization
`leave_balances.annual_quota` is snapshotted from `leave_types.annual_quota` at row creation. When editing a leave type's quota, **all employee balances for current + future years are always bulk-updated** — even if the value is unchanged (idempotent, safe). Past years are excluded (`year >= now()->year`) to preserve historical records. See `LeaveTypeController::update()` for pattern.

### Claim Approval Eligibility
Approval buttons ("Approve", "Reject") should only show to the current approval step's designated approver(s). Frontend checks `approvalStep.eligibleApprovers` array against current user's ID before rendering buttons. If user is not in eligible list, the claim is read-only (buttons hidden). Backend enforces this via policy + `ClaimService::isEligibleApproverForStep()`.

Multi-step pipeline tracks `claims.current_level` (1-based int) + `claim_approvals` rows per level. Querying claims for approval UI must eager-load `.with('claimApprovals')` to include eligibility data for permission gating.

### Leave Balance Field Contract
`LeaveBalanceResource` returns field `entitled` (not `annual_quota`) which maps the `leave_balances.annual_quota` column. Frontend `LeaveBalanceApi` type and `mapLeaveBalance()` read `entitled`. Do NOT rename this field without updating both sides.

### Leave Approval Eager-Load Requirement
`LeaveService::allLeaves()` MUST eager-load `leaveApprovals` for the approval queue UI to work. `LeaveResource` uses `$this->when($this->relationLoaded('leaveApprovals'), ...)` — if the relation isn't loaded, `leave_approvals` is omitted from the response, frontend `canAct()` gets `approvals: []`, and Approve/Reject buttons never render.
