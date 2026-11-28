# Handoff: 006 integrate profile

**Branch**: `feat/frontend/integrate-profile`, created from `feat/frontend/integrate-hub` at `51edef6`, pushed to origin.
**Rollback tag**: `pre-profile-merge` = `51edef6`.
**Resumed**: 2026-11-28. The user then asked again for **a commit and push after every step**. This replaces the earlier "one commit for steps 4–8" instruction. Step 9 still stays uncommitted until the user decides.

**Related files**:
- [plan.md](./plan.md): "Approved decisions" and "Docs re-read" at the top;
- [coverage.md](./coverage.md);
- `../003-auth-dashboard-admin-users/docs-changes.md`: the shared DOC register.

**Phase scope (approved).** The merge plus a thorough local run: mock mode fully, and real mode for the profile and hub operations with a minted token. End-to-end auth against the BE is **not** in this phase (see the last section).

## Steps

| Step | Status | Commit | What | Tests |
|---|---|---|---|---|
| — Plan | done | `387b7a2` | `plan.md` with approved decisions and the docs re-read, committed before the merge | — |
| 1 Merge origin/dev | done | `ea889ce` | 9 conflicts resolved as in plan §2; cookie BFF and second forwarder removed (O1/O2); `gen:api`; minimum compile fixes | 419 |
| 2 API client | done | `ea9a58c` | object-shaped `details { field }`; ServiceResponse " (STATUS)" suffix stripped; `INTERNAL_ERROR`; `api.blob()` | 425 |
| 3 Shared rules + route | done | `0f654cd` | `libs/validation/password.ts` (8 code points), `libs/validation/phone.ts` (contract pattern, also admin create); `/profile` shared route; nav Profile → `/profile`; AccountMenu "My profile" | 430 |
| 4 MSW profile handlers | done — gates green: tsc, 65 files / 450 tests, lint, build, server/db identical | step 4 commit | MSW profile/avatar handlers matching `src/server`; service on our paths and adapters; dev's 4 `vi.mock` test files rewritten on MSW (same titles); shared-rule and migration tests | 450 |
| 5 Hooks / services | done — gates green: tsc, 66 files / 455 tests, lint, build, server/db identical | step 5 commit | `useMyProfile` (`useAsyncResource`, server-confirmed `apply`, retry drops it); ProfilePage on it; saves call `auth.refresh()` (AccountMenu follows `/auth/me`, no second store); `toUserMessage` contexts `profilePhone` / `avatarUpload` / `avatarRemove`; server field error → field; forbidden → `ForbiddenView` | 455 |
| 6 UI | not started | — | — | — |
| 7 Forwarder (binary / multipart) | not started | — | — | — |
| 8 Docs (DOC-19 to DOC-23, …) | not started | — | — | — |
| 9 Final gates + walkthrough | not started | — | — | — |

### Step 4: done
- **`coverage.md`**, written **before** any deletion: spec 004-profile US1–US3, the edge cases, UC-03 A1–A9 and the 003 first-sign-in flow, each mapped to its target test. It also has a table of dev's tests and their replacements. **No dev test has been deleted or rewritten yet.**
- **Mock DB:**
  - `MockUser.avatarUrl` (seed: null; admin-created users: null);
  - `migrateProfile` in `mocks/db/seed.ts`, run once by `readDb` next to `migrateHub`, keeping users and sessions;
  - new failure-switch operations `getProfile`, `updateProfile`, `uploadAvatar`, `removeAvatar`, plus `uploadAvatar:conflict` and `removeAvatar:conflict` (409);
  - `mocks/db/avatar-files.ts`, an in-memory byte store (Q7), cleared by `resetMockDb`;
  - `toProfile` (`/auth/me`) now returns the user's `avatarUrl`.

