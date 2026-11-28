# Implementation Plan: University Services Hub

**Branch**: `feat/university-service-hub` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `src/specs/004-university-service-hub/spec.md`

## Summary

Deliver functional group 11 (UC-07) end to end: a PostgreSQL-backed list of external university service links, a REST API under `/api/v1` that matches `docs/api/openapi.yaml` v1.2.0, a "University Services" page for every role, the landing-page services section wired to the same data for signed-in users, and an admin page to add, edit, reorder, deactivate and reactivate links with ETag concurrency and audit logging. The frontend reaches the backend through a small Next.js server-side forwarding route that attaches a dev backend token from a server-only env var, which closes the current path, token and CORS gaps for this feature without taking on the whole Authentication group.

## Technical Context

**Language/Version**: TypeScript. Backend: Node (ESM, `.ts` run directly, `typescript ^6`). Frontend: TypeScript ^5, Next.js 16.4.3, React 19.3.

**Primary Dependencies**: Backend Express 5, `pg`, `jsonwebtoken`. Frontend `react-hook-form`, `zod`, `jose`. No new dependencies.

**Storage**: PostgreSQL 18 (pgvector image). Existing `ServiceLink`, `Permission`, `RolePermission`, `AuditLog` tables; additive migration `src/db/hub_schema.sql`.

**Testing**: Backend `node --test` (unit with fakes in `tests/helpers/fakes.ts`, integration on `createApp()` with an ephemeral port, as `tests/integration/aiPrompt.test.ts`). Frontend Vitest + Testing Library + axe-core (`src/client/tests/`). Optional DB constraint test appended to `src/db/schema_constraints_test.sql`.

**Target Platform**: Docker Compose (server :8080, db :5432), Next dev server :3000. Chrome, Edge, Firefox; 360–1920 px.

**Project Type**: Web application (Next.js frontend + Express backend + PostgreSQL).

**Performance Goals**: Hub list p95 < 1 s with 50 links (SC-002). One indexed query per request.

**Constraints**: No integration with external services (BR-NOT-06). Token never exposed to browser JS. Links never deleted. Every admin change audited in the same transaction.

**Scale/Scope**: Tens of links; 3 roles; 2 new pages, 1 updated landing section; 6 backend endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
| --- | --- | --- |
| I. Architecture aligned with `docs/` | Follows UC-07, Vision F11, BR-NOT-06/ADM-01/ADM-03, BR `ServiceLink`, OpenAPI 1.2.0, FE and BE component diagrams. Differences are listed in research R-01, R-02, R-07 for your approval before coding. | ⚠ needs your OK on R-01, R-02, R-07 |
| I. Clear interfaces; no logic in UI; logic apart from HTTP | `ServiceLinkStore` interface → `HubService` (rules) → `HubController` (HTTP only) → `HubRoute`. FE: `HubService` interface + Real/Mock + factory, hook, presentational components. | ✅ |
| II. Maintainability | One `ServiceCard` shared by landing and hub. Validation rules written once per side and mirrored by tests. TSDoc on public functions in the style of `LoadIdentity.ts`. | ✅ |
| III. Reviewed spec before implementation | This spec and plan; implementation waits for your go. | ✅ (pending review) |
| IV. Testing | Unit tests for validation and service rules, integration tests for every endpoint and status, FE component/hook/mapper tests, axe check. Critical flow (open hub, open link; admin add → visible) covered by integration tests. | ✅ |
| V. Security & data integrity | Input validated at API and BFF; permission per route; URL scheme allow-list blocks `javascript:`; token stays server-side (never sent to the browser); no secrets committed (`.env.example` only); additive migration with pre-check. | ✅ |
| V. Simplicity | No new deps; no category/icon schema; no public endpoint; no pagination. Dev token minting is the one temporary piece, flagged for removal when Auth lands. | ✅ |
| Core tech stack says "FE: Flutter" | Repo uses Next.js; plan follows the repo (research R-10). | ⚠ constitution text out of date |

**Re-check after Phase 1**: design keeps all of the above. No violations need the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
src/specs/004-university-service-hub/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── hub-api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
src/db/
├── hub_schema.sql                      # NEW additive migration + permissions + seed
└── schema_constraints_test.sql         # + ServiceLink constraint cases

