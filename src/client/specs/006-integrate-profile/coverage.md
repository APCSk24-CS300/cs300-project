# Coverage: Profile Management (spec 004-profile, UC-03) after the rewrite

**Plan**: [plan.md](./plan.md), §7 step 4 (risk R2).

**Rule**: no scenario of `src/specs/004-profile-management/spec.md` US1–US3, its edge cases, or UC-03 A1–A9 may lose coverage when dev's `vi.mock`-based tests are rewritten onto MSW or deleted.

This file was written in step 4, **before** any deletion. The *Step* column says when each test reaches its final form. Titles are kept stable, so a test can move between files without changing this table. Paths are relative to `src/client/src/`.

**Abbreviations used in the table**

| Short name | Meaning |
|---|---|
| **H** | `mocks/handlers/profile.test.ts`: the MSW profile handlers, which answer like `src/server` ProfileRoute / AvatarRoute / PasswordController |
| **PS** | `features/profile/services/profile.service.test.ts`: the service against MSW |
| **PP** | `features/profile/components/ProfilePage.test.tsx`: the page against MSW |
| **AE** | `features/profile/components/AvatarEditor.test.tsx`: the avatar editor against MSW |
| **CPF** | `features/auth/components/ChangePasswordForm.test.tsx`. Step 4 rewrites `features/profile/components/PasswordChangeForm.test.tsx` onto MSW; step 6 moves those tests here as `variant="profile"` |
| **PAV** | `features/profile/components/ProfileAvatar.test.tsx`: the authenticated image (step 6) |
| **FW** | `app/api/backend/[...path]/route.test.ts`: the forwarder (step 7) |
| **V** | `libs/validation/password.test.ts`, `libs/validation/phone.test.ts`, `features/profile/validation/avatar.validation.test.ts` |
| **BE** | `src/server/tests/**` (from origin/dev, unchanged: `git diff origin/dev -- src/server` is empty). It covers what only the server can prove: ownership from the token `sub`, bcrypt, Sharp decoding, the compare-and-set on the avatar URL, and concurrent updates. |

## US1: View and update my profile (P1)

