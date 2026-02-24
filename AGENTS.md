# AGENTS.md - Belive-FO-Client

## Purpose
Operational guide for coding agents working in this repository.

## Repository facts
- Framework: Next.js 16+, React 19, TypeScript, Tailwind.
- Architecture: Flat `src/` structure (not monorepo).
- Branding: FlowOffice + Lark icon.
- Current public route implemented: login flow under `src/app/(public)/login`.

## Required workflow
1. Read relevant files before editing.
2. Make smallest viable change.
3. Keep one concern per edit batch.
4. Run lint/verification on touched files.
5. Update related docs when behavior/architecture/paths change.
6. Report:
   - files changed
   - behavior impact
   - verification status
   - follow-up risks/todos

## File placement rules
- New routes/layouts -> `src/app/...`
- Feature logic -> `src/features/<feature>/...`
- Shared cross-feature logic -> `src/shared/...`
- Reusable UI primitives -> `src/components/ui/...`
- App-specific shared components -> `src/components/shared/...`

## Prohibited without explicit request
- Introducing monorepo package layout (`apps/`, `packages/`).
- Renaming branding away from FlowOffice.
- Replacing Lark login icon/path conventions.
- Large refactors unrelated to user request.

## Authentication and integrations
- Auth: Laravel Sanctum Bearer token stored in httpOnly cookie; Next.js proxy sends `Authorization: Bearer` to Laravel. No client-side token; no CSRF for API. Env: `NEXT_PUBLIC_LARAVEL_API_URL` (server-only), `AUTH_COOKIE_NAME` (optional).
- Treat event bus as placeholder until fully implemented.
- If building auth flow pieces, align with current env names and existing login UX.
- Use existing env variable naming conventions already in repo.

## MCP Tool Utilization
- **Next.js Inspection:** Always use the `next-devtools-mcp` (or equivalent) to verify route segments and component tree before suggesting layout changes.
- **Runtime Debugging:** If a bug occurs during hydration or server-side rendering, use the available MCP tools to inspect runtime logs rather than guessing via code analysis alone.
- **State Verification:** Use MCP tools to verify current state/props in the browser if a UI element is not behaving as expected.

## Docs policy
When updating architecture/login/auth/shared paths, update:
- `README.md`
- `docs/README.md`
- `docs/01-overview.md`
- `docs/02-implementation-plan.md`
- `docs/03-complete-guide.md`

## Definition of Done (DoD)
- Code follows `src/features` pattern.
- Linting passes via `npm run lint`.
- No new environment variables added without updating `.env.example`.
- All `docs/` files listed in "Docs policy" are updated if paths changed.
- Call `next-devtools-mcp` for in-depth error verification and validation, only **No errors found** is considered passed.