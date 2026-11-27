# Contract: Mock API (MSW)

Location: `src/client/src/mocks/`. The handlers are shared by the browser worker (`browser.ts`, mock mode) and Vitest (`node.ts`, via `setupServer`).

## Activation

| Setting | Effect |
|---|---|
| `NEXT_PUBLIC_API_MODE=mock` (default in dev) | `MockProvider` dynamically imports `mocks/browser`, awaits `worker.start({ onUnhandledRequest: 'bypass', quiet: true })`, then renders the app. Shows a "Demo data" badge. |
| `NEXT_PUBLIC_API_MODE=real` | The worker is never imported, and requests reach `NEXT_PUBLIC_API_BASE_URL`. |

The handlers match `${NEXT_PUBLIC_API_BASE_URL}/…`, so the mock and real modes use identical URLs.

## Handler behavior

Each handler reads from and writes to the store (`mocks/db/store.ts`); see [data-model.md §4](../data-model.md#4-mock-store-srcmocksdb).
- The simulated latency is 300 ms for login and 150–250 ms for other calls (enough to make loading states visible).
- Token checks decode and verify the mock JWT. A missing, invalid, expired or revoked token returns `401 UNAUTHENTICATED`.
After the token check, the account checks run in this order:
1. **Inactive** user → `403 ACCOUNT_DISABLED` (spec GAP-N). This covers the "disabled while signed in" edge case; the client clears the session and shows the disabled message on `/login`.
2. **`role: null`** → `403 FORBIDDEN`.
3. **`mustChangePassword` true** → `403 PASSWORD_CHANGE_REQUIRED` (GAP-M), except for `GET /auth/me`, `PATCH /profile/password` and `POST /auth/logout`.
4. **Role mismatch**: `/admin/*` requires role `administrator`; otherwise `403 FORBIDDEN`.

**`GET /auth/me` is exempt from checks 1–4** (`withAuth({ skipAccountChecks: true })`). With a valid token it always returns the profile, including `role: null` or `status: 'inactive'` (spec GAP-O). The client applies UC-01 A6 or A3 itself. `POST /auth/logout` is exempt from checks 1–3, so a disabled or role-less user can still sign out.

| Operation | Mock rules (beyond the contract) |
|---|---|
| `POST /auth/login` | `outage@…` → 503. Locked → 423 with `Retry-After`. Unknown email or wrong password → 401 `INVALID_CREDENTIALS` and a failure counted against that email (unknown emails count too, so locking doesn't reveal whether an account exists). Inactive → 403 `ACCOUNT_DISABLED`. Otherwise 200 with `{ token, expiresAt }` (1-hour exp, `jti`). |
| `POST /auth/logout` | Adds `jti` to `revokedTokenIds`; returns 200. An already-invalid token → 401. |
| `GET /auth/me` | No account checks (see above). Returns `user` (`Profile` + `mustChangePassword`, `role` possibly `null`), `permissions` from the role (empty for `role: null`), and empty assignments. |
| `PATCH /profile/password` | Wrong current password → 400 `CURRENT_PASSWORD_INCORRECT`. New password under 8 characters → 400 `VALIDATION_FAILED`. Success saves the password and clears `mustChangePassword`. |
| `GET /admin/users` | Search is a case-insensitive contains-match on name, email and student number. Filters on `role`; sorts and paginates according to the query. |
| `POST /admin/users` | Returns, in this order: `role` not a single enum string → 400 `VALIDATION_FAILED` `errors[{field:'role'}]` (A11). Missing required fields → 400 with field errors. Student fields on a non-student → 400 `ROLE_POLICY_VIOLATION` (A6). Duplicate email or student number → 409 `DUPLICATE_VALUE` with a field error. Otherwise it creates `{ id, version:1, status:'active', mustChangePassword:true }`, stores `initialPassword`, and returns 201. |
| `GET /admin/faculties`, `/admin/roles`, `/admin/roles/{id}/permissions` | Return seeded reference data. |

## Failure switch (dev and test)

`store.failures: OperationId[]`. When an operation ID is listed, its handler returns `500` (or `HttpResponse.error()` for the IDs with a `:network` suffix) and leaves the store unchanged.

The IDs are `login`, `logout`, `me`, `changePassword`, `listUsers`, `createUser`, `listFaculties` and `listRoles`, each optionally with `:network`.

How to set them:
- In tests: `setMockFailures(['createUser'])`.
- In the browser (dev only): `window.__myhcmusMock.fail('createUser')`, `.clearFailures()`, `.reset()`, or `.expireSessions()`. The last one revokes every issued token, so the next request returns 401 (UC-02 A2, FR-018).

The `window.__myhcmusMock` helper exists only in mock mode.

## Reset

`window.__myhcmusMock.reset()` re-seeds the store; clearing site data does the same. The helper `window.__myhcmusMock.disable(email)` sets a stored user to `inactive`, which is used to demo the GAP-N case mid-session. In tests, `resetMockDb()` runs in `beforeEach`.
