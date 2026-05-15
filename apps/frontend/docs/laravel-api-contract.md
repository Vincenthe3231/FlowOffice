# Laravel Backend API Contract

> **Auto-generated from Next.js frontend source code (2026-05-15)**
>
> This document describes every Laravel endpoint the FlowOffice Next.js frontend calls.
> All field names are in **snake\_case** (wire format after Axios interceptor transform).
> The Next.js client uses camelCase internally; the Axios request interceptor converts outgoing
> bodies to snake\_case and the response interceptor converts incoming data to camelCase.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Auth Endpoints](#auth-endpoints)
3. [Leave Endpoints](#leave-endpoints)
4. [Claims Endpoints](#claims-endpoints)
5. [Attendance Endpoints](#attendance-endpoints)
6. [Profile & Users Endpoints](#profile--users-endpoints)
7. [Departments & Offices Endpoints](#departments--offices-endpoints)
8. [Onboarding Endpoints](#onboarding-endpoints)
9. [Notifications Endpoints](#notifications-endpoints)
10. [Geocode & Maps Endpoints](#geocode--maps-endpoints)
11. [Shared Response Shapes](#shared-response-shapes)
12. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

### BFF (Backend-for-Frontend) Pattern

The browser **never talks to Laravel directly**. All requests go same-origin to Next.js:

```
Browser → Next.js (same-origin) → Laravel API
```

Two routing paths exist:

| Path | Purpose |
|------|---------|
| `/api/auth/*` | Dedicated Route Handlers for auth (login, callback, logout, me) |
| `/api/proxy/*` | Catch-all proxy that forwards `/api/proxy/{path}` → `LARAVEL_API_URL/api/{path}` |

### Auth Token Flow

1. Browser sends credentials to Next.js Route Handler
2. Route Handler bootstraps CSRF via `GET /sanctum/csrf-cookie`
3. Route Handler POSTs to Laravel with `X-XSRF-TOKEN` + `Cookie` headers
4. Laravel returns `{ data: { user, token, access_status, ... } }`
5. Route Handler stores `token` in httpOnly cookie (`fo_auth_token`), strips it from response
6. Browser receives `{ data: { user, access_status, ... } }` — **never sees the Bearer token**

### Proxy Auth Forwarding

The catch-all proxy reads `fo_auth_token` cookie and sends it as `Authorization: Bearer {token}`.
All other cookies (except auth cookie) are forwarded as `Cookie` header.
Laravel `Set-Cookie` headers are propagated back to the browser.

### Cookie Configuration

| Cookie | Default Name | httpOnly | Secure | SameSite | MaxAge | Purpose |
|--------|-------------|----------|--------|----------|--------|---------|
| Auth token | `fo_auth_token` | Yes | Prod only | Lax | 7 days | Sanctum Bearer token |
| Auth cache | `fo_staff_auth` | No | Prod only | Lax | 7 days | Client-side "likely authenticated" flag |

Cookie names are configurable via `AUTH_COOKIE_NAME` and `AUTH_CACHE_COOKIE_NAME` env vars.

### snake\_case / camelCase Boundary

- **Wire format (Laravel ↔ Next.js Route Handler)**: snake\_case
- **Next.js client code**: camelCase (Axios interceptors auto-transform)
- **FormData**: passed through as-is (no key transformation)

---

## Auth Endpoints

These use **dedicated Next.js Route Handlers** (not the catch-all proxy).

### `GET /sanctum/csrf-cookie`

Bootstrap CSRF session. Called automatically before every login/callback.

| Field | Value |
|-------|-------|
| Auth required | No |
| Response | Sets `XSRF-TOKEN` and session cookies |

---

### `POST /api/auth/login`

Email/password authentication.

| Field | Value |
|-------|-------|
| Auth required | No (CSRF only) |
| Frontend caller | `laravel-client.ts:loginWithEmail()` |
| Status | **Working** |

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response (200):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "roles": [{ "name": "staff" }]
    },
    "token": "1|abc123...",
    "access_status": "granted",
    "onboarding": null
  }
}
```

> Note: `token` is stripped by the Route Handler before reaching the browser.
> It is stored in the `fo_auth_token` httpOnly cookie.

---

### `POST /api/auth/lark/callback`

Lark OAuth code exchange.

| Field | Value |
|-------|-------|
| Auth required | No (CSRF only) |
| Frontend caller | `laravel-client.ts:loginWithLark()` |
| Status | **Working** |

**Request:**
```json
{
  "code": "lark_authorization_code"
}
```

**Response:** Same shape as `/api/auth/login`.

**Laravel must:** Exchange `code` with Lark token endpoint using server-side app secret, fetch user info, find-or-create user, return auth response.

---

### `POST /api/auth/google/callback`

Google OAuth code exchange with PKCE.

| Field | Value |
|-------|-------|
| Auth required | No (CSRF only) |
| Frontend caller | `laravel-client.ts:loginWithGoogle()` |
| Status | **501 Scaffold — Backend TODO** |
| Gate env var | `OAUTH_GOOGLE_ENABLED=true` |

**Request:**
```json
{
  "code": "google_authorization_code",
  "code_verifier": "pkce_verifier_string"
}
```

**Response:** Same shape as `/api/auth/login`.

**Laravel must:**
1. Exchange `code` + `code_verifier` with Google token endpoint (`https://oauth2.googleapis.com/token`) using `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`
2. Validate ID token or call `https://www.googleapis.com/oauth2/v3/userinfo`
3. Find-or-create user by email
4. Return auth response with Sanctum token

**Frontend sends these scopes:** `openid email profile`

---

### `POST /api/auth/microsoft/callback`

Microsoft Entra ID (Azure AD) OAuth code exchange with PKCE.

| Field | Value |
|-------|-------|
| Auth required | No (CSRF only) |
| Frontend caller | `laravel-client.ts:loginWithMicrosoft()` |
| Status | **501 Scaffold — Backend TODO** |
| Gate env var | `OAUTH_MICROSOFT_ENABLED=true` |

**Request:**
```json
{
  "code": "microsoft_authorization_code",
  "code_verifier": "pkce_verifier_string"
}
```

**Response:** Same shape as `/api/auth/login`.

**Laravel must:**
1. Exchange `code` + `code_verifier` with Microsoft token endpoint (`https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`) using `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`
2. Validate ID token or call Microsoft Graph `/me` endpoint
3. Handle multi-tenant (`tenant=common`) or single-tenant scenarios
4. Find-or-create user by email
5. Return auth response with Sanctum token

**Frontend sends these scopes:** `openid email profile User.Read offline_access`

**Env vars:**
- `NEXT_PUBLIC_MICROSOFT_TENANT_ID` (default: `common`)
- `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`

---

### `GET /api/user`

Get current authenticated user session. Called by Next.js middleware for route protection.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | Route Handler `/api/auth/me` → proxies to Laravel |
| Status | **Working** |

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "roles": [{ "name": "staff" }],
    "access_status": "granted"
  }
}
```

On 401: Next.js clears auth cookies and redirects to `/login`.

---

### `POST /api/auth/logout`

Revoke token and end session.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `laravel-client.ts:logoutUser()` |
| Status | **Working** |

**Response (200):**
```json
{
  "message": "Logged out"
}
```

Next.js clears `fo_auth_token` and `fo_staff_auth` cookies regardless of Laravel response.

---

### `GET /api/auth/my-roles`

Get current user's role list.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer, via proxy) |
| Frontend caller | `roles.ts:fetchMyRoles()` |
| Status | **Working** |

**Response:**
```json
{
  "data": [{ "name": "staff" }, { "name": "hr_admin" }]
}
```

---

### `POST /api/auth/resubmit`

Resubmit account after rejection.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer, via proxy) |
| Frontend caller | `auth/callback/page.tsx` |
| Status | **Working** |

---

## Leave Endpoints

All via catch-all proxy (`/api/proxy/leave/*` → `/api/leave/*`).

### `GET /api/leave`

List current user's leave requests.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchMyLeaves()` |

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status |
| `leave_type_id` | number | No | Filter by leave type |
| `page` | number | No | Pagination page |
| `per_page` | number | No | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "leave_type_id": 2,
      "start_date": "2026-05-20",
      "end_date": "2026-05-21",
      "day_type": "full",
      "reason": "Family event",
      "status": "pending",
      "created_at": "2026-05-15T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42
  }
}
```

---

### `POST /api/leave`

Create a new leave request.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:createLeaveRequest()` |

**Request:**
```json
{
  "leave_type_id": 2,
  "start_date": "2026-05-20",
  "end_date": "2026-05-21",
  "day_type": "full",
  "reason": "Family event"
}
```

**Response (201):** Single leave request object.

---

### `GET /api/leave/{id}`

Get leave request details.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchLeaveById()` |

---

### `PATCH /api/leave/{id}/cancel`

Cancel a leave request.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:cancelLeaveRequest()` |

**Request:** Empty body.

---

### `PATCH /api/leave/{id}/approve`

Approve a leave request at a specific approval level.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:approveRejectLeave()` |

**Request:**
```json
{
  "level": 1,
  "reason": "Approved"
}
```

---

### `POST /api/leave/{id}/reject`

Reject a leave request at a specific approval level.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:approveRejectLeave()` |

**Request:**
```json
{
  "level": 1,
  "reason": "Insufficient balance"
}
```

---

### `GET /api/leave/{id}/approvals`

Get the approval chain for a leave request.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchLeaveApprovals()` |

**Response:**
```json
{
  "data": [
    {
      "level": 1,
      "role": "hod",
      "status": "approved",
      "approver": { "id": 5, "name": "Jane Manager" },
      "reason": "Approved",
      "actioned_at": "2026-05-16T09:00:00Z"
    }
  ]
}
```

---

### `POST /api/leave/{id}/attachments`

Upload an attachment for a leave request.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:uploadLeaveAttachment()` |
| Content-Type | `multipart/form-data` |

**Request:** FormData with field `file` (File).

---

### `DELETE /api/leave/{id}/attachments/{attachment_id}`

Delete a leave attachment.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:deleteLeaveAttachment()` |

---

### `GET /api/leave/all`

List all organization leaves (for approvers: HOD, HR Admin, Top Management).

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchAllLeavesForApproval()` |

**Query params:** `per_page=200`

---

### `GET /api/leave/balance`

Get current user's leave balance.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchMyLeaveBalance()` |

**Response:**
```json
{
  "data": [
    {
      "leave_type_id": 1,
      "leave_type_name": "Annual Leave",
      "annual_quota": 14,
      "used": 3,
      "pending": 1,
      "remaining": 10
    }
  ]
}
```

---

### `GET /api/leave/balance/{user_id}`

Get another user's leave balance (admin/HR).

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchUserLeaveBalance()` |

---

### `GET /api/leave/pending-approvals`

Get leaves pending current user's approval.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchPendingLeaveApprovals()` |

---

### `POST /api/leave/oil-grant`

Grant Off-In-Lieu (OIL) days to a user.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:grantOilDays()` |

**Request:**
```json
{
  "user_id": 5,
  "days": 1,
  "reason": "Worked on public holiday"
}
```

---

### `GET /api/leave-types`

List all leave types.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:fetchLeaveTypes()` |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Annual Leave",
      "key": "annual",
      "description": "Standard annual leave",
      "annual_quota": 14,
      "requires_attachment": false,
      "approval_chain": [{ "level": 1, "role": "hod" }],
      "duration_threshold": null,
      "duration_threshold_role": null
    }
  ]
}
```

---

### `POST /api/leave-types`

Create a leave type.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `leave.ts:createLeaveType()` |

**Request:**
```json
{
  "name": "Sick Leave",
  "key": "sick",
  "description": "Medical leave",
  "annual_quota": 14,
  "requires_attachment": true,
  "approval_chain": [
    { "level": 1, "role": "hod" },
    { "level": 2, "role": "hr_admin" }
  ],
  "duration_threshold": 3,
  "duration_threshold_role": "hr_admin"
}
```

---

### `GET /api/leave-types/{id}`

Get a single leave type.

---

### `PATCH /api/leave-types/{id}`

Update a leave type (partial update).

**Request:** Any subset of the create payload fields.

---

### `DELETE /api/leave-types/{id}`

Delete a leave type.

---

## Claims Endpoints

All via catch-all proxy (`/api/proxy/claims/*` → `/api/claims/*`).

### `GET /api/claims`

List current user's claims.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `claims.ts:fetchClaims()` |

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status (comma-separated for multiple) |
| `page` | number | No | Pagination page |
| `per_page` | number | No | Items per page |

---

### `POST /api/claims`

Create a claim.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `claims.ts:createClaim()` |

**Request (receipt claim):**
```json
{
  "title": "Taxi receipt",
  "type": "receipt",
  "category_id": 3,
  "amount": 25.50,
  "claim_date": "2026-05-10",
  "merchant": "Grab",
  "description": "Client meeting transport",
  "status": "draft"
}
```

**Request (mileage claim):**
```json
{
  "title": "Site visit mileage",
  "type": "mileage",
  "category_id": 3,
  "amount": 45.00,
  "claim_date": "2026-05-10",
  "description": "Site inspection",
  "status": "draft",
  "mileage": {
    "from_location": "Office HQ",
    "to_location": "Client site",
    "distance_km": 30.5,
    "rate_per_km": 0.60
  }
}
```

---

### `GET /api/claims/{id}`

Get claim details.

---

### `PUT /api/claims/{id}`

Update a claim.

**Request:** Partial claim fields + optional `metadata` object.

---

### `DELETE /api/claims/{id}`

Delete a claim.

---

### `PATCH /api/claims/{id}/submit`

Submit a draft claim for approval.

**Request:** Empty body.

---

### `GET /api/claims/{id}/attachments`

List claim attachments.

---

### `POST /api/claims/{id}/attachments`

Upload a claim attachment.

| Field | Value |
|-------|-------|
| Content-Type | `multipart/form-data` |

**Request:** FormData with field `file` (File).

---

### `DELETE /api/claims/{id}/attachments/{attachment_id}`

Delete a claim attachment.

---

### `POST /api/claims/{id}/approve`

Approve a claim.

**Request:**
```json
{
  "level": 1,
  "reason": "Approved"
}
```

---

### `POST /api/claims/{id}/reject`

Reject a claim.

**Request:**
```json
{
  "level": 1,
  "reason": "Missing receipt"
}
```

---

### `POST /api/claims/{id}/mark-paid`

Mark a claim as paid (finance role).

---

### `GET /api/claims/{id}/approvals`

Get claim approval chain.

**Response:** Same shape as leave approvals.

---

### `GET /api/claims/all`

List all org-wide claims (approver view).

**Query params:** `per_page=200`

---

### `GET /api/claims/stats`

Claims statistics dashboard.

---

### `GET /api/claims/monthly-spend`

Monthly spend aggregation.

---

### `GET /api/claims/mileage-rate`

Get the mileage reimbursement rate (per km).

**Response:**
```json
{
  "data": { "rate": 0.60 }
}
```

---

### `POST /api/claims/calculate-distance`

Calculate distance between two locations.

**Request:**
```json
{
  "from": "Office HQ, KL",
  "to": "Client site, PJ"
}
```

**Response:**
```json
{
  "data": { "distance_km": 30.5 }
}
```

---

### `GET /api/claims/approval-threshold`

Get approval amount threshold.

---

### `POST /api/claim-approvals/{approval_id}`

Action on a specific claim approval record.

---

### `GET /api/claim-types`

List claim types.

---

### `POST /api/claim-types`

Create a claim type.

**Request:**
```json
{
  "key": "transport",
  "label": "Transport",
  "description": "Transportation expenses",
  "icon": "car",
  "color": "#3b82f6"
}
```

---

### `GET /api/claim-types/{id}`

Get claim type details.

---

### `DELETE /api/claim-types/{id}`

Delete a claim type.

---

### `GET /api/claim-types/{id}/subclaim-types`

List subclaim types under a claim type.

---

### `POST /api/claim-types/{id}/subclaim-types`

Create a subclaim type.

**Request:**
```json
{
  "label": "Taxi",
  "key": "taxi",
  "description": "Taxi rides",
  "rate": 0
}
```

---

### `GET /api/claim-types/{claim_type_id}/subclaim-types/{subclaim_type_id}`

Get subclaim type details.

---

### `DELETE /api/claim-types/{claim_type_id}/subclaim-types/{subclaim_type_id}`

Delete a subclaim type.

---

### `GET /api/claim-categories`

List claim categories.

---

## Attendance Endpoints

All via catch-all proxy.

### `GET /api/attendance/my-today`

Get current user's today attendance logs.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `attendance.ts:fetchTodayUserLogs()` |

---

### `POST /api/attendance/upload-photo`

Upload an attendance clock-in/out photo.

| Field | Value |
|-------|-------|
| Content-Type | `multipart/form-data` |

**Request:** FormData with field `photo` (File).

**Response:**
```json
{
  "data": { "url": "https://storage.example.com/photos/abc123.jpg" }
}
```

---

### `POST /api/attendance/logs`

Clock in or out.

**Request:**
```json
{
  "type": "clock_in",
  "office_id": 1,
  "latitude": 3.1390,
  "longitude": 101.6869,
  "photo_url": "https://storage.example.com/photos/abc123.jpg",
  "notes": "Working from satellite office"
}
```

`type` values: `clock_in`, `clock_out`

---

### `GET /api/admin/attendance/today`

Admin view of today's attendance across organization.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer, admin role) |
| Frontend caller | `attendance.ts:adminFetchTodayLogs()` |

---

### `GET /api/admin/profiles`

Get all user profiles (admin attendance view).

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer, admin role) |
| Frontend caller | `attendance.ts:adminFetchAllProfiles()` |

---

## Profile & Users Endpoints

All via catch-all proxy.

### `GET /api/profile/me`

Get current user's full profile.

| Field | Value |
|-------|-------|
| Auth required | Yes (Bearer) |
| Frontend caller | `profile.ts:fetchMyProfile()` |

---

### `PUT /api/profile/me`

Update current user's profile.

**Request:**
```json
{
  "full_name": "John Doe",
  "phone": "+60123456789",
  "department": "Engineering",
  "employee_id": "EMP001",
  "avatar_url": "https://...",
  "face_front_url": "https://...",
  "face_left_url": "https://...",
  "face_right_url": "https://..."
}
```

---

### `POST /api/profile/avatar`

Upload avatar photo.

| Field | Value |
|-------|-------|
| Content-Type | `multipart/form-data` |

**Request:** FormData with field `avatar` (File).

---

### `POST /api/profile/face-photo`

Upload face verification photo.

| Field | Value |
|-------|-------|
| Content-Type | `multipart/form-data` |

**Request:** FormData with fields:
- `face_photo` (File)
- `position` — `front`, `left`, or `right`

---

### `GET /api/admin/users`

List users (admin directory).

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Pagination page |
| `per_page` | number | No | Items per page |
| `search` | string | No | Search by name/email |
| `department_id` | number | No | Filter by department |
| `role` | string | No | Filter by role |
| `status` | string | No | Filter by status |

---

### `GET /api/admin/users/{user_segment}`

Get admin user details. `user_segment` may be user ID or other identifier.

---

### `PATCH /api/admin/users/{user_segment}`

Update user's department assignment.

**Request:**
```json
{
  "department_id": 3
}
```

`department_id` can be `null` to unassign.

---

### `PATCH /api/admin/users/{user_segment}/role`

Update user's role.

**Request:**
```json
{
  "role": "hr_admin"
}
```

Valid roles: `top_management`, `super_admin`, `hr_admin`, `hod`, `staff`

---

## Departments & Offices Endpoints

All via catch-all proxy.

### `GET /api/departments`

List all departments.

---

### `POST /api/departments`

Create a department.

**Request:**
```json
{
  "name": "Engineering",
  "short_code": "ENG",
  "color_scheme": "#3b82f6",
  "status": "active"
}
```

---

### `GET /api/departments/{id}`

Get department details.

---

### `PATCH /api/departments/{id}`

Update a department.

**Request:** Partial — any subset of create fields.

---

### `GET /api/offices`

List all offices.

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `is_active` | boolean | No | Filter by active status |

---

### `POST /api/offices`

Create an office.

**Request:**
```json
{
  "name": "HQ Kuala Lumpur",
  "address": "Level 10, Tower A, KLCC",
  "latitude": 3.1577,
  "longitude": 101.7117,
  "radius_meters": 200,
  "is_active": true
}
```

---

### `PUT /api/offices/{id}`

Update an office (full update).

**Request:** Same shape as create.

---

### `PATCH /api/offices/{id}`

Toggle office active status.

**Request:**
```json
{
  "is_active": false
}
```

---

## Onboarding Endpoints

All via catch-all proxy.

### `GET /api/onboarding`

List onboarding requests.

---

### `GET /api/onboarding/approval-roles`

Get roles available for onboarding approval assignment.

---

### `POST /api/onboarding/{id}/approval`

Approve an onboarding request.

**Request:**
```json
{
  "role": "staff",
  "department_id": 3
}
```

---

### `POST /api/onboarding/{id}/rejection`

Reject an onboarding request.

**Request:**
```json
{
  "rejection_reason": "Incomplete documentation"
}
```

---

## Notifications Endpoints

All via catch-all proxy.

### `GET /api/notifications`

List in-app notifications for current user.

---

### `PATCH /api/notifications/{id}/read`

Mark a single notification as read.

---

### `PATCH /api/notifications/read-all`

Mark all notifications as read.

---

## Geocode & Maps Endpoints

All via catch-all proxy.

### `POST /api/geocode`

Forward geocode an address.

**Request:**
```json
{
  "address": "KLCC, Kuala Lumpur"
}
```

**Response:**
```json
{
  "data": {
    "latitude": 3.1577,
    "longitude": 101.7117,
    "formatted_address": "Kuala Lumpur City Centre, 50088 KL"
  }
}
```

---

### `POST /api/reverse-geocode`

Reverse geocode coordinates.

**Request:**
```json
{
  "lat": 3.1577,
  "lng": 101.7117
}
```

---

### `GET /api/maps-config`

Get Google Maps API key configuration.

**Response:**
```json
{
  "data": {
    "api_key": "AIza..."
  }
}
```

---

## Shared Response Shapes

### Auth Response

Used by all login/callback endpoints.

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "roles": [{ "name": "staff" }]
    },
    "token": "1|sanctum_token_here",
    "access_status": "granted",
    "onboarding": null
  }
}
```

`access_status` values: `granted`, `pending`, `rejected`

### Paginated Response

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  },
  "links": {
    "first": "https://api.example.com/api/leave?page=1",
    "last": "https://api.example.com/api/leave?page=5",
    "prev": null,
    "next": "https://api.example.com/api/leave?page=2"
  }
}
```

### Error Response

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Role Slugs

Defined in `src/shared/constants/roles.ts`:
- `top_management` (canonical) / `super_admin` (legacy alias)
- `hr_admin`
- `hod`
- `staff`

---

## Implementation Checklist

### Working Endpoints

- [x] `POST /api/auth/login` — Email login
- [x] `POST /api/auth/lark/callback` — Lark OAuth
- [x] `POST /api/auth/logout` — Logout
- [x] `GET /api/user` — Current user session
- [x] `GET /api/auth/my-roles` — User roles
- [x] All Leave endpoints (17)
- [x] All Claims endpoints (20+)
- [x] All Attendance endpoints (4)
- [x] All Profile & Users endpoints (8)
- [x] All Departments & Offices endpoints (7)
- [x] All Onboarding endpoints (4)
- [x] All Notifications endpoints (3)
- [x] All Geocode & Maps endpoints (3)

### Backend TODO

- [ ] `POST /api/auth/google/callback` — Accept `{ code, code_verifier }`, exchange with Google, return auth response. Flip `OAUTH_GOOGLE_ENABLED=true` when ready.
- [ ] `POST /api/auth/microsoft/callback` — Accept `{ code, code_verifier }`, exchange with Microsoft, return auth response. Flip `OAUTH_MICROSOFT_ENABLED=true` when ready.

### Environment Variables for OAuth

```env
# Google OAuth (Laravel server-side)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Microsoft Entra ID (Laravel server-side)
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/callback

# Next.js flags (flip to true when Laravel endpoints ready)
OAUTH_GOOGLE_ENABLED=false
OAUTH_MICROSOFT_ENABLED=false
```
