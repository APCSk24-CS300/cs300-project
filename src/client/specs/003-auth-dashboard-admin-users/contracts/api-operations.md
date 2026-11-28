# Contract: API Operations Used by This Feature

Base URL: `NEXT_PUBLIC_API_BASE_URL` (contract `servers[0]`: `http://localhost:8080/api/v1`). Every request except login sends `Authorization: Bearer <token>`, with the token read from `localStorage` (never a cookie). Every response uses the `{ success, data | message }` envelope, and errors use `ErrorResponse { success:false, code, message, errors? }`.

**Source** column:
- **C**: defined in `openapi.yaml` v1.2.0.
- **G**: gap or proposal (not in the contract). Typed in `src/types/openapi-gaps.ts` and tagged with its GAP ID; the real backend must accept it before real-mode use.

| # | Operation | Method + path | Source | Used by | Request | Success | Errors the UI branches on |
|---|---|---|---|---|---|---|---|
| 1 | login | `POST /auth/login` | **G** API-GAP-002, GAP-B | UC-01 | `{ email, password }` | `200 { success, data: { token, expiresAt } }` (token in body, mirrors server) | 400 `VALIDATION_FAILED` (A1) · 401 `INVALID_CREDENTIALS` (A2) · 403 `ACCOUNT_DISABLED` (A3) · 423 `ACCOUNT_LOCKED` + `Retry-After` (A4) · 503 / network (A5) · 403 `ROLE_MISSING` (A6) |
| 2 | logout | `POST /auth/logout` | **G** API-GAP-002 | UC-02 | — | `200 ApiMessage` | 401 → treated as success (A2) · network / 5xx → local clear and notice (A3) |
| 3 | getCurrentUserContext | `GET /auth/me` | **C** (+ `user.mustChangePassword` **G** GAP-M; nullable `user.role` **G** GAP-O) | UC-01 step 5, reload, US7 | — | `200 CurrentUserContextResponse` (role may be `null`) | 401 `UNAUTHENTICATED` → sign-in (FR-018) · `role` null/unknown → A6 · `status: inactive` → A3 · 5xx/network right after login → discard token, service-unavailable (FR-007a) |
| 4 | changeOwnPassword | `PATCH /profile/password` | **C** | US7 (UC-03 A2/A7) | `ChangePasswordRequest { currentPassword, newPassword(min 8) }` | `200 ApiMessage` | 400 `CURRENT_PASSWORD_INCORRECT` · 400 `VALIDATION_FAILED` · 401 |
| 5 | listUsers | `GET /admin/users?search&role&page&limit=10&sortBy=createdAt&sortOrder=desc` | **C** | US5 (UC-29 1–2, A1) | query | `200 UserListResponse` | 401 · 403 → no-permission view |
| 6 | createUser | `POST /admin/users` | **C** (+ `initialPassword` **G** GAP-C; `400 ROLE_POLICY_VIOLATION` **G** GAP-H) | US6 (UC-29 3–8) | `CreateUserRequest` + `initialPassword` | `201 AdminUserResponse` | 400 `VALIDATION_FAILED` (field `role` → A11) · 400 `ROLE_POLICY_VIOLATION` (A6) · 409 `DUPLICATE_VALUE` (field) · 5xx / network (A9) · 401 / 403 |
| 7 | listFaculties | `GET /admin/faculties` | **C** | US6 (student fields) | — | `200 { data: FacultySummary[] }` | any → field-level error with retry |
| 8 | listRoles | `GET /admin/roles` | **C** | US6 review | — | `200 { data: Role[] }` | any → permissions panel error with retry; Confirm stays enabled |
| 9 | getRolePermissions | `GET /admin/roles/{roleId}/permissions` | **C** | US6 review (NFR-USA-13) | — | `200 RolePermissionsResponse` | same as #8 |

## Global rules

- **Any 401** on calls 3–9 triggers `onUnauthorized`: clear the token and hint, then redirect to `/login?reason=expired&redirectTo=…` (FR-018).
- **Any 403 `ACCOUNT_DISABLED`** on calls 4–9 (GAP-N) clears the token and the hint, then redirects to `/login?reason=disabled` (FR-018a). Calls 2 (logout) and 3 (`/auth/me`) are exempt from the status check. `/auth/me` reports `status: 'inactive'` instead, and the client applies the same handling at login and on reload.
- **Any 403 `PASSWORD_CHANGE_REQUIRED`** (GAP-M) redirects to `/change-password`.
- **Any 403 `FORBIDDEN`** renders the shared no-permission view (FR-021).
- **Message text** comes from `toUserMessage(code)`; the server `message` is never displayed raw (FR-011).

## Known server mismatches (not adapted, recorded as GAP-E)

| Topic | Contract / this client | `src/server` today |
|---|---|---|
| Base path | `/api/v1/auth/*` | `/api/auth/*` |
| Envelope | `{ success, data }` / `{ success, code, message }` | `{ success, statusCode, payload: { message, data } }` |
| Unknown email | 401 `INVALID_CREDENTIALS` (same as wrong password) | 404 "Email not found" |
| Token location | `data.token` | `payload.data.token` |
| `/auth/me`, `/auth/logout` | used | not implemented |

Real mode works once the BE aligns with the contract. The client does not ship a compatibility adapter.
