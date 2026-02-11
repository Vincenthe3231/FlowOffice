# Frontend Implementation Plan

This plan outlines the phased implementation of the BeLive FlowOffice frontend, a Next.js 16+ application integrating with Lark, Laravel, and Supabase. The project uses a flat structure with feature modules organized under `src/features/` and shared utilities under `src/shared/`, following Next.js best practices.

---

## Phase 1: Project Setup and Foundation

**Goal:** Establish a properly configured Next.js 16+ application with TypeScript, Tailwind CSS, and essential tooling.

**Status:** ✅ Completed

### 1.1 Initialize Next.js Application

- Created Next.js app using `create-next-app` with TypeScript, Tailwind CSS, ESLint, and the App Router enabled
- Selected `src/` directory option for cleaner separation
- Configured development server on port 3000

### 1.2 Configure TypeScript Strictly

- Enabled strict mode in `tsconfig.json`
- Configured path aliases for clean imports:
  - `@/*` pointing to `./src/*`
  - `@/features/*` pointing to `./src/features/*`
  - `@/shared/*` pointing to `./src/shared/*`
  - `@/components/*` pointing to `./src/components/*`

### 1.3 Establish Directory Structure

Created the project folder structure:

```
Belive-FO-Client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public routes
│   │   │   ├── layout.tsx
│   │   │   └── login/         # Login page
│   │   │       ├── page.tsx
│   │   │       └── _components/
│   │   │           ├── AuthLogin.tsx
│   │   │           ├── SocialButtons.tsx
│   │   │           ├── LeftSidebar.tsx
│   │   │           └── LarkSuiteButton.tsx
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/            # Shared UI components
│   │   ├── shared/           # App-specific components
│   │   │   └── FullLogo.tsx
│   │   └── ui/               # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── checkbox.tsx
│   ├── features/             # Feature modules
│   │   ├── attendance/       # Attendance management (planned)
│   │   │   └── index.ts
│   │   ├── leave/            # Leave requests (planned)
│   │   │   └── index.ts
│   │   ├── claims/           # Expense claims (planned)
│   │   │   └── index.ts
│   │   └── lark-sdk/         # Lark integration (planned)
│   │       └── index.ts
│   ├── shared/               # Shared utilities
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useHydration.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── index.ts
│   │   ├── lib/              # Utility functions
│   │   │   ├── api-client/   # API clients
│   │   │   │   ├── axios-instance.ts
│   │   │   │   ├── laravel-client.ts
│   │   │   │   ├── supabase-client.ts
│   │   │   │   ├── interceptors.ts
│   │   │   │   └── index.ts
│   │   │   ├── supabase/     # Supabase utilities
│   │   │   │   └── client.ts
│   │   │   ├── validation/   # Zod schemas
│   │   │   │   ├── common.schemas.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── index.ts
│   │   │   ├── event-bus.ts  # Event bus (placeholder)
│   │   │   ├── permissions.ts
│   │   │   ├── rbac.ts
│   │   │   └── transform.ts
│   │   ├── stores/           # Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   └── ui-store.ts
│   │   ├── types/            # TypeScript types
│   │   │   ├── api.types.ts
│   │   │   ├── permissions.ts
│   │   │   ├── roles.ts
│   │   │   └── index.ts
│   │   └── index.ts          # Public API exports
│   └── lib/                  # Core utilities
│       └── utils.ts         # shadcn/ui utilities
├── public/                   # Static assets
│   └── images/              # Images (logos, backgrounds, icons)
├── docs/                     # Documentation
├── package.json
├── tsconfig.json
├── next.config.ts
└── turbo.json                # Turborepo config (for build caching)
```

### 1.4 Configure ESLint

- Set up ESLint configuration following Next.js recommendations
- Configured import sorting rules for consistency

### 1.5 Install Core Dependencies

