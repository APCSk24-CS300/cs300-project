# Data Model: Role-Based Dashboard Shell, Authentication, and Administrator Account Registration

**Feature**: `003-auth-dashboard-admin-users` | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

The model has three layers (client constitution V):
- **Wire DTOs**: generated from `docs/api/openapi.yaml` into `src/types/openapi.gen.ts`, plus gap shapes in `src/types/openapi-gaps.ts`.
- **Domain types**: in `features/*/types/`.
- **Mock store records**: in `src/mocks/db/`.

Explicit mappers in `features/*/mappers/` convert between DTOs and domain types.

---

## 1. Shared enums

| Name | Values | Source |
|---|---|---|
| `RoleCode` | `student`, `manager`, `administrator` | `UserRole` (contract) → `src/libs/roles.ts` |
| `AccountStatus` | `active`, `inactive` | `AccountStatus` (contract) |
| `ApiErrorCode` | contract: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `CURRENT_PASSWORD_INCORRECT`, `DUPLICATE_VALUE`, `ROLE_POLICY_VIOLATION`, `PRECONDITION_FAILED`, …; gap (GAP-B/M): `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `ACCOUNT_LOCKED`, `ROLE_MISSING`, `PASSWORD_CHANGE_REQUIRED`, `SERVICE_UNAVAILABLE`; client-only: `NETWORK_ERROR`, `UNKNOWN` | `ErrorResponse.code` |

The role labels are Student, Manager and Administrator. Every role-to-label and role-to-URL-prefix mapping lives in `roles.ts` only.

---

## 2. Domain entities

### 2.1 `CurrentUser` (features/auth/types)

Built from `CurrentUserContextResponse.data` by `toCurrentUser()`.

| Field | Type | From | Rule |
|---|---|---|---|
| `id` | `string` | `user.id` | required |
| `email` | `string` | `user.email` | required |
| `fullName` | `string` | `user.fullName` | required |
| `role` | `RoleCode` | `user.role` (nullable on the wire, **GAP-O**) | must be one of the three values; `null`, missing or unknown → the mapper throws `InvalidRoleError`, and the client applies A6 |
| `status` | `AccountStatus` | `user.status` | `inactive` is treated as A3 |
| `avatarUrl` | `string \| null` | `user.avatarUrl` | |
| `studentNumber` | `string \| null` | `user.academicInfo.studentNumber` | |
| `faculty` | `{ id, code, name } \| null` | `user.academicInfo.faculty` | |
| `permissions` | `string[]` | `permissions` | used only to show or hide UI |
| `mustChangePassword` | `boolean` | `user.mustChangePassword` (**GAP-M**) | defaults to `false` when absent |

It replaces the existing `SessionUser`/`StudentSessionUser`/`StaffSessionUser`. Those used numeric IDs and the `admin` code, and don't match the contract. Callers migrate; there is no parallel type.

### 2.2 `SessionHint` (src/libs/session-hint.ts)

This is a non-secret cookie `myhcmus_session` that the route guard can read.

| Field | Type | Rule |
|---|---|---|
| `role` | `RoleCode` | copied from `CurrentUser.role` |
| `mustChangePassword` | `boolean` | copied from `CurrentUser.mustChangePassword` |
| `exp` | `number` (epoch seconds) | equals the token `exp`; the hint is invalid once `now ≥ exp` |

It is encoded as base64url JSON. It is never used to authorize data.

### 2.3 `AccessToken` (src/libs/token-store.ts)

This is the opaque bearer string, kept in **`localStorage`** under the key `myhcmus:token`. It is never written to a cookie (spec FR-010). Every storage access is wrapped in try/catch; if storage is unavailable, the user is treated as signed out.

The client decodes only `exp` (with `jose.decodeJwt`, no verification) to set the hint cookie's `Max-Age` and `exp`, and treats the token as gone once `now ≥ exp`. Other tabs observe changes through the `storage` event (spec FR-018b).

### 2.4 `NavItem` (src/libs/navigation.ts)

| Field | Type | Rule |
|---|---|---|
| `id` | `string` | unique per role; `dashboard` is required for each role |
| `label` | `string` | from spec FR-024 |
| `href` | `string` | under the role prefix |
| `status` | `'available' \| 'coming-soon'` | only `available` items render as links |
| `ucId` | `string` | traceability, e.g. `UC-29` |

### 2.5 `AccountSummary` (features/admin-users/types)

Built from an `AdminUser` list item by `toAccountSummary()`.

| Field | Type |
|---|---|
| `id` | `string` |
| `fullName` | `string` |
| `email` | `string` |
| `role` | `RoleCode` |
| `status` | `AccountStatus` |
| `studentNumber` | `string \| null` |
| `createdAt` | `Date` |

`AccountPage = { items: AccountSummary[]; page; limit; totalItems; totalPages }`, taken from `Pagination`.

`AccountListQuery = { search?: string; role?: RoleCode; page: number }`. The limit is fixed at 10 and the sort at `createdAt desc` (FR-028).

### 2.6 `NewAccountDraft` (features/admin-users/types)

This is the form state of the creation wizard.

| Field | Type | Validation (zod) |
|---|---|---|
| `email` | `string` | required; valid email; trimmed and lowercased |
| `fullName` | `string` | required; 1–100 chars after trimming |
| `role` | `RoleCode` | exactly one value (a single radio group); arrays are impossible in the UI and rejected by the server (A11) |
| `phoneNumber` | `string \| ''` | optional; trimmed only, no format rule (open question, spec GAP-P) |
| `studentNumber` | `string \| ''` | required when `role = student`; non-empty and at most 20 characters; ignored otherwise |
| `facultyId` | `string \| ''` | required when `role = student`; must be the `id` of a loaded `Faculty` (§2.10); ignored otherwise |
| `temporaryPassword` | `string` | always set; the generated value or an override; at least 8 characters (FR-036b) |
| `passwordOverridden` | `boolean` | UI flag; when `false`, edits to the name, student number or role regenerate the password (FR-036a) |

`toCreateUserRequest(draft)` drops `studentNumber` and `facultyId` for non-students, maps `''` to `null`, and maps `temporaryPassword` to `initialPassword` (GAP-C).

### 2.7 `CreatedAccount`

`{ account: AccountSummary; temporaryPassword: string }`. It is held only in the wizard's memory for the result view, and is never persisted or refetched (FR-036c).

### 2.8 `RolePermissions`

`{ role: RoleCode; permissions: { code: string; description: string }[] }`. It comes from `GET /admin/roles` and `GET /admin/roles/{roleId}/permissions`, and is shown on the review step.

### 2.9 `ChangePasswordDraft` (features/auth/types)

| Field | Validation |
|---|---|
| `currentPassword` | required |
| `newPassword` | at least 8 characters; must differ from `currentPassword` |
| `confirmPassword` | must equal `newPassword` (checked client-side, as the contract instructs) |

It is sent as `ChangePasswordRequest { currentPassword, newPassword }` to `PATCH /profile/password`.

### 2.10 `Faculty` (features/admin-users/types)

`{ id: string; code: string; name: string }`. It is built from the `FacultySummary` DTO by `toFaculty()` in `features/admin-users/mappers/` (constitution C-V). `AdminUsersService.listFaculties()` returns `Faculty[]`. Components never receive `FacultySummary`.

Mapper rules:
- `id` and `name` are required; an item missing either is dropped.
- A missing `code` becomes `''`.
- The list is sorted by `name` using the `vi` collation.

### 2.11 `ApiError` (src/libs/api-client.ts)

`{ status: number; code: ApiErrorCode; message: string; fieldErrors: Record<string, string>; retryAfterSeconds?: number }`. A mapper function `toUserMessage(error, context)` in `src/libs/error-messages.ts` returns display text. This is the only place where codes become copy (constitution VI, consistency).

---

## 3. State machines

### 3.1 Session (AuthProvider)

```text
            ┌──────────── bootstrap: hint+token present ──────────┐
            │                                                      ▼
