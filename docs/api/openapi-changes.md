# OpenAPI Change Proposals

> Frontend-requested contract changes for the phase-2 myHCMUS frontend work.
>
> Status values: `PROPOSED / awaiting backend agreement`, `accepted`, `rejected`, `deferred`.
>
> The tracked contract is `docs/api/openapi.yaml` (version 1.2.0). Proposals in this file are **not** proof that an operation exists. Do not call a proposed operation from production code until it is accepted and present in the tracked contract.

## API-GAP-001 — Read active activity categories for interests

| Field | Value |
|---|---|
| Feature | Profile Management — interests |
| Use case | A student selects interests from the active activity-category list |
| Current contract | Only `/admin/activity-categories` exists; it is administrator-scoped and accepts `includeInactive` |
| Proposed operation | `GET /activity-categories` |
| Proposed security | `bearerAuth`; authenticated users |
| Proposed query | `includeInactive` (default `false`) if needed; otherwise return active only |
| Proposed response | `200` — `{ success: boolean, data: ActivityCategory[] }` using the existing `ActivityCategory` schema |
| Reason | The Profile spec requires `GET /activity-categories`; the supplied YAML does not define a non-admin read operation |
| Priority | High (blocks the interests panel) |
| Frontend impact | Without this operation, the interests UI cannot load a contract-backed category list; do not reuse the admin endpoint |
| Status | `accepted` — applied in 1.2.0: `GET /activity-categories` |

Proposed YAML shape:

```yaml
/activity-categories:
  get:
    tags:
    - Profile
    summary: List active activity categories
    operationId: listActivityCategoriesForInterests
    security:
    - bearerAuth: []
    responses:
      '200':
        description: Active categories retrieved.
        content:
          application/json:
            schema:
              type: object
              required: [success, data]
              properties:
                success:
                  type: boolean
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/ActivityCategory'
      '401':
        $ref: '#/components/responses/Unauthorized'
```

## API-GAP-002 — Define the authentication/session lifecycle

| Field | Value |
|---|---|
| Feature | Shared authentication / all protected routes |
| Use case | Sign in, sign out and restore the current session |
| Current contract | Only `GET /auth/me` exists. The frontend currently posts to the local mock route `/api/auth/login` |
| Proposed operations | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (already present) |
| Proposed login request | `{ email: string, password: string }` — no role selector; the role comes from the account |
| Proposed login response | `{ success: boolean, data: { user: Profile, permissions: string[], activeOrganizationMemberships: OrganizationMembership[], activeActivityAssignments: string[] } }` or the same envelope as `/auth/me` |
| Proposed logout response | `{ success: boolean, message: string }` |
| Reason | The OpenAPI contract does not define login or logout; `getCurrentUserContext` is the only auth operation. The FE cannot claim a real login integration without this |
| Priority | High (blocks WP-1 real-auth integration) |
| Frontend impact | `authService` and `AuthProvider` must adapt to the contract envelope and the `Profile.role` field. The local `/api/auth/*` route remains a development mock only |
| Status | `PROPOSED / awaiting backend agreement` — UC-01/UC-02 are outside the three groups covered by this contract |

Notes:

- The current `/auth/me` response is `CurrentUserContextResponse`: `data.user` is a `Profile` with a single `role`, and `data.permissions` is a `string[]`. The FE `getMe()` currently expects a bare `SessionUser`.
- Do not keep the mock login request's `role` field in the production contract; the server reads the role from the account.

## API-GAP-003 — Administrative audit log read operation

