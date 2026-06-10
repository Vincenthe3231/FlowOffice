# Plan: Make Belive FO-Client a Sellable Template

## Context

Belive (branded "FlowOffice" in the UI) is a Next.js 16 + Laravel BFF employee self-service platform. It currently serves as an internal tool with attendance tracking (GPS + face verification), expense/claims management (multi-level approval chains), onboarding, user management, departments, and notifications. The owner wants to package and sell it as a template product targeting SMBs.

The codebase is architecturally sound — BFF proxy pattern, encrypted auth store, RBAC, Zustand + TanStack Query state management — but it was built as a single-tenant internal app, not a configurable product. Several gaps must be closed before it is sellable.

## Problem Statement

SMBs with 50–500 employees (especially those with field workers, hybrid offices, or shift-based staff) struggle with:

1. **Buddy-punching and attendance fraud** — manual or basic clock-in systems are easily gamed
2. **Expense claim bottlenecks** — paper-based or spreadsheet claims slow down reimbursements and lack audit trails
3. **Fragmented HR tools** — companies cobble together 3–5 separate apps for attendance, leave, claims, and onboarding

Existing template solutions on the market are either (a) generic admin dashboards with no real HR logic, or (b) full SaaS products too expensive for SMBs to self-host. There is a gap for a **production-ready, self-hostable HR front-office template** with real biometric attendance and structured approval workflows.

## Critical Selling Points

1. **Face-verified GPS attendance** — the single strongest differentiator. No competing template offers camera-based identity verification + geolocation in one flow. This solves buddy-punching for field workers and multi-site companies.
2. **Multi-level claims approval engine** — approval chains, budget utilization tracking, mileage + receipt claim types, and approval timeline visualization. This is genuinely complex logic that buyers would spend weeks building.
3. **BFF security architecture** — bearer tokens never reach the browser, CSRF protection, encrypted client-side storage. This is above typical template quality and a selling point for security-conscious buyers.
4. **Modern stack (2026-current)** — Next.js 16, React 19, Turbopack, TanStack Query v5, Tailwind CSS. Buyers get a template that won't feel outdated on day one.

## Summary

Transform the internal app into a sellable template by completing missing modules (Leave), adding configurability (white-label, i18n, feature flags, multi-auth), improving developer onboarding (Docker, API docs, demo mode), and cleaning up hardcoded values. Target price: **$99–199** on platforms like Gumroad, Lemonsqueezy, or CodeCanyon. Target buyer: freelance developers and small agencies building HR tools for SMB clients in Southeast Asia and emerging markets.

---

## Tasks

### Phase 1: Foundation — White-Label & Configuration (Priority: Critical)

**1.1 Create a centralized app config file**
- Create `src/config/app.config.ts` exporting app name, logo path, description, support URL, and default theme
- Replace all hardcoded "FlowOffice" / "BeLive" references (found in `FullLogo.tsx`, `auth-cookie.ts`, `LocationHeatmap.tsx`, and layout metadata) to read from this config
- Files to modify: `src/components/shared/FullLogo.tsx`, `src/shared/lib/auth-cookie.ts`, `src/features/attendance/components/LocationHeatmap.tsx`, `src/app/layout.tsx`

**1.2 Centralize role constants**
- Fix 15+ files that hardcode role strings instead of using `src/shared/constants/roles.ts`
- Key offenders: `useRoles.ts`, `profile.ts` type definition, `dashboard/page.tsx`, `approval-chain-preview.ts`, `AttendanceLogPage.tsx`, `onboarding.schemas.ts`
- Each file should import from `src/shared/constants/roles.ts`

**1.3 Feature flag system**
- Create `src/config/features.config.ts` with boolean toggles: `attendance`, `claims`, `leave`, `onboarding`, `notifications`
- Create a `useFeatureFlag(flag)` hook
- Gate sidebar/bottom-nav items and route access behind feature flags
- Files to modify: `src/components/layout/BottomNav.tsx`, sidebar config, `src/proxy.ts` (middleware)

### Phase 2: Complete the Leave Module (Priority: Critical)

**2.1 Implement Leave feature**
- Currently a placeholder (`export {}` with "Phase 6" comment)
- Build following the existing feature module pattern in `src/features/`
- Components needed: LeaveRequestDialog, LeaveBalanceCard, LeaveCalendarView, LeaveApprovalList, LeaveTypeManager (admin)
- Hooks: `useLeave` (TanStack Query hook for CRUD + approval)
- Types: LeaveRequest, LeaveType, LeaveBalance
- API client: `src/shared/lib/api-client/leave.ts`
- Follow the claims module as architectural reference — it's the most mature module

### Phase 3: Multi-Auth Provider Support (Priority: High)