[unknown] ──┴─ no token ─► [signedOut] ── login ok ─► [loadingContext] ── /auth/me ok ──┬─► [signedIn]
                               ▲   ▲                       │ role invalid / me fails    └─► [mustChangePassword]
                               │   └──── A6: clear ────────┘                                    │
                               │                                                                │ PATCH /profile/password ok
                               │                                                                ▼
                               ├──── logout (always clears, A2/A3) ◄──────────────────── [signedIn]
                               ├──── 401 from any call / hint exp passed (FR-018) ◄───────────────┤
                               ├──── 403 ACCOUNT_DISABLED from any call (FR-018a) ◄───────────────┤
                               └──── token removed in another tab (storage event, FR-018b) ◄──────┘
```

After login, if `/auth/me` fails with a 5xx or network error, the token is discarded and the state returns to `[signedOut]` with the service-unavailable message (spec FR-007a).

**`applyContext()` runs after both login and bootstrap.**
- `status: inactive` → `[signedOut]`, then `/login?reason=disabled`.
- Invalid or `null` role → `[signedOut]`, then `/login?reason=role-missing` (FR-007, FR-018a).
- At bootstrap only, a 5xx or network error keeps the token and shows a retryable error.

**Every entry into `[signedOut]` goes through `signOutLocally()`**, which clears both the token and the hint cookie. A stale hint therefore can't outlive the token and loop the user between protected pages and `/login` (FR-018c).

### 3.2 Account-creation wizard

```text
[form] ── Review (valid) ─► [review] ── Confirm ─► [submitting] ── 201 ─► [result]
  ▲  │                        │  ▲                    │
  │  └─ Cancel (A2, ask if dirty) ─► leave, nothing saved
  │                           │  └── 400/409/5xx/network: show error, keep input (A6/A9/dup) ─┐
  └──── Back / field error ───┘◄──────────────────────────────────────────────────────────────┘