### Step 4: left (in this order)
1. In `mocks/handlers/profile.ts`, keep the 003 `PATCH /profile/password` and add the following, answering exactly like `src/server`:
   - **`GET /profile` and `PATCH /profile`** in the ServiceResponse envelope (`hubOk` / `hubFail` from `mocks/utils/service-response.ts`, worth renaming or aliasing to `serviceOk` / `serviceFail`). The BE messages:
     - `'A profile update object is required'`;
     - `'Only phoneNumber may be updated'` with `{ fields }`;
     - `'phoneNumber is required'`;
     - `'Phone number must be 10 digits starting with 0 or +84 followed by 9 digits'` with `{ field: 'phoneNumber' }`;
     - 409 `'Phone number is already in use'` with `{ field }`, where `0…` and `+84…` count as the same number.
     - The response body is `{ id, email, fullName, phoneNumber, avatarUrl, academicInfo }`.
   - **`POST /profile/avatar`:**
     - multipart, exactly one file field named `avatar`;
     - magic bytes PNG `89 50 4E 47` / JPEG `FF D8 FF`; size ≤ 10 MiB inclusive; otherwise 400 `{ success: false, code: 'UNSUPPORTED_FILE', message }`;
     - success 200 `{ success: true, data: { avatarUrl: '/api/v1/profile/avatar/files/{uuid}.png|jpg' } }`;
     - `:conflict` → 409; a failure → 500 `{ success: false, message }`.
   - **`DELETE /profile/avatar`:** 200 `{ success: true, message: 'Avatar removed successfully' }`.
   - **`GET /profile/avatar/files/:name`:** the bytes when the name is the caller's current file, otherwise 404 `{ success: false, message: 'Picture not found' }`.
   - **Guards:** all of these use `withAuth`. Wrap them in `withFailureSwitch` with the new operation names.
2. **Handler tests** in `mocks/handlers/profile.test.ts`, using the titles in `coverage.md`. `mocks/db/store.test.ts`: "adds avatarUrl to an older store's users and keeps sessions". **V** tests: `libs/validation/password.test.ts` and `libs/validation/phone.test.ts`.
3. **Port `features/profile/services/profile.service.ts`** to our paths (`/profile`, `/profile/avatar`) and adapters. `GET`/`PATCH` use `unwrapServiceResponse`; the avatar upload uses `unwrap`. Move `mapProfile` to `features/profile/mappers/profile.mapper.ts`. MSW needs this; step 5 then adds the hooks.
4. **Rewrite dev's `vi.mock` tests onto MSW** with the same titles: `profile.service.test.ts`, `ProfilePage.test.tsx`, `AvatarEditor.test.tsx`, `PasswordChangeForm.test.tsx`. Keep the two envelope cases as mapper tests.
5. Run the gates, commit as `feat(client): MSW profile handlers … (plan 006 step 4)`, and push.

## Decisions made this session that are not yet in plan.md

- **Step 1 compile fix.** Dev's `PasswordChangeForm` is **adapted**, not swapped for `ChangePasswordForm`. Our first-sign-in form redirects to the dashboard on success, which is wrong on the profile page, so the real replacement stays in step 6. The plan said "temporary import of `ChangePasswordForm`".
- **Also removed in step 1:** dev's `features/auth/services/auth.service.test.ts`, which tests the pre-003 `/api/auth` paths and `{ success }` bodies. It covers no UC-03 scenario (recorded in `coverage.md`).
- **Message suffix.** `toApiError` now strips the ServiceResponse `" (STATUS_NAME)"` suffix from messages. This also changes the 005 hub messages: one 005 test expectation was updated.
- **Dev's validators delegate.** `password.validation.ts` and `profile.validation.ts` now call the shared rules. Dev's fixtures moved from 6- to 8-character passwords, and the scenarios are kept.
- **The phone rule applies in three places:** the admin-create zod schema, the MSW admin-users handler (mock-only enforcement, Q4), and the profile.
- **AccountMenu focus.** The menu's first item is now "My profile", and opening the menu focuses it. The 003 "logs out with Enter" test now presses Tab to reach "Log out" first.
- **Mock 409.** The avatar 409 race is simulated with the failure-switch ids `uploadAvatar:conflict` / `removeAvatar:conflict`.
- **Dev-server cache (local only).** Your running dev server left `.next/dev/types/routes.d.ts` half-written, which broke `next build`. I trimmed 4 garbage lines; the backup is `routes.d.ts.corrupt.bak` in the session scratchpad. The gate now type-checks with a scratchpad tsconfig that skips `.next/dev`. If `npm run build` fails on `.next/dev/types`, restart `npm run dev`.
- **Pushing.** The remote needs `git -c http.sslBackend=schannel push` on this machine (SSL CA), as in 005. The push is verified against `@{u}` after each step.
- **Docs re-read (already in `plan.md`):** see plan.md "Docs re-read". Summary:
  - only `openapi.yaml`, `vision-document.md` and `activity_register_feat_spec.md` changed on dev;
  - BR-ACC-09, NFR-SEC-02 and UC-03 A7 all say six, so the FE's 8 is stricter than every doc (DOC-23; DOC-09 stays open);
  - `openapi-changes.md` has no row for dev's YAML edits (DOC-22);
  - `avatarUrl` is now `uri-reference`;
  - `Profile` requires `id, email, fullName, phoneNumber, academicInfo`;
  - `additionalProperties: false` on the password and avatar requests.

