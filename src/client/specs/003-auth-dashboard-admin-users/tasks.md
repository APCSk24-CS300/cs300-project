---

description: "Task list for 003-auth-dashboard-admin-users"
---

# Tasks: Role-Based Dashboard Shell, Authentication, and Administrator Account Registration

**Input**: Design documents from `src/client/specs/003-auth-dashboard-admin-users/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md), [docs-changes.md](./docs-changes.md)

**Tests**: Included. Spec SC-003 requires a reproducible test for every listed alternative flow, and SC-010 requires accessibility checks. Write each story's tests first and confirm they fail before implementing.

**Organization**: Tasks are grouped by user story. Execution order is US1 → US2 → US3 → US6 → US7 → US4 → US5. US7 (P2) runs directly after US6 so the create → sign-in loop is demoable early (analysis M3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: the user story from spec.md (US1–US7)
- All paths are relative to the repository root. App code lives in `src/client/src/`, tests are co-located `*.test.ts(x)`, and shared test setup is in `src/client/tests/`.
- Run all commands from `src/client/`.

## Conventions every task must follow

- Read `src/client/node_modules/next/dist/docs/` for any Next.js API before using it (`src/client/AGENTS.md`).
- No hard-coded colors: use tokens from `src/client/src/app/globals.css`.
- No direct `fetch` outside `src/client/src/libs/api-client.ts`.
- Components consume domain types, never DTOs (C-V). Features never import another feature's internals (C-II); shared code goes in `src/client/src/libs/`, `src/client/src/hooks/` or `src/client/src/components/`.
- Use the role codes `student`, `manager` and `administrator` only. Never write `admin` as a role code, or "organizer".
- All user-facing error text comes from `toUserMessage()` in `src/client/src/libs/error-messages.ts`.
- The password-change screen is called **"Set a new password"** in every title, label, link and message.
- **Keep [docs-changes.md](./docs-changes.md) current.** Whenever implementation needs anything that differs from or adds to `docs/` (a field, code, behavior or wording), add or update a `DOC-xx` entry with status `proposed`. Never edit `docs/` itself.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, generated types, environment, design tokens.

- [X] T001 Update `src/client/package.json`:
  - add devDependencies `msw` (^2.7) and `openapi-typescript` (^7);
  - add the script `"gen:api": "openapi-typescript ../../docs/api/openapi.yaml -o src/types/openapi.gen.ts"`;
  - add the top-level field `"msw": { "workerDirectory": ["public"] }`;
  - run `npm install`.
- [X] T002 Run `npx msw init public --save` in `src/client/` to create `src/client/public/mockServiceWorker.js`, and commit it.
- [X] T003 [P] Run `npm run gen:api` to create `src/client/src/types/openapi.gen.ts` from `docs/api/openapi.yaml` (read-only source). Commit the generated file.
- [X] T004 [P] Create `src/client/.env.example` with `NEXT_PUBLIC_API_MODE=mock` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`. Add both keys to the local `src/client/.env.local`, which is not committed, and remove `SESSION_SECRET` and `NEXT_PUBLIC_API_URL` from it.
- [X] T005 [P] Update the design tokens and the existing state components:
  - add `--color-danger`, `--color-danger-surface`, `--color-info`, `--color-info-surface`, `--color-border`, `--color-border-strong` and `--color-page` to the `@theme` block in `src/client/src/app/globals.css`;
  - pick values that meet WCAG 2.1 AA against `--color-surface`, and align `--color-page` with `#f8f8f8` and `--color-border` with `#b5b5b5`;
  - in `src/client/src/components/ui/ErrorState.tsx`, replace `bg-red-50 text-red-600` and `border-slate-200` with `--color-danger-surface`, `--color-danger` and `--color-border`;
  - in `src/client/src/components/ui/EmptyState.tsx`, replace `border-slate-300` with `--color-border-strong`;
  - keep their props unchanged (analysis M1).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: shared types, libraries, API client, mock infrastructure, UI primitives and the minimal shell that every story uses.

**⚠️ CRITICAL**: No user-story work starts until this phase is complete.

### Types and libraries

- [X] T006 [P] Create `src/client/src/types/openapi-gaps.ts`. Tag each export with its GAP ID in a comment:
  - `LoginRequest { email: string; password: string }` (API-GAP-002);
  - `LoginResponse { success: boolean; data: { token: string; expiresAt: string } }` (API-GAP-002 refinement, DOC-03);
  - `GapErrorCode = 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'ACCOUNT_LOCKED' | 'ROLE_MISSING' | 'PASSWORD_CHANGE_REQUIRED' | 'SERVICE_UNAVAILABLE'` (GAP-B/M/N);
  - `CreateUserRequestWithPassword = CreateUserRequest & { initialPassword: string }` (GAP-C);
  - `ProfileWithGaps = Omit<Profile, 'role'> & { role: UserRole | null; mustChangePassword?: boolean }` (GAP-M, GAP-O);
  - `CurrentUserContextWithGaps`, which is the generated `CurrentUserContextResponse` with `data.user: ProfileWithGaps`.
- [X] T007 [P] Rewrite `src/client/src/libs/roles.ts`:
  - `ROLE_CODES = ["student", "manager", "administrator"] as const`;
  - `ROLE_LABEL` = Student / Manager / Administrator;
  - `ROLE_ROUTE_PREFIX = { student: "/student", manager: "/manager", administrator: "/admin" }`;
  - `isRoleCode(value): value is RoleCode`;
  - remove `ROLE_RULES`, which is replaced by route-access in T011.
- [X] T008 [P] Rewrite `src/client/src/libs/navigation.ts` and update `src/client/src/libs/navigation.test.ts`:
  - `NavItem { id; label; href; status: 'available' | 'coming-soon'; ucId }` and `NAVIGATION: Record<RoleCode, NavItem[]>`, listing exactly the spec FR-024 items in that order;
  - only `dashboard` (all roles) and administrator `users` (`/admin/users`, UC-29) are `available`, and both pages exist from US1 and US6 onward;
  - `getDashboardPath(role)` finds `id === 'dashboard'`;
  - keep `isSafeRedirectPath` and `getLoginHref`, and add `isPathAllowedForRole(path, role)`.
- [X] T009 [P] Create `src/client/src/libs/token-store.ts` and `src/client/src/libs/token-store.test.ts`, following `src/server` (bearer token in the body, `Authorization` header only):
  - `getToken()`, `setToken(token)` and `clearToken()` on **`localStorage`** key `myhcmus:token`, never a cookie;
  - wrap every access in try/catch; unavailable storage means "no token";
  - `getToken()` returns `null` and clears the key once `exp` (read via `jose.decodeJwt`, no verification) is past;
  - `getTokenExp()` returns the epoch seconds;
  - `subscribeToken(cb)` listens to the `window` `storage` event for `myhcmus:token`, so other tabs notice logout or expiry (FR-018b), and returns an unsubscribe function.
- [X] T010 [P] Create `src/client/src/libs/session-hint.ts` and `src/client/src/libs/session-hint.test.ts`:
  - `SessionHint { role: RoleCode; mustChangePassword: boolean; exp: number }`, encoded as base64url JSON in the cookie `myhcmus_session` (`Path=/`, `SameSite=Lax`, `Secure` on https, `Max-Age = exp - now`);
  - this is the **only** cookie, and it contains no token;
  - `writeHint`, `readHint`, `clearHint` (browser) and `parseHint(value)` (proxy);
  - `parseHint` returns `null` for an invalid JSON, an unknown role, or `exp <= now`.
- [X] T011 Create `src/client/src/libs/route-access.ts` with `resolveRouteAccess(pathname, hint, nowSeconds)`, implementing rules 1–6 of `contracts/ui-routes-and-components.md` §2 in order. Return `{ type: 'allow', noStore: boolean } | { type: 'redirect', to: string }`. Add `src/client/src/libs/route-access.test.ts`, covering every rule for each role (depends on T007, T008, T010).
- [X] T012 Extend `src/client/src/libs/api-client.ts` in place, and update `src/client/src/libs/api-client.test.ts`:
  - base URL from `NEXT_PUBLIC_API_BASE_URL`;
  - `setTokenProvider(fn)` adds `Authorization: Bearer` only to requests whose URL starts with that base URL;
  - `ApiError { status; code; message; fieldErrors: Record<string,string>; retryAfterSeconds? }`, read from `ErrorResponse.code` and `errors[]`, plus the `Retry-After` header;
  - network failure → `code: 'NETWORK_ERROR'`, non-JSON error → `'UNKNOWN'`;
  - session callbacks:
    - `setUnauthorizedHandler(fn)`: any 401 except from `POST /auth/login`;
    - `setAccountDisabledHandler(fn)`: 403 `ACCOUNT_DISABLED` except from `POST /auth/login` (FR-018a);
    - `setPasswordChangeRequiredHandler(fn)`: 403 `PASSWORD_CHANGE_REQUIRED`;
  - `unwrap<T>()` for the `{ success, data }` envelope;
  - an option to return response headers (`ETag`);
  - remove the `console.warn` and raw-text error messages.
