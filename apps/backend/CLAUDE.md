# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start full dev environment (server + queue + logs + Vite)
composer run dev

# Run all tests
composer run test

# Run a specific test or filter
php artisan test --filter=TestName
php artisan test tests/Feature/SomeTest.php

# Run migrations (always cd into apps/backend first — artisan must run from that directory)
cd apps/backend; php artisan migrate

# Format changed files
vendor/bin/pint --dirty

# Test Supabase connection
php artisan supabase:test

# Seed database from SQL files (database/seeds/sql/)
php artisan supabase:seed
php artisan supabase:seed 001_initial_setup.sql
```

## Architecture

**Laravel-first modular monolith** backed by Supabase PostgreSQL (plain database, no RLS).

### Authentication & Authorization

- **Authentication**: Lark OAuth → Laravel issues Sanctum Bearer token → Next.js thin BFF reads it from an httpOnly cookie and forwards `Authorization: Bearer <token>` to Laravel on every API call
- **Email/password login** also supported (`POST /auth/login`)
- **RBAC**: Spatie Permission (`spatie/laravel-permission`) manages roles (`top_management`, `hr_admin`, `hod`, `staff`)
- **Authorization**: Laravel Policies in `app/Policies/` — answer "can user X do Y?"
- **Business validation**: Domain Rules in `app/Modules/*/Rules/` — answer "under what conditions is X allowed?" (geofence, leave balance, etc.)

Both layers are required in the controller pattern:
```php
$this->authorize('create', Attendance::class);   // Policy check first
$this->attendanceRules->canClockIn(...);          // Domain Rules second
```

### Module Structure

Business logic lives in `app/Modules/`:

```
app/Modules/
├── Shared/
│   ├── Contracts/     # Interfaces for cross-module communication
│   ├── Events/        # Domain events (shared definitions)
│   └── ValueObjects/  # UserId, DateRange, Money
├── Attendance/        # AttendanceServiceProvider, Services/, Rules/, Controllers/, Events/, Adapters/
├── Leave/             # Same flat structure
├── Claims/            # Same flat structure
├── Overtime/          # OvertimeService, OvertimeApprovalChainResolver, Resources/
└── Shift/             # ShiftService, Resources/
```

**Background Jobs** live in `app/Jobs/` (queued via Laravel queues):
- `CheckEmergencyLeaveSla` — fires when emergency leave SLA deadline approaches
- `CheckOvertimeSla` — fires when urgent overtime request SLA deadline approaches

Overtime urgent requests set `metadata.sla_deadline` (ISO 8601, +2h from submission) on the `overtime_requests` row when `is_urgent = true`.

**Eloquent models are in `app/Models/`** (not inside modules) — this is the current practice, not a violation of modularity.

### Module Communication Rules

Modules must **only** communicate via:
1. `Shared/Contracts` interfaces (sync, when data is needed immediately)
2. Domain events (async, when a module just needs to react)

**Never** import another module's model or service class directly:
```php
// ❌ FORBIDDEN
use App\Modules\Attendance\Services\AttendanceService;

// ✅ CORRECT
use App\Modules\Shared\Contracts\AttendanceServiceInterface;
```

Service providers bind interfaces to implementations. Cross-module DB transactions are also forbidden — use events for eventual consistency instead.

### Response Format

All controllers use the `App\Traits\ApiResponse` trait:
- `$this->success($data, $message)` → `{ message, data }`
- `$this->error($errorCode, $message, $status)` → `{ error, message, status }`

### Key Middleware

- `auth:sanctum` — required for all protected routes
- `check.account_status` — blocks `verifying`/`rejected`/`deactivated` accounts
- `check.account_locked` — brute-force lockout
- `check.top_management` — restricts write operations to `top_management` role
- `role:top_management|hr_admin|hod` — Spatie role gate
- `demo.mode` — when `APP_DEMO_MODE=true`, blocks all POST/PUT/PATCH/DELETE except `/api/auth/login` and `/api/auth/logout`; returns `{ error: "DEMO_MODE", status: 403 }`

### Supabase

Used only as PostgreSQL database and S3-compatible file storage. No RLS policies, no Supabase JWT — Laravel owns all auth and authorization. Configure via `.env`:
```
SUPABASE_URL, SUPABASE_KEY, SUPABASE_SECRET
```

### Module API Routes

Each module has its own `api.php` (e.g. `app/Modules/Claims/api.php`) registered by its ServiceProvider. Top-level shared routes are in `routes/api.php`.

## Data Consistency Patterns

### Bulk Updates: Leave Quota Propagation
When a parent model's denormalized field changes, sync all child snapshots. Example: updating `leave_types.annual_quota` must bulk-update all `leave_balances.annual_quota` for current + future years:

```php
public function update(UpdateLeaveTypeRequest $request, LeaveType $leaveType): JsonResponse
{
    $validated = $request->validated();
    $oldQuota = $leaveType->annual_quota;

    $leaveType->update($validated);

    // Propagate to all existing balances
    if (array_key_exists('annual_quota', $validated) && (int) $validated['annual_quota'] !== (int) $oldQuota) {
        LeaveBalance::where('leave_type_id', $leaveType->id)
            ->where('year', '>=', now()->year)
            ->update(['annual_quota' => $validated['annual_quota']]);
    }

    return $this->success($leaveType);
}
```

Cast comparisons to avoid false positives from type coercion. Use `where('year', '>=', now()->year)` to cover current + pre-seeded future years.

### Claim Approval Pipeline Data Model
Multi-step approvals track state in:
- `claims.current_level` — which approval level is active (1-based int, nullable)
- `claim_approvals` — one row per level with `level`, `step_kind`, `status`, `eligible_approver_ids`
- `claim_approval_eligible_approvers` — pivot backfilled from JSON; use this when querying

When fetching claims for approval UI, eager-load approvals + eligible approvers:

```php
// In ClaimService::allClaims()
$query = Claim::query()
    ->with(['category', 'user:id,name,email', 'claimApprovals'])
    ->orderByDesc('created_at');
```

Backend response includes `ClaimApprovalResourceCollection` which transforms `eligible_approver_ids` JSON into structured `eligible_approvers[]` array with user names. Frontend uses this to gate Approve/Reject buttons.

### Leave Approval Eager-Load Requirement
`LeaveService::allLeaves()` must include `leaveApprovals` in the `with()` call. `LeaveResource` conditionally includes `leave_approvals` only when the relation is loaded (`relationLoaded()`). Missing this causes the frontend approval queue to receive empty `approvals` arrays and hide action buttons. See `pendingApprovals()` in the same service for the correct pattern.

### LeaveBalanceResource Field Name
`LeaveBalanceResource` returns `entitled` (not `annual_quota`) to match the frontend `LeaveBalanceApi` type. The underlying column is `leave_balances.annual_quota`.

## Definition of Done

- Code follows the module pattern
- `composer run lint` passes (Pint)
- Tests added for new authorization/business logic
- Bulk updates use `.where(...)->update()`, not loops