src/server/
├── scripts/mint-dev-token.ts           # NEW dev-only, temporary until Auth group
├── src/
│   ├── app.ts                          # mount /api/v1/hub and /api/v1/admin/services; AppOptions.serviceLinkStore
│   ├── types/ServiceLink.ts            # NEW
│   ├── helper/validateServiceLinkRequest.ts   # NEW
│   ├── helper/generate409Response.ts / generate412Response.ts (412 NEW)
│   ├── repositories/ServiceLinkRepository.ts  # NEW pg + audit in one transaction
│   ├── services/HubService.ts          # NEW rules: ordering, defaults, idempotent deactivate
│   ├── controllers/HubController.ts    # NEW HTTP mapping, ETag/If-Match
│   └── routes/HubRoute.ts              # NEW createHubRoute, createAdminServicesRoute
└── tests/
    ├── helpers/fakes.ts                # + FakeServiceLinkStore
    ├── unit/validateServiceLinkRequest.test.ts
    ├── unit/HubService.test.ts
    └── integration/hub.test.ts

src/client/
├── .env.example                        # NEXT_PUBLIC_DATA_SOURCE, BACKEND_API_URL, DEV_BACKEND_TOKEN
├── proxy.ts                            # /services rule; fix /forbiden typo
├── public/images/services/default.svg  # NEW fallback icon
└── src/
    ├── libs/roles.ts                   # toBackendRole/fromBackendRole; /services rule
    ├── libs/navigation.ts              # nav items
    ├── libs/api-client.ts              # status-aware ApiError, headers (If-Match), ETag access
    ├── app/api/backend/[...path]/route.ts      # NEW BFF forwarder
    ├── app/(protected)/services/page.tsx       # NEW hub page
    ├── app/(protected)/admin/services/page.tsx # NEW admin page
    ├── features/services/
    │   ├── types/{service.dto.ts,service.ts,index.ts}
    │   ├── mappers/service.mapper.ts (+ test)
    │   ├── config/{content.ts,icons.ts}
    │   ├── services/{hub.service.ts,mock.hub.service.ts,hub.service.factory.ts,service.fixtures.ts} (+ tests)
    │   ├── hooks/useUniversityServices.ts (+ test)
    │   ├── components/{ServiceCard.tsx,ServiceGrid.tsx,ServiceHub.tsx,ServiceGridSkeleton.tsx} (+ tests)
    │   └── admin/
    │       ├── schema/serviceLink.schema.ts (+ test)
    │       ├── services/{admin-hub.service.ts,mock.admin-hub.service.ts,factory}
    │       ├── hooks/useAdminServiceLinks.ts
    │       └── components/{ServiceLinkTable.tsx,ServiceLinkForm.tsx,ConfirmDeactivate.tsx,AdminServiceLinks.tsx} (+ tests)
    └── features/landing/
        ├── components/ServicesSection.tsx      # guest: locked preview; signed in: live cards
        ├── components/ServiceCard.tsx          # removed, re-exported from features/services
        └── config/services.ts                  # becomes preview-only (no href)

docs/
├── api/openapi-changes.md              # record R-02 envelope, 409 on create, DELETE returns link
├── analysis-and-design/fe/component-diagram-fe.md   # add Services feature + BFF
├── analysis-and-design/be/component-diagram-be.md   # add Hub route/controller/service/repo
└── analysis-and-design/client/pages/student.md      # fill "University Services" section
```

**Structure Decision**: Keep the existing split (`src/server`, `src/client`, `src/db`). Backend follows the route → controller → service → repository layering in `component-diagram-be.md`. Frontend follows the feature-first layout of `features/activities`.

## Phases

1. **Setup**: env examples, migration file, feature folders.
2. **Foundational (blocks all stories)**: migration + permissions + seed; backend types/validation/repository/service; BFF route and api-client changes; role mapping; route rules.
3. **US1 (P1)**: hub endpoints + `/services` page. MVP stops here.
4. **US2 (P2)**: landing section on live data.
5. **US3 (P3)**: admin endpoints + admin page.
6. **Polish**: docs, diagrams, accessibility, quickstart run.

## Known gaps left for other features

- Real login against DB users and role-bearing tokens (Authentication group). Until then `api` mode uses minted dev tokens.
- Interface language switching (UC-08).
- `/api/auth` and `/api/ai` are not moved under `/api/v1`.

## Complexity Tracking

None.