## Failing tests / known broken things

- **Tests:** at `0f654cd` (step 3) all gates were green (430 tests). The uncommitted step 4 work (`coverage.md` + mock DB) also passed every gate: tsc, 430 tests, lint, build, and `src/server` / `src/db` identical to origin/dev. No WIP commit was made, at the user's request.
- **Avatar image:** `ProfilePage` still renders dev's `<img src={avatarUrl}>`. In mock mode that is an app-origin 404, and in real mode it would need the cookie that we don't use. Replaced by `ProfileAvatar` (blob fetch) in step 6.
- **Profile service:** it still calls the absolute paths `/api/v1/profile*`, so it is not on MSW yet (step 4, item 3). Its current tests pass only because they mock the service.
- **Forwarder:** it is not binary-safe yet (step 7). A real-mode avatar upload or file read through `/api/backend` would be corrupted until then.

## src/server and src/db

`git diff origin/dev -- src/server src/db` is **empty**, checked at steps 1, 2 and 3.

## Exact next action

In `src/client/src/mocks/handlers/profile.ts`, add the `GET`/`PATCH /profile`, `POST`/`DELETE /profile/avatar` and `GET /profile/avatar/files/:name` handlers described in "Step 4: left", item 1. Then continue with items 2–5.

## Next phase: E2E authentication (not part of 006, no implementation now)

**Prep already in place.** All auth transport is in `features/auth/services/auth.service.ts` plus the single API client (`libs/api-client.ts`). Session state is in `AuthProvider`, and `/auth/me` is mapped in `features/auth/mappers/current-user.mapper.ts`. The next phase should only need to change the auth service, the mappers and config (`.env`, the forwarder allowlist). There must be no per-component auth calls.

**Known gaps** between our auth layer (003 contract plus gaps) and the current BE on origin/dev (`src/server`):

| # | Gap | Our side | Current BE | DOC / ref |
|---|---|---|---|---|
| A1 | **Unversioned paths** | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` under `NEXT_PUBLIC_API_BASE_URL` (`…/api/v1`) | `POST /api/auth/login`, `GET /api/auth/me` (`SessionRoute`), with no `/api/v1` prefix; `/api/auth/register` still public | 003 GAP-E, GAP-F; DOC-19 |
| A2 | **Login response shape** | the contract `{ success, data: { accessToken, … } }` plus gaps (DOC-03) | ServiceResponse `{ payload: { data: { token } } }` | DOC-03, DOC-16, DOC-19 |
| A3 | **Login errors** | `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `ACCOUNT_LOCKED` (`Retry-After`), `ROLE_MISSING` | the generic messages of the BE `AuthController`; no lockout | DOC-04, DOC-14 |
| A4 | **`/auth/me` shape** | `Profile` + a single `role` (nullable, DOC-02), `status`, `mustChangePassword` (DOC-06), `permissions` | `{ userId, email, fullName, avatarUrl, facultyId, studentNumber: null, roles[], permissions[] }`: several roles, no `status`, no `mustChangePassword`, `studentNumber` always null | DOC-01, DOC-02, DOC-06, 003 GAP-G (one role per account) |
| A5 | **Logout** | `POST /auth/logout` (token revocation, UC-02) | none on the BE (dev's only logout was the cookie BFF we removed) | 003 GAP-E, DOC-12 |
| A6 | **Token subject** | the forwarder passes our bearer (005 Q1) | hub permissions (`requirePermission`) and the profile owner both read the token `sub` as a DB `User.user_id` | 005 R6, DOC-17 |
| A7 | **Password minimum** | the FE enforces 8 code points (Q3) | BE, `openapi.yaml`, BR-ACC-09, NFR-SEC-02 and UC-03 A7 say 6 | DOC-23, DOC-09 (open) |
| A8 | **Account status on authenticated calls** | `ACCOUNT_DISABLED` handling (DOC-01) | profile: SQL `is_active`; `/api/auth/me` answers 401 "Account unavailable" for inactive accounts | DOC-01 |
| A9 | **Role codes** | `administrator` (the contract) | DB `administrator` ✔; dev's FE mapped it to `admin` (removed) | — |
| A10 | **Session transport** | bearer in the token store plus the hint cookie (003 DOC-03, 005 Q1) | dev's alternative was httpOnly cookies through a Next BFF (not adopted, Q1) | DOC-19 |