| Field | Value |
|---|---|
| Feature | System Administration — audit logs and dashboard activity feed |
| Use case | Administrators review recent audited actions |
| Current contract | The admin spec states `GET /admin/audit-logs` exists, but the tracked YAML has no such path |
| Proposed operation | `GET /admin/audit-logs` |
| Proposed query | Contract-defined pagination (`page`, `limit`), `from`, `to`, `actorId`, `action`, `resource` only if approved |
| Proposed response | `{ success: boolean, data: { items: AuditLogEntry[], pagination: Pagination } }` |
| Proposed schema | `AuditLogEntry` with fields agreed by BE (for example `id`, `createdAt`, `actor`, `action`, `resourceType`, `resourceId`, `summary`) |
| Reason | The spec claims the operation exists; it does not. An audit feed must not be fabricated |
| Priority | Medium (blocks the audit screen and any audit-backed dashboard panel) |
| Frontend impact | Do not render a working audit feed until the operation and schema are agreed |
| Status | `accepted` — applied in 1.2.0: `GET /admin/audit-logs` |

## API-GAP-004 — Administrative import validate/confirm operations

| Field | Value |
|---|---|
| Feature | System Administration — imports |
| Use case | Administrators validate and confirm a resource import |
| Current contract | No `/admin/imports/*` paths exist |
| Proposed operations | `POST /admin/imports/{resource}/validate`, `POST /admin/imports/{resource}/confirm` |
| Proposed `resource` | Closed enum agreed with BE (for example `users`, `activities`, `registrations`) |
| Proposed request | Multipart upload or a contract-defined file reference; do not assume CSV/XLSX |
| Proposed response | Validation summary with row-level errors; confirm summary with created/updated/failed counts |
| Reason | The admin spec describes imports but the contract does not define them |
| Priority | Low (only if imports are approved for the release) |
| Frontend impact | Keep the import entry points absent until the resource enum and upload schema are confirmed |
| Status | `accepted` — applied in 1.2.0: `POST /admin/imports`, `GET|DELETE /admin/imports/{importId}`, `POST /admin/imports/{importId}/confirm` (session-based instead of `{resource}/validate`) |

## API-GAP-005 — Pagination metadata for organizations

| Field | Value |
|---|---|
| Feature | System Administration — organizations |
| Use case | Paginate the organization list |
| Current contract | `GET /admin/organizations` accepts `page` and `limit` but the `200` schema has only `success` and `data: Organization[]` |
| Proposed change | Return `data: { items: Organization[], pagination: Pagination }`, matching `UserListResponse` |
| Reason | The contract advertises pagination inputs without pagination outputs; the FE cannot display total pages or detect the last page |
| Priority | Medium |
| Frontend impact | Until fixed, the organization table can render an unpaginated page with no reliable total |
| Status | `accepted` — applied in 1.2.0: `OrganizationListResponse` with `items` + `pagination` |

## API-GAP-006 — Unify student-number field naming

| Field | Value |
|---|---|
| Feature | System Administration — users; Profile Management |
| Use case | Display and edit a student's academic identity consistently |
| Current contract | `AdminUser.studentId`, `CreateUserRequest.studentNumber`, `AcademicInfo.studentNumber` |
| Proposed change | Use `studentNumber` consistently in `AdminUser` and related responses |
| Reason | Two names for the same institutional identifier invite mapping mistakes and inconsistent forms |
| Priority | Medium |
| Frontend impact | WP-3/WP-5 mappers must handle the current inconsistency explicitly; do not silently alias without recording it |
| Status | `accepted` — applied in 1.2.0: `AdminUser.studentNumber` |

## API-GAP-007 — Distinguish incorrect current password from unauthenticated

| Field | Value |
|---|---|
| Feature | Profile Management — change password |
| Use case | Show an accurate error when the current password is wrong |
| Current contract | `PATCH /profile/password` returns `401` for both "unauthenticated" and "current password is incorrect" |
| Proposed change | Keep `401` for unauthenticated and return a distinct `400`/`422` error code or field error for an incorrect current password, or explicitly confirm that the FE must show a generic message |
| Reason | The Profile spec forbids special-casing a status code as "wrong current password" without contract evidence |
| Priority | Low |
| Frontend impact | Until confirmed, show a generic, non-destructive error and preserve the form |
| Status | `accepted` — applied in 1.2.0: `400` with `code: CURRENT_PASSWORD_INCORRECT`; `401` only for unauthenticated |

