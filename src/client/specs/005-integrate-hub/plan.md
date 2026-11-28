# Plan 005: Integrate the University Service Hub (origin/dev) into the 003 frontend

**Branch**: `feat/frontend/integrate-hub` (from `feat/frontend/auth-dashboard-admin-users`, HEAD `bdc9ae9`)
**Merging**: `origin/dev` at `95b150f`. Merge-base `a516b98` (PR #95).
**Status**: Approved 2026-11-28. Step 1 (merge) done in `f361f68`; rollback tag `pre-hub-merge` = `bdc9ae9`.
**Date**: 2026-11-28

## Approved decisions (override the options in §6 and §8)

**Answers**
- **Q1, real-mode token.** The forwarder passes the user's bearer on to the backend. The `DEV_BACKEND_TOKEN` fallback is used only when **all** of these hold, and each use logs a server warning:
  - `NODE_ENV !== "production"`;
  - `ALLOW_DEV_BACKEND_TOKEN=true`;
  - the request has no `Authorization` header.

  It is off by default, so permission bugs are not hidden by everyone acting as `SEED-ADMIN`.
- **Q2.** Test real mode with a minted token until BE login is DB-backed. Note this in `HANDOFF.md` and `quickstart.md`.
- **Q3.** Shared `/services` for all roles.
- **Q4.** Keep `features/services`, with no rename. A teammate is still on `feat/university-service-hub`.
- **Q5.** The service-link form is a dialog.
- **Q6.** Union-resolve the root `.gitignore` in the merge.
- **Q7.** Accept the hub envelope through the single adapter. DOC-16 is also written as a request that BE adopt the OpenAPI envelope.

**Plan changes**
1. **Mock DB.** No key bump. `readDb` migrates: if `serviceLinks` is missing, it seeds it and keeps the existing users and sessions. This replaces §6 "bump to v2" and removes risk R4.
2. **R2.** Before dev's hub tests are deleted, `coverage.md` lists every spec 004 acceptance scenario (US1–US3) and the test that covers it after the rewrite. No scenario may lose coverage.
3. **R7.** A DOC entry lists which parts of dev's `docs/` edits (component diagrams, `student.md`) are stale after the adaptation (RoleNav, mock classes, factories). `docs/` itself is not edited.

**Execution rules**
- Follow §7, with a checkpoint after step 1.
- Steps 2–9: one commit per step, with test, lint and build after each.
- At the end, `git diff origin/dev -- src/server src/db` must be empty.

**Step 1 notes**
- §2 put the `/services` route rule and the navigation entries into the C7 and C8 resolutions. They moved to step 3, and the merge took ours unchanged for both files.
- Until step 3, `/services` is guarded client-side only, by `RequireSession` in the `(protected)` layout.

## 0. Dry run

- **How it ran.** `git merge-tree --write-tree HEAD origin/dev` does the same merge as `git merge --no-commit --no-ff`, but in memory, so the working tree was never touched and no abort was needed.
- **Size.** origin/dev adds 26 commits and 89 files (+5375 / −361). We add 14 commits and 187 files.
- **Result.** 8 files conflict. `src/client/tests/setup.ts` and `src/client/.gitignore` merge cleanly.

| # | Conflicting file | Type |
|---|---|---|
| C1 | `.gitignore` (repo root) | content |
| C2 | `src/client/.env.example` | add/add |
| C3 | `src/client/src/app/(protected)/admin/dashboard/page.tsx` | content |
| C4 | `src/client/src/app/(protected)/manager/dashboard/page.tsx` | content |
| C5 | `src/client/src/app/(protected)/student/dashboard/page.tsx` | content |
| C6 | `src/client/src/libs/api-client.ts` | content |
| C7 | `src/client/src/libs/navigation.ts` | content |
| C8 | `src/client/src/libs/roles.ts` | content |

**Root cause of almost everything below:** the hub frontend (PR #105) was written on top of the **pre-003** frontend. That frontend had:
- role code `admin`;
- `ROLE_RULES` and `NAVIGATION_ITEMS`;
- a signed `session` cookie with `SESSION_SECRET`;
- an `api-client` with no error model;
- mock service classes.

003 replaced all of these, so many dev files merge *textually* but will not compile or will duplicate our infrastructure (§3).

---

## 1. What origin/dev adds since the merge-base

### BE (`src/server`), spec 004, all new except `app.ts`
- **Wiring.** `app.ts` mounts `/api/v1/hub` and `/api/v1/admin/services`, and shares one `requirePermission` with the AI routes.
- **Routes** (`routes/HubRoute.ts`). Middleware order: method → `validateAccessToken` (Bearer) → `requirePermission(hub.services.read | hub.services.manage)` → content type → controller.
- **Layers.**
  - `controllers/HubController.ts`;
  - `services/HubService.ts`;
  - `repositories/ServiceLinkRepository.ts` (transaction plus `AuditLog` row);
  - `types/ServiceLink.ts`;
  - `helper/validateServiceLinkRequest.ts`;
  - `helper/generate412Response.ts`.
- **Tests.** `tests/integration/hub.test.ts`, `tests/unit/HubService.test.ts`, `tests/unit/validateServiceLinkRequest.test.ts`, `tests/helpers/fakes.ts`.
- **Dev script.** `scripts/mint-dev-token.ts`, dev-only. It signs `{ sub: <DB user_id> }` with `JWT_SECRET`.
- **Not added:** CORS (the server has none) and a DB-backed login. `/api/auth/login` is still in-memory and unversioned.

### DB (`src/db`)
- **`hub_schema.sql`.** Additive and idempotent:
  - adds `ServiceLink.version INT DEFAULT 1` and a URL `CHECK`;
  - adds permissions 910 `hub.services.read` (all three roles) and 911 `hub.services.manage` (administrator);
  - seeds the six agreed links.
- **`hub_schema_test.sql`.**
- **The seed is now split** (PR #103): `seed.sql` is an activator that runs `seed_lookups_and_junctions.sql`, `seed_entities.sql` and `seed_ai.sql` in one transaction. Demo accounts include `SEED-ADMIN` and `SEED-STUDENT-1`. `README.md` documents the run order.
- **No migrations framework.** Ordering is by SQL file, as described in the README.

### HUB FE logic (`src/client`)
- **`features/services/`:**
  - `types/` (`UniversityServiceDTO` including `version`; `BackendEnvelope<T>` = `{ success, statusCode, payload: { message, data } }`);
  - `mappers/service.mapper.ts` (sorting, `isSafeHref`, icon lookup);
  - `services/hub.service.ts` (`RealHubService`);
  - `mock.hub.service.ts`, `mock.store.ts` (in-memory), `service.fixtures.ts` (the six links, from 2b751c2);
  - `hub.service.factory.ts` (`getDataSource()`);
  - `hooks/useUniversityServices.ts`;
  - `config/content.ts`, `config/icons.ts`.
- **`features/services/admin/`:**
  - `admin-hub.service.ts` (Real: `api.request("POST"|"PATCH"|"DELETE", …)` with `If-Match`);
  - `mock.admin-hub.service.ts` (409 / 412 / 404 rules);
  - its factory;
  - `hooks/useAdminServiceLinks.ts`;
  - `schema/serviceLink.schema.ts` (zod).
- **libs:**
  - `api-client.ts` (6fe7c5c);
  - `roles.ts` (d7d6dea: `/services` rule, `toBackendRole` / `fromBackendRole`);
  - `navigation.ts` (81ee068);
  - `backend-path.ts` (allowlist: `hub/*`, `admin/services*`).
- **`app/api/backend/[...path]/route.ts`** plus its test (5bb5b2f). This is a dev BFF forwarder. It adds `Authorization: Bearer ${DEV_BACKEND_TOKEN}` and forwards the method, query, JSON body, `If-Match`, and back the `ETag`.
- **`tests/setup.ts`** (6055e57): the `matchMedia` mock is guarded with `typeof window` so that node-environment tests (the route handler) can run.

### HUB FE UI
- **`app/(protected)/services/page.tsx`** (all roles) and **`app/(protected)/admin/services/page.tsx`**. Both import `globals.css`, `RoleNav` and `Container`.
- **`components/layout/RoleNav.tsx`**, a horizontal nav built from `NAVIGATION_ITEMS` and `AuthContext`.
- **Components:**
  - `features/services/components/` (`ServiceCard`, `ServiceGrid`, `ServiceGridSkeleton`, `ServiceHub`, with tests);
  - `features/services/admin/components/` (`AdminServiceLinks`, `ServiceLinkForm`, with tests).
- **Landing** (1837a19, 2b751c2):
  - `ServicesSection` shows a live hub list for signed-in users and the locked preview for guests;
  - `features/landing/config/services.ts` is slimmed to the preview;
  - the landing `ServiceCard` became a re-export.
- **Image.** `public/images/services/default.svg`.
- **Dashboards.** dev adds `<RoleNav />` to the three old placeholder dashboard pages.

### Non-HUB
- **Seed data:** the split seeds above (fbcadc5, PR #103).
- **ai-guard** (PR #109): merge commit only. Its server files were already in the merge-base or touch nothing in the diff list; nothing in `src/client`.
- **Docs, edited by dev (we only receive them):**
  - `docs/api/openapi-changes.md` (API-GAP-HUB-01);
  - `docs/analysis-and-design/{be,fe}/component-diagram-*.md`;
  - `docs/analysis-and-design/client/pages/student.md`;
  - `docs/guides/ai-assistant-setup.md`.
- **Reports:** `docs/management/reports/PA4/weekly-reports.md` and two PNGs.
- **Spec Kit:** `src/specs/004-university-service-hub/*` (spec, plan, research, data-model, contracts, quickstart, tasks, checklist). It sits outside `src/client/specs`, and we leave it there.
- **Root `.gitignore`:** a code-review-graph block.

---

## 2. Conflicts and proposed resolution

| # | Ours (003) | Theirs (dev) | Resolution |
|---|---|---|---|
| C1 `.gitignore` | Ignores `CLAUDE.md`, `.specify/`, `.claude/`; comments out `!src/.specify/memory/constitution.md` | Adds the code-review-graph block (`.code-review-graph/`, `/.claude/`, `/.mcp.json`, `/CLAUDE.md`, `/.venv/`) | **Union.** Keep our lines and add dev's block. The duplicate `CLAUDE.md` / `.claude` lines are harmless; keep one of each. This file is outside `src/client`, but resolving it is part of the merge you are doing (open question Q6). |
| C2 `src/client/.env.example` | `NEXT_PUBLIC_API_MODE=mock`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1` | `SESSION_SECRET`, `NEXT_PUBLIC_DATA_SOURCE`, `NEXT_PUBLIC_API_BASE_URL=/api/backend`, `BACKEND_API_URL`, `DEV_BACKEND_TOKEN` | **Ours, plus a real-mode block.** Add `BACKEND_API_URL` (server-only, the target of the forwarder) and a commented real-mode `NEXT_PUBLIC_API_BASE_URL=/api/backend`. Drop `SESSION_SECRET` (003 removed the cookie-JWT route; `src/app/api/` does not exist). `NEXT_PUBLIC_DATA_SOURCE` stays readable as the legacy fallback in `service-mode.ts`, but is not advertised. Whether `DEV_BACKEND_TOKEN` stays depends on Q1. |
| C3–C5 dashboard pages | Thin page: `useAuth()` → `<RoleDashboard user>` inside AppShell / SideNav | Old placeholder page plus `<RoleNav />` | **Ours.** `RoleNav` is not needed because SideNav renders the role nav (§3). The "University Services" shortcut goes into our `dashboard-sections.ts` / `ShortcutGrid` instead. |
| C6 `libs/api-client.ts` (6fe7c5c) | Already passes `method`. `ApiError({status, code, message, fieldErrors: Record, retryAfterSeconds})`. Reads OpenAPI `{code, message, errors[]}`. `request(endpoint, method, opts)` returns `{data, headers}`. Bearer from the token store, attached only to the API origin. Session callbacks. | Fixes `method` (same bug, already fixed by us). `ApiError(status, message, details)` with `fieldErrors: ApiFieldError[]`. Reads `payload.data.details`. `ApiResult {body, etag}`. `request(method, endpoint, opts)`. | **Ours, extended.** Teach `toApiError` the backend `ServiceResponse` error shape too: `message` ← `payload.message`; `fieldErrors[field]` ← `payload.data.details[].message`; `code` ← `details[0].code` when it is a known code (e.g. `DUPLICATE_VALUE`), otherwise the status mapping (412 → `PRECONDITION_FAILED`, 409 → `DUPLICATE_VALUE`, 503 → `SERVICE_UNAVAILABLE`). Add `ApiError.details` (raw) and a helper `etagOf(headers)` → version. Do not take dev's constructor or argument order. Port the hub callers instead (§3). |
| C7 `libs/navigation.ts` (81ee068) | `NAVIGATION: Record<RoleCode, NavItem[]>` with `id`, `status` and `ucId`. Student "University Services" is `/student/services`, `coming-soon`. | `NAVIGATION_ITEMS` keyed `admin`, adding "University Services" `/services` for all roles and "Service Links" `/admin/services` | **Ours.** Student `services` → `href: "/services"`, `available`. Add `{id:"services", label:"University Services", href:"/services", status:"available", ucId:"UC-07"}` for manager and administrator. Add administrator `{id:"service-links", label:"Service Links", href:"/admin/services", status:"available", ucId:"UC-30"}` (BR-ADM-01). Update DOC-11. |
| C8 `libs/roles.ts` (d7d6dea) | `ROLE_CODES = student, manager, administrator` (the contract codes); `ROLE_ROUTE_PREFIX`; `getRoleForPath` | `ROLE_RULES` with a `/services` rule for all roles; `toBackendRole` / `fromBackendRole` (`admin` ⇄ `administrator`) | **Ours.** The mapping is obsolete because our role codes already equal the backend and DB codes; nothing on dev calls the mapping except its own file. The `/services` rule moves to `libs/route-access.ts`: add `"/services"` to `PROTECTED_SHARED_PATHS`, so any signed-in role is allowed and the session / change-password rules still apply. Add a route-access test. |
| (clean) `tests/setup.ts` (6055e57) | Our MSW, mock store, navigation mock | Guard `matchMedia` with `typeof window` | **Keep the auto-merge.** Also guard the `HTMLElement` / `HTMLDialogElement` / `window.scrollTo` blocks. They already have guards, so the route-handler test can run under `// @vitest-environment node`. Check that `beforeEach` (localStorage, cookie) is skipped when there is no `window`, otherwise the forwarder test crashes. |
| (clean) `src/client/.gitignore` | `.env*` | `!.env.example` | Keep. |

---

## 3. Silent overlaps (merge cleanly, but break or duplicate)

| Overlap | dev | ours | Action |
|---|---|---|---|
| Two API client styles | Hub services call `api.request("POST", url, {body, headers})` and expect `{body, etag}`; `new ApiError(409, msg, details)`; `api.get(url, {signal})` | `api.request(url, "POST", {body, headers})` → `{data, headers}`; `ApiError({…})` | **Will not compile.** Port `admin-hub.service.ts`, `AdminServiceLinks.tsx` and `ServiceLinkForm.tsx` to our signature and our `ApiError` (`code`, `fieldErrors` record). The version comes from the DTO `version` (ETag only as a fallback). |
| Two role-nav systems | `RoleNav.tsx` imports `NAVIGATION_ITEMS` (gone after C7) and `@/libs/cn` | `SideNav` / `AppShell` from `NAVIGATION` | **Delete `RoleNav.tsx`.** The hub pages render inside our `(protected)` layout. |
| Two auth / token paths | Forwarder injects `DEV_BACKEND_TOKEN`, minted by `mint-dev-token.ts` for a DB user; ignores the browser | `AuthProvider`, a bearer in `localStorage`, `api-client` attaches it, session-hint cookie, proxy guards | **One path:** our session. The forwarder passes on the browser's `Authorization` header (see §6). `DEV_BACKEND_TOKEN` survives at most as a dev-only fallback (Q1, Q2). |
| Two mock strategies | `MockHubService` / `MockAdminHubService` plus an in-memory `mock.store` (resets on reload) and `getDataSource()` factories | MSW network mocks over `localStorage` `myhcmus:mock-db:v1` (C-IV v1.1.0) | **Replace with MSW handlers** (§6). Delete the mock classes, `mock.store`, `service.fixtures` (move the six links into the mock seed) and both factories. One real service per feature. |
| Two async-state hooks | `useUniversityServices`, `useAdminServiceLinks` (own abort / requestId logic) | `useAsyncResource` (admin-users), `useForbidden` / `isForbiddenError`, `status: 'forbidden'` | Rebuild both hooks on `useAsyncResource`, so a 403 gives our forbidden state and the wiring rule is followed. Move `useAsyncResource` from `features/admin-users/hooks` to `src/hooks` because it is now shared. |
| Error copy | Literal strings in components and `config/content.ts` | `toUserMessage(error, context)` is the only error-to-copy mapper (FR-011) | Add `ErrorContext` values `"hub"` and `"manageServiceLink"`. 409 → "A service with this name already exists". 412 → "This link was changed by someone else. Reload to see the latest." Field errors come from `fieldErrors`. |
| Styles outside our tokens (C-VI) | `RoleNav` (`bg-black/5`, `border-slate-200`); `AdminServiceLinks` (`bg-green-50`, `bg-red-50`, `bg-slate-100`, `text-green-800`, `text-red-700`, `text-slate-700`, `border-slate-*`); `ServiceLinkForm` (`border-red-500`, `border-slate-300`, `text-red-600`); landing `ServicesSection` (`text-white`, `text-white/80`) | `@theme` tokens in `globals.css` | Replace with tokens plus our primitives (`Tag` / `Badge` for status, `FormField` / `TextInput` for inputs, `Alert` for messages). Add a token only if one is missing, and only in `globals.css`. |
| Pages importing `@/app/globals.css` | Both hub pages | Imported once in the root layout | Remove the import. |
| Test helpers | Hub tests use `expectNoA11yViolations` (missing in our `tests/test-utils.tsx`), `renderWithProviders`, `createAuthContextValue` | The last two exist | Add `expectNoA11yViolations` (axe; check `vitest-axe` / `jest-axe` is a dependency). Otherwise rewrite those assertions. Tests that inject mock service classes switch to MSW. |
| Landing services | `ServicesSection` uses `useContext(AuthContext)?.user`; card moved to `features/services` | Our `AuthContextValue.user: CurrentUser \| null` (compatible) | Keep dev's behaviour (locked preview for guests, up to 6 live cards when signed in). It stays on raw context (no throw outside the provider), but with tokens and our `ErrorState` compact variant. |
| `proxy.ts` `/forbiden` typo fix (004 R-09) | Targets the old proxy | Ours already uses `/forbidden` | Nothing to do. Check that the merged `proxy.ts` is ours. It did not conflict, so dev did not touch it after the merge-base. |

---

## 4. What HUB implements and how its BE contract differs

**Use cases:**
- **UC-07** University Services Hub (basic flow plus A1 empty, A2 close, A3 external failure, A4 retryable error).
- **Service-link administration**: BR-ADM-01 / BR-ADM-03, part of the UC-30 system-configuration area.

**`openapi.yaml` 1.2.0 operations:**

| Operation | Path | BE | dev FE uses |
|---|---|---|---|
| `listUniversityServices` | `GET /hub/services` | yes | yes (hub page, landing) |
| `getUniversityService` | `GET /hub/services/{serviceId}` | yes (404 when inactive) | no |
| `adminListServices` | `GET /admin/services?includeInactive=true` | yes | yes |
| `createServiceLink` | `POST /admin/services` | yes | yes |
| `updateServiceLink` | `PATCH /admin/services/{serviceId}` | yes (also reactivates) | yes |
| `deactivateServiceLink` | `DELETE /admin/services/{serviceId}` | yes (soft) | yes |

**Differences:**

| Aspect | `openapi.yaml` | Hub BE (API-GAP-HUB-01, accepted) | Our 003 assumptions (`docs-changes.md`) |
|---|---|---|---|
| Base path | `/api/v1` | `/api/v1/hub`, `/api/v1/admin/services` ✔ | `http://localhost:8080/api/v1` ✔. But the BE's `/api/auth` is unversioned and in-memory, so our `/auth/*` calls have no real target yet (DOC-03, API-GAP-002). |
| Success envelope | `{ success, data }` | `{ success, statusCode, payload: { message, data } }` | `unwrap()` reads `.data` |
| Error envelope | `ErrorResponse { success, code, message, errors[{field,message}] }` | `payload.message` text plus `payload.data.details[{field, code, message}]`; the client must branch on status and `details[].code` | `toApiError` reads `code`, `message`, `errors[]` |
| 409 duplicate | not on create | 409 on create and update, `details[0].code = DUPLICATE_VALUE` | `DUPLICATE_VALUE` exists |
| DELETE response | `MessageSuccess` | the deactivated `UniversityService` plus `ETag`; already inactive → 200 no-op | n/a |
| ETag / If-Match | ETag on PATCH; `If-Match` optional; 412 | `ETag: "<version>"` on create, patch and delete; `If-Match` optional; 412 | `PRECONDITION_FAILED` copy exists |
| Extra field | none | optional `reason` (≤ 200) on POST and PATCH | n/a |
| Roles and permissions | `UserRole` = student / manager / administrator | DB `Role.code` is the same; access by permission (`hub.services.read` / `manage`) looked up by token `sub` = DB `user_id` | Our codes are the same; the UI guard is cosmetic, the API enforces ✔ |
| Token | Bearer JWT | Bearer `{ sub }` signed with `JWT_SECRET`; no DB-backed login exists | Bearer from our `/auth/login` response (DOC-03) |
| CORS | n/a | **not configured**, so a browser on :3000 cannot call :8080 directly | Our real mode calls `http://localhost:8080/api/v1` directly, which **would be blocked** |

**New `docs-changes.md` entries (status `proposed`, `docs/` stays untouched):**
- **DOC-16.** The client accepts both envelopes: OpenAPI for 003, `ServiceResponse` for the hub, per API-GAP-HUB-01. Asks BE to converge on one.
- **DOC-17.** Real mode reaches the BE through the same-origin `/api/backend` forwarder, which passes the user's bearer, because the BE has no CORS.
- **DOC-11, updated.** Role navigation now has University Services for all roles and Service Links for administrators.

---

## 5. UI adaptation

**Folder:** keep dev's `src/client/src/features/services/` name (Q4 offers a rename). Layout follows `features/admin-users`:
- `components/`, `hooks/`, `services/` (real only), `types/`, `mappers/`, `config/`;
- `admin/{components, hooks, services, schema}`.

| dev piece | Becomes | Uses (ours) | States |
|---|---|---|---|
| `app/(protected)/services/page.tsx` | Same path, inside the `(protected)` layout (AppShell, SideNav, RequireSession). Uses `PageHeader` instead of `RoleNav` + `Container`. | `PageHeader` | — |
| `ServiceHub` | `features/services/components/ServiceHub.tsx` on `useHubServices` (`useAsyncResource`) | `LoadingState` or the existing `ServiceGridSkeleton` built on `Skeleton`; `EmptyState`; `ErrorState` with Retry | loading skeleton / empty (A1) / error + Retry (A4) / forbidden → `ForbiddenView` |
| `ServiceCard`, `ServiceGrid` | Same, on `SurfaceCard` with tokens and the external-link icon from `components/icons`. Always `target="_blank" rel="noopener noreferrer"` with an "opens in a new tab" label; `isSafeHref` stays in the mapper. | `SurfaceCard`, `NavIcons` | — |
| `app/(protected)/admin/services/page.tsx` | Same path. The route-access rule keeps it in the administrator area (`/admin` prefix). | `PageHeader` with an "Add link" action | — |
| `AdminServiceLinks` | `features/services/admin/components/ServiceLinkList.tsx` | `DataTable` (name, URL, order, status `Tag` Active/Inactive, actions), `Button`; `ConfirmDialog` for deactivate (FR-015); `Alert` for success and 412 with "Reload" | loading `LoadingState` / empty `EmptyState` / error `ErrorState` / forbidden `ForbiddenView` |
| `ServiceLinkForm` | Same, as a dialog or inline panel (your choice, default: dialog), RHF + zod (`serviceLink.schema.ts` kept) | `FormField`, `TextInput`, a number input; field errors from zod and `ApiError.fieldErrors` | submitting, server field errors, 409, 412 |
| `RoleNav` | **Deleted** | `SideNav` from `NAVIGATION` | — |
| Landing `ServicesSection` / `ServiceCard` | Keep dev's logic and the shared card; tokens instead of `text-white/*` | `Section`, `SectionHeader`, `Button` | guest locked / loading / list / empty / compact error + Retry |
| Dashboards | "University Services" shortcut `available` in `dashboard-sections.ts`; administrator also gets "Service Links" | `ShortcutGrid` | — |
| `config/icons.ts`, `public/images/services/default.svg` | Kept | — | — |

---

## 6. Both modes

**One transport.** All hub calls go through `libs/api-client.ts`. The envelope stays in the hub service, for example `unwrapHub(body) = body.payload.data`, so 003 code keeps `unwrap()`.

### Mock mode (MSW, C-IV)
- **Handlers.** New `src/mocks/handlers/hub.ts`, registered in `handlers/index.ts`. They answer exactly like the real hub BE:
  - the `ServiceResponse` envelope;
  - `details[{field, code, message}]` with the codes from `contracts/hub-api.md` (`REQUIRED`, `TOO_LONG`, `INVALID_URL`, `INVALID_TYPE`, `OUT_OF_RANGE`, `EMPTY_UPDATE`, `UNKNOWN_FIELD`, `DUPLICATE_VALUE`);
  - `ETag: "<version>"`, `If-Match` → 412, 404 for unknown or inactive (hub), soft delete, no-op re-deactivate;
  - ordering by `displayOrder`, then lower-case name, then id.
- **Auth checks.** Reuse `withAuth`: 401 without a token, 403 when the caller's role lacks the permission (read: all roles; manage: administrator). Reuse `withFailureSwitch` with new operation names `hubList` and `serviceLinks`.
- **Store.** Add `serviceLinks` to the mock DB, seeded with dev's six links (2b751c2) plus the inactive HCMUS website row. Bump the store key to `myhcmus:mock-db:v2` (or migrate in `readDb`), so old browsers re-seed. Admin changes then persist across reloads and appear on `/services` for every role.
- **Validation.** One shared validator used by the handler (mirrors `validateServiceLinkRequest.ts`), and the FE zod schema for pre-checks.
- **Tests.** Handler tests in `mocks/handlers/hub.test.ts` (Vitest + `msw/node`), plus component tests against the handlers.

### Real mode
- **Base URL.** `NEXT_PUBLIC_API_MODE=real` and `NEXT_PUBLIC_API_BASE_URL=/api/backend`, i.e. same origin, so CORS is not an issue.
- **Forwarder** (`app/api/backend/[...path]/route.ts`, kept from dev and changed):
  - forwards the **incoming `Authorization` header** (our bearer, which `api-client` attaches because the URL starts with the base) instead of injecting `DEV_BACKEND_TOKEN`;
  - fallback (Q1): only when `NODE_ENV !== "production"` **and** the request has no `Authorization` header, use `DEV_BACKEND_TOKEN`;
  - extends `isAllowedBackendPath` to the paths the client uses: `auth/*`, `me*`, `admin/users*`, `hub/*`, `admin/services*`. Still not an open proxy;
  - forwards `ETag`, `Location`, `Retry-After` (as dev does).
- **Rules that still hold.**
  - `getApiBaseUrl()` may now be relative. Check that MSW `apiUrl()` and the bearer origin check still work, with a test.
  - Mock mode keeps the absolute contract URL, so mock and real stay switchable by configuration only.
- **End-to-end today.** Hub real mode works with a minted token (`mint-dev-token.ts SEED-ADMIN`) as long as BE login is in-memory (Q2). Full real-mode login stays blocked by API-GAP-002, as in 003's T105.

---

## 7. Execution order (after approval)

1. Tag `pre-hub-merge` on `bdc9ae9`. Run `git merge --no-ff origin/dev` and resolve C1–C8 as in §2. Apply the minimum compile fixes in the same merge commit: delete `RoleNav`, fix the two hub pages, port the `api.request` / `ApiError` calls. The merge commit should build, even if the hub UI is still rough.
2. `api-client` support for the hub envelope, plus tests.
3. Route access for `/services`, navigation, dashboard shortcuts, plus tests.
4. MSW hub handlers, mock DB v2, plus handler tests. Delete the mock classes and factories.
5. Hooks on `useAsyncResource` (moved to `src/hooks`), plus error-message contexts.
6. UI adaptation (§5) and token clean-up, plus component and a11y tests.
7. Forwarder changes (§6), plus its node test.
8. `docs-changes.md` DOC-16 and DOC-17, update DOC-11. `HANDOFF.md`, `quickstart.md` (real-mode steps).
9. Gates: `npm run test`, `npm run lint`, `npm run build`, then a manual walkthrough of both modes.

---

## 8. Risks and open questions

**Risks**
- **R1.** After the merge, ~15 dev FE files will not type-check until step 1's fixes. Resolve them in the same merge commit, or the branch sits red.
- **R2.** Dev's hub tests (`ServiceHub`, `useUniversityServices`, `AdminServiceLinks`, mappers, mock service) assume injected mock classes. Most will be rewritten for MSW. Real coverage of spec 004 must not drop: keep every acceptance scenario of US1–US3 as a test.
- **R3.** Two envelopes in one client make `toApiError` more complex. If the BE later converges on the OpenAPI envelope, the hub adapter must be removed. The adapter stays in one place.
- **R4.** Bumping the mock DB to v2 wipes testers' local mock state (sign-ins, created accounts).
- **R5.** Forwarding our localStorage bearer runs against 004 R-01, which rejected browser-held tokens. 003 chose "Browser token" deliberately, so this is a design decision to record, not a bug.
- **R6.** The BE permission check needs the token `sub` to be a DB `user_id`. Our future real login must issue that, which is a requirement on the Authentication BE.
- **R7.** The `docs/` changes dev made (component diagrams, `student.md`) describe dev's FE structure (`RoleNav`, mock classes). After our adaptation they are partly stale. Record this in `docs-changes.md` without editing `docs/`.

**Open questions**
- **Q1.** In real mode, should the forwarder pass on our user's bearer (recommended), keep dev's `DEV_BACKEND_TOKEN` as a dev-only fallback, or use only `DEV_BACKEND_TOKEN` as dev does?
- **Q2.** Until BE login is DB-backed, is it acceptable that real mode is tested only with a minted token, so 003 login can't be exercised against the BE?
- **Q3.** Hub URL: shared `/services` for all roles (dev, recommended; the landing "See all services" link already uses it), or per-role `/student/services`, `/manager/services`, `/admin/services` as in our 003 nav? The per-role option would clash with the admin `/admin/services` management page.
- **Q4.** Keep the folder name `features/services` (dev; it gives `features/services/services/…`), or rename it to `features/university-services`?
- **Q5.** Service-link form as a dialog (default) or a separate page `/admin/services/new` and `/admin/services/[id]` like admin-users?
- **Q6.** Resolving the root `.gitignore` (C1) touches a file outside `src/client`. Is that OK as part of the merge?
- **Q7.** Should the hub-envelope gap (DOC-16) also be raised with BE as a request to adopt the OpenAPI envelope, or accepted as-is?
