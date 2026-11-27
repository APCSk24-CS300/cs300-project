# Research: Role-Based Dashboard Shell, Authentication, and Administrator Account Registration

**Feature**: `003-auth-dashboard-admin-users` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

Each item resolves an unknown in the plan's Technical Context. Format: Decision / Rationale / Alternatives considered.

---

## R1. Mock strategy: network-level mock (MSW) instead of per-feature mock classes

**Decision**: Use **MSW 2.x** (`msw`) with the same request handlers in two places: `setupWorker` in the browser (dev/demo) and `setupServer` from `msw/node` in Vitest. Feature services have one real implementation that always calls `@/libs/api-client`. In mock mode the browser worker intercepts those HTTP requests at the contract paths under `NEXT_PUBLIC_API_BASE_URL`.

**Rationale**:
- The plan input asks for requests that "still go over HTTP with the real paths and status codes", so a mock at the network layer is the only way the mock exercises the real service, API client, error normalization and status-code branches.
- One handler set serves both the app and the tests, so mock behavior can't drift between them.
- Switching mode needs only `NEXT_PUBLIC_API_MODE`; no page, component or service changes (FR-039, SC-009).

**Alternatives considered**:
- *Mock service classes* (the current `mock.auth.service.ts` pattern): this skips HTTP, so status codes, the envelope, headers (`Retry-After`, `ETag`) and the API client's error mapping are never exercised. Rejected for auth/admin; kept for the existing landing `activities` feature (out of scope). Client constitution v1.1.0 Principle IV now explicitly accepts MSW handlers as the mock form, so no deviation remains.
- *Next.js route handlers as the mock backend* (the current `app/api/auth/login/route.ts`): state would live in server memory and be lost on restart, and the URL is not the contract URL. Rejected.
- *json-server / Prism*: Prism can mock from `openapi.yaml`, but it is stateless (a created account can't log in) and needs a separate process. Rejected.

---

## R2. Session transport and the route guard (decided with the user, Q4)

**Decision** (follows `src/server`, refined in analysis H1): login returns a **bearer JWT in the response body**.
- **Token storage**: the client stores the token in **`localStorage`** under the key `myhcmus:token`. It never goes in a cookie, so it is not sent with page requests to the Next server.
- **Sending the token**: the API client reads it and sends `Authorization: Bearer <token>` only to `NEXT_PUBLIC_API_BASE_URL`.
- **Session hint**: a cookie `myhcmus_session` (`Path=/`, `SameSite=Lax`, `Secure` on https, `Max-Age` = token `exp`) holds a non-sensitive hint (`role`, `mustChangePassword`, `exp`), written after `GET /auth/me`.
- **Route guard**: `src/proxy.ts` reads only the hint to redirect (no session → `/login`; wrong role → `/forbidden`; must change password → `/change-password`). It is cosmetic (constitution IV). A forged hint gives access to no data, because every API call needs the token.
- **Cross-tab**: a `storage` event on `myhcmus:token` (logout or expiry in another tab) makes `AuthProvider` clear its state and redirect to `/login` (spec FR-018b).
- **Hint hygiene**: because the hint is a separate cookie, it can outlive the token, e.g. when local storage is cleared. The client clears the hint every time it finds no valid token, so `proxy.ts` rule 1 (`/login` with a valid hint → dashboard) can't loop (spec FR-018c).

**Rationale**:
- **What the server does**: `src/server/src/services/AuthService.ts` issues `jwt.sign({ sub, name }, secret, { expiresIn: "1h" })` and returns it in `payload.data.token`. `ValidatorMiddleware.validateAccessToken` reads only the `Authorization: Bearer` header, and the server sets no cookies. Holding the token client-side is the only design that drops in against that backend unchanged.
- **Why localStorage**: a `Path=/` cookie would be sent on every page request to the Next origin, which contradicts "sent only to the API origin" (spec FR-010).
- **Why the hint is a cookie**: browser MSW can't set `HttpOnly` cookies, and proxy.ts runs on the Next server, where it can't read `localStorage`. So only the non-sensitive hint is a cookie.
- **Where the role comes from**: the server token carries no role claim, so the role comes from `/auth/me` (contract) and is copied into the hint. The hint is never trusted for data.

**Alternatives considered**:
- A token cookie readable by JS (the earlier draft): it leaks the token to the page origin. Rejected in analysis H1.
- A BFF with an `HttpOnly` cookie and MSW in Node with a JSON-file store: more secure, but it differs from the server's mechanism and was declined by the user (Q4).

**Refresh**: none. The server has no refresh endpoint, and the contract defines none. On expiry (a `401 UNAUTHENTICATED` from any call, or a hint whose `exp` is in the past), the client clears the token and the hint and redirects to `/login?reason=expired&redirectTo=<path>` (FR-018).

**Disabled mid-session (H3)**: a `403 ACCOUNT_DISABLED` from any authenticated call (gap GAP-N) clears the token and the hint and redirects to `/login?reason=disabled` (FR-018a).

**Logout invalidation**: the client calls `POST /auth/logout` (API-GAP-002 proposal). The mock adds the token's `jti` to a revoked list in its store, and any later request with that token gets `401`. The client always clears the token and the hint, even on network failure (UC-02 A3). The server has no logout yet (GAP-E), so in real mode the token stays valid server-side until `exp`. This is recorded, not worked around.

**Back-navigation (UC-02 A4)**: proxy sets `Cache-Control: no-store` on every protected response. The protected shell also re-checks the hint on `pageshow` (bfcache restore) and calls `router.replace('/login')` if the session is gone.

---

## R3. Mock persistence

**Decision**: A small versioned store in `localStorage` under the key `myhcmus:mock-db:v1`, holding `users`, `faculties`, `roles`, `rolePermissions`, `revokedTokens` and `loginAttempts`.
- It is seeded on first read, or when the version is missing.
- It is reset via `window.__myhcmusMock.reset()` (dev only) or by clearing site data.
- Under Vitest it uses jsdom's `localStorage`; each test calls `resetMockDb()`.

**Rationale**: The plan input requires persistence across reloads so admin-created accounts can log in (FR-041). Wrapping it in a typed store module with `read`/`write`/`reset` keeps handlers pure and testable.

**Alternatives**: IndexedDB (async and heavier, no benefit at this size); `sessionStorage` (lost when the tab closes, which breaks "log out → log in as new account" across tabs).

**Mock token signing**: `jose` `SignJWT` (already a dependency), using HS256 with a constant mock-only key in `src/mocks`. The claims mirror the server (`sub`, `name`, `exp` = 1h) plus `jti` for revocation. The key is public by design: mock tokens confer nothing in real mode.

---

## R4. Typing the API from `openapi.yaml`

**Decision**: Add **`openapi-typescript` 7.x** as a devDependency. The script `npm run gen:api` generates `src/types/openapi.gen.ts` from `../../docs/api/openapi.yaml` (read-only source; the generated file lives in `src/client`). The generated file is committed, and CI or a reviewer re-runs it when the contract changes.
- Shapes that are not in the contract yet (API gaps) are hand-written in `src/types/openapi-gaps.ts`. Each one is tagged with its GAP ID: login request/response, `ACCOUNT_LOCKED` and related codes, `CreateUserRequest.initialPassword`, `Profile.mustChangePassword`.
- DTO files re-export from these two sources only.

**Rationale**: It gives one source of truth for wire types, and makes the gaps visible and greppable for removal once BE accepts them (constitution II, "never invent fields").

**Alternatives**: hand-written DTOs only (they drift from the contract); `openapi-fetch` as the transport (it would replace `@/libs/api-client`, which client constitution III forbids).

---

## R5. API client upgrades

**Decision**: Extend `src/libs/api-client.ts` in place (no second client):
1. **Base URL** comes from `NEXT_PUBLIC_API_BASE_URL` (contract default `http://localhost:8080/api/v1`).
2. **Auth header**: a `tokenProvider` hook injects `Authorization: Bearer`.
3. **Errors are normalized** into `ApiError { status, code, message, fieldErrors, retryAfterSeconds }`. `code` is read from `ErrorResponse.code`. Network failures become `NETWORK_ERROR` and non-JSON bodies become `UNKNOWN`. Raw text never reaches the UI (FR-011).
4. **Session callbacks** registered by `AuthProvider`: `onUnauthorized` handles global expiry (FR-018); `onAccountDisabled` handles 403 `ACCOUNT_DISABLED` (FR-018a); `onPasswordChangeRequired` handles 403 `PASSWORD_CHANGE_REQUIRED` (FR-044).
5. **Envelope unwrap helper** `unwrap<T>(res): T` for `{ success, data }`.
6. **Header access** for `ETag` and `Retry-After`.

**Rationale**: Client constitution III mandates a single transport boundary.

---

## R6. Mode switch

**Decision**: `NEXT_PUBLIC_API_MODE=mock|real`, read in `src/libs/service-mode.ts`, which already exists. The existing `NEXT_PUBLIC_DATA_SOURCE=mock|api` stays as a deprecated fallback so the landing activities keep working. The default is `mock` in development. `real` must be set explicitly.
- In mock mode, `src/mocks/MockProvider.tsx`, a client component in the root `Provider`, awaits `worker.start({ onUnhandledRequest: 'bypass' })` before rendering its children. A small "Demo data" badge is shown when mode is mock (edge case in the spec).

**Rationale**: It reuses the existing selection point instead of adding a parallel one (no duplication rule).

**Caveat**: In mock mode, data fetching for these screens MUST happen client-side, because the browser worker can't intercept Server Component fetches. This is acceptable: all screens in scope are interactive and session-bound.

---

## R7. Route guard placement and rules

**Decision**:
- **Move** `proxy.ts` from `src/client/proxy.ts` to `src/client/src/proxy.ts`. Next 16 loads Proxy only "at the same level as `app`" (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). At the current location it is not picked up.
- Its rules come from a pure function `resolveRouteAccess(pathname, hint, now)` in `src/libs/route-access.ts`. It returns `allow | redirect(login) | redirect(forbidden) | redirect(change-password) | redirect(dashboard)` and is unit-tested.
- A **second layer** runs in the protected layout's client shell (`RequireSession`). It uses the same function against `AuthProvider` state, covering client-side navigation, bfcache, and expiry detected by the API client.
- Fixes along the way: the `/forbiden` typo, and the already-authenticated redirect on `/login`, which was a `return` inside `forEach` and so had no effect (UC-01 A7). Debug `console.log`s are removed.

**Rationale**: Proxy gives the fast, flash-free redirect. The layout guard covers what Proxy can't see. Both stay cosmetic, and the API enforces (FR-021).

---

## R8. Role code alignment

**Decision**:
- `ROLE_CODES = ["student", "manager", "administrator"]`. URL prefixes stay `/student`, `/manager`, `/admin` (the URLs are not role codes).
- A `ROLE_ROUTE_PREFIX` map in `roles.ts` and a `ROLE_LABEL` map ("Student", "Manager", "Administrator") are the single sources.
- Update `navigation.test.ts` and any fixtures that use `admin`.

**Rationale**: The contract's `UserRole` enum and the domain rules say exactly these three codes (FR-022).

---

## R9. Navigation model with "Coming soon"

**Decision**: `src/libs/navigation.ts` exports `NAVIGATION: Record<RoleCode, NavItem[]>`, where `NavItem = { id, label, href, status: 'available' | 'coming-soon', ucId }`. Items follow spec FR-024. `SideNav` renders `coming-soon` items as non-link elements with `aria-disabled="true"`, a "Coming soon" badge, and no `href` (FR-024). `getDashboardPath` derives from `id === 'dashboard'` rather than from the label.

**Rationale**: Enabling a feature later becomes a one-line status change. The same list feeds the dashboard shortcuts (FR-024a), so the two can't diverge.

---

## R10. Temporary password generator

**Decision**: A pure function `generateTemporaryPassword({ fullName, role, studentNumber }, random)` in `src/features/admin-users/lib/temporary-password.ts`. It strips diacritics with `normalize('NFD')`, removes combining marks, and maps `đ/Đ → D`. It takes the initials of non-empty words and uppercases them, then appends the suffix rule from FR-036. `random` is injected, so the random digits are deterministic in tests and come from `crypto.getRandomValues` in the app.

**Rationale**: FR-036 requires the rule to be defined in one place so it can become stricter later. It also needs to be testable for Vietnamese names.

---

## R11. Account-creation request and gap fields

**Decision**: `POST /admin/users` with the contract `CreateUserRequest` plus the gap field `initialPassword` (GAP-C). In the review step, permissions come from `GET /admin/roles` (to resolve `roleId` by `code`) followed by `GET /admin/roles/{roleId}/permissions` (NFR-USA-13). Faculties come from `GET /admin/faculties`. The mock responds:
- `400 ROLE_POLICY_VIOLATION` when student number or faculty is sent for a non-student role (example policy, GAP-H);
- `400 VALIDATION_FAILED` with `errors[{ field: 'role' }]` when `role` is an array or otherwise not a single enum value (A11);
- `409 DUPLICATE_VALUE` with a field error for a duplicate email (case-insensitive) or student number;
- `201 AdminUserResponse` on success, setting `mustChangePassword: true`.

**Double submission**: the confirm button is disabled while the request is pending (FR-037), and the wizard keeps a single in-flight promise.

---

## R12. Login errors and lock (gap codes, GAP-B)

**Decision**: The mock returns these for `POST /auth/login`:

| Case | Status | `code` | Notes |
|---|---|---|---|
| unknown email or wrong password | 401 | `INVALID_CREDENTIALS` | same message for both |
| inactive account | 403 | `ACCOUNT_DISABLED` | |
| 5th consecutive failure, or locked | 423 | `ACCOUNT_LOCKED` | `Retry-After` header (seconds) |
| outage trigger | 503 | `SERVICE_UNAVAILABLE` | |
| account with no role | 200 | — | `/auth/me` returns `role: null`, so the client applies A6 |

The client also handles `403 ROLE_MISSING` should the BE choose to return it. Failure triggers for tests and demos are listed in [contracts/mock-api.md](./contracts/mock-api.md).

---

## R13. Testing approach

**Decision**:
- **Vitest + Testing Library + `msw/node`**, reusing the app handlers.
- **Unit tests** cover `route-access`, `temporary-password`, mappers, `api-client` error normalization, and the mock store.
- **Integration tests** render pages or forms inside providers against the MSW server, and cover each alternative flow in SC-003.
- **Accessibility**: the existing `axe-core` helper runs on each new screen (SC-010).
- **No Playwright**: no browser E2E tool is installed and adding one is not justified for this phase. The full click-through is covered by [quickstart.md](./quickstart.md) manual scenarios.

---

## R14. Dependencies to add

| Package | Type | Why existing code isn't enough |
|---|---|---|
| `msw` ^2.7 | devDependency (worker is dev/demo only) | Network-level mock with real paths and status codes (R1). Its `mockServiceWorker.js` is generated into `public/` via `npx msw init public`. |
| `openapi-typescript` ^7 | devDependency | Generate wire types from the contract (R4). |

No new runtime dependency. `jose`, `zod` and `react-hook-form` are already present.
