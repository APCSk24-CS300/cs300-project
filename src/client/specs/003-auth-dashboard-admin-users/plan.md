# Implementation Plan: Role-Based Dashboard Shell, Authentication, and Administrator Account Registration

**Branch**: `003-auth-dashboard-admin-users` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `src/client/specs/003-auth-dashboard-admin-users/spec.md`

## Summary

The feature delivers:
- UC-01 log in and UC-02 log out end to end, with all listed alternative flows;
- a first-sign-in password change;
- one shared role-aware app shell with draft dashboards for student, manager and administrator, plus full role navigation with "Coming soon" items;
- the administrator account list and single-account creation with review, generated temporary password and result (UC-29 subset).

The approach:
- **One transport**: every call goes through `@/libs/api-client`, typed from `openapi.yaml` via `openapi-typescript`. Contract gaps are typed separately and tagged.
- **One mock at the network layer**: MSW, running in the browser in mock mode and in Node in tests. It is backed by a versioned `localStorage` store, so admin-created accounts can sign in after reloads.
- **Mode switch**: `NEXT_PUBLIC_API_MODE=mock|real` plus `NEXT_PUBLIC_API_BASE_URL`.
- **Session mirrors `src/server`**: a bearer JWT returned in the body, kept in `localStorage` and sent only as `Authorization: Bearer` to the API. A separate non-sensitive hint cookie (role, password-change mark, expiry) is the only thing the route guard reads.
- **Route guards are cosmetic**: they live in `src/proxy.ts` (which must move from the client root to be loaded by Next 16) and in the protected layout, while the API enforces access.

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 (App Router, `proxy.ts` convention, Node runtime)

**Primary Dependencies**: existing `next`, `react`, `react-hook-form` 7, `zod` 4, `@hookform/resolvers`, `jose` 6, `tailwindcss` 4. New dev-only dependencies: `msw` ^2.7 and `openapi-typescript` ^7 (research R14).

**Storage**:
- Client: `localStorage` key `myhcmus:token` (bearer token, never a cookie) and cookie `myhcmus_session` (non-sensitive role/expiry hint for the route guard).
- Mock: `localStorage` key `myhcmus:mock-db:v1`.
- There is no server-side storage in the client.

**Testing**: Vitest 3 + Testing Library + jsdom + `msw/node` + `axe-core` (existing setup in `tests/setup.ts`).

**Target Platform**: evergreen desktop and mobile browsers. The Next dev/prod server only hosts pages and proxy.

**Project Type**: web frontend (single Next.js app in `src/client/`).

**Performance Goals**: sign-in → dashboard and confirm → result in under 3 s (NFR-PER-01, SC-007). Mock latency of 150–300 ms keeps loading states observable.

**Constraints**:
- Code only in `src/client/`.
- Contract-first: no invented fields. Gaps live in `openapi-gaps.ts`, tagged with GAP IDs.
- In mock mode, data must be fetched client-side, because MSW in the browser can't intercept Server Component fetches.
- No hard-coded colors.
- WCAG 2.1 AA.

**Scale/Scope**: 8 routes, about 12 new shared components, 3 features touched (`auth`, `dashboard`, `admin-users`), 9 API operations (6 contract, 3 partly gap).

No NEEDS CLARIFICATION items remain; research R1–R14 resolves all of them.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Two constitutions apply, both at v1.1.0: the repository-level one (`.specify/memory/constitution.md`, principles R-I…R-VI) and the client one (`src/client/.specify/memory/constitution.md`, principles C-I…C-VIII).

