# Proposed Documentation Changes: 003-auth-dashboard-admin-users

> Every place where this feature (spec, plan, analysis remediation, implementation) **differs from or adds to `docs/`**.
>
> Since plan 005 (`specs/005-integrate-hub/`), this file is also the register for the University Services Hub integration: DOC-16 to DOC-18, and the DOC-11 update.
>
> Since plan 006 (`specs/006-integrate-profile/`), it also records the Profile Management integration: DOC-19 to DOC-23, and the DOC-07, DOC-09 and DOC-11 updates.
>
> Status values follow `docs/api/openapi-changes.md`: `proposed`, `accepted`, `rejected`, `deferred`.
>
> **This file does not change `docs/`.** The docs owners decide; the frontend team raises each entry with BE and the docs owners. Until an entry is `accepted`, the frontend implements it **only in the mock** (MSW), and real-mode use is blocked (constitution R-II v1.1.0, C-IV v1.1.0).
>
> **Maintenance rule**: during `/speckit-implement`, every new deviation gets a new `DOC-xx` entry here, or an update to an existing one.

| ID | Topic | Spec ref | Status |
|---|---|---|---|
| DOC-01 | `ACCOUNT_DISABLED` on authenticated requests | GAP-N, FR-018a | proposed |
| DOC-02 | Nullable `role` in `/auth/me` | GAP-O, FR-007 | proposed |
| DOC-03 | Login response carries the bearer token; client token handling | GAP-A, GAP-D, FR-010 | proposed |
| DOC-04 | Login error codes | GAP-B, FR-003–FR-006 | proposed |
| DOC-05 | `initialPassword` and the temporary-password rule for admin-created accounts | GAP-C, FR-036 | proposed |
| DOC-06 | First-sign-in "Set a new password" flow (`mustChangePassword`) | GAP-M, US7, FR-043–FR-048 | proposed |
| DOC-07 | Phone number format (open question) | GAP-P | proposed |
| DOC-08 | `ROLE_POLICY_VIOLATION` on account creation | GAP-H, FR-034 | proposed |
| DOC-09 | Password minimum length (6 vs 8) | GAP-I, FR-036b, FR-045 | proposed |
| DOC-10 | "Organizer" terminology in client design docs | GAP-K, FR-022 | proposed |
| DOC-11 | Role navigation lists (Dashboard, Profile, "Coming soon") | FR-024 | proposed |
| DOC-12 | Logout destination | UC-02 step 4, Assumptions | proposed |
| DOC-13 | Forgot/reset password and social sign-in on the login page | FR-012 | proposed |
| DOC-14 | Optional sign-in lock (NFR-SEC-05) behavior | FR-005 | proposed |
| DOC-15 | Dashboard summary operations | GAP-J, FR-025 | proposed |
| DOC-16 | Hub response envelope: request that BE adopt the OpenAPI envelope | 005 Q7, API-GAP-HUB-01 | proposed |
| DOC-17 | Real-mode transport: same-origin `/api/backend` forwarder with the user's bearer | 005 Q1/Q2, spec 004 FR-017 | proposed |
| DOC-18 | Hub parts of dev's `docs/` edits that are stale after the 005 adaptation | 005 R7 | proposed |
| DOC-19 | Dev's cookie-BFF session not adopted; ask BE for contract auth | 006 Q1/Q6, GAP-E | proposed |
| DOC-20 | Profile envelope and object-shaped error `details` | 006 O5, extends DOC-16 | proposed |
| DOC-21 | Avatar file URL and its authenticated read | 006 O8/Q5 | proposed |
| DOC-22 | `openapi.yaml` changed without a version bump or a changes row | 006 docs re-read | proposed |
| DOC-23 | Password minimum: the FE enforces 8; contract, BE and BRs say 6 | 006 Q3, links DOC-09 | proposed |

---

## DOC-01 — `ACCOUNT_DISABLED` on authenticated requests

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: `components.schemas.ErrorResponse.description` (code list) and `components.responses.Forbidden`. `docs/api/openapi-changes.md`: new entry. |
| Current text | `ErrorResponse` codes: "UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, CURRENT_PASSWORD_INCORRECT, UNSUPPORTED_FILE, DUPLICATE_VALUE, INVALID_STATE, ROLE_POLICY_VIOLATION, POLICY_VERSION_IMMUTABLE, IMPORT_EXPIRED, PRECONDITION_FAILED." `Forbidden`: "The authenticated user does not have permission to perform this operation." `updateUserStatus` only says "Deactivation revokes active sessions". |
| Proposed change | Add `ACCOUNT_DISABLED` to the code list. Document that any authenticated operation called by an inactive account returns `403` with `code: ACCOUNT_DISABLED`, **with two exceptions**: <br>• `GET /auth/me` returns `200` with the profile and `user.status: 'inactive'`, so the client can show the disabled message when restoring a session on reload; <br>• `POST /auth/logout` still succeeds. <br>Use the same code for sign-in by an inactive account (DOC-04). |
| Reason | UC-29 A10 and BR-ACC-06 require changed status to apply on the next request. UC-01 A3 requires a specific "disabled" message. A generic `FORBIDDEN` would render "no permission" and keep the user in a dead session. |
| FE impact | The API client calls the account-disabled handler. The client clears the token and the hint and shows "This account is disabled. Contact the administrator." on `/login?reason=disabled` (FR-018a, tasks T012, T052, T055). On reload, `applyContext()` treats `status: 'inactive'` from `/auth/me` the same way (T038, T045, T048). The mock returns both now. |
| Status | `proposed` |

