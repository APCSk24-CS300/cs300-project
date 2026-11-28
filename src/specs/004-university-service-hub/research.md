# Research: University Services Hub

**Feature**: 004-university-service-hub | **Date**: 2026-11-27

Each item records a gap found in the current repo, the decision taken, and what was rejected. Items marked **[needs your OK]** differ from or add to `docs/`, so the constitution (Principle I) asks for approval before implementation.

## R-01 Frontend and backend do not talk to each other yet **[needs your OK]**

**Findings**

| Area | Frontend today | Backend today |
| --- | --- | --- |
| Base URL | `NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:3000` (`src/client/src/libs/api-client.ts`) | Express on port 8080 (`docker-compose.yml`) |
| Path prefix | Calls `/auth/login`, `/activities/landing` with no prefix | Mounts `/api/auth`, `/api/ai`; OpenAPI says `/api/v1` |
| Login | Mock: Next route `app/api/auth/login/route.ts` signs its own JWT `{ userId, role }` with `SESSION_SECRET` into a `session` cookie | `POST /api/auth/login` signs `{ sub, name }` with `JWT_SECRET`, users from `InMemoryAuthRepository`, not the DB |
| Token transport | Cookie, read by `proxy.ts` | `Authorization: Bearer` only, no cookie support |
| Role codes | `student`, `manager`, `admin` (`libs/roles.ts`) | `student`, `manager`, `administrator` (DB `Role.code` CHECK) |
| Permissions | none | `RolePermission` lookup by `sub` in the DB (`IdentityRepository.hasPermission`) |
| CORS | n/a | not configured |

**Decision**

1. Hub endpoints mount under **`/api/v1`** as the OpenAPI contract says (`/api/v1/hub/services`, `/api/v1/admin/services`). Existing `/api/auth` and `/api/ai` stay where they are (other features own them).
2. The browser never calls the backend directly. A Next.js route handler `src/client/src/app/api/backend/[...path]/route.ts` forwards `GET/POST/PATCH/DELETE` to `BACKEND_API_URL` (server-only env, e.g. `http://server:8080/api/v1` in Docker, `http://localhost:8080/api/v1` locally), adds `Authorization: Bearer <DEV_BACKEND_TOKEN>` (see 5), and passes through status, body, `ETag` and `If-Match`. This removes the CORS problem and keeps the token out of browser JS.
3. The FE `api-client` keeps one base URL; in `api` mode it is `/api/backend`.
4. One mapping function `toBackendRole` / `fromBackendRole` in `libs/roles.ts` converts `admin` ⇄ `administrator`.
5. Getting a real backend token is the Authentication group's job, and this feature does not touch login, logout or the session cookie. For development the forwarding route reads one server-only `DEV_BACKEND_TOKEN` env var (ignored when `NODE_ENV=production`), and `src/server/scripts/mint-dev-token.ts` signs a token for a seeded DB user with `JWT_SECRET`. Both are dev-only and documented as temporary; when Auth issues backend tokens, the route reads the token from the session instead.

**Rejected**: enabling CORS and putting the bearer token in `localStorage` (exposes the token to XSS, and needs a second auth path later); doing the full Authentication group here (out of scope, much larger); calling the backend from Server Components only (admin forms need client-side mutations anyway).

## R-02 Response envelope differs from the OpenAPI contract **[needs your OK]**

**Findings**: OpenAPI says `{ success, data }` / `{ success, code, message, errors[] }`. Every existing backend endpoint returns `ServiceResponse.get()`: `{ success, statusCode, payload: { message: "<text> (<STATUS_CODE>)", data } }`.

**Decision**: Hub endpoints use the existing `ServiceResponse` envelope so the backend stays consistent. Validation errors put `errors: [{ field, code, message }]` inside `payload.data`. The FE mapper reads `payload.data` and the HTTP status (not the message text). Record the difference in `contracts/hub-api.md` and in `docs/api/openapi-changes.md`.