| Principle | Check | Pre-design | Post-design |
|---|---|---|---|
| R-I Client-only scope | Every created or changed path is under `src/client/`. `docs/` and `src/server/` are only read (`gen:api` reads `docs/api/openapi.yaml`). | ✅ | ✅ |
| R-II Traceability | Every route and operation maps to a UC and an endpoint ([api-operations.md](./contracts/api-operations.md), [ui-routes-and-components.md](./contracts/ui-routes-and-components.md)). Login, logout, `initialPassword`, `mustChangePassword`, the nullable role, `ACCOUNT_DISABLED` and the login error codes are not in the contract. They are recorded as gaps (spec GAP-A/B/C/M/N/O), typed separately, served only by the mock (allowed by R-II v1.1.0), and proposed to the docs owners in [docs-changes.md](./docs-changes.md). | ✅ | ✅ |
| R-III Single role | `RoleCode` is one value; `admin` is renamed to `administrator`; `role: null` is treated as A6; the role array in the create request is rejected (A11). | ✅ | ✅ |
| R-IV Server enforces | proxy and `RequireSession` only redirect; 401/403 from the API are always honored; the mock enforces role, `mustChangePassword` and revocation server-side. | ✅ | ✅ |
| R-V Loading/empty/error | State matrix in the UI contract §6; shared `LoadingState`/`EmptyState`/`ErrorState`/`Alert`. | ✅ | ✅ |
| R-VI Consistency | One shell, one nav model, one error→message map, one form-field primitive set, one API client. | ✅ | ✅ |
| C-I App Router + TS strict | Routes under `src/app` `(public)`/`(protected)`; no `any`; `"use client"` only for interactive parts. | ✅ | ✅ |
| C-II Feature-first | `features/auth`, `features/dashboard`, `features/admin-users` with `components/hooks/services/types/mappers`; routes stay thin; cross-feature code lives only in `libs/`, `hooks/` and `components/`. 403 handling is in the shared `src/hooks/useForbidden.ts` and `components/layout/ForbiddenView.tsx` (analysis C2), and no feature imports another's internals. | ✅ | ✅ |
| C-III Single API client | `@/libs/api-client` is extended in place (R5); MSW intercepts below it; no direct `fetch` elsewhere. | ✅ | ✅ |
| C-IV Service contracts with real and mock implementations (v1.1.0) | Each feature keeps a TS `interface` with a real implementation. The mock is MSW handlers following `openapi.yaml`, which C-IV v1.1.0 accepts. Switching is `NEXT_PUBLIC_API_MODE` only, and mock code loads only via `MockProvider`. | ✅ (after amendment) | ✅ |
| C-V DTO / domain mappers | DTOs from `openapi.gen.ts`/`openapi-gaps.ts`; mappers `toCurrentUser`, `toAccountSummary`, `toCreateUserRequest`, `toRolePermissions`, `toFaculty` (analysis C3). Services return domain types only, e.g. `listFaculties(): Faculty[]`. | ✅ | ✅ |
| C-VI Tokens + layering | New tokens in `globals.css`; primitives in `components/ui`; shell in `components/layout`; the sign-in page's raw hex values and the hard-coded colors in the existing `ErrorState`/`EmptyState` are replaced (analysis M1). | ✅ | ✅ |
| C-VII Four data states | As R-V. | ✅ | ✅ |
| C-VIII Accessibility | Menu-button, drawer, nav, dialog, field-error associations; axe tests per screen (SC-010). | ✅ | ✅ |
| C-Constraints: dependencies justified | `msw` and `openapi-typescript` are justified in research R14, and both are dev-only. | ✅ | ✅ |
| C-Constraints: no restructuring for preference | The `proxy.ts` move is a correctness fix (R7). `LoginForm` moves to `features/auth/components` because it holds auth logic (C-II); `components/forms` keeps any generic form pieces. | ✅ | ✅ |