## DOC-02 — Nullable `role` in `/auth/me`

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: `components.schemas.Profile.role`, used by `CurrentUserContextResponse.data.user` (`GET /auth/me`). |
| Current text | `role: $ref: '#/components/schemas/UserRole'`, which is non-nullable, enum `student`, `manager`, `administrator`. |
| Proposed change | In `/auth/me` responses, allow `user.role` to be `null` when the account has no valid role. The server still refuses every other protected operation for such an account (403). Alternatively, define 403 `ROLE_MISSING` at sign-in (DOC-04) and keep `role` non-nullable. Either way, the behavior should be documented. |
| Reason | UC-01 A6 ("Role is missing or session creation fails; do not grant access and report the problem") can't be expressed by the current schema. `/auth/me` must still return the profile so the client can apply A6. |
| FE impact | The wire type is `role: UserRole \| null` (`openapi-gaps.ts`). `toCurrentUser` throws `InvalidRoleError`, and the client clears the session and shows "This account cannot be signed in". This happens both at sign-in and when a session is restored on reload, via `/login?reason=role-missing` (FR-007, T031, T045, T048, T057). The mock seeds `norole@example.invalid` and exempts `/auth/me` from role and status checks. |
| Status | `proposed` |

## DOC-03 — Login response carries the bearer token; client token handling

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi-changes.md`: API-GAP-002 ("Proposed login response"). `docs/api/openapi.yaml`: `components.securitySchemes.bearerAuth`, tag "Authentication & Session". |
| Current text | API-GAP-002: "Proposed login response: `{ success, data: { user: Profile, permissions, activeOrganizationMemberships, activeActivityAssignments } }` or the same envelope as `/auth/me`". It doesn't mention a token. `bearerAuth`: `type: http, scheme: bearer, bearerFormat: JWT`. No refresh, no lifetime. |
| Proposed change | `POST /auth/login` returns `200 { success: true, data: { token: string, expiresAt: string (date-time) } }`, and the client then calls `GET /auth/me` for the context. `POST /auth/logout` invalidates the presented token: later requests with it get `401 UNAUTHENTICATED`. Document a 1-hour lifetime, no refresh, and expiry → `401 UNAUTHENTICATED`. Optionally add a `role` claim to the JWT. |
| Reason | It matches `src/server`: `AuthService.login` returns `{ userID, token }` in the body, signed with `expiresIn: "1h"`, and `ValidatorMiddleware.validateAccessToken` reads only `Authorization: Bearer`, with no cookies. The current proposal can't work with a bearer scheme, because the client never receives the token. |
| FE impact | The client keeps the token in `localStorage` (`myhcmus:token`) and sends it only as `Authorization: Bearer` to `NEXT_PUBLIC_API_BASE_URL`. A separate non-sensitive cookie `myhcmus_session` (role, password-change mark, expiry) feeds the route guard only. On expiry the user goes to sign-in (FR-010, FR-018, research R2). No contract change is needed for the hint cookie, which is FE-internal. |
| Status | `proposed` (extends API-GAP-002) |

## DOC-04 — Login error codes

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi-changes.md`: API-GAP-002. `docs/api/openapi.yaml`: `ErrorResponse` code list, future `POST /auth/login` responses. |
| Current text | No login operation and no login error codes. `src/server` returns `404 "Email not found"` and `401 "Wrong password"`. |
| Proposed change | `POST /auth/login` errors: <br>• `400 VALIDATION_FAILED` (missing or malformed input) <br>• `401 INVALID_CREDENTIALS`, **identical for unknown email and wrong password** <br>• `403 ACCOUNT_DISABLED` <br>• `423 ACCOUNT_LOCKED` with a `Retry-After` header in seconds (only if NFR-SEC-05 is implemented) <br>• `403 ROLE_MISSING` (alternative to DOC-02) <br>• `503 SERVICE_UNAVAILABLE` |
| Reason | UC-01 A2 forbids revealing whether an account exists, and the server's 404 violates it. UC-01 A3/A4/A5/A6 each need a distinguishable outcome. FE logic may only branch on `code`. |
| FE impact | `toUserMessage` maps each code (T013). The mock implements all of them (T046). |
| Status | `proposed` (extends API-GAP-002) |

