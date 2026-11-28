---
description: "Task list for the University Services Hub"
---

# Tasks: University Services Hub

**Input**: `src/specs/004-university-service-hub/` (plan, spec, research, data-model, contracts/hub-api.md)

**Tests**: Required by the constitution (Principle IV). Test tasks come first in each story and should fail before the implementation task.

**Paths**: `src/db/`, `src/server/`, `src/client/` from the repo root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no unfinished dependency)
- **[Story]**: US1, US2, US3

---

## Phase 1: Setup

- [x] T001 Create folders `src/client/src/features/services/{types,mappers,config,services,hooks,components,admin}` and `src/server/scripts/`
- [x] T002 [P] Add `NEXT_PUBLIC_DATA_SOURCE`, `NEXT_PUBLIC_API_BASE_URL`, `BACKEND_API_URL`, `DEV_BACKEND_TOKEN` with comments to `src/client/.env.example` (create if missing; never `.env.local`)
- [x] T003 [P] Add fallback icon `src/client/public/images/services/default.svg`

---

## Phase 2: Foundational (blocks every story)

### Database

- [x] T004 Write `src/db/hub_schema.sql`: pre-check `DO` block for rows that would break new checks; `ALTER TABLE "ServiceLink" ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1`; url/description/display_order checks; unique index `lower(btrim(name))`; index `(is_active, display_order, lower(name))`; permissions 910–911 + `RolePermission`; seed 6 links `ON CONFLICT DO NOTHING` (data-model.md)
- [x] T005 [P] Add ServiceLink cases (bad scheme, duplicate name different case, out-of-range order, version) in `src/db/hub_schema_test.sql`

### Backend core

- [x] T006 [P] Types `ServiceLink`, inputs, `ServiceLinkStore`, `UpdateResult`, `DuplicateNameError` in `src/server/src/types/ServiceLink.ts`
- [x] T007 [P] Unit tests for every rule and code in contracts/hub-api.md §Validation in `src/server/tests/unit/validateServiceLinkRequest.test.ts`
- [x] T008 Implement `validateCreateServiceLink` / `validateUpdateServiceLink` (trim, null-empty description, URL allow-list) in `src/server/src/helper/validateServiceLinkRequest.ts` (after T006, makes T007 pass)
- [x] T009 [P] Add `generate412Response` in `src/server/src/helper/generate412Response.ts`; let `generate400Response`/`generate409Response` take an optional `data` for `errors[]`
- [x] T010 [P] `FakeServiceLinkStore` (in-memory, version, audit array, `fail` switch) in `src/server/tests/helpers/fakes.ts`
- [x] T011 Implement `ServiceLinkRepository` (pg) with transactional mutation + `AuditLog` insert, `23505` → `DuplicateNameError`, version-checked update in `src/server/src/repositories/ServiceLinkRepository.ts`
- [x] T012 [P] Unit tests for `HubService` (ordering ties, default order = max+1, unchanged update → no audit, deactivate idempotent, reactivate action name, stale → stale) in `src/server/tests/unit/HubService.test.ts`
- [x] T013 Implement `HubService` in `src/server/src/services/HubService.ts` (makes T012 pass)
- [x] T014 Add `serviceLinkStore` to `AppOptions` and wire `HubService`/`HubController` in `src/server/src/app.ts` (routes mounted per story)
- [x] T015 [P] Dev-only `src/server/scripts/mint-dev-token.ts <userId>` signing `{ sub }` with `JWT_SECRET`, refuses when `NODE_ENV=production`

### Frontend core