**Gate result**: PASS. The C-IV deviation was resolved by the constitution amendment (v1.1.0), and the R-II gaps are allowed by R-II v1.1.0. Analysis findings C2 and C3 are designed out (see the rows above). One accepted trade-off remains, listed under Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
src/client/specs/003-auth-dashboard-admin-users/
├── spec.md
├── plan.md                      # this file
├── research.md                  # Phase 0
├── data-model.md                # Phase 1
├── quickstart.md                # Phase 1
├── contracts/
│   ├── api-operations.md        # operations used, contract vs gap, error branching
│   ├── mock-api.md              # MSW handler rules, seeds, failure switch
│   └── ui-routes-and-components.md  # routes, guard rules, shared components, state matrix
├── checklists/requirements.md
├── docs-changes.md              # proposed changes to docs/ (API-GAP format); kept current during implement
└── tasks.md                     # Phase 2 (/speckit-tasks)
```

### Source Code (`src/client/`)

Legend: `+` new, `~` changed, `→` moved, `-` removed.

```text
src/client/
├── .env.example                         + NEXT_PUBLIC_API_MODE, NEXT_PUBLIC_API_BASE_URL
├── package.json                         ~ devDeps msw, openapi-typescript; scripts gen:api; "msw.workerDirectory": ["public"]
├── proxy.ts                             → src/proxy.ts (Next 16 loads proxy only beside app/)
├── public/mockServiceWorker.js          + generated by `npx msw init public`
├── src/
│   ├── proxy.ts                         ~ uses resolveRouteAccess + session hint; no-store on protected; typo + A7 fixed
│   ├── app/
│   │   ├── globals.css                  ~ new tokens (danger, info, border, page)
│   │   ├── (public)/login/page.tsx      ~ tokens, notices from ?reason
│   │   ├── (protected)/layout.tsx       + RequireSession + AppShell
│   │   ├── (protected)/change-password/page.tsx  +
│   │   ├── (protected)/forbidden/page.tsx        + (replaces app/forbidden)
│   │   ├── (protected)/student/dashboard/page.tsx ~ thin → RoleDashboard
│   │   ├── (protected)/manager/dashboard/page.tsx ~
│   │   ├── (protected)/admin/dashboard/page.tsx   ~
│   │   ├── (protected)/admin/users/page.tsx       +
│   │   ├── (protected)/admin/users/new/page.tsx   +
│   │   ├── forbidden/page.tsx           - (moved into the protected group)
│   │   ├── api/auth/login/route.ts      - (old ad-hoc mock; replaced by MSW)
│   │   └── test/page.tsx                (untouched)
│   ├── hooks/useForbidden.ts            + shared 403 handling (analysis C2)
│   ├── components/
│   │   ├── layout/ AppShell, AppHeader, AccountMenu, SideNav, PageHeader, ForbiddenView  +
│   │   ├── ui/ErrorState.tsx, EmptyState.tsx   ~ tokens instead of red-*/slate-* (analysis M1)
│   │   ├── ui/ FormField, TextInput, PasswordInput, Select, RadioGroup, Alert,
│   │   │      ConfirmDialog, DataTable, Pagination, LoadingState, CopyField,
│   │   │      ComingSoonBadge                                                 +
│   │   └── forms/LoginForm.tsx          → features/auth/components/LoginForm.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/ LoginForm ~, ChangePasswordForm +, RequireSession +, LogoutNotice +
│   │   │   ├── context/AuthContext.tsx  ~ CurrentUser, status machine (data-model §3.1)
│   │   │   ├── provider/AuthProvider.tsx ~ uses auth service via selection point; registers onUnauthorized
│   │   │   ├── services/auth.service.ts ~ interface AuthService + HttpAuthService (login, logout, me, changePassword)
│   │   │   ├── services/mock.auth.service.ts - (superseded by MSW; Complexity Tracking)
│   │   │   ├── schema/ login.schema.ts ~ (no role), change-password.schema.ts +
│   │   │   ├── mappers/current-user.mapper.ts +
│   │   │   └── types/ auth.dto.ts ~ (re-export gen + gaps), auth.ts ~ (CurrentUser)
│   │   ├── dashboard/                   + components/RoleDashboard…, config/dashboard-sections.ts
│   │   └── admin-users/                 + services/admin-users.service.ts (interface + Http impl),
│   │                                      hooks/useAsyncResource (shared read-hook core: derived loading, 'forbidden' status),
│   │                                      useAccountList, useCreateAccount, useRolePermissions, useFaculties,
│   │                                      mappers/, types/, schema/new-account.schema.ts,
│   │                                      lib/temporary-password.ts, components/…
│   ├── libs/
│   │   ├── api-client.ts                ~ base URL, bearer, ApiError, onUnauthorized, unwrap, headers
│   │   ├── error-messages.ts            + toUserMessage(code, context)
│   │   ├── roles.ts                     ~ administrator, ROLE_LABEL, ROLE_ROUTE_PREFIX
│   │   ├── navigation.ts                ~ NAVIGATION with status + ucId; getDashboardPath by id
│   │   ├── route-access.ts              + resolveRouteAccess (pure)
│   │   ├── session-hint.ts              + encode/decode/read/write hint cookie
│   │   ├── token-store.ts               + bearer token in localStorage (get/set/clear/subscribe)
│   │   ├── service-mode.ts              ~ NEXT_PUBLIC_API_MODE (+ legacy fallback)
│   │   └── session.ts                   - (server JWT verify no longer used; the hint is not a secret)
│   ├── mocks/                           +
│   │   ├── MockProvider.tsx, browser.ts, node.ts, dev-tools.ts (window.__myhcmusMock)
│   │   ├── handlers/ auth.ts, profile.ts, admin-users.ts, reference.ts, index.ts
│   │   ├── db/ store.ts, seed.ts, types.ts
│   │   └── utils/ envelope.ts, errors.ts, token.ts, latency.ts
│   ├── providers/provider.tsx           ~ MockProvider → AuthProvider
│   └── types/
│       ├── openapi.gen.ts               + generated
│       ├── openapi-gaps.ts              + GAP-A/B/C/M shapes
│       └── entities.ts                  ~ IDs as string (contract), RoleCode import unchanged
└── tests/
    ├── setup.ts                         ~ msw/node server lifecycle + resetMockDb
    └── (co-located *.test.ts(x) next to each module, as today)
