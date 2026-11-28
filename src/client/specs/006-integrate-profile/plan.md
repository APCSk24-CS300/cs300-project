# Plan 006: Integrate Profile Management (origin/dev) into the 003 + 005 frontend

**Branch**: proposed `feat/frontend/integrate-profile`, created from `feat/frontend/integrate-hub` at `51edef6`, where plan 005 is done. See Q8.
**Merging**: `origin/dev` at `5302b6d` (PR #106 `feat/end-to-end`). The merge-base is `95b150f`, the dev commit that 005 merged.
**Status**: Approved 2026-11-28, with changes (see "Approved decisions"). §1, §3, §4, §6, §7 and §8 are updated to match.
**Date**: 2026-11-28

## Approved decisions (override the options in §3–§8)

**Phase scope.** This phase is the merge plus a thorough local run:
- mock mode, fully;
- real mode for the profile and hub operations, with a minted token.

End-to-end authentication against the BE is **not** part of this phase; it is the next feature. See HANDOFF "Next phase: E2E authentication".

**Answers**
- **Q1.** Do not adopt dev's cookie BFF; 005 Q1 stays.
- **Q2.** One `ChangePasswordForm` with `variant: "first-sign-in" | "profile"`.
- **Q3 (changed from the recommendation).** The FE keeps the password minimum at **8 code points everywhere**:
  - where: the 003 first-sign-in form, the profile change-password form, `libs/validation/password.ts`, the MSW mock, and the copy "At least 8 characters";
  - recorded as **DOC-23**: the FE enforces 8, while dev's `openapi.yaml` (`minLength: 6`), the BE (6), BR-ACC-09, NFR-SEC-02 and UC-03 A7 (all "six") say 6;
  - being stricter is compatible with the BE; DOC-23 asks the team to align contract, BE and BR on one value;
  - **DOC-09 stays open.**
- **Q4.** The phone pattern applies to both profile and admin create, through one shared validator. For admin create it is enforced in the mock only, until the contract adds the pattern there.
- **Q5.** The avatar loads through an authenticated blob fetch in the API client.
- **Q6.** Real-mode sign-in stays blocked; no `auth/*` remapping in the forwarder. DOC-19 is raised.
- **Q7.** Mock avatar bytes are kept in memory.
- **Q8.** New branch `feat/frontend/integrate-profile` from `feat/frontend/integrate-hub` (`51edef6`).

**Prep for the next phase (no implementation now)**
- All auth transport stays inside `features/auth/services/auth.service.ts` plus the single API client, so the next phase only changes the auth service, its mappers and config.
- `HANDOFF.md` gets the section "Next phase: E2E authentication": every known gap between our auth layer and the current BE, with DOC IDs.

**Execution**
- As in §7 and 005: tag `pre-profile-merge`, with a checkpoint after step 1 (build + tests pass, then report and stop).
- `coverage.md` is written before dev's tests are deleted.
- One commit per step, with test + lint + build and a push after each.
- `git diff origin/dev -- src/server src/db` stays empty.

## Docs re-read on origin/dev (2026-11-28, before step 1)

**Re-read:** `openapi.yaml`, `openapi-changes.md`, `vision-document.md`, `use-case-specifications.md` (UC-01, UC-03, UC-29), `business-rules.md` (BR-ACC-*), `docs/analysis-and-design/client/*` and `docs/analysis-and-design/fe/*`.

**Changed since the merge-base:** only `openapi.yaml`, `vision-document.md` and `activity_register_feat_spec.md`. The use cases, business rules, `openapi-changes.md` and the client/fe design docs are unchanged (identical to our HEAD).

**New or more precise than the first draft of §1 / §4:**
- `Profile` now **requires** `id, email, fullName, phoneNumber, academicInfo`. `Profile.avatarUrl` and `AvatarResponse.data.avatarUrl` changed from `format: uri` to **`uri-reference`** ("legal same-origin URL"). `AvatarResponse.data.avatarUrl` is now required.
- `ChangePasswordRequest` and `AvatarUploadRequest` get `additionalProperties: false`. Our request already sends only `currentPassword` and `newPassword`. The avatar limit is stated as 10485760 bytes inclusive.
- **`openapi-changes.md` has no row** for any of dev's YAML changes, and the version is still 1.2.0. This strengthens DOC-22.
- **Password minimum in the docs:** BR-ACC-09 says "at least six characters" (unchanged), as do NFR-SEC-02 ("at least 6 characters") and UC-03 A7 ("shorter than six characters"). So the FE's 8 (approved Q3) is stricter than every doc (DOC-23).
- **Phone:** UC-03 / BR-ACC-07 define no format; dev's `UpdateProfileRequest.phoneNumber.pattern` is the only definition (DOC-07).
- `vision-document.md`: only Workflow 1.4 (registration cancellation and waiting list) changed. That is not profile-related.

None of these changes affects an approved decision.

**Kept from 005, unchanged** (005 plan, "Approved decisions"):
- **Q1** forward the user's bearer; the dev token is an opt-in fallback;
- **Q2** real mode is tested with a minted token;
- **Q3** shared routes;
- **Q4** no folder renames;
- **Q5** dialogs;
- **Q6** union-resolve ignore files;
- **Q7** one envelope adapter, and DOC requests to BE.

## 0. Dry run

- **How it ran.** `git fetch origin` (with `-c http.sslBackend=schannel`, as in 005), then `git merge-tree --write-tree --name-only HEAD origin/dev`. That is an in-memory merge: the working tree was not touched.
- **Size.** origin/dev adds 50 commits and 77 files (+5162 / −132).
- **Result.** 9 files conflict.

| # | Conflicting file | Type |
|---|---|---|
| C1 | `src/client/.env.example` | content |
| C2 | `src/client/.gitignore` | content |
| C3 | `src/client/src/app/api/auth/login/route.ts` | **modify/delete**: we deleted it in 003; dev modified it |
| C4 | `src/client/src/features/auth/provider/AuthProvider.tsx` | content |
| C5 | `src/client/src/features/auth/services/auth.service.ts` | content |
| C6 | `src/client/src/features/auth/types/auth.dto.ts` | content |
| C7 | `src/client/src/features/auth/types/auth.ts` | content |
| C8 | `src/client/src/libs/api-client.test.ts` | content |
| C9 | `src/client/src/libs/api-client.ts` | content |

**Root cause (the same as 005):**
- the profile frontend was written on the **pre-003** frontend: role code `admin`, a `SessionUser` with a chosen role, a cookie session with `SESSION_SECRET`, and an `api-client` with no error model;
- on top of that, it adds **a second, cookie-based auth system** (§3 O1).

**Risk of a broken build.** Several dev files merge *cleanly* but break the build. For example, `app/api/auth/me/route.ts` imports `@/libs/session`, which no longer exists.

---

## 1. What origin/dev adds since the merge-base

### BE (`src/server`)

**Profile and avatar** (all new):
- Routes:
  - `routes/ProfileRoute.ts`: `GET/PATCH /api/v1/profile`, `PATCH /api/v1/profile/password`;
  - `routes/AvatarRoute.ts`: `POST/DELETE /api/v1/profile/avatar`, `GET /api/v1/profile/avatar/files/:fileName`, mounted before the profile route.
- `controllers/ProfileController.ts`, `controllers/PasswordController.ts`.
- `services/ProfileService.ts`:
  - only `phoneNumber` may be patched;
  - phone pattern `^(?:0\d{9}|\+84\d{9})$`, and `null` clears it;
  - duplicate check that treats `0…` and `+84…` as the same number → 409.
- `services/AvatarService.ts`, `services/AvatarFileStorage.ts`:
  - Sharp decodes the file; only JPG and PNG are accepted;
  - limit 10 MiB, inclusive;
  - files live in `AVATAR_STORAGE_DIRECTORY`;
  - compare-and-set on `User.avatar_url` → 409 on a race;
  - `helper/validateAvatar.ts` checks the files.
- `repositories/ProfileRepository.ts`, `repositories/AvatarRepository.ts`, `types/Profile.ts`.

**Auth:**
- `routes/SessionRoute.ts` adds **`GET /api/auth/me`**: DB-backed; it returns `{ userId, email, fullName, avatarUrl, facultyId, studentNumber: null, roles[], permissions[] }`.
- `repositories/AuthRepository.ts` ("InMemory" in name only) **now queries PostgreSQL**. So `POST /api/auth/login` is DB-backed (bcrypt).
- `services/AuthService.changePassword`:
  - bcrypt verify and an atomic replace;
  - min 6 code points;
  - `400 CURRENT_PASSWORD_INCORRECT` with `errors[{field: currentPassword, code: INCORRECT}]`;
  - `400 VALIDATION_FAILED` with `errors[]`;
  - `500 INTERNAL_ERROR`.
- `middleware/ValidatorMiddleware.ts`: small change.

**Infra:** `Dockerfile`, `.dockerignore`, `.env.example` (`AVATAR_STORAGE_DIRECTORY`), `package.json` (adds `sharp`).

**Tests:** 11 unit files, plus `tests/integration/profilePersistence.test.ts`, which runs only with `PROFILE_TEST_DATABASE_URL`.

### DB (`src/db`)

**No changes.** The profile uses the existing `User.phone_number`, `User.password_hash` and `User.avatar_url`, plus `Student` and `Faculty`. The student number is `Student.user_id` (implementation.md, "Schema cross-check").

### Profile FE logic (`src/client`)
- **`features/profile/services/profile.service.ts`:** `RealProfileService` with `getProfile`, `updatePhoneNumber`, `uploadAvatar` (FormData) and `removeAvatar`. It parses both envelopes itself and calls the absolute paths `/api/v1/profile*`.
- **`features/profile/types/profile.ts`:**
  - `Profile` = `{ email, fullName, phoneNumber, avatarUrl, academicInfo: { studentNumber, faculty: { name } } }`;
  - `ProfileResponseDTO` = either envelope.
- **`features/profile/validation/`:**
  - `profile.validation.ts`: the phone regex;
  - `password.validation.ts`: 6 code points and the confirmation match;
  - `avatar.validation.ts`: JPG/PNG MIME, ≤ 10 MiB.
- **Auth changes:**
  - `features/auth/services/auth.service.ts`: `BASE = "/api/auth"`; `changePassword` → `PATCH /api/v1/profile/password`;
  - `AuthProvider` switches from the mock to the real service;
  - the type tweaks in `auth.ts` and `auth.dto.ts` are on the **pre-003** `SessionUser`.
- **`libs/api-client.ts` hack:** endpoints starting with `/api/v1/profile` or `/api/auth/` skip the base URL.
- **Cookie BFF:**
  - `app/api/auth/login/route.ts` (modified): calls the BE login, picks a `role` (`student | manager | admin`), and sets the httpOnly cookies `session` (signed with `SESSION_SECRET`) and `backend_access`;
  - new `app/api/auth/logout/route.ts` and `app/api/auth/me/route.ts`;
  - new `libs/backend-session.ts`: `readBackendUser` (maps `administrator` → `admin`), `sameOrigin`, and `proxyProfile` (forwards with the cookie token, buffers bodies up to 10 MiB + 64 KiB, and clears the cookies on 401);
  - new `app/api/v1/profile/[[...segments]]/route.ts`, **a second forwarder**.
- **Tests:** `profile.service.test.ts`, the validation tests, `auth.service.test.ts`, `backend-session.test.ts`, `api/auth/login/route.test.ts`, `api/v1/profile/.../route.test.ts`, and added `api-client.test.ts` cases.

### Profile FE UI
- **`app/(protected)/profile/page.tsx`:** a shared `/profile` route.
- **`features/profile/components/ProfilePage.tsx`** (373 lines):
  - own `<main className="min-h-screen bg-slate-50">` and `Container`;
  - the avatar `<img src={avatarUrl}>`, with an image-load retry;
  - a read-only identity block (name, email, student number, faculty);
  - phone edit / save / cancel;
  - raw colors: `slate-*`, `white`, `red-700`, `green-700`.
- **`PasswordChangeForm.tsx`:** plain inputs; on any failure it shows one generic error and clears all three fields.
- **`AvatarEditor.tsx`:** file input with a preview, upload and remove.
- **Tests:** `ProfilePage.test.tsx`, `PasswordChangeForm.test.tsx`, `AvatarEditor.test.tsx`. They mock `profileService` and `authService` with `vi.mock`.

### Non-profile
- **`docs/` edited by dev** (we receive the changes; we never edit `docs/`):
  - **`docs/api/openapi.yaml`, still labelled 1.2.0:**
    - avatar limit 5 MB → 10 MB;
    - new `GET /profile/avatar/files/{fileName}`;
    - 409/500 on the avatar operations;
    - `INTERNAL_ERROR` code;
    - `UpdateProfileRequest` gets a phone `pattern` and `additionalProperties: false`;
    - `AcademicInfo` fields required and readOnly;
    - **`ChangePasswordRequest.newPassword.minLength` 8 → 6.**
  - `docs/requirements/vision-document.md`;
  - `docs/analysis-and-design/activity_register/activity_register_feat_spec.md`, reverted back in (another team's draft).
- **Spec Kit:** `src/specs/004-profile-management/*` (spec, plan, tasks, implementation). It is numbered 004 like the hub spec; we leave it in place.
- **Root-level:** `src/.gitignore`, `src/.specify/init-options.json`, `src/.specify/integration.json`. These are outside `src/client` and taken as-is.

---

## 2. Conflicts and proposed resolution

| # | Ours (003 + 005) | Theirs (dev) | Resolution |
|---|---|---|---|
| C1 `.env.example` | `NEXT_PUBLIC_API_MODE`, the base URL, `BACKEND_API_URL`, `ALLOW_DEV_BACKEND_TOKEN`, `DEV_BACKEND_TOKEN` | `API_BACKEND_URL`, `SESSION_SECRET` | **Ours.** `API_BACKEND_URL` duplicates our `BACKEND_API_URL`. `SESSION_SECRET` belongs to the cookie BFF we do not take (Q1). |
| C2 `src/client/.gitignore` | `.env*` plus `!.env.example` | the same lines, ordered differently | **Union**; drop the duplicate line. |
| C3 `app/api/auth/login/route.ts` | deleted (003: login goes through our API client and MSW, not a Next route) | cookie-BFF login with role selection | **Keep it deleted** (`git rm`). Role selection at login contradicts "each account has exactly one role". The cookie session contradicts Q1 and 003's browser-token decision. Recorded in DOC-19. |
| C4 `AuthProvider.tsx` | the 003 provider (bootstrap, hint, `signOutLocally`, `refresh`, `changePassword`) | switches the pre-003 provider from `mockAuthService` to `authService` | **Ours.** Already real-service based, with MSW in mock mode. |
| C5 `auth.service.ts` | `HttpAuthService`: `/auth/login|logout|me` via the base URL; `changePassword` → `PATCH /profile/password` with `OWN_ERRORS` | `BASE = "/api/auth"`; `changePassword` → `/api/v1/profile/password` | **Ours.** Our client already calls the contract path `PATCH /profile/password`. Dev's absolute paths bypass the base URL and break mock/real switching (C-IV). |
| C6 `auth.dto.ts` | the 003 DTOs | adds `success` to `MessageResponse` | **Ours.** `ApiMessageDTO` already models `{ success, message }`. |
| C7 `auth.ts` | `CurrentUser` (003) | loosens the pre-003 `SessionUser` id and faculty types | **Ours.** `SessionUser` no longer exists. |
| C8 `api-client.test.ts` | the 003 and 005 tests | tests for the `/api/v1/profile` and `/api/auth/` prefix hack | **Ours.** The hack is not taken (C9). |
| C9 `api-client.ts` | the single client (base URL, bearer, `toApiError`, `unwrap`, `unwrapServiceResponse`) | the prefix hack | **Ours, extended** (§3 O5, O8): binary reads, and object-shaped `details` in `toApiError`. |

---

## 3. Silent overlaps (merge cleanly, but break or duplicate)

| # | Overlap | dev | ours | Action |
|---|---|---|---|---|
| O1 | **Two auth systems** | Cookie BFF: `api/auth/{login,logout,me}`, `libs/backend-session.ts` (+ test), `login/route.test.ts`, `SESSION_SECRET`, `API_BACKEND_URL`, roles mapped `administrator → admin`, a chosen role | `AuthProvider`, bearer in the token store, session-hint cookie, `proxy.ts`, MSW | **Delete dev's files** (Q1 kept). `me/route.ts` would not even compile (`@/libs/session` is gone). Recorded in DOC-19. |
| O2 | **Two forwarders** | `app/api/v1/profile/[[...segments]]/route.ts` (cookie token, its own allowlist, multipart buffering) | `app/api/backend/[...path]` (005: the user's bearer, opt-in dev token) | **Delete dev's.** Extend ours: allow `profile`, `profile/avatar`, `profile/avatar/files/{name}` (`profile/password` is already allowed), and make it **binary-safe** (§6). Reuse dev's bounded-buffer idea. |
| O3 | **Two change-password services, two forms** | `PasswordChangeForm` → the pre-003 `authService.changePassword` (generic error, `response.success` check) | `ChangePasswordForm` (003 FR-043–048: RHF + zod, `FormField` / `PasswordInput`, `CURRENT_PASSWORD_INCORRECT` → field error) → `AuthProvider.changePassword` → `authService.changePassword` → `PATCH /profile/password` | **One service, one form.** `ChangePasswordForm` gets `variant: "first-sign-in" \| "profile"`. <br>• First sign-in: unchanged (label "Current (temporary) password", go to the dashboard after success). <br>• Profile: label "Current password", success alert, stay on the page, clear the fields. <br>• Both handle `CURRENT_PASSWORD_INCORRECT` the same way: field error on `currentPassword`, the new-password values kept (API-GAP-007 accepted: 400 + code; 401 only for unauthenticated). <br>Delete dev's `PasswordChangeForm`; its scenarios move onto `ChangePasswordForm` tests (coverage.md). |
| O4 | **Two profile data sources** | `ProfilePage` keeps its own `Profile` state from `GET /api/v1/profile`; the AccountMenu never learns about changes | `AuthProvider.user: CurrentUser` from `/auth/me`; AccountMenu shows `fullName` and initials | **Server data on the page; one session store.** <br>• The page reads `GET /profile` (`getMyProfile`, which has `phoneNumber` and `academicInfo`, missing from `CurrentUser`) through `useAsyncResource`. <br>• After a successful phone save, avatar upload or avatar removal, the page calls `auth.refresh()`, which re-reads `/auth/me`. So `AuthProvider.user` (AccountMenu name and avatar) updates from the server, with no second store and no local patching. <br>• The page itself takes the returned `Profile`, or re-reads it on retry. |
| O5 | **Envelope parsing** | `getProfileData` handles both envelopes itself; avatar `{success, data}`; password message-only | `unwrap` (contract) and `unwrapServiceResponse` (005 hub adapter); `toApiError` reads both error shapes | **Reuse.** <br>• `GET/PATCH /profile` use `unwrapServiceResponse` (BE `ServiceResponse`). <br>• Avatar upload uses `unwrap` (contract `{success, data}`); remove and password are message-only. <br>• Extension in `toApiError`, the same mechanism: profile 400/409 send `payload.data.details` as an **object** `{ field: "phoneNumber" }`, not an array. Map it to `fieldErrors[field] = payload.message`. |
| O6 | **Validation duplicates** | `profile.validation.ts` (phone regex), `password.validation.ts` (6, code points), `avatar.validation.ts` | 003 zod schema in `ChangePasswordForm` (min **8**), mock `PASSWORD_MIN_LENGTH = 8`; admin-users phone = any trimmed string (DOC-07 open) | **One rule each, in one place**: `src/libs/validation/phone.ts`, `src/libs/validation/password.ts`, `features/profile/validation/avatar.ts`. <br>• **Password:** `PASSWORD_MIN_LENGTH = 8`, counted in code points like the BE. It is used by both `ChangePasswordForm` variants and the MSW mock (approved Q3, DOC-23). The 003 copy stays "At least 8 characters". <br>• `TEMP_PASSWORD_MIN_LENGTH = 8` (admin-issued temporary passwords, DOC-05) is unchanged. <br>• **Phone:** the contract pattern, used by the profile and by admin create (Q4; mock-only enforcement for admin create). Dev's `password.validation.ts` and `profile.validation.ts` are replaced. |
| O7 | **Raw colors and layout** | `slate-*`, `bg-white`, `text-red-700`, `text-green-700`, own `<main>` / `min-h-screen` / `Container` | tokens, `AppShell`, `PageHeader` | Tokens plus primitives (§5). No `<main>` inside `AppShell`. |
| O8 | **Avatar image needs auth** | `<img src="/api/v1/profile/avatar/files/{uuid}.png">`; the cookie lets the BFF attach the token | the bearer lives in the token store, and an `<img>` request cannot carry `Authorization` | **An authenticated image component**: `components/ui/Avatar.tsx` (or `features/profile/components/ProfileAvatar.tsx`, shared with AccountMenu). <br>• It fetches the file through `api.blob(url)`, a new read in the single API client: same base URL, same bearer and same error mapping, but it returns a `Blob`. <br>• It renders an object URL, falls back to initials, and offers "Retry picture" when the load fails (A9). <br>• The `avatarUrl` the BE returns is `/api/v1/profile/avatar/files/…`. The client maps it to its own base path (`…/profile/avatar/files/{name}`), so mock and real work the same way (§6, Q5). |
| O9 | **Navigation** | `/profile` exists but nothing links to it | per-role `Profile` items `/student/profile` etc., `coming-soon` | **One shared `/profile`**, like `/services` (Q3 of 005): nav items `available`, and a "My profile" link in AccountMenu. `route-access`: add `/profile` to `PROTECTED_SHARED_PATHS`. The proxy and route tests repeat the 005 pattern. DOC-11 updated. |
| O10 | **Contract types** | `openapi.yaml` changed | `src/types/openapi.gen.ts` generated from the old version | Run `npm run gen:api` after the merge. Reconcile `src/types/openapi-gaps.ts` (`INTERNAL_ERROR` becomes contract; `ApiErrorCode` gains it). |
| O11 | **Tests that mock services** | `vi.mock(profileService)`, `vi.mock(api)` | MSW network mocks (C-IV v1.1.0) | Rewrite onto MSW, with a `coverage.md` (spec 004-profile US1–US3 → tests) written **before** deleting anything, as in 005. |

---

## 4. Use cases, contract operations, differences

**UC-03** Manage own profile:
- basic flow: view, edit the phone, save;
- A1 cancel;
- A2 change password;
- A3 change avatar;
- A4 remove avatar;
- A5 invalid phone;
- A6 read-only identity and other users' data;
- A7 wrong current password, too short, or no match;
- A8 bad avatar file;
- A9 upload or storage failure.

The 003 first-sign-in flow (FR-043–048) shares A2 and A7's operation.

| `openapi.yaml` operation (dev version) | Path | BE | Used by FE |
|---|---|---|---|
| `getMyProfile` | `GET /profile` | yes (`ServiceResponse`) | profile page |
| `updateMyProfile` | `PATCH /profile` | yes (`phoneNumber` only; 400 / 409) | profile page |
| `changeMyPassword` | `PATCH /profile/password` | yes (contract envelope) | profile page + 003 first sign-in |
| `uploadMyAvatar` | `POST /profile/avatar` (multipart `avatar`) | yes (`{success, data: {avatarUrl}}`) | avatar editor |
| `deleteMyAvatar` | `DELETE /profile/avatar` | yes (message) | avatar editor |
| `readMyAvatarFile` | `GET /profile/avatar/files/{fileName}` | yes (bytes, `no-store`) | avatar image (page + AccountMenu) |
| `/profile/interests` | `GET/PUT` | **no** | not in scope |

**Differences:**

| Aspect | `openapi.yaml` (dev) | Profile BE | Our 003 / 005 |
|---|---|---|---|
| Envelope | `{success, data}` / `ErrorResponse` | profile GET/PATCH: `ServiceResponse` (`payload.data`); avatar upload: `{success, data}`; remove and password: `{success, message}` / `ErrorResponse` | three shapes → `unwrapServiceResponse` / `unwrap` (DOC-16 extended) |
| Field errors | `errors[{field, message}]` | password: `errors[]` ✔; profile: `payload.data.details = { field }` (object, one field), message in `payload.message` | O5 extension |
| Base path | `/api/v1` | profile ✔ `/api/v1/profile`; auth ✗ `/api/auth/login`, `/api/auth/me` (unversioned) | 003 calls `/auth/*` under the base URL, so real-mode auth still misses (GAP-E, Q6) |
| `/auth/me` shape | `Profile` (+ 003 gaps: nullable `role`, `mustChangePassword`, status) | `{ userId, email, fullName, avatarUrl, facultyId, studentNumber: null, roles[], permissions[] }` (several roles, no `mustChangePassword`) | GAP-E / DOC-02 / DOC-06, still open; DOC-19 |
| Password min | **6** (changed from 8 by dev); BR-ACC-09, NFR-SEC-02 and UC-03 A7 say six | 6 code points | **8 code points, kept** (approved Q3). Stricter, so compatible; DOC-23 asks for one value. DOC-09 stays open. |
| Avatar URL | `format: uri-reference`, "legal same-origin URL" | BE-relative `/api/v1/profile/avatar/files/{uuid}.{png\|jpg}`; the file read needs auth | O8 (blob fetch, Q5) |
| Avatar limit | 10 MB inclusive (= 10 MiB in the BE) | 10 × 1024 × 1024 | client pre-check uses the same constant |
| Login | `POST /auth/login` → token (DOC-03 gap) | `POST /api/auth/login` → `payload.data.token` | still a gap; the forwarder does not remap paths (Q6) |

**New `docs-changes.md` entries** (status `proposed`; `docs/` stays untouched):
- **DOC-19.** Dev's cookie-BFF session is not adopted (Q1 / 003 DOC-03). Ask BE: a versioned `/api/v1/auth/*` with the contract shapes, one role, and `mustChangePassword`.
- **DOC-20.** The profile envelope and the object-shaped `details`: an extension of the DOC-16 request.
- **DOC-21.** The avatar-file URL contract: say that `avatarUrl` is relative to the API base, or return the file id. Also add the `readMyAvatarFile` caching and auth note.
- **DOC-22.** Dev edited `docs/api/openapi.yaml` itself without a version bump (1.2.0 with breaking `minLength` and pattern changes). Ask for 1.3.0 and an `openapi-changes.md` row.
- **DOC-23.** Password minimum: the FE enforces 8 (approved Q3); the contract, BE and BRs say 6. Ask the team for one value. **DOC-09 stays open** and links to DOC-23.
- **DOC-07** resolved for the profile (pattern); open for admin create (Q4).
- **DOC-11** updated (a shared `/profile`).
- **DOC-18 style.** Note which parts of `src/specs/004-profile-management/implementation.md` describe the dropped BFF.

---

## 5. UI adaptation

**Folder:** keep dev's `features/profile/`: `components`, `services`, `types`, `validation` (Q4-of-005 spirit). Add `hooks/` and `mappers/`.

| dev piece | Becomes | Uses (ours) | States |
|---|---|---|---|
| `app/(protected)/profile/page.tsx` | Same path, inside the `(protected)` layout (AppShell, RequireSession) | `PageHeader` ("My profile") | — |
| `ProfilePage` | `features/profile/components/ProfilePage.tsx` on `useMyProfile` (`useAsyncResource`) | `SurfaceCard` sections: Picture, Account (read-only), Contact (phone), Password | loading `Skeleton` / error `ErrorState` + Retry / forbidden `ForbiddenView` / success |
| Read-only identity | `ProfileDetails` (definition list): full name, email, role (`ROLE_LABEL`), and for students the student number and faculty | text only, no inputs (A6). "Managed by the university" hint | `—` when null |
| Phone edit | `PhoneForm`: RHF + zod (shared phone rule), `FormField` / `TextInput`, Edit → Save / Cancel (A1 discards) | `Alert` for save errors; server `fieldErrors.phoneNumber` on the field; draft kept (A5); 409 copy | submitting / error / saved |
| `PasswordChangeForm` | **removed**; `ChangePasswordForm variant="profile"` (O3) | `FormField`, `PasswordInput`, `Alert` | wrong current password → field error; success alert |
| `AvatarEditor` | `AvatarEditor` on `Button` (choose / upload / remove), preview through an object URL, `ConfirmDialog` for remove (as dev's test "confirmed removal" expects) | client pre-check (type, size); server `UNSUPPORTED_FILE` / 409 / 500 copy via `toUserMessage` | A8 / A9 keep the current picture |
| Avatar image | `ProfileAvatar` (O8): page (80 px) and AccountMenu (32 px) | initials fallback, "Retry picture" | loading / loaded / failed |
| AccountMenu | "My profile" link → `/profile`; avatar from `user.avatarUrl` via `ProfileAvatar` | — | — |
| Nav | `profile` items → `/profile`, `available` (all roles) | `NAVIGATION` | — |
| Error copy | new `ErrorContext` `"profile"`: `CURRENT_PASSWORD_INCORRECT`, `UNSUPPORTED_FILE` ("Choose a JPG or PNG image up to 10 MB."), `DUPLICATE_VALUE` ("This phone number is already in use."), 409 avatar race ("The picture changed while saving. Please retry."), `INTERNAL_ERROR` / 5xx → unavailable | `toUserMessage` | — |

---

## 6. Both modes

**One transport:** every profile call goes through `libs/api-client.ts`, with paths under the base URL (`/profile…`). There are no absolute `/api/v1/...` paths and no prefix hack.

### Mock (MSW, C-IV)

**Extend `mocks/handlers/profile.ts`** (it already has `PATCH /profile/password`):
- `GET /profile` and `PATCH /profile`, in the `ServiceResponse` envelope, with object-shaped `details` exactly as the BE sends:
  - only `phoneNumber` is accepted; anything else → 400 "Only phoneNumber may be updated";
  - the phone pattern applies;
  - the duplicate check treats `0…` and `+84…` as the same number → 409.
- `POST /profile/avatar`:
  - `await request.formData()`; exactly one file field named `avatar`;
  - a **magic-byte check** (PNG `89 50 4E 47`, JPEG `FF D8 FF`) stands in for Sharp, so a renamed `.txt` is rejected;
  - size ≤ 10 MiB inclusive;
  - errors: 400 `UNSUPPORTED_FILE`, 409 race (failure switch), 500 (failure switch).
- `DELETE /profile/avatar`, and `GET /profile/avatar/files/:name` (bytes, 404 when it is not the current file).
- Token and account checks reuse `withAuth` (005 rule).
- Password min stays 8 (`PASSWORD_MIN_LENGTH` from `libs/validation/password.ts`, Q3).

**Mock DB:**
- `users[].avatarUrl` is a new field, added by migrating in place in `readDb` (`migrateProfile`, run once when the field is missing, keeping everything else; the 005 pattern).
- **Avatar bytes stay in memory** in `mocks/db/avatar-files.ts`, because localStorage is too small for 10 MiB.
- After a reload the file is gone, so the file read answers 404. The UI then shows its A9 fallback (initials + retry), and `__myhcmusMock.reset()` clears it. See Q7: an IndexedDB store is an option.

**Tests:** handler tests in `mocks/handlers/profile.test.ts`, using `File` objects built from byte arrays, including 10 MiB exactly and 10 MiB + 1.

### Real

**Same as 005:** `NEXT_PUBLIC_API_BASE_URL=/api/backend`, and the forwarder passes on the user's bearer.

**Forwarder changes** (`app/api/backend/[...path]/route.ts`, `libs/backend-path.ts`):
- **Allowlist:** add `profile`, `profile/avatar`, `profile/avatar/files/{name}` (one segment, a safe file name).
- **Binary-safe requests:** forward the body as `arrayBuffer()`, not `text()`. Keep `Content-Type` as sent, *including* the multipart boundary; today's code strips `;…` parameters, which would break multipart.
- **Bounded body:**
  - `Content-Length` larger than 10 MiB + 64 KiB → 413 before reading;
  - otherwise read with a running byte count and cancel past the limit (dev's `readBody` idea), answering **413** in the `ServiceResponse` shape;
  - the BE's own 400 `UNSUPPORTED_FILE` still covers file-level size checks.
- **Binary-safe responses:** pass `upstream.body` as a stream, not `text()`. Forward `Content-Type`, `Cache-Control`, `X-Content-Type-Options` and `Content-Length` for images.

**Forwarder tests** (node environment):
- multipart pass-through: the boundary is kept and the bytes are identical;
- an oversize upload → 413 and the backend is never called;
- `Content-Length` lies → stopped while streaming;
- image response bytes and headers pass through;
- a `profile/avatar/files/../x` traversal → 404;
- the 005 token rules still hold.

**Avatar URL mapping:** the client takes the file name from the BE `avatarUrl` (`…/profile/avatar/files/{name}`) and reads `${base}/profile/avatar/files/{name}` through `api.blob`. The mapper rejects any other shape (DOC-21).

**Known gap:** real-mode UI sign-in is still blocked. The BE auth is DB-backed now, but it is unversioned and has a different shape (GAP-E, Q6). Per Q2, the profile operations are verified with curl through the forwarder and a minted token, including a multipart upload with `curl -F avatar=@pic.png`.

---

## 7. Execution order (after approval)

1. **Branch and merge.**
   - Create `feat/frontend/integrate-profile` from `51edef6` and tag `pre-profile-merge`.
   - `git merge --no-ff origin/dev`. Resolve C1–C9 as in §2.
   - Delete O1 and O2 files. Run `gen:api`.
   - Apply the minimum compile fixes so the merge commit builds: port the profile callers to our `api` / `ApiError` and paths, and drop `PasswordChangeForm` usage in favour of a temporary import of `ChangePasswordForm`.
   - **Checkpoint:** build + tests pass; report and stop.
2. **API client:** object-shaped `details`; `api.blob`; `INTERNAL_ERROR`. Plus tests.
3. **Shared rules and route:**
   - `libs/validation/{phone,password}.ts`;
   - the shared password rule (8 code points, unchanged behaviour; the 003 form and the mock import it);
   - `/profile` route rule, nav and AccountMenu link;
   - proxy and route-access tests (signed out → login; every role → 200).
4. **MSW profile handlers:** write `coverage.md` (spec 004-profile US1–US3 plus UC-03 A1–A9 → tests) **first**. Then the handlers, the mock DB `migrateProfile`, the in-memory avatar files, and handler tests. Then delete dev's `vi.mock`-based tests and replace them.
5. **Hooks and services:** `useMyProfile` (`useAsyncResource`); `profileService` on the single client with the envelope adapters; mutations followed by `auth.refresh()`; the `"profile"` error context; forbidden handling.
6. **UI (§5):** `ProfilePage` sections, `PhoneForm`, `ChangePasswordForm` variant, `AvatarEditor` + `ConfirmDialog`, `ProfileAvatar` (page + AccountMenu), tokens, a11y tests.
7. **Forwarder:** allowlist, binary/multipart-safe body and response, 413 bound, plus node tests.
8. **Docs:** DOC-19 to DOC-23, the DOC-07 / DOC-11 updates (DOC-09 stays open and links DOC-23), the HANDOFF section "Next phase: E2E authentication", `quickstart.md` (mock walkthrough plus real-mode curl with `-F`), and `HANDOFF.md`.
9. **Final:** gates, the walkthrough at 360 px and desktop width, and `git diff origin/dev -- src/server src/db` empty.

As in 005: one commit per step, tests + lint + build after each, a push after each, and a stop only if a gate fails.

---

## 8. Risks and open questions

**Risks**
- **R1. Red merge.** About 10 dev FE files will not compile after the merge, among them `me/route.ts` (`@/libs/session`) and `PasswordChangeForm` (old `authService` API). They are resolved in the merge commit (step 1).
- **R2. Coverage.** Dev's profile tests all mock services. Rewriting them onto MSW must not lose any UC-03 scenario. `coverage.md` is written first.
- **R3. Avatar memory.** Mock avatar bytes are kept in memory and lost on reload. Acceptable for a mock, but it shows the A9 path after every reload (Q7).
- **R4. Forwarder memory.** It buffers up to 10 MiB per upload. That is fine for dev; a production deployment would stream. Recorded as a note in DOC-17.
- **R5. Password-length mismatch.** The FE keeps 8 while the contract, BE and BRs say 6 (Q3, DOC-23). A BE-accepted 6- or 7-character password cannot be set through our UI. That is a deliberate restriction, and it is visible to testers.
- **R6. Two auth worlds.** Dev's profile BE and auth BE work end to end only with their cookie BFF. Keeping Q1 means real-mode sign-in stays blocked until `/api/v1/auth/*` exists (Q6).
- **R7. Stale spec text.** `src/specs/004-profile-management/implementation.md` describes the cookie BFF and `API_BACKEND_URL`. After our adaptation it is stale; record it, don't edit it.

**Open questions**
- **Q1. Auth model.** Confirm that dev's cookie BFF (httpOnly `backend_access` + `session`) is **not** adopted, and that 005 Q1 (forward the user's bearer from the token store) stays. *Recommended: yes*, for consistency with 003 DOC-03 and 005; a move to httpOnly cookies could be its own later feature. Note that the cookie model *would* let `<img>` load the avatar without O8.
- **Q2. One change-password form** with `variant` (recommended), or two components sharing only the service and schema?
- **Q3. Answered: keep 8 everywhere** (see "Approved decisions"). The earlier recommendation of 6 was not taken.
- **Q4. Phone pattern** `^(?:0\d{9}|\+84\d{9})$`: profile only, or also admin account creation (UC-29), closing DOC-07? *Recommended: both*, through one shared validator, with a mock-only enforcement note for admin create until the contract adds the pattern there.
- **Q5. Avatar loading:** an authenticated blob fetch through the API client, with an object URL (recommended)? Or should we ask BE for a signed or public URL instead (DOC-21)?
- **Q6. Real-mode sign-in.** Should the forwarder remap `auth/*` → BE `/api/auth/*` and adapt its shapes, so real-mode sign-in works now? Or keep it blocked until BE serves `/api/v1/auth/*` per the contract? *Recommended: keep it blocked* (no invented paths; CLAUDE.md), and raise DOC-19.
- **Q7. Mock avatar storage:** in memory (recommended; simple) or IndexedDB (survives a reload)?
- **Q8. Branch:** a new `feat/frontend/integrate-profile` from `feat/frontend/integrate-hub` (recommended), or continue on `feat/frontend/integrate-hub`?