**Root dependencies:**
- **State Management:** TanStack Query, Zustand
- **Forms:** react-hook-form, @hookform/resolvers, Zod
- **UI:** shadcn/ui (initialized), lucide-react
- **Supabase:** @supabase/supabase-js
- **HTTP Client:** Axios
- **Build Tools:** Turborepo (for build caching)

### 1.6 Set Up Environment Variables

- Created `.env` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_SUPABASE_SECRET`
  - `NEXT_SUPABASE_JWT_SECRET`
  - `NEXT_PUBLIC_LARAVEL_API_URL`
  - `BFF_INTERNAL_SECRET`
  - `NEXT_PUBLIC_LARK_APP_ID`
  - `NEXT_PUBLIC_LARK_REDIRECT_URI`

**Success Criteria:**

- ✅ Next.js app runs with `pnpm dev` without errors
- ✅ TypeScript compiles with no errors in strict mode
- ✅ Path aliases work correctly (`@/shared/`, `@/features/`, `@/components/`)
- ✅ shadcn/ui components render properly
- ✅ Login page with Lark OAuth button implemented

---

## Phase 2: Authentication Infrastructure

**Goal:** Implement Lark OAuth flow and token management following Next.js patterns.

**Status:** 🟡 Partially Completed (Login page UI done, OAuth callback pending)

### 2.1 Create Lark SDK TypeScript Declarations

- Create `src/features/lark-sdk/index.ts` with TypeScript interfaces for `window.tt` global object
- Include types for `getLocation`, `chooseImage`, `getWifiStatus`
- Create a wrapper module with availability checks
- Export from `src/features/lark-sdk/index.ts` for use in other features

### 2.2 Implement Auth Store (Zustand)

- ✅ Created `src/shared/stores/auth-store.ts`
- ✅ Store `apiToken`, `supabaseToken`, and `user` object
- ✅ Use `persist` middleware with `partialize` to only persist tokens
- ✅ Implement `setTokens`, `logout`, and `isAuthenticated` methods
- ✅ Export from `src/shared/index.ts` for use in app and other features

### 2.3 Build Lark OAuth Flow

- Create `src/lib/auth/lark-auth.ts` with `loginWithLark(code)` function (planned)
- Exchange Lark authorization code with Laravel backend
- Parse response containing both `api_token` and `supabase_token`
- Use auth store from `@/shared` to store tokens

### 2.4 Create Auth Callback Page

- Implement `src/app/auth/callback/page.tsx` as a Client Component (planned)
- Extract `code` from URL search params
- Call `loginWithLark`, store tokens using auth store from `@/shared`, and redirect to dashboard

### 2.5 Implement Next.js Middleware for Route Protection

- Create `src/middleware.ts` at app root (planned)
- Check for auth token in cookies/localStorage
- Redirect unauthenticated users to `/login`
- Configure matcher to exclude public routes (`/login`, `/auth/*`, `/_next/*`)

### 2.6 Handle Hydration Safety for Auth State

- ✅ Created `useHydration` hook in `src/shared/hooks/useHydration.ts`
- ✅ Export from `src/shared/index.ts`
- Wrap auth-dependent components with hydration guards (planned)
- Use skeleton loaders during hydration to prevent mismatches

### 2.7 Login Page Implementation

- ✅ Created `src/app/(public)/login/page.tsx` with side-layout design
- ✅ Implemented `SocialButtons` component with Lark OAuth button (uses Lark.png icon)
- ✅ Implemented `AuthLogin` component with username/password form
- ✅ Implemented `LeftSidebar` component with auth background image
- ✅ Implemented `FullLogo` component with FlowOffice branding and Lark icon

**Success Criteria:**

- ✅ Login page UI implemented with Lark OAuth button
- ✅ Auth store created and configured
- ✅ Hydration hook implemented
- ⏳ Lark OAuth redirect callback (planned)
- ⏳ Tokens stored and persisted across page refreshes (planned)
- ⏳ Protected routes redirect to login when unauthenticated (planned)
- ⏳ No hydration mismatch errors in console (planned)

---

## Phase 3: Shared Infrastructure

**Goal:** Build the shared infrastructure that all feature modules depend on.

**Status:** 🟡 Partially Completed

### 3.1 Set Up Shared Module

- ✅ Created `src/shared/` directory structure
- ✅ Created `src/shared/index.ts` to export public API
- ✅ Dependencies installed: Zustand, @supabase/supabase-js, @tanstack/react-query, Axios

### 3.2 Create Event Bus for Module Communication

- ✅ Created `src/shared/lib/event-bus.ts` (currently a placeholder)
- ⏳ Implement typed event subscriptions with `on(event, callback)`
- ⏳ Implement event emission with `emit(event, payload)`
- ⏳ Return unsubscribe functions for cleanup
- ✅ Export from `src/shared/index.ts`

### 3.3 Build Laravel API Client

- ✅ Created `src/shared/lib/api-client/` directory
- ✅ Created `src/shared/lib/api-client/laravel-client.ts` with Axios-based client
- ✅ Created `src/shared/lib/api-client/axios-instance.ts` and `interceptors.ts`
- ✅ Implement `get`, `post`, `put`, `delete` methods
- ✅ Automatically attach `Authorization` header from auth store
- ✅ Handle common error responses (401, 403, 500)
- ✅ Export from `src/shared/index.ts`

### 3.4 Configure TanStack Query

- ⏳ Create `src/shared/lib/api-client/query-client.ts` with sensible defaults (planned)
- ⏳ Set `staleTime` for caching strategy
- ⏳ Configure global error handler for 401 redirects
- ⏳ Use in `src/app/layout.tsx` to wrap app with `QueryClientProvider`

### 3.5 Create Supabase Client Factory

- ✅ Created `src/shared/lib/supabase/client.ts` with `getSupabaseClient()` function
- ✅ Initialize client with Supabase JWT from auth store
- ✅ Set `persistSession: false` (Laravel manages auth)
- ⏳ Reset client when user logs out (subscribe to auth store changes)
- ✅ Export from `src/shared/index.ts`

### 3.6 Build Realtime Subscription Hook

- ⏳ Create `src/shared/hooks/useSupabaseRealtime.ts` (planned)
- ⏳ Accept table, event type, optional filter, and callback
- ⏳ Handle channel subscription and cleanup in useEffect
- ⏳ Integrate with TanStack Query for cache updates
- ⏳ Export from `src/shared/index.ts`

### 3.7 Create Supabase Storage Helpers

- ⏳ Implement `src/shared/lib/supabase/storage.ts` with upload/download/delete functions (planned)
- ⏳ Support signed URL generation for secure access
- ⏳ Handle error cases gracefully
- ⏳ Export from `src/shared/index.ts`

### 3.8 Set Up UI Store for Global Preferences

- ✅ Created `src/shared/stores/ui-store.ts`
- ✅ Manage sidebar state, theme, and language
- ✅ Use `persist` middleware with hydration guards
- ✅ Export from `src/shared/index.ts`

### 3.9 Build Shared UI Components

- ✅ Added essential shadcn/ui components to `src/components/ui/` (Button, Input, Label, Checkbox)
- ⏳ Create app shell layout components (AppShell, Navigation, Sidebar) in `src/shared/components/layout/` (planned)
- ⏳ Implement ErrorBoundary component for graceful error handling (planned)

**Success Criteria:**

- ✅ API client successfully calls Laravel endpoints
- ✅ UI store persists preferences without hydration errors
- ✅ Supabase client factory created
- ⏳ Event bus correctly publishes and subscribes to events (placeholder exists)
- ⏳ TanStack Query caches and refetches data correctly (planned)
- ⏳ Supabase Realtime subscriptions receive updates (planned)

---

## Phase 4: App Router Structure and Layouts

**Goal:** Set up the Next.js App Router with proper layouts following best practices.

**Status:** 🟡 Partially Completed

### 4.1 Create Root Layout

- ✅ Implemented `src/app/layout.tsx` with HTML structure
- ⏳ Include Lark JS SDK script in head (planned)
- ⏳ Wrap children with `QueryClientProvider` from `@/shared` (planned)
- ✅ Set up font loading with `next/font` (Geist fonts)
- ✅ Configure metadata for SEO

### 4.2 Create Route Groups

- ✅ Set up `(public)` route group in `src/app/(public)/` for login and public pages
- ✅ Created `src/app/(public)/layout.tsx` with minimal layout
- ⏳ Set up `(authenticated)` route group in `src/app/(authenticated)/` for protected pages (planned)
- ⏳ Each group gets its own layout for different UI shells (planned)

### 4.3 Implement Authenticated Layout

- ⏳ Create `src/app/(authenticated)/layout.tsx` (planned)
- ⏳ Import and use AppShell, Navigation, and Sidebar components from `@/shared` (planned)
- ⏳ Initialize global Supabase Realtime listeners here (planned)
- ⏳ Handle auth checking and redirects using auth store from `@/shared` (planned)

### 4.4 Create Loading and Error States

- ⏳ Add `loading.tsx` files for route-level loading UI (planned)
- ⏳ Add `error.tsx` files for route-level error boundaries (planned)
- ⏳ Create `not-found.tsx` for 404 handling (planned)
- ⏳ Use React Suspense boundaries where appropriate (planned)

### 4.5 Configure Server Components vs Client Components

- ✅ Default to Server Components for pages
- ✅ Mark interactive components with `'use client'` directive (SocialButtons, AuthLogin, etc.)
- ✅ Import feature components from `@/features/*` and shared from `@/shared/*`
- ⏳ Identify data fetching patterns (server vs client) (planned)
- ⏳ Plan component composition to minimize client bundle (planned)

**Success Criteria:**

- ✅ Route groups correctly apply different layouts (public group done)
- ✅ Server and Client Components work together without issues
- ⏳ Loading states appear during navigation (planned)
- ⏳ Error boundaries catch and display errors gracefully (planned)

---

## Phase 5: Attendance Feature (First Feature Module)

**Goal:** Build the first complete feature module as a vertical slice.

**Status:** ⏳ Planned

### 5.1 Create Feature Structure

- ✅ Created `src/features/attendance/` directory
- ✅ Created `src/features/attendance/index.ts` (placeholder)
- ⏳ Add dependency on `@/shared` for API client and hooks
- ⏳ Add dependency on `@/features/lark-sdk` for GPS functionality
- ⏳ Set up TypeScript configuration (uses root config)

Create `src/features/attendance/` with:

- `api/` - Feature API layer (attendance-api.ts)
- `components/` - Feature UI components
- `hooks/` - Business logic hooks
- `types/` - TypeScript definitions
- `events/` - Event definitions for module communication
- `index.ts` - Public API exports

### 5.2 Define Feature Types

- ⏳ Create attendance types in `src/features/attendance/types/index.ts` (Attendance, ClockInData, AttendanceStats)
- ⏳ Define event payload types (AttendanceClockedInPayload)
- ⏳ Export only public types from `src/features/attendance/index.ts`

### 5.3 Implement Feature API Layer

- ⏳ Create `src/features/attendance/api/attendance-api.ts` with `attendanceApi` object
- ⏳ Methods: `clockIn`, `clockOut`, `getList`, `getStats`
- ⏳ Use Laravel API client from `@/shared/lib/api-client`
- ⏳ Export from `src/features/attendance/index.ts`

### 5.4 Build TanStack Query Hooks

- ⏳ Create `src/features/attendance/hooks/useAttendanceList.ts` - Fetch attendance records
- ⏳ Create `src/features/attendance/hooks/useClockIn.ts` - Mutation for clocking in (integrates Lark SDK for GPS)
- ⏳ Create `src/features/attendance/hooks/useClockOut.ts` - Mutation for clocking out
- ⏳ Implement optimistic updates for better UX
- ⏳ Export all hooks from `src/features/attendance/index.ts`

### 5.5 Create Realtime Subscription Hook

- ⏳ Create `src/features/attendance/hooks/useAttendanceRealtime.ts`
- ⏳ Subscribe to attendance table changes using `useSupabaseRealtime` from `@/shared`
- ⏳ Filter by current user ID
- ⏳ Update TanStack Query cache on INSERT/UPDATE events
- ⏳ Export from `src/features/attendance/index.ts`

### 5.6 Build Feature Components

- ⏳ Create `src/features/attendance/components/ClockInButton.tsx` - Handles clock-in flow with GPS
- ⏳ Create `src/features/attendance/components/AttendanceList.tsx` - Displays attendance records
- ⏳ Create `src/features/attendance/components/AttendanceCard.tsx` - Individual record display (private, not exported)
- ⏳ Keep internal components private, export only public ones from `src/features/attendance/index.ts`

### 5.7 Create Attendance Page

- ⏳ Create `src/app/(authenticated)/attendance/page.tsx` - Main attendance page
- ⏳ Import components and hooks from `@/features/attendance`
- ⏳ Compose components from feature's public API
- ⏳ Keep page thin (routing and composition only)

### 5.8 Wire Up Event Publishing

- ⏳ Publish `CLOCKED_IN` event on successful clock-in using event bus from `@/shared`
- ⏳ Publish `CLOCKED_OUT` event on successful clock-out
- ⏳ Allow other features to react to attendance changes via event bus

**Success Criteria:**

- Clock-in with GPS works when running in Lark
- Realtime updates appear without page refresh
- Attendance list displays correctly
- Events are published and can be subscribed to

---

## Phase 6: Leave and Claim Features

**Goal:** Build remaining feature modules following the same pattern.

**Status:** ⏳ Planned

### 6.1 Leave Feature Structure

- ✅ Created `src/features/leave/` directory
- ✅ Created `src/features/leave/index.ts` (placeholder)
- ⏳ Add dependencies: `@/shared`
- ⏳ Set up TypeScript configuration (uses root config)

Create `src/features/leave/` following same structure:

- Types: Leave, LeaveRequest, LeaveBalance in `src/features/leave/types/`
- API: submitLeave, getLeaveList, getLeaveBalance in `src/features/leave/api/`
- Hooks: useSubmitLeave, useLeaveList, useLeaveBalance, useLeaveRealtime in `src/features/leave/hooks/`
- Components: LeaveRequestForm, LeaveList, LeaveBalanceWidget in `src/features/leave/components/`
- Export all public APIs from `src/features/leave/index.ts`
- Listeners: Subscribe to attendance events for eligibility updates using event bus from `@/shared`

### 6.2 Claim Feature Structure

- ✅ Created `src/features/claims/` directory
- ✅ Created `src/features/claims/index.ts` (placeholder)
- ⏳ Add dependencies: `@/shared`, `@/features/lark-sdk`
- ⏳ Set up TypeScript configuration (uses root config)

Create `src/features/claims/` following same structure:

- Types: Claim, ClaimReceipt in `src/features/claims/types/`
- API: submitClaim, getClaimsList, uploadReceipt in `src/features/claims/api/`
- Hooks: useSubmitClaim, useClaimsList, useUploadReceipt in `src/features/claims/hooks/`
- Components: ClaimForm, ClaimsList, ReceiptUploader in `src/features/claims/components/`
- Export all public APIs from `src/features/claims/index.ts`
- Integrate Lark SDK from `@/features/lark-sdk` for camera capture
- Use Supabase Storage helpers from `@/shared` for receipt uploads

### 6.3 Cross-Feature Communication

- Leave feature listens to attendance `CLOCKED_IN` events via event bus from `@/shared`
- Refresh leave eligibility when user clocks in
- Use event bus for communication, not direct feature imports
- Features remain independent and can be developed in separate branches

### 6.4 Create Feature Pages

- ⏳ Create `src/app/(authenticated)/leave/page.tsx`
- ⏳ Create `src/app/(authenticated)/claims/page.tsx`
- ⏳ Import components and hooks from `@/features/leave` and `@/features/claims`
- ⏳ Keep pages thin, compose from feature public APIs

**Success Criteria:**

- ⏳ Each feature is self-contained and independently testable (planned)
- ⏳ Cross-feature communication works via event bus (planned)
- ⏳ No direct imports between feature internals (features communicate via public APIs) (planned)
- ⏳ All pages render correctly (planned)

---

## Phase 7: Polish and Production Readiness

**Goal:** Prepare the application for production deployment.

### 7.1 Error Handling and Edge Cases

- Implement proper error boundaries at package level
- Handle Lark SDK unavailability (desktop browser fallback) in `@belive/lark-sdk` package
- Handle offline scenarios gracefully
- Add retry logic for failed API calls in `@belive/shared` API client

### 7.2 Performance Optimization

- Implement code splitting per package using dynamic imports: `dynamic(() => import('@belive/attendance'))`
- Optimize images with `next/image`
- Configure caching headers for static assets in Next.js config
- Analyze bundle size and reduce where possible
- Leverage Turborepo caching for faster builds

### 7.3 Accessibility Audit

- Ensure all interactive elements are keyboard accessible
- Verify color contrast ratios
- Add proper ARIA labels where needed
- Test with screen readers

### 7.4 Testing Setup

- Configure Jest and React Testing Library at root level
- Write unit tests for critical hooks in each package
- Write integration tests for package flows
- Test package boundaries through package.json dependencies (no need for ESLint boundary enforcement)

### 7.5 Production Configuration

- Configure environment variables for production in `apps/belive-fo/.env.production`
- Set up proper CSP headers in Next.js config
- Configure CORS handling for API calls
- Set up monitoring and error tracking (optional: Sentry)
- Configure Turborepo for production builds

### 7.6 Documentation

- Document package public APIs in each package's README
- Create developer setup guide for monorepo
- Document environment variable requirements
- Document package development workflow and feature branch strategy
- Add inline comments for complex logic

**Success Criteria:**

- Application runs without console errors
- Lighthouse score above 90 for Performance
- All critical paths have test coverage
- Documentation is complete and accurate

---

## Implementation Timeline

```mermaid
gantt
    title Frontend Implementation Phases
    dateFormat  YYYY-MM-DD
    section Phase1
    Project Setup           :p1, 2026-02-10, 3d
    section Phase2
    Auth Infrastructure     :p2, after p1, 4d
    section Phase3
    Shared Package         :p3, after p2, 5d
    section Phase4
    App Router Structure   :p4, after p3, 3d
    section Phase5
    Attendance Package     :p5, after p4, 5d
    section Phase6
    Leave and Claim       :p6, after p5, 7d
    section Phase7
    Polish and Production  :p7, after p6, 5d
```

---

## Key Next.js Best Practices Applied

1. **App Router First** - Using the modern App Router with Server Components by default
2. **Thin Pages** - Pages are composition layers, logic lives in feature modules
3. **Server Components by Default** - Only marking interactive parts as Client Components
4. **Proper Loading/Error States** - Using file-based loading.tsx and error.tsx (planned)
5. **Middleware for Auth** - Centralized route protection at the edge (planned)
6. **Environment Variables** - Proper separation of public vs server-only variables
7. **TypeScript Strict Mode** - Catching errors at compile time
8. **Path Aliases** - Clean imports using Next.js pattern:
   - `@/*` → `./src/*`
   - `@/features/*` → `./src/features/*`
   - `@/shared/*` → `./src/shared/*`
   - `@/components/*` → `./src/components/*`
9. **Feature Module Structure** - Features organized under `src/features/` for independent development
10. **Shared Utilities** - Common code in `src/shared/` for reuse across features
11. **Standard Next.js Structure** - Following Next.js conventions with `src/app/`, `src/components/`, `src/lib/` directories