**Rejected**: a second envelope for hub endpoints only (two conventions in one API); rewriting `ServiceResponse` for all endpoints (touches the AI feature, out of scope). If you prefer the OpenAPI envelope, it is a contained change in the hub controller and FE mapper.

## R-03 No version column for ETag / If-Match

**Findings**: Contract requires `version` + `ETag`/`If-Match` → 412. `ServiceLink` has no version column.

**Decision**: Migration adds `version INT NOT NULL DEFAULT 1`. Updates run `UPDATE ... SET ..., version = version + 1 WHERE service_id = $1 AND ($2::int IS NULL OR version = $2) RETURNING *`. Zero rows with an existing id ⇒ 412. `If-Match` stays optional, as in the contract. Existing rows get version 1, so no data is lost.

## R-04 No permission codes for the hub

**Decision**: Add `hub.services.read` (student, manager, administrator) and `hub.services.manage` (administrator) as permission ids **910–911**; AI reserved 900–905. Use the existing `createRequirePermission` middleware. Seeding mirrors `ai_schema.sql` (`ON CONFLICT DO NOTHING`).

**Rejected**: checking role codes directly in the route (bypasses the permission model the AI feature already uses).

## R-05 URL safety

**Decision**: Validate with `new URL()`; accept only `http:`/`https:`, reject `username`/`password`, whitespace, length > 2048. A DB `CHECK (url ~* '^https?://')` backs it up. The FE renders links only from validated data and always with `target="_blank" rel="noopener noreferrer"`. This blocks `javascript:` and `data:` links, which would be stored XSS.

## R-06 Category and icon

**Findings**: UC-07 says "categorized links"; BR `ServiceLink` and OpenAPI deliberately have no category or icon. The landing config has icons and an `access` field.

**Decision**: No schema field. Order is admin-controlled. Icons come from a FE map (`moodle`, `student-portal`, `tuition-payment`, `hcmus-website`, `hcmus-library`, `it-support`) keyed by slugified name, fallback `/images/services/default.svg`. The `access: public | authenticated` field from the landing config is dropped: all hub data requires login (UC-07 precondition).

## R-07 Guest view on the landing page **[needs your OK]**

**Findings**: user-flow §2.1 lets guests "access available university services" from the landing page; UC-07 requires authentication. The current landing locks all cards for guests.

**Decision**: Follow UC-07 and keep today's behaviour: guests see a locked preview drawn from the static config (no hrefs rendered), signed-in users see live data. No public endpoint.

**Rejected**: a public `GET /hub/services/public` (contradicts UC-07; would need an access field the BR does not have).

## R-08 Audit trail

**Decision**: `ServiceLinkRepository` runs each mutation and its `AuditLog` insert in one transaction (`BEGIN … COMMIT`). Actions: `service_link.create`, `service_link.update`, `service_link.deactivate`, `service_link.reactivate` (an update whose only effective change is `isActive: true`). `reason` is required by the table; the API takes an optional `reason` field and defaults to the action name.

## R-09 Frontend structure

**Decision**: New feature folder `src/client/src/features/services/` following `features/activities/` (types, DTOs, mapper, service interface + Real + Mock + factory, hook, components). The landing `ServiceCard` moves into this feature and the landing section imports it, so there is one card component. Admin UI lives in `features/services/admin/` and uses `react-hook-form` + `zod`, already dependencies. No new dependencies.

Routes: `app/(protected)/services/page.tsx` (all roles) and `app/(protected)/admin/services/page.tsx`. `ROLE_RULES` gets `{ prefix: "/services", roles: ["student", "manager", "admin"] }`; `NAVIGATION_ITEMS` gets "University Services" for every role and "Service Links" for admin. Also fixes the `/forbiden` typo in `proxy.ts` that this feature's 403 path relies on.

## R-10 Constitution tech stack line

The constitution lists "FE: Flutter" but the repo and project docs use Next.js 16 / React 19. This plan follows the repo. Suggest amending the constitution separately.