## API-GAP-008 — Remove Organizer terminology from schemas

| Field | Value |
|---|---|
| Feature | API hygiene / System Administration |
| Use case | Keep role language consistent with the canonical role model |
| Current contract | `POST /admin/users` summary says "Create a Student or Organizer account"; `OverviewReportResponse.totalOrganizers` exists |
| Proposed change | Replace "Organizer" with manager/administrator terminology; rename `totalOrganizers` to a canonical field such as `totalManagers` (or remove it) |
| Reason | The only roles are `student`, `manager`, `administrator`. `organizer` is invalid |
| Priority | Medium |
| Frontend impact | Do not render `totalOrganizers` or the Organizer label; reports must wait for a canonical field |
| Status | `accepted` — applied in 1.2.0: summary `Create a user account`; `totalManagers` |

## API-GAP-009 — Reconcile contract version references

| Field | Value |
|---|---|
| Feature | API governance |
| Use case | Keep specs, tracker and YAML traceable to one contract version |
| Current contract | `docs/api/openapi.yaml` says `info.version: 1.1.0`; the phase-2 specs cite "OpenAPI v1.2.0" |
| Proposed change | Confirm the authoritative version and update either the YAML or the spec references |
| Reason | Version drift makes it unclear which contract the frontend is implementing |
| Priority | Low (documentation/traceability) |
| Frontend impact | None at runtime; affects audit evidence and future gap analysis |
| Status | `accepted` — applied in 1.2.0: `info.version: 1.2.0` |

## Review-driven changes in 1.2.0

| Item | Decision | Contract change |
|---|---|---|
| Versioned base path | accepted | `servers[0].url` is `/api/v1` |
| `/users/{id}/role` takes a list | rejected (reviewer read outdated docs) | each user has one role: `PUT /admin/users/{userId}/role` with `{ role, reason }`; `Profile`, `AdminUser` and `CreateUserRequest` use a single `role` |
| `organization_id` snake_case | accepted, field removed | BR `ServiceLink` has no organization; field dropped from service schemas |
| Pagination consistency | accepted for unbounded lists | users, organizations, memberships, audit logs paginated; small reference lists stay whole |
| ETag / If-Match | accepted (UC-29 A8, UC-30 A9) | `ETag` header + `version` field; optional `If-Match`; `412 PreconditionFailed` |
| Policy field semantics | accepted (from BR) | `weight` is a multiplier; `minPoints <= maxPoints`; `semesterCap` bounds the criterion-semester total |
| RFC 7807 errors | partly accepted | kept the `{success, message}` envelope; added required machine-readable `code` and `errors[].code` |
| Idempotency | accepted where this contract writes in bulk | import confirm is idempotent per session |
| Score ledger, student score endpoints, attendance/award/appeal endpoints, double-award protection | out of scope | belong to the training-score and requests contracts; BR already models `TrainingScore`, `ScoreChange`, `ScoreAdjustment` and unique (source, criterion) |
| Semester score lock | not adopted | no requirement in Vision, UC or BR; needs stakeholder decision |

Other fixes: removed invalid `paths.admin: null`; declared all tags; `Permission.code` replaces `name`; `Role.name` added; reasons required for role-permission, status and staff profile changes; response bodies defined for previously empty 200/201 responses; `nullable` `$ref` siblings wrapped in `allOf`; report filter renamed `semester` -> `semesterId`; added `PATCH /admin/organizations/{organizationId}/members/{membershipId}` to end a membership.

## Change log

| Date | Change |
|---|---|
| 2026-11-20 | Initial gap register created during WP-0 repository/API audit. No OpenAPI YAML edit was made. |
| 2026-11-25 | Contract 1.2.0: applied API-GAP-001, 003-009 and accepted review items; API-GAP-002 remains proposed. |
| 2026-11-26 | Single-role model: reverted `/roles` to `/role` with `{ role, reason }`; `roles[]` -> `role`; removed multi-duty wording and BR v1.2.0 references; import resource `user-roles` -> `user-role`. |