- [X] T013 [P] Create `src/client/src/libs/error-messages.ts` and `src/client/src/libs/error-messages.test.ts`:
  - `toUserMessage(error: ApiError, context: 'login' | 'logout' | 'changePassword' | 'createAccount' | 'load')` returns non-technical copy for every code in data-model §1;
  - `INVALID_CREDENTIALS` → "Email or password is incorrect.";
  - `ACCOUNT_LOCKED` → "Too many failed attempts. Try again after {HH:mm}." (from `retryAfterSeconds`);
  - `ACCOUNT_DISABLED` → "This account is disabled. Contact the administrator." (both at sign-in and mid-session);
  - `ROLE_MISSING` → "This account cannot be signed in. Contact the administrator.";
  - `NETWORK_ERROR` / `SERVICE_UNAVAILABLE` / 5xx → "The service is unavailable. Please try again.";
  - no output may contain status numbers or server text.
- [X] T014 [P] Update `src/client/src/libs/service-mode.ts`:
  - `getApiMode(): 'mock' | 'real'` reads `NEXT_PUBLIC_API_MODE`, falls back to `NEXT_PUBLIC_DATA_SOURCE` (`api` → `real`), and defaults to `mock`;
  - keep `getDataSource()` and `isMockDataSource()` working for `src/client/src/features/activities/services/activity.service.factory.ts`.
- [X] T015 [P] Change `ID` in `src/client/src/types/entities.ts` to `string`, matching contract IDs such as `user-001`, and fix any compile errors this causes in `src/client/src/features/activities/`.

### Mock infrastructure (MSW)

- [X] T016 Create the mock store, per data-model §4:
  - `src/client/src/mocks/db/types.ts`: `MockDb`, `MockUser` with `role: RoleCode | null`, `passwordPlain`, `mustChangePassword`, `status`, `version`, `createdAt`, and the `OperationId` union from `contracts/mock-api.md`;
  - `src/client/src/mocks/db/seed.ts`: **six stored users** (`student1@`, `manager1@`, `admin@`, `disabled@`, `norole@`, `newuser@` at `example.invalid`, all with password `demo2026`, fields exactly as in data-model §4). `outage@example.invalid` is **not** stored; it's a login-handler rule (T046). Also seed about 6 faculties from `src/server/src/enums/Faculty.ts` with IDs as strings (include id `120`); 3 roles `role-student`, `role-manager`, `role-administrator`; and role → permission codes from `PERMISSION_CODES` in `src/client/src/types/entities.ts`, with `role.manage` and `reports.view` for administrator;
  - `src/client/src/mocks/db/store.ts`: `readDb()`, `writeDb()`, `resetMockDb()` and `setMockFailures()` on the `localStorage` key `myhcmus:mock-db:v1`; re-seed when the data is missing or `version !== 1`;
  - `src/client/src/mocks/db/store.test.ts`.
- [X] T017 [P] Create the mock utilities:
  - `src/client/src/mocks/utils/envelope.ts`: `ok(data, status)`, `fail(status, code, message, errors?, headers?)`;
  - `src/client/src/mocks/utils/latency.ts`: `delay(ms)` using `msw`'s `delay`; 300 ms for login, 200 ms otherwise;
  - `src/client/src/mocks/utils/token.ts`: `issueToken(user)` issues an **unsigned** jose `UnsecuredJWT` (claims `sub`, `name`, `jti`, `exp = now + 3600`) and records `jti → user id` in the store's `issuedTokens` (research R3). `verifyToken(token)` returns the claims only if the `jti` was issued by this store for that `sub`, isn't in `revokedTokenIds` and hasn't expired; otherwise `null`, so a forged token is rejected;
  - `src/client/src/mocks/utils/token.test.ts`.
- [X] T018 Create `src/client/src/mocks/handlers/guards.ts` with `withAuth(resolver, { requireRole?, allowWhenMustChange?, skipAccountChecks?, skipStatusAndRoleChecks? })`, implementing `contracts/mock-api.md`:
  - a missing or invalid token → 401 `UNAUTHENTICATED`;
  - then, unless `skipAccountChecks`:
    1. an inactive user → **403 `ACCOUNT_DISABLED`** (H3);
    2. `role: null` → 403 `FORBIDDEN`;
    3. `mustChangePassword` → 403 `PASSWORD_CHANGE_REQUIRED`, unless `allowWhenMustChange`;
    4. a role mismatch → 403 `FORBIDDEN`;
  - `GET /auth/me` uses `skipAccountChecks: true` (H2), so a valid token always gets the profile, including `role: null` or `status: 'inactive'`;
  - `POST /auth/logout` uses `skipStatusAndRoleChecks: true`, which skips checks 1–3.

  Also add `withFailureSwitch(opId, resolver)`: when `opId` (or `opId:network`) is in `store.failures`, return 500 `UNKNOWN` (or `HttpResponse.error()`) without touching the store. Add `src/client/src/mocks/handlers/guards.test.ts`.