| # | Scenario | Test(s) after the rewrite | Step |
|---|---|---|---|
| 1 | Own saved profile and the applicable academic identity are shown | **H:** "GET /profile returns the caller's own profile in the ServiceResponse envelope"<br>**PP:** "shows loading state before rendering saved profile and read-only identity", "shows unavailable academic details and an avatar fallback"<br>**PS:** "requests and maps the server profile response" | 4, 6 |
| 2 | A valid phone number is saved and shown | **H:** "PATCH /profile saves a valid phone number or clears it with null"<br>**PP:** "saves a valid phone number and refreshes the displayed profile" (step 5 adds that AccountMenu's user refreshes)<br>**PS:** "updates only the phone number and maps the returned profile", "sends null when clearing the phone number" | 4, 5 |
| 3 | Invalid phone: an explanation, the draft is kept, the saved value is unchanged (A5) | **V:** "accepts empty, 0 + 9 digits and +84 + 9 digits; rejects everything else"<br>**H:** "PATCH /profile rejects an invalid phone with 400 and a { field } detail, and changes nothing"<br>**PP:** "validates the phone number without discarding the entered value", "shows a server validation error on the phone field while preserving the draft" | 4 |
| 4 | Read-only identity, or another user's profile: rejected, both unchanged (A6) | **H:** "PATCH /profile accepts phoneNumber only; read-only fields are rejected and nothing changes", "every profile operation uses the token's user; there is no user id in the path or body"<br>**PP:** "shows name, email, student number and faculty as text, not inputs" (step 6)<br>**BE** (cross-user writes) | 4, 6 |
| 5 | Cancel discards unsaved edits (A1) | **PP:** "discards unsaved edits when canceled" | 4 |

## US2: Change my password (P1)

| # | Scenario | Test(s) after the rewrite | Step |
|---|---|---|---|
| 1 | Correct current password, new password long enough, matching confirmation: updated, success shown | **H:** "changes the password, clears the mark, old password stops working" (003 test, kept)<br>**CPF:** "profile variant: submits only API password fields and shows loading and success states" | 4, 6 |
| 2 | Wrong current password, too short, or no match: a correction message, the password unchanged (A7) | **H:** "rejects a wrong current password" (400 `CURRENT_PASSWORD_INCORRECT`), "rejects a new password under 8 characters" (003 tests, kept)<br>**V:** "counts code points and requires 8 (DOC-23)"<br>**CPF:** "profile variant: rejects a missing current password / a seven-character new password / mismatched confirmation", "profile variant: shows Current password is incorrect on the field and keeps the new password" | 4, 6 |
| 3 | A rejected change returns and stores no plaintext | **H:** "password responses never contain password values"<br>**BE** (hashing) | 4 |

## US3: Set or remove my profile picture (P2)

| # | Scenario | Test(s) after the rewrite | Step |
|---|---|---|---|
| 1 | JPG/PNG ≤ 10 MB is stored and shown (A3) | **H:** "POST /profile/avatar stores a PNG or JPEG up to 10 MiB inclusive and returns its URL", "GET /profile/avatar/files/{name} returns the bytes of the current picture only"<br>**AE:** "previews and saves a picture only after upload succeeds"<br>**PS:** "uploads multipart avatar content and validates the active URL"<br>**PAV:** "loads the picture through the API client with the bearer" | 4, 6 |
| 2 | Remove restores the default picture (A4) | **H:** "DELETE /profile/avatar clears the picture; the file is gone"<br>**AE:** "confirms removal and restores the default only after success"<br>**PP:** "restores the default picture after confirmed removal"<br>**PS:** "removes the avatar only when the API confirms success" | 4, 6 |
| 3 | Unsupported format or > 10 MB is rejected with a reason; the current picture is kept (A8) | **V:** "accepts JPG/PNG at exactly the size limit, rejects oversized/unsupported/empty files" (dev, kept)<br>**H:** "rejects content that is not JPG/PNG (renamed file), a 10 MiB + 1 byte file, an empty file and a missing field with 400 UNSUPPORTED_FILE"<br>**AE:** "rejects unsupported input and preserves the saved image on upload failure"<br>**FW:** "rejects an upload body above 10 MiB + 64 KiB with 413 before calling the backend" | 4, 7 |
| 4 | An upload or profile update fails: profile intact, retry possible (A9) | **H:** "answers 500 and 409 through the failure switch and keeps the current picture"<br>**AE:** "keeps the selected file for retry after storage failure, then updates only on success", "preserves the saved picture on removal failure"<br>**PP:** "shows save errors and keeps the entered phone number for correction", "shows an error and retries the profile request" | 4 |

## Edge cases from the spec

| Edge case | Test after the rewrite | Step |
|---|---|---|
| Unauthenticated view or change is denied | **H:** "answers 401 without a token on every profile operation"<br>`proxy.test.ts`: "sends signed-out visitors from /profile to sign-in and lets every role in, marked no-store" | 3, 4 |
| No user id can be chosen in the request | **H:** "every profile operation uses the token's user; there is no user id in the path or body" | 4 |
| An attempt to modify a read-only identity field | **H:** "PATCH /profile accepts phoneNumber only; read-only fields are rejected and nothing changes" | 4 |
| Profile or picture cannot be loaded: report and retry, no stale data shown as saved | **PP:** "shows an error and retries the profile request", "offers retry when the saved picture fails to load"<br>**PAV:** "shows initials and Retry picture when the file read fails" | 4, 6 |
| Overlapping updates must not report success for an unsaved change | **H:** "answers 500 and 409 through the failure switch and keeps the current picture"<br>**BE** (real concurrency) | 4 |
| Image content, not only the file name, is checked | **H:** "rejects content that is not JPG/PNG (renamed file), a 10 MiB + 1 byte file, an empty file and a missing field with 400 UNSUPPORTED_FILE" (magic bytes stand in for Sharp)<br>**BE** (Sharp) | 4 |
| Exactly 10 MB is accepted; above is rejected | **V** (avatar)<br>**H:** "POST /profile/avatar stores a PNG or JPEG up to 10 MiB inclusive and returns its URL" (the exact size) and the 10 MiB + 1 rejection above | 4 |
| Older mock store without `avatarUrl` is migrated, keeping users and sessions | `mocks/db/store.test.ts`: "adds avatarUrl to an older store's users and keeps sessions" | 4 |

## 003 first-sign-in flow (FR-043–048), sharing the operation

The flow is unchanged. It stays covered by the existing `ChangePasswordForm.test.tsx` (first-sign-in variant), `AuthProvider` tests and **H** "blocks other operations while a change is pending, but not /auth/me or logout". The shared minimum (8, DOC-23) is covered by **V**.

## Dev tests deleted or rewritten, and their replacements

| Dev test (origin/dev) | What happens to it | Replacement |
|---|---|---|
| `features/profile/services/profile.service.test.ts` (7 tests; `vi.mock` of the API client) | Rewritten in step 4 onto MSW. "supports the documented success/data response" and "rejects an invalid profile response" stay as mapper tests (`mappers/profile.mapper.test.ts`) because MSW always answers in the BE shape. | **PS** (same titles) + the mapper test |
| `features/profile/components/ProfilePage.test.tsx` (10 tests; `vi.mock(profileService)`) | Rewritten in step 4 onto MSW, same titles. Step 6 changes selectors for the new UI. "offers retry when the saved picture fails to load" moves to **PAV** in step 6. | **PP** (+ **PAV**) |
| `features/profile/components/PasswordChangeForm.test.tsx` (5 tests; `vi.mock(authService)`) | Rewritten in step 4 onto MSW. Step 6 deletes the component and moves the tests to **CPF** as `profile variant: …`. The old test "shows a safe failure message and clears fields when the request is rejected" becomes "profile variant: shows Current password is incorrect on the field and keeps the new password": the copy comes from `toUserMessage`, and the new password is kept so it can be corrected (spec FR-011). | **CPF** |
| `features/profile/components/AvatarEditor.test.tsx` (5 tests; `vi.mock(profileService)`) | Rewritten in step 4 onto MSW, same titles. Removal goes through `ConfirmDialog` in step 6. | **AE** |
| `features/profile/validation/password.validation.test.ts` | Kept until step 6 (dev's validator delegates to the shared rule), then deleted with the validator. | **V** `libs/validation/password.test.ts` |
| `features/profile/validation/avatar.validation.test.ts` | Kept. | **V** |
| `features/auth/services/auth.service.test.ts`, `libs/backend-session.test.ts`, `app/api/auth/login/route.test.ts`, `app/api/v1/profile/.../route.test.ts` | Deleted in step 1 (`ea889ce`), with the code they test: the pre-003 `/api/auth` paths, the cookie BFF and the second forwarder (approved Q1). They covered no UC-03 scenario that is not listed above. Multipart forwarding moves to **FW**. | **FW** (multipart) |