**3.1 Add Google OAuth**
- Add Google OAuth flow alongside existing Lark OAuth
- Create `src/shared/lib/google-oauth-browser.ts` (mirror structure of `lark-oauth-browser.ts`)
- Add GoogleLoginButton component to login page
- Add `/api/auth/google/callback` route handler
- Environment variables: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`

**3.2 Add Microsoft Entra ID (Azure AD) OAuth**
- Same pattern as Google — `microsoft-oauth-browser.ts`, MicrosoftLoginButton, `/api/auth/microsoft/callback`
- Environment variables: `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`, `NEXT_PUBLIC_MICROSOFT_TENANT_ID`, `NEXT_PUBLIC_MICROSOFT_REDIRECT_URI`

**3.3 Auth provider config**
- Add `enabledAuthProviders` array to `src/config/app.config.ts`: `['email', 'lark', 'google', 'microsoft']`
- Login page renders only the enabled provider buttons

### Phase 4: Internationalization (Priority: High)

**4.1 Set up next-intl**
- Install `next-intl`
- Create `/messages/en.json`, `/messages/zh.json`, `/messages/ms.json` (English, Chinese, Malay — covering SEA market)
- Configure Next.js middleware for locale detection
- Extract all hardcoded UI strings from components into translation keys
- Start with the highest-traffic screens: Login, Dashboard, Attendance, Claims

### Phase 5: Developer Experience & Deployment (Priority: High)

**5.1 Docker setup**
- Create `Dockerfile` (multi-stage: deps → build → production)
- Create `docker-compose.yml` with services: `app` (Next.js), `api` (Laravel placeholder/stub), `db` (PostgreSQL)
- Create `.dockerignore`

**5.2 API contract documentation**
- Create `docs/api-contract.md` documenting every endpoint the frontend calls through the BFF proxy
- Include request/response shapes (can be derived from the Zod schemas in `src/shared/lib/validators/` and the API client files)
- This is critical for buyers who want to swap out the Laravel backend

**5.3 Demo mode**
- Create `src/config/demo.config.ts` with `NEXT_PUBLIC_DEMO_MODE=true` flag
- When enabled, API calls return mock data from existing `src/features/*/data/mockData.ts` files instead of hitting the backend
- This lets buyers see the full UI without setting up Laravel
- Add a "Demo Mode" banner component

**5.4 Improve README**
- Add screenshots/GIFs of key flows (attendance check-in, claim submission, approval)
- Add architecture diagram (BFF proxy flow)
- Add "Quick Start" with Docker one-liner
- Add "Customization Guide" section

### Phase 6: PWA & Mobile Optimization (Priority: Medium)

**6.1 PWA setup**
- Install and configure `next-pwa`
- Create `public/manifest.json` with app name from config
- Add service worker for offline caching of static assets
- Add install prompt component for mobile users
- This is important because attendance + claims are mobile-first workflows

### Phase 7: Packaging & Legal (Priority: Medium)

**7.1 License**
- Create `LICENSE` file (recommend MIT or a commercial template license)
- Update README.md placeholder `[Your License Here]`

**7.2 Changelog**
- Create `CHANGELOG.md` with initial release notes

**7.3 .env.example cleanup**
- Ensure all new env vars (Google OAuth, Microsoft OAuth, demo mode, feature flags) are documented in `.env.example`

---

## Rules

1. **Never break the BFF pattern** — all new auth providers and API routes must go through the Next.js server. The browser must never hold a raw Bearer token or call Laravel directly.

2. **Feature module pattern is law** — all new feature code (Leave, etc.) goes in `src/features/<name>/` with the standard `hooks/`, `components/`, `lib/`, `types/`, `stores/` structure. No dumping logic in `src/app/` route files.

3. **Role constants from one source** — every role string comparison must use `src/shared/constants/roles.ts`. No new hardcoded role strings, and all existing ones must be migrated.

4. **Config over code** — anything a buyer would want to customize (app name, logo, enabled modules, auth providers, locale) must be changeable from config files, not by editing component internals.

5. **No regressions on existing modules** — Claims and Attendance are the two most mature and valuable modules. Changes to shared code (auth, RBAC, API client, middleware) must not break them. Run `pnpm lint` and manual smoke-test after every phase.

6. **snake_case ↔ camelCase boundary stays at the Axios interceptor** — all new API client code uses camelCase internally. The interceptors in `src/shared/lib/api-client/axios.ts` handle transformation. Do not add manual case conversion elsewhere.

7. **Translation keys are namespaced by feature** — i18n keys follow `feature.component.key` pattern (e.g., `attendance.checkIn.submitButton`). No flat global namespace.

8. **Mock data stays in `data/` directories** — demo mode reads from existing `mockData.ts` files within each feature. Do not scatter mock data across hooks or components.

9. **Environment variables follow Next.js convention** — client-accessible vars use `NEXT_PUBLIC_` prefix. Server-only secrets (OAuth client secrets, BFF secret) never get the prefix.

10. **Mobile-first responsive** — all new UI must be usable on 375px viewport width. The app already uses `BottomNav` on mobile; new features must integrate with it.