```

On `[result]` the list query is invalidated, so the new row appears without a manual reload (FR-038).

### 3.3 Login attempts (mock store; server-owned in real mode)

The record is `{ email, consecutiveFailures, lockedUntil? }`.
- A failure increments `consecutiveFailures`. When it reaches 5, `lockedUntil = now + 15 min`.
- A success resets the record.
- While `now < lockedUntil`, every attempt returns `423` with `Retry-After`.

---

## 4. Mock store (`src/mocks/db`)

The store is a localStorage key `myhcmus:mock-db:v1`:

```text
MockDb {
  version: 1
  users: MockUser[]             // AdminUser fields + passwordPlain (mock only) + mustChangePassword + role: RoleCode | null
  faculties: FacultySummary[]   // subset of src/server/src/enums/Faculty.ts, ids as strings
  roles: Role[]                 // 3 records: role-student, role-manager, role-administrator
  rolePermissions: Record<roleId, PermissionCode[]>  // from BR permission codes in src/types/entities.ts
  revokedTokenIds: string[]
  loginAttempts: Record<emailLower, { consecutiveFailures: number; lockedUntil?: string }>
  failures: OperationId[]       // dev/test switch: operations forced to fail (see contracts/mock-api.md)
}
```

### Seed accounts

The store holds **six users**, all with the password `demo2026`. The seventh row, `outage@example.invalid`, is **not a stored user**. It is a rule in the login handler that always returns 503, checked before the user lookup.

| Email | Role | Status | mustChangePassword | Purpose |
|---|---|---|---|---|
| `student1@example.invalid` | student (`23127001`, faculty 120) | active | false | US1 |
| `manager1@example.invalid` | manager | active | false | US1 |
| `admin@example.invalid` | administrator | active | false | US1, US5, US6 |
| `disabled@example.invalid` | student | inactive | false | UC-01 A3 |
| `norole@example.invalid` | `null` | active | false | UC-01 A6 |
| `newuser@example.invalid` | student | active | true | US7 |
| `outage@example.invalid` *(handler rule, not stored)* | — | — | — | login always returns 503 (UC-01 A5) |

Invariants enforced by the handlers:
- Email is unique case-insensitively.
- Student number is unique.
- Every created user has exactly one role.
- Every created user starts with `mustChangePassword: true`.
- Passwords are compared exactly.