- [x] T016 [P] `toBackendRole` / `fromBackendRole` in `src/client/src/libs/roles.ts` + test
- [x] T017 [P] Tests for the BFF route (no token → 401 without fetch; forwards method/body/If-Match; passes status and ETag; disallowed path → 404; network error → 502) in `src/client/src/app/api/backend/[...path]/route.test.ts`
- [x] T018 Implement BFF route `src/client/src/app/api/backend/[...path]/route.ts` (contracts/hub-api.md §BFF) (makes T017 pass)
- [x] T019 Extend `src/client/src/libs/api-client.ts`: `ApiError { status, code, fieldErrors }`, unwrap `payload.data`, per-request headers, return `etag` when asked; update `api-client.test.ts`
- [x] T020 ~~Set `be_token` in the login route~~ Dropped: login/logout are the Authentication group's. The BFF reads `DEV_BACKEND_TOKEN` instead (temporary until Auth lands)
- [x] T021 [P] Feature types, DTOs and mapper (drop non-http(s), sort, icon lookup) in `src/client/src/features/services/{types,mappers,config/icons.ts}` + `service.mapper.test.ts`
- [x] T022 [P] `HubService` interface, `RealHubService`, `MockHubService` (fixtures from today's landing config), factory in `src/client/src/features/services/services/` + tests

**Checkpoint**: migration applies twice cleanly; backend unit tests and FE foundation tests pass.

---

## Phase 3: User Story 1 - Open a university service from the hub (P1) 🎯 MVP

**Goal**: every signed-in role opens `/services` and launches a service in a new tab.

**Independent test**: spec US1 scenarios 1–7.

### Tests (write first)

- [x] T023 [P] [US1] Integration tests for `GET /api/v1/hub/services` and `/{id}`: 200 ordered active only, empty list, 401 no token, 403 no permission, 404 inactive/unknown/non-numeric, 405, 503 store failure in `src/server/tests/integration/hub.test.ts`
- [x] T024 [P] [US1] Hook tests (loading → success, empty, error → retry, abort on unmount) in `src/client/src/features/services/hooks/useUniversityServices.test.tsx`
- [x] T025 [P] [US1] Component tests: grid renders links with `target=_blank`, `rel`, accessible name; empty state; error with Retry; skeleton; axe clean in `src/client/src/features/services/components/ServiceHub.test.tsx`

### Implementation

- [x] T026 [US1] `HubController.list` / `.get` in `src/server/src/controllers/HubController.ts`
- [x] T027 [US1] `createHubRoute` in `src/server/src/routes/HubRoute.ts`; mount at `/api/v1/hub` in `app.ts` with `requirePermission('hub.services.read')`
- [x] T028 [US1] Move `ServiceCard` to `src/client/src/features/services/components/ServiceCard.tsx` (props: `UniversityService`, `locked`), keep landing tests green via re-export
- [x] T029 [US1] `useUniversityServices` hook, `ServiceGrid`, `ServiceGridSkeleton`, `ServiceHub` (uses `EmptyState`, `ErrorState`), strings in `config/content.ts`
- [x] T030 [US1] Page `src/client/src/app/(protected)/services/page.tsx`
- [x] T031 [US1] Add `/services` to `ROLE_RULES` (all roles) and "University Services" to `NAVIGATION_ITEMS` for every role; fix `/forbiden` → `/forbidden` in `src/client/src/proxy.ts` (moved from the client root: Next.js only loads it next to `app/` when a `src/` folder is used); login return path to `/services` works (test in `navigation.test.ts`)

**Checkpoint**: US1 works in mock mode and in api mode with a dev token.

---

## Phase 4: User Story 2 - Service cards on the landing page (P2)

**Goal**: guests keep the locked preview; signed-in users get live clickable cards.

### Tests (write first)

- [x] T032 [P] [US2] Update `ServicesSection.test.tsx`: guest = locked, no `href` in DOM, "Log in for more" → `/login?redirectTo=%2F%23services`; signed in = up to 6 live links + "See all services"; API error = compact retry, rest of page renders
- [x] T033 [P] [US2] Keep `landing-accessibility.test.tsx` passing for both states

### Implementation

- [x] T034 [US2] Make `features/landing/config/services.ts` preview-only (name + icon, no href/access/available)
- [x] T035 [US2] `ServicesSection`: read `useAuth()`; guest → preview grid locked; signed in → `useUniversityServices`, `slice(0, 6)`, link to `/services`

**Checkpoint**: landing works for both states; US1 still passes.

---

## Phase 5: User Story 3 - Administrators manage service links (P3)

**Goal**: admins create, edit, reorder, deactivate, reactivate with validation, concurrency and audit.

### Tests (write first)

- [x] T036 [P] [US3] Integration tests for `/api/v1/admin/services`: list with/without inactive, bad `includeInactive`; POST 201 + ETag + Location, 400 each code, 409 duplicate (case/space), 415; PATCH 200 + new ETag, 400 empty/unknown, 404, 409, 412 stale, unchanged → no audit; DELETE 200, idempotent, 412; 403 for student/manager on every route; exactly one audit row per change (append to `hub.test.ts`)
- [x] T037 [P] [US3] Zod schema tests mirroring backend rules in `src/client/src/features/services/admin/schema/serviceLink.schema.test.ts`
- [x] T038 [P] [US3] Component tests: table shows status; form field errors; server 409 shown on name; 412 shows reload message; deactivate asks to confirm; reactivate; axe clean in `src/client/src/features/services/admin/components/AdminServiceLinks.test.tsx`

### Implementation

- [x] T039 [US3] `HubController.adminList/create/update/deactivate` with ETag/If-Match parsing (`"3"`, `W/"3"`, `3`) in `HubController.ts`
- [x] T040 [US3] `createAdminServicesRoute` in `HubRoute.ts`; mount at `/api/v1/admin/services` with `requirePermission('hub.services.manage')` and `validateContentType` on POST/PATCH
- [x] T041 [US3] `serviceLink.schema.ts` (zod) matching contracts/hub-api.md
- [x] T042 [US3] `AdminHubService` interface + Real (passes `If-Match`) + Mock (in-memory with versions) + factory in `features/services/admin/services/`
- [x] T043 [US3] `useAdminServiceLinks` hook (list, create, update, deactivate, reactivate; keeps ETag per row)
- [x] T044 [US3] `ServiceLinkTable`, `ServiceLinkForm` (react-hook-form + zod, maps `fieldErrors` from 400/409), `ConfirmDeactivate`, `AdminServiceLinks`
- [x] T045 [US3] Page `src/client/src/app/(protected)/admin/services/page.tsx`; "Service Links" in admin navigation

**Checkpoint**: all three stories work together; admin change shows on hub and landing.

---

## Phase 6: Polish

- [x] T046 [P] Record envelope (R-02), 409 on create, DELETE returning the link, BFF in `docs/api/openapi-changes.md`; bump `openapi.yaml` hub responses to match
- [x] T047 [P] Add Hub route/controller/service/repository to `docs/analysis-and-design/be/component-diagram-be.md`
- [x] T048 [P] Add Services feature, BFF route to `docs/analysis-and-design/fe/component-diagram-fe.md`
- [x] T049 [P] Fill "University Services" in `docs/analysis-and-design/client/pages/student.md`
- [x] T050 [P] TSDoc on new public backend functions in the `LoadIdentity.ts` style
- [x] T051 Run `npm test`, `npx tsc --noEmit` (both apps), `npm run lint` (client); then quickstart.md sections 1–5
- [x] T052 Edge-case pass from spec §Edge Cases; add a regression test for anything found

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 / US3 → Polish.
- US2 needs US1's hook and card (T028, T029). US3 needs only Foundational on the backend, and T019/T022 on the frontend, so it can run beside US1.
- Inside each story: tests → controller/route → FE service/hook → components → page.

## Parallel examples

- Foundational: T005, T006, T007, T009, T010, T015, T016, T017, T021, T022 together.
- After Foundational: one person on US1 backend (T023, T026, T027), one on US1 frontend (T024, T025, T028–T031), one on US3 backend (T036, T039, T040).

## MVP

Phases 1–3. That alone satisfies UC-07 for every role with seeded links.