- [X] T019 Create the MSW entry points:
  - `src/client/src/mocks/handlers/index.ts`, exporting `handlers` (an empty array for now; stories add theirs);
  - `src/client/src/mocks/browser.ts` (`setupWorker(...handlers)`);
  - `src/client/src/mocks/node.ts` (`setupServer(...handlers)`);
  - `src/client/src/mocks/dev-tools.ts`, which installs `window.__myhcmusMock = { reset, fail(opId), clearFailures, expireSessions, disable(email) }` (`expireSessions` adds every issued `jti` to `revokedTokenIds`; `disable` sets a stored user's `status` to `inactive`).

  Handlers build URLs as `${process.env.NEXT_PUBLIC_API_BASE_URL}/…`.
- [X] T020 Create `src/client/src/mocks/MockProvider.tsx`, a client component:
  - when `getApiMode() === 'mock'`, dynamically import `./browser` and `./dev-tools`, await `worker.start({ onUnhandledRequest: 'bypass', quiet: true, serviceWorker: { url: '/mockServiceWorker.js' } })`, and render `LoadingState` until it is ready;
  - expose `useIsMockMode()`;
  - otherwise render the children directly.

  Update `src/client/src/providers/provider.tsx` to `<MockProvider><AuthProvider>…</AuthProvider></MockProvider>`.
- [X] T021 Update `src/client/tests/setup.ts`:
  - start `server` from `src/client/src/mocks/node.ts` (`listen({ onUnhandledRequest: 'error' })`, `resetHandlers`, `close`);
  - in `beforeEach`, call `resetMockDb()`, remove `myhcmus:token` from `localStorage`, and clear the `myhcmus_session` cookie;
  - stub `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`.

  Update `src/client/tests/test-utils.tsx` with `renderWithProviders(ui, { route })`, wrapping `AuthProvider` and a mocked `next/navigation` router.

### Shared UI primitives (token-styled, accessible)

- [X] T022 [P] Create these components, each with a test:
  - `src/client/src/components/ui/FormField.tsx`: label, "Required"/"Optional" marker, hint and error, with the error and hint wired through `aria-describedby` and `aria-invalid`;
  - `src/client/src/components/ui/TextInput.tsx`, with input styles taken from the current `LoginForm` inputs, using tokens;
  - `src/client/src/components/ui/PasswordInput.tsx`, with a show/hide toggle that has an accessible name.
- [X] T023 [P] Create `src/client/src/components/ui/Select.tsx` and `src/client/src/components/ui/RadioGroup.tsx` (`fieldset`/`legend`, single choice), each with a test.
- [X] T024 [P] Create `src/client/src/components/ui/Alert.tsx` (variants `info`, `success`, `warning` and `error`; `role="alert"` for error, `role="status"` otherwise), with a test.
- [X] T025 [P] Create `src/client/src/components/ui/LoadingState.tsx` (a page/section variant built from `Skeleton`, `aria-busy`, with visually hidden "Loading…" text) and `src/client/src/components/ui/ComingSoonBadge.tsx` (a `Badge` variant with the text "Coming soon").
- [X] T026 [P] Create `src/client/src/components/ui/ConfirmDialog.tsx`, using native `<dialog>` or `role="dialog"` with `aria-modal`, a focus trap, Escape to cancel, and focus returned on close. Include a test.

### Minimal shell and shared 403 handling (completed in US4)

- [X] T027 [P] Create `src/client/src/components/layout/PageHeader.tsx` (`h1` title, optional description and actions).
- [X] T028 Create `src/client/src/components/layout/AccountMenu.tsx`, a menu-button pattern showing the full name, `ROLE_LABEL[role]` and a "Log out" item. Escape or an outside click closes it without an action (UC-02 A1), and focus returns to the trigger. Props: `user`, `onLogout`, `pending`. Include a test.
- [X] T029 Create `src/client/src/components/layout/AppHeader.tsx` (reuses `src/client/src/components/layout/Logo.tsx`, `AccountMenu`, and a slot for the mobile menu toggle) and `src/client/src/components/layout/AppShell.tsx` (skip link, `<header>`, `<nav aria-label="Main">` slot, `<main id="main">`). Use tokens only (depends on T027, T028).
- [X] T030 [P] Create the shared 403 handling (analysis C2):
  - `src/client/src/components/layout/ForbiddenView.tsx`: `EmptyState`-based, "You don't have permission to view this page", plus a link to the `dashboardHref` prop;
  - `src/client/src/hooks/useForbidden.ts`, with two exports:
    - `isForbiddenError(err: unknown): boolean` (pure): true for an `ApiError` with `code === 'FORBIDDEN'`;
    - `useForbidden(): { isForbidden, handleError(err: unknown): boolean }`, component-owned state for mutations;
  - tests for both.

  **Wiring rule (analysis M7)**:
  - **Read hooks** catch errors with `isForbiddenError` and return `status: 'forbidden'`; the rendering component shows `ForbiddenView` for that status.
  - **Components that run mutations** own `useForbidden()` and call `handleError` in their own catch.
  - Hooks never call `useForbidden()` internally.

  This implements FR-021. Features must not import `features/auth/*` for this.

**Checkpoint**: lint, test and build pass; MSW starts in `npm run dev` with mock mode.

---

## Phase 3: User Story 1 - Log in and land on my role's dashboard (Priority: P1) 🎯 MVP

**Goal**: A seeded account of any role signs in with email and password (no role picker) and lands on its own dashboard, and the session survives a reload.

**Independent Test**: Sign in as `student1@example.invalid`, `manager1@example.invalid` and `admin@example.invalid` with `demo2026`. Each lands on its dashboard with its name and role in the header, and a reload keeps the session (quickstart H1–H3).

### Tests for User Story 1 ⚠️ (write first, confirm they fail)

- [X] T031 [P] [US1] Create `src/client/src/features/auth/mappers/current-user.mapper.test.ts`: a valid context maps to `CurrentUser`; a `null`, missing or unknown `role` throws `InvalidRoleError`; a missing `mustChangePassword` defaults to `false`.
- [X] T032 [P] [US1] Create `src/client/src/mocks/handlers/auth.test.ts`, happy path:
  - login for each seed account returns 200 `{ token, expiresAt }`;
  - the token has `sub`, `name`, `jti` and a 1-hour `exp`;
  - `GET /auth/me` with the token returns the profile, role and permissions, and returns `role: null` for `norole@` and `status: 'inactive'` for `disabled@` instead of 403 (H2);
  - without a token it returns 401 `UNAUTHENTICATED`.
- [X] T033 [P] [US1] Rewrite the test as `src/client/src/features/auth/components/LoginForm.test.tsx` (moved from `src/client/src/components/forms/LoginForm.test.tsx`):
  - no role selector is rendered;
  - successful login for each role calls `router.replace` with its dashboard, stores the token in `localStorage` `myhcmus:token`, and sets no cookie other than `myhcmus_session`;
  - a safe `redirectTo` within the role's area is honored; an unsafe or other-role one is ignored;
  - the submit button shows the pending state and a second click sends no second request.

### Implementation for User Story 1

- [X] T034 [US1] Rewrite `src/client/src/features/auth/types/auth.ts` (`CurrentUser`, exactly as in data-model §2.1, with `role: RoleCode` non-null in the domain) and `src/client/src/features/auth/types/auth.dto.ts` (re-export `LoginRequest`, `LoginResponse` and `CurrentUserContextWithGaps` from the gen/gap types). Remove `SessionUser`, `StudentSessionUser`, `StaffSessionUser` and `hasStudentProfile`, and update `src/client/src/features/auth/types/index.ts`.
- [X] T035 [US1] Create `src/client/src/features/auth/mappers/current-user.mapper.ts` with `toCurrentUser(dto)` and `InvalidRoleError`. Use `isRoleCode` from `src/client/src/libs/roles.ts`.
- [X] T036 [US1] Rewrite `src/client/src/features/auth/services/auth.service.ts`:
  - `interface AuthService { login(req): Promise<{ token: string; expiresAt: string }>; logout(): Promise<void>; getCurrentUser(): Promise<CurrentUser>; changePassword(req): Promise<void> }`;
  - `class HttpAuthService implements AuthService`, calling `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` and `PATCH /profile/password` through `api-client` and `unwrap`;
  - `export const authService: AuthService`;
  - remove forgot/reset/change-password calls that use non-contract paths.

  Delete `src/client/src/features/auth/services/mock.auth.service.ts`; per constitution C-IV v1.1.0 the MSW handlers are the mock.
- [X] T037 [US1] Create `src/client/src/mocks/handlers/auth.ts` with:
  - `POST /auth/login`, happy path: find the user by lowercased email, compare `passwordPlain`, `issueToken`;
  - `GET /auth/me`: `withAuth(…, { skipAccountChecks: true })`; returns `{ user: Profile + mustChangePassword (role may be null), permissions, activeOrganizationMemberships: [], activeActivityAssignments: [] }`.

  Register both in `src/client/src/mocks/handlers/index.ts`.
- [X] T038 [US1] Rewrite `src/client/src/features/auth/context/AuthContext.tsx` and `src/client/src/features/auth/provider/AuthProvider.tsx`, following the state machine in data-model §3.1. The `status` values are `unknown | signedOut | loadingContext | signedIn | mustChangePassword`.
  - **`signOutLocally(reason?)`**: one helper that calls `clearToken()` and `clearHint()` and sets `signedOut`. **Every** transition to `signedOut` goes through it, so a stale hint can never survive without a token and cause a dashboard ↔ `/login` loop (analysis H5, FR-018c). With a `reason`, it stores `signOutReason` and navigates to `/login?reason=<reason>` itself; see the redirect-ownership rule in T042.
  - **`applyContext(data)`**: create it here (analysis M11). It turns `/auth/me` data into a `CurrentUser`; `status: 'inactive'` → `ApiError ACCOUNT_DISABLED`, and an invalid or `null` role → `ApiError ROLE_MISSING`. It's used by the bootstrap and by `login()`.
  - **Bootstrap**: if `getToken()` exists, call `getCurrentUser()`, pass the result through `applyContext()`, then `writeHint`. If there is no token, or the call returns 401, call `signOutLocally()`.
  - **`login(email, password)`**: call `authService.login`, then `setToken` (localStorage), `getCurrentUser`, `toCurrentUser`, and `writeHint({ role, mustChangePassword, exp: getTokenExp() })`. Return the `CurrentUser`.
  - **On mount**: register `setTokenProvider(getToken)`, `setUnauthorizedHandler` and `setAccountDisabledHandler` (the bodies come in T055), and subscribe via `subscribeToken`.
  - Expose `signOutLocally` to `RequireSession` through the context (internal API, not used by other features).
  - Expose `user`, `status`, `login`, `logout`, `refresh` and `changePassword`.
  - Remove all `console.*` calls.
- [X] T039 [US1] Update `src/client/src/features/auth/schema/login.schema.ts`: remove `role`; `email` is required ("Email is required") and must be a valid email ("Enter a valid email address"); `password` is required ("Password is required") with no length rule (spec Assumptions).
- [X] T040 [US1] Move `src/client/src/components/forms/LoginForm.tsx` to `src/client/src/features/auth/components/LoginForm.tsx` and rebuild it:
  - use react-hook-form + `zodResolver(LoginSchema)`, with `FormField`, `TextInput`, `PasswordInput`, `Button` (`loading`) and `Alert`;
  - remove the role selector, the "Forgot Password?" link and the social buttons (FR-012);
  - on success, redirect to a safe `redirectTo` if `isPathAllowedForRole`, otherwise to `getDashboardPath(user.role)` (FR-009);
  - use tokens only.

  Update `src/client/src/app/(public)/login/page.tsx` to import it and replace its raw hex classes with tokens.
- [X] T041 [US1] Create `src/client/src/proxy.ts`:
  - read **only** the `myhcmus_session` cookie, call `parseHint` and `resolveRouteAccess`, and return `NextResponse.redirect` or `NextResponse.next()`;
  - keep the existing matcher, excluding `api`, `_next/static`, `_next/image`, `favicon.ico` and `mockServiceWorker.js`;
  - no `console.*`.

  Delete `src/client/proxy.ts`, `src/client/src/libs/session.ts` and `src/client/src/app/api/auth/login/route.ts`. Add `src/client/src/proxy.test.ts`, covering no hint → `/login?redirectTo=…`, wrong role → `/forbidden`, and allowed.
- [X] T042 [US1] Create `src/client/src/features/auth/components/RequireSession.tsx`:
  - while `status` is `unknown` or `loadingContext`, render a full-page `LoadingState`;
  - when `signedOut` **and `signOutReason === null`**, `router.replace(getLoginHref(pathname))`;
  - otherwise apply `resolveRouteAccess` to the client state and render the children.
  - If the bootstrap fails with a 5xx or network error, keep the token and render `ErrorState` with retry. Inactive or role-less accounts are not errors here: `applyContext()` (T038) signs them out and the provider redirects with a reason.

  **Redirect ownership (analysis M12)**: when the provider signs the user out *with a reason* (`expired`, `disabled`, `role-missing`, `signed-out`, `logout-unconfirmed`), the provider alone navigates to `/login?reason=…`. `RequireSession` redirects only when there's no reason, for example no token at bootstrap. This makes exactly one redirect happen, so the reason notice can't be overwritten by a second `/login?redirectTo=…` redirect.

  Create `src/client/src/app/(protected)/layout.tsx`, wrapping `RequireSession` and `AppShell`, with the header showing the user.
- [X] T043 [US1] Replace the stub pages `src/client/src/app/(protected)/student/dashboard/page.tsx`, `src/client/src/app/(protected)/manager/dashboard/page.tsx` and `src/client/src/app/(protected)/admin/dashboard/page.tsx` with thin pages rendering `PageHeader` "Dashboard" and the text "Welcome, {fullName}". Remove their own logout buttons and raw classes (completed in US4). (done: the pages render the final `RoleDashboard` directly, so T091 needed no further change)

**Checkpoint**: quickstart H1–H3 pass on the mock.

---

## Phase 4: User Story 2 - Sign-in failures are explained safely (Priority: P1)

**Goal**: UC-01 A1–A7 each produce the specified outcome, and unknown-email and wrong-password failures are indistinguishable.

**Independent Test**: The "Alternative flows" rows UC-01 A1–A7 in quickstart.md.

### Tests for User Story 2 ⚠️

- [X] T044 [P] [US2] Extend `src/client/src/mocks/handlers/auth.test.ts`:
  - unknown email and wrong password both return 401 `INVALID_CREDENTIALS` with an identical body;
  - `disabled@…` returns 403 `ACCOUNT_DISABLED`;
  - the 5th consecutive failure and later attempts return 423 `ACCOUNT_LOCKED` with `Retry-After` ≤ 900; unknown emails count too; a success resets the counter;
  - `outage@…` returns 503 and is not a stored user;
  - `norole@…` gets 200 on login and `/auth/me` returns `role: null`;
  - `fail('login:network')` produces a network error.
- [X] T045 [P] [US2] Create `src/client/src/features/auth/components/LoginForm.alternatives.test.tsx`, with one test per flow:
  - **A1**: field errors, and zero requests recorded by MSW;
  - **A2**: the same message text for both causes;
  - **A3**: the disabled message, and no `myhcmus:token` in `localStorage`;
  - **A4**: the locked message containing the retry time;
  - **A5**: the unavailable message, with the email kept;
  - **A6**: "cannot be signed in", with the token and hint cleared and no navigation;
  - **A6 / context failure (FR-007a)**: login succeeds but `fail('me')` or `fail('me:network')` → the token is removed, no navigation, the service-unavailable message is shown;
  - **A7**: a signed-in user who renders the login page is redirected to the dashboard.
  - **Reload, inactive (H6)**: with a stored token for `student1@`, `disable('student1@example.invalid')`, then mount `AuthProvider`. The token and hint are cleared, with a redirect to `/login?reason=disabled`.
  - **Reload, role missing (H6)**: with a stored token, set the user's `role` to `null` in the mock store, then mount. The token and hint are cleared, with a redirect to `/login?reason=role-missing`.

### Implementation for User Story 2

- [X] T046 [US2] Extend `POST /auth/login` in `src/client/src/mocks/handlers/auth.ts`, in this order:
  1. `outage@example.invalid` (checked before any user lookup) → 503 `SERVICE_UNAVAILABLE`;
  2. lock check (`now < lockedUntil`) → 423 `ACCOUNT_LOCKED` with `Retry-After`;
  3. unknown email or wrong password → increment `loginAttempts[emailLower]`; set `lockedUntil = now + 15 min` when it reaches 5 (that attempt returns 423); otherwise 401 `INVALID_CREDENTIALS` with the message "Email or password is incorrect";
  4. `status === 'inactive'` → 403 `ACCOUNT_DISABLED`;
  5. success → reset attempts and issue the token.

  Wrap the handler with `withFailureSwitch('login', …)`, and wrap `GET /auth/me` with `withFailureSwitch('me', …)`.
- [X] T047 [US2] In `src/client/src/features/auth/components/LoginForm.tsx`, map `ApiError` through `toUserMessage(err, 'login')` into `Alert`. Map `fieldErrors` from 400 `VALIDATION_FAILED` onto the fields. Keep the email, clear the password after a failure, and move focus to the alert.
- [X] T048 [US2] In `src/client/src/features/auth/provider/AuthProvider.tsx`, extend `login()` and the bootstrap around **`applyContext(dto): CurrentUser`** (analysis H6). Note: `applyContext()` itself was **folded into T038** (analysis M11); this task adds the login and bootstrap error handling below. It throws a typed `ApiError` for:
  - `status: 'inactive'` → `ACCOUNT_DISABLED`;
  - an `InvalidRoleError` from `toCurrentUser`, or a 403 `ROLE_MISSING` / `FORBIDDEN` → `ROLE_MISSING`.

  **In `login()`**:
  - those errors, plus a 5xx, `UNKNOWN` or `NETWORK_ERROR` from `getCurrentUser()` (FR-007a / M5, mapped to `SERVICE_UNAVAILABLE`), call `signOutLocally()` and are rethrown, so the form shows the matching message.

  **In the bootstrap**:
  - `ACCOUNT_DISABLED` → `signOutLocally()` + `router.replace('/login?reason=disabled')`;
  - `ROLE_MISSING` → `signOutLocally()` + `router.replace('/login?reason=role-missing')`;
  - a 5xx or network error keeps the token and shows the retryable `ErrorState` (T042).
- [X] T049 [US2] Make A7 reliable: confirm rule 1 of `src/client/src/libs/route-access.ts` redirects `/login` to the dashboard when a valid hint exists, and add a client fallback in `src/client/src/features/auth/components/LoginForm.tsx` (`useEffect`: if `status === 'signedIn'`, `router.replace(getDashboardPath(user.role))`) without calling login again.

**Checkpoint**: all UC-01 alternative-flow tests pass.

---

## Phase 5: User Story 3 - Log out and keep protected pages closed (Priority: P1)

**Goal**: Logging out from the account menu ends the session in this and other tabs, even when the server is unreachable or the session has already expired. Afterwards no protected page is viewable, including via Back. Expiry or disabling mid-session sends the user to sign-in.

**Independent Test**: quickstart rows UC-02 A1–A4, "Expiry (FR-018)", "Disabled mid-session" and "Two tabs".

### Tests for User Story 3 ⚠️

- [X] T050 [P] [US3] Extend `src/client/src/mocks/handlers/auth.test.ts`:
  - after `POST /auth/logout` the same token gets 401 on `/auth/me`;
  - logout with an invalid token returns 401;
  - `expireSessions()` invalidates all issued tokens;
  - after `disable(email)`, `GET /admin/users` (admin token) returns 403 `ACCOUNT_DISABLED`, while `/auth/me` still returns 200 with `status: 'inactive'` (H2/H3).
- [X] T051 [P] [US3] Extend `src/client/src/components/layout/AccountMenu.test.tsx`: Escape and an outside click close the menu without calling `onLogout`; Enter on "Log out" calls it; while `pending`, the item is disabled.
- [X] T052 [P] [US3] Create `src/client/src/features/auth/logout.integration.test.tsx`:
  - **basic**: redirect to `/login?reason=signed-out`, with `myhcmus:token` and `myhcmus_session` gone;
  - **A2** (expired): silent redirect, with no error alert;
  - **A3** (`fail('logout:network')`): `/login?reason=logout-unconfirmed`, with token and hint gone;
  - **A4**: rendering a protected page after logout calls `router.replace('/login…')` and never renders protected content;
  - **FR-018**: a 401 on a later call redirects to `/login?reason=expired&redirectTo=<current path>`;
  - **FR-018a / H3**: `disable('admin@example.invalid')`, then a protected call → token and hint cleared, redirect to `/login?reason=disabled`, the disabled message shown;
  - **FR-018b / L1, two tabs**: render two `AuthProvider` instances sharing `localStorage`; log out in instance A, dispatch the `storage` event, and instance B goes to `signedOut` and redirects to `/login` without a server call.
  - **FR-018c / H5, stale hint**: write a valid `myhcmus_session` hint but no `myhcmus:token`, then render a protected page. The hint cookie is cleared, `router.replace('/login…')` is called exactly once, and rendering `/login` afterwards does not redirect back (no loop). Add the matching pure case to `src/client/src/libs/route-access.test.ts`: no hint on `/login` → `allow`.
- [X] T053 [P] [US3] Extend `src/client/src/proxy.test.ts`: protected responses carry `Cache-Control: no-store`; an expired hint redirects to `/login`; the proxy never reads a token cookie.

### Implementation for User Story 3

- [X] T054 [US3] Add `POST /auth/logout` to `src/client/src/mocks/handlers/auth.ts`, wrapped in `withAuth(…, { skipStatusAndRoleChecks: true })` and `withFailureSwitch('logout', …)`. It adds `jti` to `revokedTokenIds` and returns 200 `ApiMessage`.
- [X] T055 [US3] In `src/client/src/features/auth/provider/AuthProvider.tsx`:
  - **`logout()`**: call `authService.logout()`; in `finally`, always call `signOutLocally('signed-out')`, or `signOutLocally('logout-unconfirmed')` after a network error or 5xx. Return `'confirmed'` on 200, `'already-expired'` on 401 and `'unconfirmed'` otherwise. **The provider performs the navigation**; the caller doesn't navigate (redirect ownership, T042 / analysis M12).
  - **Unauthorized handler**: `signOutLocally('expired')`, which navigates to `/login?reason=expired&redirectTo=<current path>`.
  - **Account-disabled handler**: `signOutLocally('disabled')`, which navigates to `/login?reason=disabled`.
  - **`subscribeToken` callback**: when the token disappears in another tab, `signOutLocally('signed-out')`, which navigates to `/login?reason=signed-out`.
  - Every reason-specific redirect above is done by the provider only; `RequireSession` doesn't redirect again while `signOutReason` is set (T042).
- [X] T056 [US3] Wire `AccountMenu.onLogout` in `src/client/src/components/layout/AppHeader.tsx` (through the `(protected)/layout.tsx` props) to `logout()` and navigation, with a pending state.
- [X] T057 [US3] Create `src/client/src/features/auth/components/LogoutNotice.tsx`, mapping `?reason=`:
  - `signed-out` → info "You have been signed out.";
  - `logout-unconfirmed` → warning "You have been signed out on this device, but we could not confirm it with the server.";
  - `expired` → info "Your session has expired. Please sign in again.";
  - `disabled` → error "This account is disabled. Contact the administrator.";
  - `role-missing` → error "This account cannot be signed in. Contact the administrator." (FR-007 on reload, H6)

  Render it on `src/client/src/app/(public)/login/page.tsx` above the form.
- [X] T058 [US3] In `src/client/src/features/auth/components/RequireSession.tsx`, add a `pageshow` listener (`event.persisted`): re-check `getToken()` and the hint; if either is missing or expired, call `signOutLocally()` (which clears both) and redirect to `/login` (UC-02 A4, FR-018c).
- [X] T059 [US3] In `src/client/src/proxy.ts`, set `Cache-Control: no-store` on responses where `resolveRouteAccess` returns `allow` with `noStore: true` (all `(protected)` paths).

**Checkpoint**: US1–US3 complete; the MVP auth loop is shippable.

---

## Phase 6: User Story 6 - Administrator registers a single account with exactly one role (Priority: P1)

**Goal**: The administrator opens User Management (a minimal page in this phase), fills in the form, reviews it (values, role permissions, generated temporary password with override), confirms, and sees the result with a copyable temporary password. The new account can sign in.

**Independent Test**: quickstart H4–H5, the UC-29 A2/A6/A9/A11 rows, and "Duplicate". The admin nav "User Management" opens a page with a "Create account" button (analysis M2). The new account signs in and is routed to "Set a new password", which US7 builds next.

### Tests for User Story 6 ⚠️

- [X] T060 [P] [US6] Create `src/client/src/features/admin-users/lib/temporary-password.test.ts` with the FR-036 examples verbatim:
  - "Nguyễn Văn An" / `23127001` → `KHTN@NVA7001`;
  - "Trần Thị Bích" as manager, with injected random digits `8203` → `KHTN@TTB8203`;
  - `Đặng` → `D`;
  - extra spaces and a hyphen are ignored as empty words;
  - a one-word name gives one initial;
  - a student number shorter than 4 is left-padded with random digits;
  - the result length is always ≥ 10.
- [X] T061 [P] [US6] Create `src/client/src/features/admin-users/schema/new-account.schema.test.ts`:
  - email required and valid, trimmed and lowercased;
  - full name 1–100 characters after trimming;
  - phone optional and **only trimmed, with no format rule** ("abc 123 " becomes "abc 123"; L3, GAP-P);
  - student number required when `role = student`, non-empty, at most 20 characters;
  - faculty required when `role = student`;
  - student fields ignored for other roles;
  - temporary password ≥ 8 characters.
- [X] T062 [P] [US6] Create `src/client/src/mocks/handlers/admin-users.test.ts` for `POST /admin/users`:
  - 201 for each role, with the stored user `mustChangePassword: true`, and login with `initialPassword` succeeding;
  - **A11**: `role: ['student','manager']` → 400 `VALIDATION_FAILED` with `errors[0].field === 'role'`;
  - **A6**: a manager with `studentNumber` → 400 `ROLE_POLICY_VIOLATION`;
  - duplicate email (different case) → 409 `DUPLICATE_VALUE` on `email`; duplicate student number → 409 on `studentNumber`;
  - a non-administrator token → 403;
  - `fail('createUser')` → 500 with the store unchanged.

  Also test `GET /admin/faculties`, `/admin/roles` and `/admin/roles/{id}/permissions`.
- [X] T063 [P] [US6] Create `src/client/src/features/admin-users/components/CreateAccountWizard.test.tsx`:
  - form → review shows all values, the role label, the permission list and the generated password;
  - overriding the password with fewer than 8 characters blocks Confirm;
  - after an override, a name edit keeps the override, and clearing the override regenerates;
  - Confirm → result shows `CopyField` with the password;
  - double-clicking Confirm sends 1 request (FR-037);
  - **A2**: Cancel on a dirty form opens `ConfirmDialog`, and confirming navigates away with no request;
  - **A6** message;
  - **A9**: retry keeps all input and the second attempt succeeds after `setMockFailures([])`;
  - duplicate → field error on email;
  - switching Student → Manager hides and drops the student fields;
  - a faculty load error shows a retry and blocks Confirm for Student;
  - a 403 `FORBIDDEN` renders `ForbiddenView` via `useForbidden`;
  - the axe check passes.

### Implementation for User Story 6

- [X] T064 [P] [US6] Create the admin-users types and mappers:
  - `src/client/src/features/admin-users/types/admin-users.dto.ts`: re-export `AdminUser`, `UserListResponse`, `AdminUserResponse`, `CreateUserRequestWithPassword`, `FacultySummary`, `Role` and `RolePermissionsResponse`;
  - `src/client/src/features/admin-users/types/admin-users.ts`: `AccountSummary`, `AccountPage`, `AccountListQuery`, `NewAccountDraft`, `CreatedAccount`, `RolePermissions` and **`Faculty { id: string; code: string; name: string }`**, exactly as in data-model §2.5–2.10;
  - `src/client/src/features/admin-users/mappers/admin-users.mapper.ts`:
    - `toAccountSummary`, `toAccountPage`;
    - `toCreateUserRequest` (drops `studentNumber`/`facultyId` for non-students, maps `''` → `null`, trims `phoneNumber`, `temporaryPassword` → `initialPassword`);
    - `toRolePermissions`;
    - **`toFaculty`** (drops items without `id` or `name`, missing `code` → `''`) and `toFaculties` (sorted by `name` with `localeCompare(…, 'vi')`) (analysis C3);
  - `src/client/src/features/admin-users/mappers/admin-users.mapper.test.ts`.
- [X] T065 [P] [US6] Create `src/client/src/features/admin-users/lib/temporary-password.ts` with `generateTemporaryPassword({ fullName, role, studentNumber }, random = cryptoDigits)`, implementing FR-036 exactly: `KHTN@` + the initials of non-empty words after `normalize('NFD')`, combining marks removed and `đ/Đ → D`, uppercased; then for students the last 4 characters of the student number (left-padded with random digits to 4), otherwise 4 random digits. Export `TEMP_PASSWORD_MIN_LENGTH = 8`.
- [X] T066 [P] [US6] Create `src/client/src/features/admin-users/schema/new-account.schema.ts`, a zod schema with the data-model §2.6 rules verbatim, using `superRefine` for the role-conditional student fields and the message "Each account has exactly one role" for an invalid role. `phoneNumber` is `z.string().trim()` and optional, with **no format rule** (GAP-P).
- [X] T067 [US6] Create `src/client/src/features/admin-users/services/admin-users.service.ts`:
  - `interface AdminUsersService { listUsers(q: AccountListQuery): Promise<AccountPage>; createUser(draft: NewAccountDraft): Promise<AccountSummary>; listFaculties(): Promise<Faculty[]>; getRolePermissions(role: RoleCode): Promise<RolePermissions> }`;
  - `class HttpAdminUsersService`: `GET /admin/users?search&role&page&limit=10&sortBy=createdAt&sortOrder=desc`, `POST /admin/users`, `GET /admin/faculties` (mapped with `toFaculties`), and `GET /admin/roles` then `GET /admin/roles/{roleId}/permissions`, all through `api-client` and the mappers;
  - no DTO type in any method signature;
  - export the instance.
- [X] T068 [US6] Create `src/client/src/mocks/handlers/admin-users.ts` with `POST /admin/users`, using `withAuth({ requireRole: 'administrator' })` and `withFailureSwitch('createUser')`. Validate in the order given in `contracts/mock-api.md`. Create the user with `id = 'user-' + n`, `version: 1`, `status: 'active'`, `mustChangePassword: true`, `passwordPlain = initialPassword` and `createdAt = now`. Return 201 `AdminUserResponse` with permissions.

  Create `src/client/src/mocks/handlers/reference.ts` with `GET /admin/faculties`, `GET /admin/roles` and `GET /admin/roles/:roleId/permissions` (administrator only; failure switches `listFaculties` and `listRoles`). Register both in `src/client/src/mocks/handlers/index.ts`.
- [X] T069 [US6] Create these hooks. Each read hook returns `{ status: 'loading' | 'error' | 'forbidden' | 'success', data, error, retry }`, and maps errors with `isForbiddenError` from `src/client/src/hooks/useForbidden.ts` (no `useForbidden()` inside hooks, per the T030 wiring rule). The read hooks share **`src/client/src/features/admin-users/hooks/useAsyncResource.ts`**. It derives `loading` from a request key instead of setting state inside the effect, drops stale responses, and returns `status: 'forbidden'` via `isForbiddenError`. `useAccountList` (T097) uses it too.
  - `src/client/src/features/admin-users/hooks/useFaculties.ts` (`Faculty[]`);
  - `src/client/src/features/admin-users/hooks/useRolePermissions.ts` (keyed by role);
  - `src/client/src/features/admin-users/hooks/useCreateAccount.ts` (mutation: returns `{ submit, pending }`, rejects with the `ApiError`), which keeps one in-flight promise and ignores re-entry (FR-037).
- [X] T070 [P] [US6] Create `src/client/src/components/ui/CopyField.tsx` (a read-only value plus a "Copy" button using `navigator.clipboard.writeText`, with an `aria-live="polite"` "Copied" status and a fallback that selects the text), with a test.
- [X] T071 [US6] Create the wizard components under `src/client/src/features/admin-users/components/`:
  - `AccountForm.tsx`: react-hook-form + zod; `RadioGroup` for the single role; student fields shown only for Student; `Select` faculty (`Faculty[]`) with loading and error-with-retry; required/optional markers;
  - `RolePermissionsPanel.tsx`: loading, empty ("No permissions") and error-with-retry states;
  - `AccountReview.tsx`: a values summary, `RolePermissionsPanel`, and the temporary-password row with a "Change" control. Regenerate while `passwordOverridden === false` whenever the name, student number or role change; "Use generated password" clears the override;
  - `AccountResult.tsx`: account details, `CopyField` with the password, a "shown only once" note, and the actions "Back to User Management" (`/admin/users`) and "Create another";
  - `CreateAccountWizard.tsx`: the state machine from data-model §3.2; Cancel opens `ConfirmDialog` when dirty (A2); server errors keep input, map `fieldErrors` to fields and other codes to `Alert` via `toUserMessage(err, 'createAccount')` (A6/A9/A11/duplicate); the wizard owns `useForbidden()` and calls `handleError` in the Confirm catch, rendering `ForbiddenView` when `isForbidden`; `useFaculties`/`useRolePermissions` with `status: 'forbidden'` also render `ForbiddenView`; the temporary password is kept only in component state.
- [X] T072 [US6] Create the route `src/client/src/app/(protected)/admin/users/new/page.tsx` (thin: `PageHeader` "Create account" plus `CreateAccountWizard`).
- [X] T073 [US6] Create a **minimal** `src/client/src/app/(protected)/admin/users/page.tsx` (analysis M2): `PageHeader` "User Management" with the primary action button "Create account" → `/admin/users/new`, and an `EmptyState` placeholder "The account list is coming in the next step." so the available nav item never 404s. US5 (T099) replaces the placeholder with the list.

**Checkpoint**: an admin can open User Management, create accounts of all three roles on the mock; the new account's login succeeds, and the session hint has `mustChangePassword: true`.

---

## Phase 7: User Story 7 - Set a new password at first sign-in (Priority: P2, executed directly after US6)

**Goal**: Accounts with `mustChangePassword` can only reach "Set a new password" until they change it. Afterwards they reach their dashboard, and the temporary password stops working.

**Independent Test**: quickstart H6–H9 and the "US7 A7" row; the full SC-002 loop for all three roles.

### Tests for User Story 7 ⚠️

- [X] T074 [P] [US7] Create `src/client/src/mocks/handlers/profile.test.ts` for `PATCH /profile/password`:
  - a wrong current password → 400 `CURRENT_PASSWORD_INCORRECT`;
  - a new password under 8 characters → 400 `VALIDATION_FAILED`;
  - success → 200, `mustChangePassword` false, the old password rejected at login and the new one accepted;
  - while the flag is true, `GET /admin/users` (as a new administrator) → 403 `PASSWORD_CHANGE_REQUIRED`, while `/auth/me` and logout still work.
- [X] T075 [P] [US7] Create `src/client/src/features/auth/components/ChangePasswordForm.test.tsx`, covering spec US7 scenarios 3–6:
  - the heading reads "Set a new password";
  - success refreshes the context and redirects to the dashboard or a safe return page;
  - under 8 characters, equal to the current password, or a mismatched confirmation shows field errors with no request;
  - a wrong current password shows "Current password is incorrect";
  - a network failure shows a retryable alert;
  - a double submit sends 1 request;
  - axe passes.
- [X] T076 [P] [US7] Create `src/client/src/features/admin-users/first-sign-in.integration.test.tsx` for SC-002, once per role: (done at `src/client/src/app/first-sign-in.integration.test.tsx` instead, so the test can compose features without a C-II cross-feature import)
  1. admin creates the account;
  2. logout;
  3. login with the temporary password lands on `/change-password` ("Set a new password");
  4. navigating to the dashboard redirects back;
  5. the password change succeeds and the dashboard opens;
  6. logout, then the temporary password is rejected and the new one works.

  The test drives only through public routes, pages and the MSW server. It must not import `features/auth` internals into `features/admin-users`; it renders pages through `renderWithProviders`.

### Implementation for User Story 7

- [X] T077 [P] [US7] Create `src/client/src/features/auth/schema/change-password.schema.ts`: `currentPassword` is required; `newPassword` has at least 8 characters ("Use at least 8 characters") and differs from `currentPassword` ("Choose a password different from the temporary one"); `confirmPassword` must equal `newPassword` ("Passwords do not match").
- [X] T078 [US7] Create `src/client/src/mocks/handlers/profile.ts` with `PATCH /profile/password`, wrapped in `withAuth({ allowWhenMustChange: true })` and `withFailureSwitch('changePassword')`, following the `contracts/mock-api.md` rules. Register it in `src/client/src/mocks/handlers/index.ts`.
- [X] T079 [US7] In `src/client/src/features/auth/provider/AuthProvider.tsx`:
  - implement `changePassword({ currentPassword, newPassword })`: call `authService.changePassword`, then `refresh()`, which re-reads `/auth/me`, rewrites the hint with `mustChangePassword: false` and sets `signedIn`;
  - set `status: 'mustChangePassword'` when the context has the flag;
  - register `setPasswordChangeRequiredHandler`, which calls `router.replace('/change-password')`.
- [X] T080 [US7] Create `src/client/src/features/auth/components/ChangePasswordForm.tsx` using **react-hook-form + `zodResolver(ChangePasswordSchema)`**:
  - an explanation `Alert`: "For your security, set a new password before continuing.";
  - three `PasswordInput` fields, a submit `Button` labelled "Set a new password" with `loading`, and errors via `toUserMessage(err, 'changePassword')`;
  - on success, navigate to a safe `redirectTo` or `getDashboardPath(role)`;
  - a "Log out" secondary action.
- [X] T081 [US7] Create `src/client/src/app/(protected)/change-password/page.tsx` (thin: `PageHeader` "Set a new password" plus `ChangePasswordForm`). In `src/client/src/app/(protected)/layout.tsx`, pass an empty nav to `AppShell` when `status === 'mustChangePassword'` so only the header and account menu show (FR-044).

**Checkpoint**: SC-002 passes for all three roles.

---

## Phase 8: User Story 4 - Shared, role-aware application shell (Priority: P2)

**Goal**: The full shell has role-filtered navigation with "Coming soon" items, a mobile drawer, a "Demo data" badge, the no-permission page, and draft dashboards built from shared components.

**Independent Test**: Sign in as each role and compare the header, menu and layout; only the nav items and dashboard content differ. As a student, open `/admin/users` and see the no-permission page (quickstart "Role separation").

### Tests for User Story 4 ⚠️

- [X] T082 [P] [US4] Create `src/client/src/components/layout/SideNav.test.tsx`:
  - for each role it renders exactly the `NAVIGATION[role]` labels;
  - `available` items are links, and the current one has `aria-current="page"`;
  - `coming-soon` items have no `href`, carry `aria-disabled="true"`, are skipped by Tab, and show "Coming soon";
  - no other role's items appear.
- [X] T083 [P] [US4] Create `src/client/src/components/layout/AppShell.test.tsx`: the skip link focuses `main`; the mobile toggle has `aria-expanded`, the drawer opens and closes with keyboard and Escape, and focus returns; the "Demo data" badge shows only in mock mode; axe passes for each role.
- [X] T084 [P] [US4] Create `src/client/src/features/dashboard/components/RoleDashboard.test.tsx`: for each role, the greeting has the full name, the account details card shows email, role label (and student number and faculty for students), the shortcut cards match `NAVIGATION[role]` minus `dashboard` (coming-soon cards are non-actionable), and every unavailable section shows "Not yet available" with no numeric values (FR-025).
- [X] T085 [P] [US4] Create `src/client/src/app/(protected)/forbidden/page.test.tsx`: it renders `ForbiddenView` inside the shell with a link to the user's own dashboard.

### Implementation for User Story 4

- [X] T086 [US4] Create `src/client/src/components/layout/SideNav.tsx` (renders `NavItem[]`; `available` items use `next/link`; `coming-soon` items are a `<span aria-disabled="true">` with `ComingSoonBadge`; the current item is marked; tokens only).
- [X] T087 [US4] Complete `src/client/src/components/layout/AppShell.tsx` and `src/client/src/components/layout/AppHeader.tsx`:
  - `SideNav` is persistent at `lg` and above, and a drawer below `lg` (toggle with `aria-controls`, Escape closes, focus is managed);
  - the "Demo data" badge comes from `useIsMockMode()`;
  - the nav receives `NAVIGATION[user.role]` from `src/client/src/app/(protected)/layout.tsx`.
- [X] T088 [P] [US4] Create `src/client/src/app/(protected)/forbidden/page.tsx`, rendering `ForbiddenView` (from T030) with `getDashboardPath(user.role)`. Delete `src/client/src/app/forbidden/page.tsx`.
- [X] T089 [P] [US4] Create `src/client/src/features/dashboard/config/dashboard-sections.ts`. Per role, list the summary sections from UC-32, all with `status: 'unavailable'` (GAP-J):
  - student: "Upcoming activities", "Registration status", "Training score", "My requests";
  - manager: "My activities", "Registrations", "Upcoming activities", "Pending verifications";
  - administrator: "System activity", "Registrations", "Verified participation", "Training scores".
- [X] T090 [US4] Create the dashboard components under `src/client/src/features/dashboard/components/`:
  - `RoleDashboard.tsx`, which receives a `user` prop built from `src/client/src/hooks/useAuth.ts` by the page, without importing `features/auth` internals;
  - `AccountDetailsCard.tsx` (`SurfaceCard`);
  - `ShortcutGrid.tsx`, derived from `NAVIGATION[role]`; coming-soon cards use `ComingSoonBadge` and aren't focusable as links (FR-024a);
  - `UnavailableSection.tsx` (`EmptyState` variant "Not yet available").

  Add `src/client/src/features/dashboard/index.ts`.
- [X] T091 [US4] Update the three dashboard pages (`src/client/src/app/(protected)/student/dashboard/page.tsx`, `…/manager/dashboard/page.tsx` and `…/admin/dashboard/page.tsx`) to render `PageHeader` plus `<RoleDashboard user={useAuth().user} />`. Mark each page `'use client'`, because it needs the `useAuth` hook (allowed by C-I for hooks; analysis L8). `src/client/src/hooks/useAuth.ts` stays the single shared bridge to auth state, and `RoleDashboard` receives `user` as a prop.

**Checkpoint**: all three roles share one shell; role separation verified.

---

## Phase 9: User Story 5 - Administrator views user accounts (Priority: P2)

**Goal**: A paginated account list (name, email, role, status, created date; newest first; 10 per page) with search and a role filter, plus empty, loading and error states. It replaces the minimal page from T073.

**Independent Test**: As `admin@…`, open User Management, see the seed accounts, page through them, search `zzz` to get the empty state with "Clear filters", and see an account created in US6 appear (quickstart UC-29 A1).

### Tests for User Story 5 ⚠️

- [X] T092 [P] [US5] Extend `src/client/src/mocks/handlers/admin-users.test.ts` for `GET /admin/users`:
  - default sort `createdAt desc`, `limit` 10, correct `pagination`;
  - `search` matches name, email or student number, case-insensitively;
  - the `role` filter works;
  - a non-admin gets 403; `fail('listUsers')` returns 500.
- [X] T093 [P] [US5] Create `src/client/src/features/admin-users/components/UserListView.test.tsx`: a skeleton while loading; rows show the role label and status; the empty state with "Clear filters" resets the filters; `ErrorState` retry refetches; next and previous pages work; a 403 renders `ForbiddenView`; axe passes.

### Implementation for User Story 5

- [X] T094 [P] [US5] Create `src/client/src/components/ui/DataTable.tsx`: a semantic `<table>` with `caption`, column definitions, a skeleton row set while `loading`, and `empty`/`error` slots that render `EmptyState`/`ErrorState` full width. Include a test.
- [X] T095 [P] [US5] Create `src/client/src/components/ui/Pagination.tsx` (`<nav aria-label="Pagination">`, Previous/Next buttons and the text "Page X of Y", with disabled ends). Include a test.
- [X] T096 [US5] Add `GET /admin/users` to `src/client/src/mocks/handlers/admin-users.ts`, wrapped in `withAuth({ requireRole: 'administrator' })` and `withFailureSwitch('listUsers')`. It filters, sorts and paginates per the contract parameters and returns `UserListResponse`, omitting `permissions` in the items.
- [X] T097 [US5] Create `src/client/src/features/admin-users/hooks/useAccountList.ts`:
  - keep `search`, `role` and `page` in the URL search params, so the state survives Back and reloads;
  - debounce search by 300 ms, and reset to page 1 when a filter changes;
  - map errors with `isForbiddenError` to `status: 'forbidden'` (T030 wiring rule);
  - return `{ status: 'loading' | 'error' | 'forbidden' | 'success', data, error, retry, setQuery, clearFilters }`;
  - refetch on mount, so the list reflects new accounts after the wizard (FR-038).
- [X] T098 [US5] Create `src/client/src/features/admin-users/components/UserFilters.tsx` (search `TextInput` and role `Select` with "All roles") and `src/client/src/features/admin-users/components/UserListView.tsx` (`UserFilters`, plus `DataTable` with the columns Full name, Email, Role (`ROLE_LABEL`), Status (`Badge`) and Created (`src/client/src/libs/format.ts` date), plus `Pagination`). The empty state is "No accounts match" with a "Clear filters" action (UC-29 A1). `status === 'forbidden'` renders `ForbiddenView`.
- [X] T099 [US5] Replace the placeholder in `src/client/src/app/(protected)/admin/users/page.tsx` (from T073) with `UserListView`. Keep `PageHeader` "User Management" and the "Create account" action.

**Checkpoint**: list plus create works end to end for the administrator.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T100 [P] Create `src/client/src/features/auth/auth-accessibility.test.tsx`, running axe (following `src/client/src/features/landing/components/landing-accessibility.test.tsx`) on the login page, the "Set a new password" page and `ForbiddenView`. Fix any serious or critical violations (SC-010).
- [X] T101 Remove dead code and run a full check:
  - delete the now-empty `src/client/src/components/forms/`, if it is empty;
  - confirm that `rg -n "'admin'|\"admin\"|organizer|SessionUser|mockAuthService|NEXT_PUBLIC_MOCK_AUTH_STATE|SESSION_SECRET|console\.log|myhcmus_token" src/client/src` returns no role-code, organizer, token-cookie or debug hits;
  - confirm that `rg -n "features/auth/" src/client/src/features --glob '!src/client/src/features/auth/**'` returns no cross-feature imports (C-II);
  - confirm that `rg -n "change password|Change password" src/client/src` returns no UI copy (L6);
  - remove the unused icons `src/client/src/components/icons/UsersIcon.tsx` and `UserIcon.tsx` if they are no longer referenced.
- [X] T102 [P] Update `src/client/DEV_NOTES.md`: mock mode (`NEXT_PUBLIC_API_MODE`, `window.__myhcmusMock`, seed accounts), the session decision (token in `localStorage`, hint cookie only), the `proxy.ts` relocation, and a link to `specs/003-auth-dashboard-admin-users/docs-changes.md` for the open proposals.
- [X] T103 [P] Update `src/client/README.md`: setup (`npm install`, `npx msw init public`, `.env.example`), `npm run gen:api`, and how to switch to the real backend.
- [X] T104 Run `npm run lint`, `npm run test` and `npm run build` in `src/client/`, and fix every new error and warning. (done 2026-11-27: `npm run test` 48 files / 296 tests passed; `npx eslint .` 0 problems; `npm run build` exit 0 on retry — the first attempt was halted only by the Next.js security advisory, see HANDOFF §3)
- [ ] T105 Walk through `src/client/specs/003-auth-dashboard-admin-users/quickstart.md` in `npm run dev` with mock mode: (in progress: tick off `t105-checklist.md` sections A–G and the H config-only check. The real-mode flows against the backend are **blocked: waiting for BE**, because `src/server` has no `/api/v1`, `/auth/me`, `/auth/logout`, `/profile/password`, `/admin/*` or CORS; see GAP-E)
  - run every scenario, and record any failure as a new task;
  - **fill in the "Manual timing (SC-007)" table**, noting that SC-007 isn't measurable on the mock and must be re-checked against the real backend;
  - **do the "Consistency review (SC-011)"** across all three roles, recording any one-off variant as a task;
  - confirm `docs-changes.md` lists every deviation found during implementation;
  - switch to `NEXT_PUBLIC_API_MODE=real`, rebuild, and confirm that `git status` shows no changes under `src/client/src/app`, `src/client/src/components` or `src/client/src/features` (SC-009).
- [X] T106 Replace every raw Tailwind palette color in `src/client/src` with theme tokens (constitution C-VI, analysis C1), including the existing `Button.tsx`, `Skeleton.tsx` and landing components:
  - add `--color-on-primary`, `--color-hover-tint`, `--color-overlay`, `--color-skeleton`, `--color-surface-muted`, `--color-divider`, `--color-hero-headline` and `--color-hero-shadow` to `@theme` in `src/client/src/app/globals.css`, with the **exact previous values**, so nothing changes visually;
  - swap `text-white`, `bg-black/*`, `bg/border-slate-*`, the gradient `*-white` utilities and HeroSection's `[#FFA800]` and `rgba` shadow for those tokens;
  - the only visual change is the dev-only `/test` page button, from `bg-blue-500/600` to `bg-primary/primary-dark`;
  - a grep of `src/client/src` (excluding `globals.css` and tests) for raw palette colors, hex or `rgba` returns nothing;
  - lint, tests and build pass.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on Phase 1, and blocks all stories.
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on US1 (same login form, handlers and provider).
- **US3 (Phase 5)**: depends on US1. It can run in parallel with US2, coordinating edits to the shared files `mocks/handlers/auth.ts` and `AuthProvider.tsx`.
- **US6 (Phase 6)**: depends on Phase 2 and US1 (an admin session is needed). Independent of US2 and US3.
- **US7 (Phase 7)**: depends on US1, US3 (logout in the flow) and US6 (T076 creates accounts). It is executed directly after US6 (M3).
- **US4 (Phase 8)**: depends on US1. It replaces the US1 dashboard pages, and can run in parallel with US2, US3, US6 and US7.
- **US5 (Phase 9)**: depends on US6 (T064, T067, T073).
- **Polish (Phase 10)**: depends on all stories.

### Story completion order (graph)

```text
Setup → Foundational → US1 ─┬─► US2
                            ├─► US3 ─────────┐
                            ├─► US6 ─► US7 ◄─┘ ─► US5 ─► Polish
                            └─► US4 ──────────────────────┘
```

### Within each story

- Tests are written first and must fail, then types/mappers, then services and mock handlers, then hooks, then components, then routes.
- `[P]` tasks touch different files and have no incomplete dependencies.

## Parallel Examples

**Phase 2** (after T001–T005): T006, T007, T008, T009, T010, T013, T014, T015, T017, T022–T027 and T030 in parallel. Then T011 (needs T007, T008, T010), T012, T016, T018–T021, T028 and T029.

**US1**: T031, T032 and T033 together. Then T034 → T035 → T036, alongside T037 and T039; then T038 → T040 → T041 → T042 → T043.

**US6**: T060, T061, T062 and T063 together; then T064, T065, T066 and T070 together; then T067 → T068 → T069 → T071 → T072 → T073.

**US7**: T074, T075, T076 and T077 together, then T078 → T079 → T080 → T081.

**US4**: T082, T083, T084 and T085 together; then T088 and T089 together; then T086 → T087 → T090 → T091.

**US5**: T092 and T093, then T094 and T095, then T096 → T097 → T098 → T099.

## Implementation Strategy

### MVP first

1. Phase 1, then Phase 2.
2. US1, then **stop and validate** quickstart H1–H3.
3. US2 and US3, completing the auth loop. This is the demoable MVP: log in or out for every role, with every UC-01 and UC-02 flow, plus disabled-mid-session and two-tab handling.

### Incremental delivery

4. US6 delivers admin account creation from a minimal User Management page.
5. US7 adds "Set a new password", so SC-002 passes end to end right after US6.
6. US4 makes the shell and dashboards consistent.
7. US5 adds the account list in place of the placeholder.
8. Polish, with timing, the consistency review and the docs-changes check.

Each checkpoint leaves lint, test and build green.

### Notes

- Commit after each task or small group; keep one story per PR where possible.
- Gap-dependent pieces only work on the mock until the BE accepts them. See spec "API Gaps" and [docs-changes.md](./docs-changes.md): GAP-A/B/C/M/N/O.