```

**Structure Decision**: Keep the existing single Next.js app and its feature-first layout (C-II), as in `docs/analysis-and-design/fe/component-diagram-fe.md`. Add two features (`dashboard`, `admin-users`), expand `auth`, put shell chrome in `components/layout` and primitives in `components/ui`, and isolate all mock code under `src/mocks/` so it is loaded only through `MockProvider` when the mode is `mock`.

## Implementation phases (input to /speckit-tasks)

1. **Foundation**:
   - deps, `gen:api`, gap types;
   - `api-client` upgrade + `error-messages`;
   - `roles`/`navigation`/`route-access`/`token-store`/`session-hint`;
   - tokens;
   - mock store + handlers + `MockProvider`;
   - test setup.
2. **US1–US3 auth (P1)**:
   - auth service interface + Http impl, mapper, `AuthProvider` rewrite;
   - `LoginForm` (no role, A1–A7);
   - logout via `AccountMenu`;
   - `src/proxy.ts` + `RequireSession`;
   - `/forbidden`.
3. **US6 create account (P1)**: temporary-password generator, schema, wizard (form/review/result), permissions panel, faculties (`Faculty` domain type), and a minimal `/admin/users` page with the "Create account" button (analysis M2).
4. **US7 "Set a new password" (P2, moved directly after US6, analysis M3)**: `ChangePasswordForm`, guard rules 3/4, mock `PASSWORD_CHANGE_REQUIRED`. This makes the create → sign-in loop demoable right after US6.
5. **US4 shell + dashboards (P2)**: `SideNav` with "Coming soon", mobile drawer, `RoleDashboard` drafts, `/forbidden` page.
6. **US5 user list (P2)**: `DataTable`, `Pagination`, filters, empty/error; replaces the minimal list page.
7. **Polish**: axe checks per screen, remove the dead mock route/`session.ts`/`mock.auth.service.ts`, update `DEV_NOTES.md` and `docs-changes.md`, walk through the quickstart (including manual timing and the consistency review).

The minimal shell (header, account menu, `ForbiddenView`, `useForbidden`) is built in Foundational because US3 logout and every data view depend on it. US4 completes it.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| **Security trade-off (Q4/H1)**: the bearer token is in `localStorage`, so page scripts can read it (an XSS exposure). | It follows `src/server` exactly: the token is in the response body and accepted only in `Authorization: Bearer`, with no cookies. It also lets the browser mock work. | The BFF/httpOnly design was offered and declined by the user. The risk is limited by: the token is never in a cookie (so it is not sent to the Next origin), it is attached only to `NEXT_PUBLIC_API_BASE_URL`, it expires after 1 hour, the guard reads only a non-sensitive hint, and the server is the only enforcement point. |

The earlier rows for C-IV and R-II are removed: constitution v1.1.0 resolves both. All contract gaps are proposed to the docs owners in [docs-changes.md](./docs-changes.md).
