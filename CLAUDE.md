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
└── Claims/            # Same flat structure
```

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

### Supabase

Used only as PostgreSQL database and S3-compatible file storage. No RLS policies, no Supabase JWT — Laravel owns all auth and authorization. Configure via `.env`:
```
SUPABASE_URL, SUPABASE_KEY, SUPABASE_SECRET
```

### Module API Routes

Each module has its own `api.php` (e.g. `app/Modules/Claims/api.php`) registered by its ServiceProvider. Top-level shared routes are in `routes/api.php`.