## DOC-05 — `initialPassword` and the temporary-password rule for admin-created accounts

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: `components.schemas.CreateUserRequest`. `docs/requirements/use-case-specifications.md`: UC-29 steps 4–8. |
| Current text | `CreateUserRequest`: "Create one user account with one role. Password activation/invitation is a separate flow." It has no password field. UC-29 doesn't describe how a new account gets credentials. |
| Proposed change | Add `initialPassword: string (minLength 8)` to `CreateUserRequest`. Document the FE default rule: `KHTN@` + full-name initials (diacritics removed, `Đ → D`, uppercased) + the last 4 student-number characters for students, or 4 random digits for staff, e.g. `KHTN@NVA7001`. The administrator may override it on the review step. UC-29 step 8 should say the result shows the temporary password once. Open for BE: should the server generate it instead (then return it in `AdminUserResponse` once)? |
| Reason | The phase goal requires that "new accounts can log in immediately afterwards". There's no invitation flow in this phase. The product owner chose this rule (spec Q1). |
| FE impact | Wizard review step with override, result view with a copy field (FR-036–FR-036d, T065, T071). The mock stores `initialPassword` as the login password. Real-mode creation is blocked until this is accepted. |
| Status | `proposed` |

## DOC-06 — First-sign-in "Set a new password" flow (`mustChangePassword`)

| Field | Value |
|---|---|
| Affected doc + section | `docs/requirements/use-case-specifications.md`: UC-01 basic flow step 5 (and a new alternative flow), UC-03 A2. `docs/api/openapi.yaml`: `components.schemas.Profile`, `PATCH /profile/password`, `ErrorResponse` codes. `docs/analysis-and-design/business-rules.md`: §2.1 Accounts. |
| Current text | UC-01 step 5: "System establishes an authenticated session, resolves the account's single assigned role … and displays the appropriate role-based homepage." UC-03 A2 covers voluntary password change only. `Profile` has no password-change state. |
| Proposed change | **UC-01**: new alternative flow. "Step 5: the account was created by an administrator with a temporary password; system shows **Set a new password** and allows no other protected page until the user sets a new password; then continues to the homepage." <br>**BR**: "Accounts created by an administrator must replace the temporary password at first sign-in." <br>**Contract**: add `mustChangePassword: boolean` to `Profile` (true on `POST /admin/users`, cleared by `PATCH /profile/password`), and `403 PASSWORD_CHANGE_REQUIRED` for other operations while it is true (except `/auth/me`, `/profile/password`, `/auth/logout`). |
| Reason | The temporary password (DOC-05) can be derived from public data. Forcing a change was agreed with the product owner (spec Q3, GAP-L). |
| FE impact | User Story 7 ("Set a new password" screen, guard rule, T074–T081). The wording "Set a new password" is used consistently in the UI. The mock implements the flag and the 403. |
| Status | `proposed` |

## DOC-07 — Phone number format (open question)

| Field | Value |
|---|---|
| Affected doc + section | `docs/requirements/use-case-specifications.md`: UC-03 A5. `docs/analysis-and-design/business-rules.md`: BR-ACC-07. `docs/api/openapi.yaml`: `phoneNumber` in `CreateUserRequest`, `UpdateProfileRequest`, `AdminUser`. |
| Current text | UC-03 A5: "Phone number is invalid; system highlights the invalid field". No format is defined anywhere; the contract example is `'0901234567'`. |
| Proposed change | Define the accepted phone format (e.g., Vietnamese 10-digit `0xxxxxxxxx`, or E.164), or state explicitly that any trimmed string is accepted. |
| Reason | Without a rule, "invalid" can't be tested, and FE and BE validation may disagree. |
| FE impact | For now the client only trims `phoneNumber` and applies no format rule (analysis L3, T061, T066). A rule will be added once defined. **Update (006):** dev's `openapi.yaml` now defines the pattern for `UpdateProfileRequest.phoneNumber` only: `^(?:0\d{9}|\+84\d{9})$`, with null clearing it. The FE uses it through one shared rule (`libs/validation/phone.ts`) for the profile **and** for admin create (approved 006 Q4). For admin create it is enforced only by the FE and the MSW mock, until `CreateUserRequest` gets the same pattern. Still open for `CreateUserRequest`. |
| Status | `proposed` (open question) |

