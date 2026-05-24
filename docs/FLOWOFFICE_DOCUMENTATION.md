# FlowOffice HRMS — Official Documentation

> Version 1.0 · May 2026

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [System Architecture](#2-system-architecture)
3. [Role-Based Access Control](#3-role-based-access-control)
4. [Business Workflows](#4-business-workflows)
5. [API Contract](#5-api-contract)
6. [Full API Route Reference](#6-full-api-route-reference)

---

## 1. Executive Overview

### How FlowOffice Transforms Your HR Operations

Most growing companies manage HR through a patchwork of spreadsheets, WhatsApp approvals, and manual reimbursements. This creates invisible costs: delayed approvals, lost receipts, payroll errors, and zero visibility into who is doing what and when.

**FlowOffice replaces that fragmentation with a single, mobile-first HRMS** — built for teams of 10 to 500, ready to scale beyond.

### Five Outcomes You Can Measure

| Pain Point | FlowOffice Solution | Measurable Outcome |
|---|---|---|
| Approval chains run through chat — slow, undocumented | Structured multi-level digital approval (HOD → HR → Management) | Approval decisions in hours, not days |
| Expense claims are paper-based or email-based | Employees submit claims with photo attachments from mobile; finance approves in-app | Reimbursement cycle cut from weeks to days |
| No visibility into who is working from where | GPS-verified attendance with geofence validation and face recognition | Real-time headcount dashboard; fraud-resistant check-in |
| Leave balances tracked in spreadsheets | Leave types with configurable quotas; balances update automatically on approval | Zero manual balance reconciliation |
| No audit trail for compliance | Every action logged with actor, timestamp, and before/after state | One-click audit export for regulatory review |

### What's Included

- **Attendance** — GPS-verified clock in/out with face recognition
- **Leave Management** — configurable leave types, multi-level approval, balance tracking
- **Expense Claims** — receipts, mileage, business travel, subclaim categorisation
- **Overtime** — request and approval workflow
- **Shift Management** — shift definitions and employee assignments
- **Analytics** — real-time dashboards for attendance, leave, and claims
- **Audit Trail** — full activity log for compliance

---

## 2. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / Mobile                           │
│                    Next.js 16 Frontend (React 19)                   │
│                         localhost:3000                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  Same-origin HTTPS
                           │  (httpOnly cookie carries auth token)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Next.js BFF (Backend-for-Frontend)                    │
│                                                                     │
│   /api/auth/*     — auth endpoints (login, logout, me)             │
│   /api/proxy/**   — transparent proxy to Laravel                   │
│                                                                     │
│   Reads httpOnly cookie → injects Authorization: Bearer <token>    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  Internal HTTP (LARAVEL_API_URL)
                           │  Bearer token forwarded
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Laravel 12 API (PHP 8.2)                         │
│                                                                     │
│  Auth: Laravel Sanctum (token-based)                                │
│  RBAC: Spatie Permission (roles + permissions)                      │
│  Audit: Spatie Activity Log                                         │
│                                                                     │
│  Modules:                                                           │
│   ├── Attendance  (clock-in/out, geofence, face verify)            │
│   ├── Leave       (requests, balance, multi-level approval)        │
│   ├── Claims      (expenses, mileage, approval pipeline)           │
│   ├── Overtime    (requests, approval)                              │
│   ├── Shift       (definitions, assignments)                        │
│   └── Shared      (contracts, events, value objects)               │
└──────────┬───────────────────────────────────────────┬─────────────┘
           │  PostgreSQL (Supabase)                    │  S3 API
           ▼                                           ▼
┌─────────────────────────┐             ┌─────────────────────────────┐
│   Supabase PostgreSQL   │             │   Supabase Storage          │
│   (plain DB, no RLS)    │             │   profile-picture (public)  │
│   ap-southeast-1        │             │   attachment (private)      │
└─────────────────────────┘             └─────────────────────────────┘
```

### Design Principles

**BFF Pattern (Backend-for-Frontend)**
The browser never communicates with Laravel directly. All requests go same-origin to the Next.js server, which proxies them to Laravel with an injected auth token. This prevents token exposure in the browser and enables seamless CSRF protection.

**Modular Monolith**
Business logic is organised in `app/Modules/` (Attendance, Leave, Claims, Overtime, Shift). Each module owns its routes, controllers, and services. Modules communicate only through shared interfaces (`app/Modules/Shared/Contracts/`) or domain events — never by importing each other's classes directly.

**Portable RBAC (No Vendor Lock-in)**
Authorization uses Spatie Permission (a Laravel package), not Supabase Auth/RLS. Roles and permissions live in your own PostgreSQL database. The system can be migrated to any Laravel-compatible PostgreSQL host without re-architecting access control.

**Signed Storage URLs**
Claim and leave attachments are stored in a private S3 bucket. Laravel generates time-limited signed URLs (1-hour expiry) for each request. Direct bucket access is denied; files are only accessible via the API.

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js + React | 16 / 19 |
| Language (frontend) | TypeScript | 5+ |
| State management | TanStack Query + Zustand | — |
| Backend | Laravel | 12 |
| Language (backend) | PHP | 8.2+ |
| Auth | Laravel Sanctum | — |
| RBAC | Spatie Permission | — |
| Audit logging | Spatie Activity Log | — |
| Database | PostgreSQL (via Supabase) | 17 |
| File storage | S3-compatible (Supabase Storage) | — |
| Package manager | pnpm (frontend), Composer (backend) | — |

### Authentication Flow

```
Lark OAuth Login:
  1. User clicks "Login with Lark"
  2. Frontend sends { code } to POST /api/auth/lark/callback
  3. Next.js BFF proxies to Laravel
  4. Laravel exchanges code for Lark access_token
  5. Laravel fetches user profile from Lark (open_id, email, name, avatar)
  6. Laravel finds or creates User; assigns 'staff' role for new users
  7. Laravel issues Sanctum Bearer token
  8. Next.js stores token in httpOnly cookie (never exposed to JS)
  9. Response: { user, accessStatus, token }

Email/Password Login:
  1. POST /api/auth/login with { email, password }
  2. Brute-force check (5 attempts → 15-min lockout)
  3. Password verified via bcrypt
  4. Sanctum token issued; stored in httpOnly cookie
  5. Response: { user, accessStatus, token }

Account Status Gates:
  verifying   → account created, pending admin approval
  active      → full access granted
  rejected    → access denied; rejection_reason returned
  deactivated → account suspended
```

---

## 3. Role-Based Access Control

### Roles

| Role Slug | Display Name | Description |
|---|---|---|
| `staff` | Employee | Regular employees. Self-service only. |
| `hod` | Head of Department | Manages and approves for their department. |
| `hr_admin` | HR Administrator | Full HR operations across all departments. |
| `top_management` | Top Management | Full system access including configuration and analytics. |

### Permission Matrix

| Permission | staff | hod | hr_admin | top_management |
|---|:---:|:---:|:---:|:---:|
| `attendance.view-own` | ✓ | ✓ | ✓ | ✓ |
| `attendance.create` | ✓ | ✓ | ✓ | ✓ |
| `attendance.view-team` | | ✓ | ✓ | ✓ |
| `attendance.update` | | | ✓ | ✓ |
| `leave.view-own` | ✓ | ✓ | ✓ | ✓ |
| `leave.create` | ✓ | ✓ | ✓ | ✓ |
| `leave.view-team` | | ✓ | ✓ | ✓ |
| `leave.approve` | | ✓ | ✓ | ✓ |
| `leave.reject` | | ✓ | ✓ | ✓ |
| `claims.view-own` | ✓ | ✓ | ✓ | ✓ |
| `claims.create` | ✓ | ✓ | ✓ | ✓ |
| `claims.view-team` | | ✓ | ✓ | ✓ |
| `claims.approve` | | ✓ | ✓ | ✓ |
| `claims.reject` | | ✓ | ✓ | ✓ |
| Analytics & Config | | | | ✓ |
| Department management | | | | ✓ |
| User role assignment | | | | ✓ |
| Onboarding approval | | | | ✓ |

### HOD Department Scoping

A `hod` user can only view and approve requests from employees in **their own department**. They cannot access data from other departments. This scoping is enforced at the service layer, not just at the route level.

### Multi-Level Approval

Leave types and claim categories support configurable approval chains with up to 4 levels. Each level specifies which role approves (e.g., level 1 = HOD, level 2 = HR Admin, level 3 = Top Management). The system tracks which specific users are eligible to approve at each step (`eligible_approver_ids`), and approval buttons are hidden for ineligible users.

---

## 4. Business Workflows

### 4.1 Employee Onboarding

```
Employee logs in via Lark OAuth or is invited
          │
          ▼
New user created with status = 'verifying'
Role assigned: 'staff' (default)
          │
          ▼
Top Management reviews onboarding queue
(/dashboard/onboarding)
          │
     ┌────┴────┐
     │         │
  Approve    Reject
     │         │
     ▼         ▼
status =    status =
'active'   'rejected'
             + rejection_reason stored
             + employee notified
```

### 4.2 Leave Request

```
Employee submits leave request
POST /api/proxy/leave
{ leave_type_id, start_date, end_date, day_type, reason }
          │
          ▼
Validation:
  - Sufficient leave balance?
  - No date conflicts?
  - Attachment required for this leave type?
          │
          ▼
Leave created with status = 'pending_l1'
Leave balance: pending += requested_days
          │
          ▼
Approval Level 1 (HOD — same department)
PATCH /api/proxy/leave/{id}/approve
          │
     ┌────┴──────────┐
     │               │
  Approve          Reject
     │               │
     ▼               ▼
status =         status = 'rejected'
'pending_l2'     balance: pending -= days
(if configured)
     │
     ▼
Approval Level 2 (HR Admin)
     │
     ▼
status = 'approved'
Leave balance: used += days, pending -= days
```

### 4.3 Expense Claim

```
Employee creates claim (status = 'draft')
POST /api/proxy/claims
{ claim_type_id, subclaim_type_id, title, amount, claim_date, ... }
          │
          ▼
Employee uploads attachments (receipts / photos)
POST /api/proxy/claims/{id}/attachments
          │
          ▼
Employee submits claim
PATCH /api/proxy/claims/{id}/submit
status → 'pending_l1'
          │
          ▼
Approval pipeline (1–4 levels, configured per claim type):
  Level 1: HOD
  Level 2: HR Admin
  Level 3: Top Management (high-value claims)
  Level 4: Finance (if configured)
          │
     ┌────┴────┐
     │         │
  Approve    Reject
     │         │
     ▼         ▼
status =    status =
'approved'  'rejected'
     │       + rejection_reason
     ▼
Finance marks paid
PATCH /api/proxy/claims/{id}/mark-paid
status → 'paid'
```

### 4.4 Attendance Clock-In

```
Employee opens app at work location
          │
          ▼
Upload selfie
POST /api/proxy/attendance/upload-photo
          │
          ▼
Face verification (compares against registered face photos)
POST /api/proxy/face/verify
          │
     ┌────┴────┐
     │         │
  Match      No match
     │         │
     ▼         ▼
Clock in      Flagged as
POST /api/proxy/attendance/logs  'invalid' or
{ type: 'clock_in',              'pending_review'
  latitude, longitude,
  photo_url }
          │
          ▼
Geofence check:
  distance to nearest active office ≤ geofence_radius?
     │
  Yes: status = 'valid'
  No:  status = 'invalid_location'
```

### 4.5 Overtime Request

```
Employee submits overtime request
POST /api/proxy/overtime
{ date, hours, reason }
          │
          ▼
status = 'pending'
          │
          ▼
HOD approves (role: hod | hr_admin | top_management)
PATCH /api/proxy/overtime/{id}/approve
          │
     ┌────┴────┐
     │         │
  Approve    Reject
     │         │
     ▼         ▼
status =    status =
'approved'  'rejected'
```

---

## 5. API Contract

All API calls from the browser go through the Next.js BFF proxy at `/api/proxy/`. The proxy forwards to Laravel at the configured `LARAVEL_API_URL`. Response format:

**Success:**
```json
{ "message": "string", "data": {} }
```

**Error:**
```json
{ "error": "ERROR_CODE", "message": "Human-readable message", "status": 4xx }
```

**Demo Mode:** When `DEMO_MODE=true`, all `POST`, `PUT`, `PATCH`, `DELETE` requests (except login/logout) return:
```json
{ "error": "DEMO_MODE", "message": "This action is disabled in demo mode.", "status": 403 }
```

---

### Auth

#### POST /api/auth/login
Login with email and password.

**Auth:** Public · **Rate limit:** 5/min

**Request:**
```json
{ "email": "string", "password": "string" }
```

**Response 200:**
```json
{
  "user": {
    "id": "integer",
    "uuid": "string",
    "name": "string",
    "email": "string",
    "avatar_url": "string|null",
    "status": "active|verifying|rejected|deactivated",
    "roles": ["staff|hod|hr_admin|top_management"]
  },
  "accessStatus": "granted|pending|rejected|deactivated",
  "rejectionReason": "string|null",
  "token": "string"
}
```

**Errors:**
- `INVALID_CREDENTIALS` → 401
- `ACCOUNT_LOCKED` → 423 (includes `remainingSeconds`)
- `ACCOUNT_DEACTIVATED` → 403

---

#### POST /api/auth/lark/callback
Exchange Lark OAuth code for session.

**Auth:** Public · **Rate limit:** 30/min

**Request:**
```json
{ "code": "string" }
```

**Response 200:** Same shape as `/auth/login`

---

#### POST /api/auth/logout
Revoke current session token.

**Auth:** Required

**Response 200:** `{ "message": "Logged out." }`

---

#### GET /api/proxy/user
Get currently authenticated user.

**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "id": "integer", "uuid": "string", "name": "string",
    "email": "string", "avatar_url": "string|null",
    "status": "string", "roles": ["string"],
    "department": { "id": "integer", "name": "string" }
  }
}
```

---

### Profile

#### GET /api/proxy/profile/me
Get own full profile.

**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "id": "integer", "name": "string", "email": "string",
    "employee_id": "string|null", "avatar_url": "string|null",
    "face_front_url": "string|null",
    "department": { "id": "integer", "name": "string" },
    "roles": ["string"], "status": "string"
  }
}
```

---

#### PUT /api/proxy/profile/me
Update own profile (name, employee_id).

**Auth:** Required

**Request:** `{ "name": "string", "employee_id": "string" }`

---

#### POST /api/proxy/profile/avatar
Upload profile picture.

**Auth:** Required · **Content-Type:** multipart/form-data

**Request:** `file` (image/*, max 5MB)

**Response 201:** `{ "data": { "avatar_url": "string" } }`

---

#### POST /api/proxy/profile/face-photo
Upload face recognition photo.

**Auth:** Required · **Content-Type:** multipart/form-data

**Request:**
```
file: image file
type: "front" | "left" | "right"
```

---

### Attendance

#### POST /api/proxy/attendance/upload-photo
Upload selfie before clocking in/out.

**Auth:** Required · **Content-Type:** multipart/form-data

**Request:** `file` (image/jpeg,png, max 10MB)

**Response 200:** `{ "data": { "photo_url": "string" } }`

---

#### POST /api/proxy/attendance/logs
Record clock-in or clock-out.

**Auth:** Required

**Request:**
```json
{
  "type": "clock_in | clock_out",
  "latitude": "number",
  "longitude": "number",
  "photo_url": "string",
  "notes": "string|null"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "integer", "type": "string", "status": "valid|invalid_location|pending_review",
    "timestamp": "ISO8601", "distance_meters": "integer"
  }
}
```

---

#### GET /api/proxy/attendance/my-today
Get own attendance records for today.

**Auth:** Required

**Response 200:** `{ "data": { "clock_in": {}, "clock_out": {} } }`

---

#### GET /api/proxy/admin/attendance/today
Get all employee attendance for today.

**Auth:** Required · **Role:** hod, hr_admin, top_management

---

### Leave

#### GET /api/proxy/leave-types
List all leave types.

**Auth:** Required

**Response 200:**
```json
{
  "data": [{
    "id": "integer", "name": "string", "key": "string",
    "annual_quota": "integer|null", "requires_attachment": "boolean",
    "approval_chain": [{ "role": "string", "level": "integer" }]
  }]
}
```

---

#### POST /api/proxy/leave
Submit leave request.

**Auth:** Required

**Request:**
```json
{
  "leave_type_id": "integer",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "day_type": "full | am | pm",
  "reason": "string"
}
```

**Response 201:** Created leave object

**Errors:**
- `INSUFFICIENT_BALANCE` → 422
- `DATE_CONFLICT` → 422
- `ATTACHMENT_REQUIRED` → 422

---

#### GET /api/proxy/leave
List own leave requests.

**Auth:** Required

**Query params:** `?status=pending|approved|rejected|cancelled` `?year=2026`

---

#### GET /api/proxy/leave/{id}
Get leave request detail.

**Auth:** Required (own leaves) or hod/hr_admin/top_management (any leave)

---

#### PATCH /api/proxy/leave/{id}/cancel
Cancel a pending leave request.

**Auth:** Required (own leaves only, while pending)

---

#### GET /api/proxy/leave/balance
Get own leave balance for current year.

**Auth:** Required

**Response 200:**
```json
{
  "data": [{
    "leave_type": { "id": "integer", "name": "string" },
    "entitled": "integer",
    "used": "integer",
    "pending": "integer",
    "available": "integer"
  }]
}
```

---

#### PATCH /api/proxy/leave/{id}/approve
Approve a leave request.

**Auth:** Required · **Role:** hod, hr_admin, top_management

---

#### POST /api/proxy/leave/{id}/reject
Reject a leave request.

**Auth:** Required · **Role:** hod, hr_admin, top_management

**Request:** `{ "reason": "string" }`

---

#### POST /api/proxy/leave/{id}/attachments
Upload attachment to a leave request.

**Auth:** Required · **Content-Type:** multipart/form-data

**Request:** `file` (jpeg,jpg,png,pdf, max 10MB)

**Response 201:**
```json
{
  "data": {
    "id": "integer", "url": "string (signed, 1h expiry)",
    "original_name": "string", "mime_type": "string", "size_bytes": "integer"
  }
}
```

---

### Claims

#### GET /api/proxy/claim-types
List claim types (with subclaim types).

**Auth:** Required

---

#### POST /api/proxy/claims
Create expense claim (draft).

**Auth:** Required

**Request:**
```json
{
  "claim_type_id": "integer",
  "subclaim_type_id": "integer|null",
  "title": "string",
  "type": "receipt | mileage | business-travel | miscellaneous | office | outstation | renovation | special-mileage | transportation",
  "amount": "number",
  "claim_date": "YYYY-MM-DD",
  "description": "string|null",
  "merchant": "string|null"
}
```

**Response 201:** Created claim object (status = `draft`)

---

#### PATCH /api/proxy/claims/{id}/submit
Submit draft claim for approval.

**Auth:** Required (own drafts only)

**Response 200:** Claim with status = `pending_l1`

---

#### PATCH /api/proxy/claims/{id}/approve
Approve claim at current level.

**Auth:** Required · **Role:** hod, hr_admin, top_management

---

#### POST /api/proxy/claims/{id}/reject
Reject claim.

**Auth:** Required · **Role:** hod, hr_admin, top_management

**Request:** `{ "reason": "string" }`

---

#### PATCH /api/proxy/claims/{id}/mark-paid
Mark approved claim as paid.

**Auth:** Required · **Role:** hr_admin, top_management

---

#### POST /api/proxy/claims/{id}/attachments
Upload attachment to a claim.

**Auth:** Required · **Content-Type:** multipart/form-data

**Request:** `file` (jpeg,jpg,png,pdf, max 10MB)

**Response 201:**
```json
{
  "data": {
    "id": "integer", "url": "string (signed, 1h expiry)",
    "original_name": "string", "mime_type": "string", "size_bytes": "integer"
  }
}
```

---

### Overtime

#### POST /api/proxy/overtime
Submit overtime request.

**Auth:** Required

**Request:**
```json
{ "date": "YYYY-MM-DD", "hours": "number", "reason": "string" }
```

---

#### PATCH /api/proxy/overtime/{id}/approve
Approve overtime request.

**Auth:** Required · **Role:** hod, hr_admin, top_management

---

#### POST /api/proxy/overtime/{id}/reject
Reject overtime request.

**Auth:** Required · **Role:** hod, hr_admin, top_management

**Request:** `{ "reason": "string" }`

---

### Shifts

#### GET /api/proxy/shifts
List all shifts.

**Auth:** Required

**Response 200:**
```json
{
  "data": [{
    "id": "integer", "name": "string",
    "start_time": "HH:MM", "end_time": "HH:MM",
    "description": "string|null"
  }]
}
```

---

#### POST /api/proxy/shifts
Create shift definition.

**Auth:** Required · **Role:** hr_admin, top_management

**Request:** `{ "name": "string", "start_time": "HH:MM", "end_time": "HH:MM", "description": "string|null" }`

---

#### POST /api/proxy/shifts/{id}/assignments
Assign employees to shift.

**Auth:** Required · **Role:** hr_admin, top_management

**Request:** `{ "user_ids": ["integer"] }`

---

### Analytics

#### GET /api/proxy/admin/analytics/overview
HR overview metrics.

**Auth:** Required · **Role:** hr_admin, top_management

**Response 200:**
```json
{
  "data": {
    "total_employees": "integer",
    "active_today": "integer",
    "pending_leaves": "integer",
    "pending_claims": "integer",
    "pending_claims_amount": "number"
  }
}
```

---

#### GET /api/proxy/admin/analytics/attendance
Attendance analytics.

**Auth:** Required · **Role:** hr_admin, top_management

---

#### GET /api/proxy/admin/analytics/leave
Leave analytics.

**Auth:** Required · **Role:** hr_admin, top_management

---

#### GET /api/proxy/admin/analytics/claims
Claims analytics and spend.

**Auth:** Required · **Role:** hr_admin, top_management

---

#### GET /api/proxy/admin/audit
Audit trail (all user actions).

**Auth:** Required · **Role:** hr_admin, top_management

**Query params:** `?user_id=integer` `?from=YYYY-MM-DD` `?to=YYYY-MM-DD`

---

## 6. Full API Route Reference

All routes are prefixed `/api/proxy/` from the browser (or `/api/` on the Laravel server directly).

### Auth & Profile

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Email/password login |
| POST | `/auth/lark/callback` | public | Lark OAuth login |
| POST | `/auth/logout` | any | Revoke token |
| POST | `/auth/resubmit` | any | Re-apply after rejection |
| GET | `/user` | any | Current user |
| GET | `/auth/my-roles` | any | Current user roles |
| GET | `/profile/me` | any | Own profile |
| PUT | `/profile/me` | any | Update own profile |
| POST | `/profile/avatar` | any | Upload avatar |
| POST | `/profile/face-photo` | any | Upload face photo |

### Attendance

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/attendance/my-today` | any | Own attendance today |
| POST | `/attendance/upload-photo` | any | Upload selfie |
| POST | `/attendance/logs` | any | Clock in / clock out |
| POST | `/face/verify` | any | Face verification |
| GET | `/admin/attendance/today` | hod+ | All attendance today |
| GET | `/admin/profiles` | hod+ | All employee profiles |
| GET | `/offices` | any | List offices |
| POST | `/offices` | hr_admin+ | Create office |
| PUT | `/offices/{id}` | hr_admin+ | Update office |
| PATCH | `/offices/{id}` | hr_admin+ | Toggle office active |

### Leave

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/leave-types` | any | List leave types |
| POST | `/leave-types` | hr_admin+ | Create leave type |
| GET | `/leave-types/{id}` | hr_admin+ | Get leave type |
| PATCH | `/leave-types/{id}` | hr_admin+ | Update leave type |
| DELETE | `/leave-types/{id}` | hr_admin+ | Delete leave type |
| GET | `/leave` | any | Own leave requests |
| POST | `/leave` | any | Submit leave request |
| GET | `/leave/{id}` | any | Leave detail |
| PATCH | `/leave/{id}/cancel` | any | Cancel leave |
| GET | `/leave/balance` | any | Own leave balance |
| GET | `/leave/balance/{userId}` | hr_admin+ | User leave balance |
| POST | `/leave/oil-grant` | hr_admin+ | Grant OIL balance |
| GET | `/leave/pending-approvals` | hod+ | Pending approvals queue |
| GET | `/leave/all` | hod+ | All leave requests |
| GET | `/leave/{id}/approvals` | hod+ | Leave approval steps |
| PATCH | `/leave/{id}/approve` | hod+ | Approve leave |
| POST | `/leave/{id}/reject` | hod+ | Reject leave |
| POST | `/leave/{id}/attachments` | any | Upload attachment |
| DELETE | `/leave/{id}/attachments/{aid}` | any | Delete attachment |

### Claims

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/claim-types` | any | List claim types |
| POST | `/claim-types` | hr_admin+ | Create claim type |
| GET | `/claim-types/{id}` | hr_admin+ | Get claim type |
| PUT | `/claim-types/{id}` | hr_admin+ | Update claim type |
| DELETE | `/claim-types/{id}` | hr_admin+ | Delete claim type |
| POST | `/claim-types/{id}/subclaim-types` | hr_admin+ | Create subclaim type |
| PUT | `/claim-types/{id}/subclaim-types/{sid}` | hr_admin+ | Update subclaim type |
| DELETE | `/claim-types/{id}/subclaim-types/{sid}` | hr_admin+ | Delete subclaim type |
| GET | `/claims` | any | Own claims |
| POST | `/claims` | any | Create claim draft |
| GET | `/claims/{id}` | any | Claim detail |
| PUT | `/claims/{id}` | any | Update draft claim |
| PATCH | `/claims/{id}/submit` | any | Submit claim |
| DELETE | `/claims/{id}` | any | Delete draft claim |
| GET | `/claims/all` | hod+ | All claims |
| GET | `/claims/stats` | any | Claim statistics |
| GET | `/claims/monthly-spend` | any | Monthly spend chart |
| GET | `/claims/mileage-rate` | any | Current mileage rate |
| POST | `/claims/calculate-distance` | any | Distance calculation |
| GET | `/claims/approval-threshold` | any | Approval thresholds |
| GET | `/claim-categories` | any | Claim categories |
| GET | `/claims/{id}/approvals` | any | Approval steps |
| PATCH | `/claims/{id}/approve` | hod+ | Approve claim |
| POST | `/claims/{id}/reject` | hod+ | Reject claim |
| PATCH | `/claims/{id}/mark-paid` | hr_admin+ | Mark claim paid |
| GET | `/claims/{id}/attachments` | any | List attachments |
| POST | `/claims/{id}/attachments` | any | Upload attachment |
| DELETE | `/claims/{id}/attachments/{aid}` | any | Delete attachment |

### Overtime

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/overtime` | any | Own overtime requests |
| POST | `/overtime` | any | Submit overtime request |
| GET | `/overtime/{id}` | any | Overtime detail |
| PATCH | `/overtime/{id}/cancel` | any | Cancel overtime |
| GET | `/overtime/pending-approvals` | hod+ | Pending queue |
| GET | `/overtime/all` | hod+ | All overtime requests |
| GET | `/overtime/{id}/approvals` | hod+ | Approval steps |
| PATCH | `/overtime/{id}/approve` | hod+ | Approve overtime |
| POST | `/overtime/{id}/reject` | hod+ | Reject overtime |

### Shifts

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/shifts/my` | any | Own shift assignment |
| GET | `/shifts` | any | All shifts |
| GET | `/shifts/{id}` | any | Shift detail |
| POST | `/shifts` | hr_admin+ | Create shift |
| PATCH | `/shifts/{id}` | hr_admin+ | Update shift |
| DELETE | `/shifts/{id}` | hr_admin+ | Delete shift |
| GET | `/shifts/{id}/assignments` | hod+ | Shift assignments |
| POST | `/shifts/{id}/assignments` | hr_admin+ | Assign employees |
| DELETE | `/shifts/assignments/{id}` | hr_admin+ | Remove assignment |

### Admin / Analytics / Departments

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/admin/users` | hod+ | List all users |
| GET | `/admin/users/{uuid}` | hod+ | User detail |
| PATCH | `/admin/users/{uuid}` | top_management | Update user department |
| PATCH | `/admin/users/{uuid}/role` | top_management | Update user role |
| GET | `/departments` | hod+ | List departments |
| GET | `/departments/{id}` | hod+ | Department detail |
| POST | `/departments` | top_management | Create department |
| PUT | `/departments/{id}` | top_management | Update department |
| GET | `/admin/analytics/overview` | hr_admin+ | Overview metrics |
| GET | `/admin/analytics/attendance` | hr_admin+ | Attendance analytics |
| GET | `/admin/analytics/leave` | hr_admin+ | Leave analytics |
| GET | `/admin/analytics/claims` | hr_admin+ | Claims analytics |
| GET | `/admin/audit` | hr_admin+ | Audit trail |
| GET | `/onboarding` | top_management | Onboarding queue |
| POST | `/onboarding/{id}/approval` | top_management | Approve onboarding |
| POST | `/onboarding/{id}/rejection` | top_management | Reject onboarding |
| GET | `/notifications` | any | In-app notifications |
| PATCH | `/notifications/read-all` | any | Mark all read |
| PATCH | `/notifications/{id}/read` | any | Mark one read |

---

> **Role notation:** `any` = authenticated user of any role. `hod+` = hod, hr_admin, or top_management. `hr_admin+` = hr_admin or top_management. `top_management` = top management only.

---

*FlowOffice — Built on Laravel 12 + Next.js 16. Portable architecture, no vendor lock-in.*