## DOC-08 — `ROLE_POLICY_VIOLATION` on account creation

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: `POST /admin/users` (`createUser`) responses. |
| Current text | `ROLE_POLICY_VIOLATION` is documented only for `PUT /admin/users/{userId}/role` ("A role change that violates permission policy returns 400 `ROLE_POLICY_VIOLATION` (UC-29 A6)"). `createUser` lists 400 `ValidationError` without that code. |
| Proposed change | Document `400 ROLE_POLICY_VIOLATION` for `createUser`. Specify the policy, e.g. "student number and faculty are allowed only for role student" (the FE mock's example policy), or link the server's policy list. |
| Reason | UC-29 A6 ("Proposed role assignments violate permission policies; system rejects the affected changes") applies at creation too. |
| FE impact | The wizard shows the policy message and keeps the input (FR-034, T068, T071). |
| Status | `proposed` |

## DOC-09 — Password minimum length (6 vs 8)

| Field | Value |
|---|---|
| Affected doc + section | `docs/requirements/vision-document.md`: NFR-SEC-02. `docs/analysis-and-design/business-rules.md`: BR-ACC-09. `docs/requirements/use-case-specifications.md`: UC-03 A7. `docs/api/openapi.yaml`: `ChangePasswordRequest.newPassword`. |
| Current text | NFR-SEC-02: "Passwords shall be at least 6 characters". BR-ACC-09: "at least six characters". UC-03 A7: "shorter than six characters". `ChangePasswordRequest`: `minLength: 8` ("must be at least 8 characters"). |
| Proposed change | Pick one minimum and align all four documents. 8 is recommended, because it satisfies both today. |
| Reason | The conflicting rules make UC-03 A7 untestable. |
| FE impact | The FE uses 8 for overridden temporary passwords and for "Set a new password" (FR-036b, FR-045). **Update (006):** dev's `openapi.yaml` changed `minLength` from 8 to 6, so now only the FE says 8. Approved 006 Q3 keeps 8 everywhere in the FE (both change-password variants, the mock, the copy). This entry **stays open**, and the request to agree on one value is **DOC-23**. |
| Status | `proposed` |

## DOC-10 — "Organizer" terminology in client design docs

| Field | Value |
|---|---|
| Affected doc + section | `docs/analysis-and-design/client/user-flow.md` (§1.5, §2.2, the "Organizer Dashboard" headings and diagrams) and `docs/analysis-and-design/client/pages/organizer.md` (and `common.md`'s `role:` front matter). |
| Current text | "user's role: Student, Organizer and Administrator"; "Organizer: Activity Management, …"; `role: Guest, Student, Organizer, Administrator`. |
| Proposed change | Rename Organizer → Manager everywhere, and rename `pages/organizer.md` → `pages/manager.md`. |
| Reason | The only roles are student, manager and administrator (CLAUDE.md, contract `UserRole`, API-GAP-008). |
| FE impact | None at runtime; the FE already uses `manager` (FR-022). |
| Status | `proposed` |

## DOC-11 — Role navigation lists

| Field | Value |
|---|---|
| Affected doc + section | `docs/analysis-and-design/client/user-flow.md`: §1.5 "Authenticated Navigation". |
| Current text | Student: Dashboard, Activities, DRS Management, My Registrations, Calendar, AI Student Assistant, University Services, Profile. Organizer: Activity Management, Registration Management, Attendance and Results, Appeals, Reports, Profile. Administrator: User Management, Activity Categories, System Configuration, Reports and Analytics, Audit Logs. |
| Proposed change | Add **Dashboard** to the Manager and Administrator lists, and **Profile** to the Administrator list (UC-03 and UC-32 apply to all users). Note that unbuilt destinations are shown disabled with "Coming soon" until delivered. **Update (005):** add **University Services** (`/services`, UC-07, shared by every role) to the Manager and Administrator lists, and **Service Links** (`/admin/services`, BR-ADM-01) to the Administrator list. The Student item now points to `/services`, not a student-only page. **Update (006):** **Profile** is one shared, available `/profile` item for every role (UC-03), and AccountMenu has "My profile". |
| Reason | Product-owner decision Q2 (full menu with "Coming soon"). UC-32 gives every role a homepage, and UC-03 gives every role a profile. |
| FE impact | `NAVIGATION` per FR-024 (T008, T086). 005 step 3: `libs/navigation.ts` and `libs/route-access.ts` (`/services` is a shared protected path). |
| Status | `proposed` |

## DOC-12 — Logout destination

| Field | Value |
|---|---|
| Affected doc + section | `docs/analysis-and-design/client/user-flow.md`: global flow diagram (`logout --> landingPage`). |
| Current text | Logout leads to the Landing Page. |
| Proposed change | Logout leads to the **sign-in page**, which matches UC-02 step 4 ("System displays the sign-in/public entry page"), with a "You have been signed out." notice. |
| Reason | UC-02 is the source of truth. The notice is needed for UC-02 A3 ("explains that server invalidation could not be confirmed"). |
| FE impact | `/login?reason=signed-out|logout-unconfirmed` (FR-014, FR-016, T055, T057). |
| Status | `proposed` |

## DOC-13 — Forgot/reset password and social sign-in on the login page

| Field | Value |
|---|---|
| Affected doc + section | `docs/analysis-and-design/client/user-flow.md`: §2.2 Login Page Flow (`loginPage --> forgotPassword`, `resetPassword`). `docs/analysis-and-design/client/pages/common.md`: Forgot Password, Reset Password. |
| Current text | The login page links to Forgot Password and Reset Password. |
| Proposed change | Mark Forgot/Reset Password as **not available** until the contract defines the operations (no endpoint exists in `openapi.yaml`). Also state that third-party sign-in is not planned. |
| Reason | The constitution forbids invented endpoints, and UC-01 doesn't include these flows. |
| FE impact | The links and social buttons are hidden in this phase (FR-012, T040). |
| Status | `proposed` |

## DOC-14 — Optional sign-in lock (NFR-SEC-05) behavior

| Field | Value |
|---|---|
| Affected doc + section | `docs/requirements/vision-document.md`: NFR-SEC-05. `docs/requirements/use-case-specifications.md`: UC-01 A4. |
| Current text | NFR-SEC-05 is "(OPTIONAL) … temporarily locked for 15 minutes after 5 failed login attempts". UC-01 A4 applies "only if optional NFR-SEC-05 is implemented". |
| Proposed change | Record whether the lock is implemented by BE. If so, add: <br>• failures are counted per email, including unknown emails, so that locking doesn't reveal whether an account exists; <br>• a success resets the counter; <br>• the response is `423 ACCOUNT_LOCKED` with `Retry-After` (DOC-04). |
| Reason | The FE displays the lock and the mock implements it; the behavior must match what BE builds. |
| FE impact | The lock message with the retry time (FR-005, T046). If BE doesn't implement it, the UI simply never shows it. |
| Status | `proposed` |

## DOC-15 — Dashboard summary operations

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: no student or manager overview operations. `docs/requirements/use-case-specifications.md`: UC-32 A3–A5. |
| Current text | Only `GET /admin/reports/overview` exists (admin). UC-32 describes student and manager summaries. |
| Proposed change | Add overview operations for the student summary (UC-32 A3) and the manager summary (UC-32 A4), or state which existing contracts will provide them. |
| Reason | The draft dashboards must not show invented numbers (UC-32 A2, FR-025). |
| FE impact | The dashboards show "Not yet available" sections until these exist (GAP-J, T089, T090). |
| Status | `proposed` |

---

## DOC-16 — Hub response envelope: request that BE adopt the OpenAPI envelope

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml` 1.2.0, tag "University Services Hub" (all 6 operations) and `ErrorResponse`; `docs/api/openapi-changes.md` API-GAP-HUB-01 item 1 (`accepted`). |
| Current text | The YAML defines `{ success, data }` and `ErrorResponse { success, code, message, errors[{field,message}] }`. API-GAP-HUB-01 records that the hub backend uses the `ServiceResponse` envelope: `{ success, statusCode, payload: { message: "<text> (<STATUS>)", data } }`, with field errors in `payload.data.details[{field, code, message}]`. |
| Proposed change | **Request to BE and the docs owners:** move the hub endpoints, and later all endpoints, to the OpenAPI envelope, then close item 1 of API-GAP-HUB-01. Until then, the FE accepts the hub envelope through one adapter. |
| Reason | One client, two envelopes. The 003 endpoints follow the YAML; the hub follows `ServiceResponse`. With `ServiceResponse`, clients must branch on the HTTP status and `details[].code`, because there is no top-level `code`. A single envelope removes the adapter and the double error parsing. |
| FE impact | Approved decision Q7. The adapter is `unwrapServiceResponse` in `libs/api-client.ts`. `toApiError` reads both error shapes: a known `details[].code` such as `DUPLICATE_VALUE` wins, otherwise the status mapping (409 `DUPLICATE_VALUE`, 412 `PRECONDITION_FAILED`, 403 `FORBIDDEN`). <br>The MSW hub handlers answer in `ServiceResponse`, except for token and account checks, which reuse the Authentication middleware's contract shape (DOC-01, DOC-06: `UNAUTHENTICATED`, `ACCOUNT_DISABLED`, `PASSWORD_CHANGE_REQUIRED`). <br>When BE switches, only `unwrapServiceResponse`, the hub part of `toApiError`, and `mocks/utils/service-response.ts` change. |
| Status | `proposed` |

## DOC-17 — Real-mode transport: same-origin `/api/backend` forwarder with the user's bearer

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi-changes.md` API-GAP-HUB-01 item 7; `docs/analysis-and-design/fe/component-diagram-fe.md` "Backend Forwarder" (line 37); spec 004 FR-017 and research R-01. |
| Current text | "Frontend access goes through the Next.js route `/api/backend/*`, which adds the Bearer token from an httpOnly cookie." (Dev's code actually injects one server-wide `DEV_BACKEND_TOKEN`.) |
| Proposed change | Real mode uses `NEXT_PUBLIC_API_BASE_URL=/api/backend`. The route forwards to `BACKEND_API_URL`. <br>**Token:** the route passes on the signed-in user's `Authorization: Bearer` header, which the API client attaches (the token is kept in browser storage, per 003 DOC-03). `DEV_BACKEND_TOKEN` is a dev-only, opt-in fallback, used only when `NODE_ENV` is not production **and** `ALLOW_DEV_BACKEND_TOKEN=true` **and** the request has no `Authorization` header. It is never used for `auth/*`, and every use logs a server warning. <br>**Missing token:** the request is still forwarded, and the backend answers 401. <br>**Allowed paths:** exactly the operations the client calls (hub, `admin/services`, `auth/login\|logout\|me`, `profile/password`, `admin/users\|faculties\|roles`, `activities/landing`). It is not an open proxy. |
| Reason | The backend has no CORS, so the browser cannot call `:8080` from `:3000`. One server-wide token would make every user act as one seeded account and hide permission bugs (005 Q1). The httpOnly-cookie design in R-01 needs an Authentication BE that issues backend tokens; that BE does not exist yet. |
| FE impact | `app/api/backend/[...path]/route.ts`, `libs/backend-path.ts`, `.env.example` (`BACKEND_API_URL`, `ALLOW_DEV_BACKEND_TOKEN=false`, `DEV_BACKEND_TOKEN`). <br>Per Q2, until BE login is DB-backed, real mode is tested only with a token minted by `src/server/scripts/mint-dev-token.ts`. 003 login cannot be exercised against the BE yet (GAP-E). |
| Status | `proposed` |

## DOC-18 — Hub parts of dev's `docs/` edits that are stale after the 005 adaptation

| Field | Value |
|---|---|
| Affected doc + section | Two files, edited on origin/dev by PR #105: <br>• `docs/analysis-and-design/fe/component-diagram-fe.md`: line 36 "University Services", line 37 "Backend Forwarder", node `HubDataService` (line 81); <br>• `docs/analysis-and-design/client/pages/student.md`: "University Services" (line 27). |
| Current text | "Data comes from `HubService` / `AdminHubService` (mock or real)"; "Hub Services: HubService / AdminHubService: Real / Mock / Factory"; "forwards hub requests to the backend with the Bearer token from an httpOnly cookie"; "Data: `GET /api/v1/hub/services` through the frontend's `/api/backend` forwarder." |
| Proposed change | **`component-diagram-fe.md`:** <br>• `HubService` and `AdminHubService` each have one real implementation over the API client; there are no mock classes and no factories. <br>• The mock is the MSW network handler set (`src/mocks/handlers/hub.ts`, client constitution C-IV v1.1.0), selected only by `NEXT_PUBLIC_API_MODE`. <br>• The forwarder text follows DOC-17 (it also serves auth and admin-users calls). <br>**`student.md`:** the forwarder is real mode only, and mock mode is answered by MSW. Add the "forbidden" state, a 403 shown with the shared forbidden view. <br>**Not stale:** `RoleNav` (deleted in 005) does not appear in `docs/`, and the BE component diagram is unaffected. |
| Reason | The hub FE was written on the pre-003 frontend: mock service classes, a factory on `NEXT_PUBLIC_DATA_SOURCE`, the `admin` role code, and `RoleNav`. Plan 005 adapted it to the 003 architecture: one API client, MSW, `AppShell` / `SideNav`, and shared states. |
| FE impact | None. This entry only records documentation drift, for the docs owners. |
| Status | `proposed` |

## DOC-19 — Dev's cookie-BFF session is not adopted; ask BE for the contract auth

| Field | Value |
|---|---|
| Affected doc + section | `src/specs/004-profile-management/implementation.md` ("Authentication and configuration", "Storage and API"); `docs/api/openapi.yaml` `/auth/login`, `/auth/logout`, `/auth/me`; 003 GAP-E. |
| Current text | implementation.md: "The Next.js login route calls existing backend `POST /api/auth/login` … Next.js stores the backend access token and signed UI session in separate HTTP-only, SameSite=Lax cookies … Configure `API_BACKEND_URL` … and a strong `SESSION_SECRET`." The BE serves `POST /api/auth/login` (ServiceResponse, `payload.data.token`) and `GET /api/auth/me` (`roles[]`, `permissions[]`), unversioned; there is no BE logout. |
| Proposed change | **Request to BE:** serve `/api/v1/auth/login`, `/api/v1/auth/logout` and `/api/v1/auth/me` with the contract shapes plus the 003 gaps: DOC-01 to DOC-04, DOC-06, one role per account (GAP-G), and `status` and `mustChangePassword` on `/auth/me`. <br>**Docs owners:** `src/specs/004-profile-management/implementation.md` describes a cookie BFF (`app/api/auth/*`, `app/api/v1/profile/*`, `SESSION_SECRET`, `API_BACKEND_URL`, a role chosen at login, `administrator → admin`). None of it is in the integrated frontend, so that text is stale (plan 006 R7). |
| Reason | Plan 006 approved Q1: keep the 003 / 005 session model (bearer in the token store, forwarded by `/api/backend`). Choosing a role at login contradicts "each account has exactly one role". Dev's `me` route also did not compile against the 003 code. |
| FE impact | Removed in the 006 merge (`ea889ce`): `app/api/auth/{login,logout,me}`, `libs/backend-session.ts`, `app/api/v1/profile/[[...segments]]` and their tests. Real-mode sign-in stays blocked until the BE matches (approved Q6; no `auth/*` path remapping). The full gap list for the next phase is in `specs/006-integrate-profile/HANDOFF.md` "Next phase: E2E authentication". |
| Status | `proposed` |

## DOC-20 — Profile envelope and object-shaped error `details`

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: `getMyProfile`, `updateMyProfile`, `uploadMyAvatar`, `deleteMyAvatar`, `ErrorResponse`; DOC-16 (hub envelope). |
| Current text | The YAML documents `{ success, data }` and `ErrorResponse { code, message, errors[] }` for every profile operation. |
| Proposed change | **Request to BE** (extends DOC-16): one envelope for all profile operations. Today the BE answers in **three shapes**: <br>• `GET/PATCH /profile`: ServiceResponse `{ success, statusCode, payload: { message: "<text> (<STATUS>)", data } }`, and a 400/409 carries **one object** `payload.data.details = { field: "phoneNumber" }` with the text in `payload.message` (not `errors[]`). The duplicate phone is 409 with no `code`. <br>• Avatar upload: `{ success, data: { avatarUrl } }`; avatar errors: `{ success: false, code?, message }`. <br>• Removal and password: `{ success, message }`; password errors: the contract `ErrorResponse` (`CURRENT_PASSWORD_INCORRECT`, `VALIDATION_FAILED`, `INTERNAL_ERROR`). <br>Also give the 409 a code: 409 means a taken phone number on `PATCH /profile` but an avatar race on `/profile/avatar`. |
| Reason | One client has to parse three shapes. 409 has two meanings, so the copy can only be chosen by context. |
| FE impact | Still one adapter per shape, in `libs/api-client.ts`: `unwrap`, `unwrapServiceResponse`, and `toApiError`, which maps an object `details { field }` to `fieldErrors[field] = payload.message` and strips the " (STATUS)" suffix (006 step 2). `profileFromEnvelope` picks the adapter. The copy contexts are `profilePhone`, `avatarUpload` and `avatarRemove` (006 step 5). The MSW mock answers exactly like the BE today. |
| Status | `proposed` |

## DOC-21 — Avatar file URL and its authenticated read

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml`: `AvatarResponse.data.avatarUrl` and `Profile.avatarUrl` (`format: uri-reference`, "legal same-origin URL"), `readMyAvatarFile` (`GET /profile/avatar/files/{fileName}`). |
| Current text | `avatarUrl` is a "legal same-origin URL". The BE returns `/api/v1/profile/avatar/files/{uuid}.png\|jpg`. The file read requires the bearer and answers `Cache-Control: private, no-store`. |
| Proposed change | State in the contract that `avatarUrl` is the `readMyAvatarFile` path **relative to the API base** (or return the file name only), and that clients must send the bearer to read it. An `<img src>` cannot send it, so a client must fetch the file itself, unless BE offers short-lived signed URLs. |
| Reason | "Same-origin" assumed a cookie-based BFF (DOC-19). With a bearer client the URL is not directly usable as `<img src>`, and its `/api/v1` prefix duplicates the client's base URL. |
| FE impact | `ProfileAvatar` (006 step 6) takes the file name from `…/profile/avatar/files/{name}` only (any other shape shows initials). It reads `${base}/profile/avatar/files/{name}` through `api.blob` (bearer) and renders an object URL, with an initials fallback and "Retry picture" (UC-03 A9). The forwarder allows exactly one safe file-name segment and passes the bytes and headers through unchanged (006 step 7). |
| Status | `proposed` |

## DOC-22 — `openapi.yaml` was changed without a version bump or a changes row

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml` (info.version still `1.2.0`); `docs/api/openapi-changes.md` (no row). |
| Current text | PR #106 changed these without a version bump: <br>• avatar limit 5 MB → 10 MB (10485760 bytes inclusive); <br>• new `GET /profile/avatar/files/{fileName}`; <br>• 409 / 500 on the avatar operations; <br>• `INTERNAL_ERROR`; <br>• `UpdateProfileRequest` gets a phone `pattern` and `additionalProperties: false`; <br>• `AcademicInfo` fields required and readOnly; <br>• `Profile` requires `id, email, fullName, phoneNumber, academicInfo`; <br>• `avatarUrl` `uri` → `uri-reference`; <br>• **`ChangePasswordRequest.newPassword.minLength` 8 → 6**; <br>• `additionalProperties: false` on the password and avatar requests. |
| Proposed change | Release these as **1.3.0**. Add an `openapi-changes.md` entry (API-GAP-PROFILE-01 or similar) that lists them, in particular the breaking `minLength` change (see DOC-23). |
| Reason | Clients pin to a contract version. `openapi-typescript` regenerated different types under the same version (006 step 1), and the password change affects the 003 first-sign-in flow. |
| FE impact | `src/types/openapi.gen.ts` regenerated from the new YAML in the 006 merge. No FE behaviour depends on the version string. |
| Status | `proposed` |

## DOC-23 — Password minimum: the FE enforces 8; contract, BE and BRs say 6

| Field | Value |
|---|---|
| Affected doc + section | `docs/api/openapi.yaml` `ChangePasswordRequest.newPassword.minLength` (now 6); `docs/analysis-and-design/business-rules.md` BR-ACC-09 ("at least six characters"); `docs/requirements/vision-document.md` NFR-SEC-02 ("at least 6 characters"); `docs/requirements/use-case-specifications.md` UC-03 A7 ("shorter than six characters"); `src/server` `AuthService.changePassword` (6 code points). |
| Current text | Contract, BE, BR, NFR and UC all say 6. |
| Proposed change | **Ask the team to agree on one value** and align contract, BE and BRs. The FE recommends 8 (stricter, compatible with every 6-character rule). Until then the FE keeps 8. |
| Reason | Plan 006 approved Q3: the FE keeps 8 everywhere. Being stricter is compatible: anything the FE sends also satisfies the BE. A 6- or 7-character password accepted by the BE cannot be set through our UI, which is a deliberate and visible restriction (plan 006 R5). |
| FE impact | One rule: `libs/validation/password.ts` (`PASSWORD_MIN_LENGTH = 8`, counted in code points like the BE), used by both `ChangePasswordForm` variants and the MSW mock, with the copy "At least 8 characters." Admin-issued temporary passwords keep their own rule (`TEMP_PASSWORD_MIN_LENGTH = 8`, DOC-05). **DOC-09 stays open** and points here. |
| Status | `proposed` |

## Not documentation changes (BE / DB alignment only)

These are mismatches between `src/server` or `src/db` and the documented contract. The docs are already correct here, and BE should align. They are listed so this file can serve as the full hand-off.

| Spec ref | Finding | Requested of BE |
|---|---|---|
| GAP-E | Server base path `/api/auth/*` vs contract `/api/v1`; envelope `{ success, statusCode, payload }` vs `{ success, data \| message, code }`; login 404 "Email not found"; no `/auth/me` or `/auth/logout` | Implement the contract (plus DOC-03/DOC-04 once accepted) |
| GAP-F | Public `POST /api/auth/register` (student self-registration) | Remove it or make it admin-only; UC-29 defines admin provisioning via `POST /admin/users` |
| GAP-G | DB `UserRole` primary key `(user_id, role_id)` allows several roles; AI identity uses `roles[]` | Enforce exactly one role per account (BR-ADM-12) |

## Change log

| Date | Change |
|---|---|
| 2026-11-27 | Created during the `/speckit-analyze` remediation (DOC-01 to DOC-15). |
| 2026-11-27 | `/speckit-implement`: no new deviation from `docs/` came up. The implementation follows DOC-01 to DOC-15 as written. FE-internal changes need no `docs/` change: unsigned mock tokens, a `setRole` dev helper, and the token provider registered at module load. |
| 2026-11-27 | Second analysis pass. **DOC-01**: the proposal now exempts `GET /auth/me` (returns `status: 'inactive'`) and `POST /auth/logout` from `ACCOUNT_DISABLED`, needed for the reload case (H6). **DOC-02**: FE impact now covers reload (`reason=role-missing`). The other fixes in this pass are FE-internal and need no `docs/` change: stale-hint clearing (H5), `useForbidden` wiring (M7), wording fixes (M8–M10, L7, L8). |
| 2026-11-28 | Plan 005 (hub integration): added DOC-16 (envelope request), DOC-17 (forwarder and token) and DOC-18 (stale hub docs from PR #105); updated DOC-11 (University Services for every role, Service Links for administrators). |
| 2026-11-28 | Plan 006 (profile integration): added DOC-19 (cookie BFF not adopted; contract auth request), DOC-20 (profile envelope, object `details`), DOC-21 (avatar URL and authenticated read), DOC-22 (YAML changed without a version bump), DOC-23 (password minimum 8 vs 6); updated DOC-07 (phone pattern), DOC-09 (stays open, see DOC-23) and DOC-11 (shared `/profile`). |
