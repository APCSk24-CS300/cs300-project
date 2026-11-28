# Tasks: Profile Management

**Input**: [spec.md](spec.md), [plan.md](plan.md), and UC-03 in `docs/requirements/use-case-specifications.md`

**Prerequisites**: Requester approved the specification/plan, feature-scoped Next.js exception, phone policy, unavailable student number, and PostgreSQL avatar storage on 2026-11-28, with schema design as the reference. See [implementation.md](implementation.md).

**Organization**: Tasks are ordered by user story and keep each workflow independently testable. Test work is included to satisfy the project constitution's testing requirements.

**Verification status (2026-11-28)**: All 35 tasks are implemented and verified. Client 154/154 tests and server 93/93 tests pass, including real-schema PostgreSQL integration with no skipped tests in the recorded run. TypeScript checks pass in both projects and changed client files pass ESLint. No new schema or application dependency was needed.

## Phase 1: Foundation and contract verification

**Purpose**: Confirm existing capabilities and decisions that profile work depends on.

- [X] T001 Inspect the current-user, profile, and password-change flows in the client and server; record which UC-03 behaviors exist so they are reused rather than duplicated. **Verified:** the client calls `GET/PATCH /api/v1/profile` and `PATCH /api/v1/profile/password`; server routes, controllers, services, and repositories implement these operations. The shared access-token bypass has now been removed; see T006/T008/T013.
- [X] T002 Confirm the authenticated identity fields and profile data available from `src/db/schema.sql`; identify the approved source for student number without making protected identity fields user-editable. **Verified:** Checked db/schema.sql and the referenced design document. SQL has no student-number field; requester approved null/unavailable. Faculty is read from Student.faculty_id. See implementation.md.
- [X] T003 Confirm existing phone-number validation and error-response conventions. **Verified:** Requester approved the existing domestic/+84 format, null clearing, and equivalent-format duplicate checks; validation and API documentation agree.
- [X] T004 Confirm the approved avatar storage mechanism and verify it supports JPG/PNG validation, the 10 MB limit, replacement, and removal. Do not add a storage provider or dependency without approval. **Verified:** Approved PostgreSQL storage uses existing User.avatar_url TEXT. Atomic image/reference writes and removal pass real-database failure-preservation tests.
- [X] T005 Resolve the frontend platform mismatch between the constitution and the current Next.js client with the team before frontend implementation. **Verified:** Requester approved a feature-scoped Next.js exception, recorded in spec.md and plan.md.

## Phase 2: User Story 1 - View and update my profile (Priority: P1)

**Goal**: Authenticated users view only their own profile, update their phone number, and cannot edit protected identity fields.

**Independent Test**: Read the signed-in user's profile, save a valid phone number, reload to verify persistence, then verify invalid and cross-user changes are rejected without altering saved data.

### Tests

- [X] T006 [P] [US1] Add server tests for self-only profile reads and updates, including unauthenticated access, cross-user target attempts, invalid phone input, and protected identity-field tampering. **Verified:** Full server authorization tests pass, including rejection of the former bypass and invalid/expired/wrongly signed tokens.
- [X] T007 [P] [US1] Add client tests for profile loading, valid phone updates, validation feedback, failure handling, and discarding edits on cancel. **Verified:** Client profile tests pass for loading, saving, rejection/preserved input, read-only academic fields, retry, and cancel.

### Implementation

- [X] T008 [US1] Add or extend the authenticated profile read/update API using the existing route, controller, service, and repository patterns; derive the target user only from verified request identity. **Verified:** Ownership comes only from verified JWT sub. Real PostgreSQL integration checks all three account duties and rejects cross-user/protected-field writes.
- [X] T009 [US1] Limit profile writes to the permitted phone field and apply the approved phone validation before persistence. **Verified:** Approved phone policy is implemented, documented, and tested on both client/server. Only phoneNumber is accepted by profile PATCH.
- [X] T010 [US1] Build the profile view and edit flow under the approved client feature structure; render available academic identity fields read-only and preserve entered values when validation fails. **Verified:** Existing Next.js profile view displays schema-backed identity read-only and preserves edits on rejection. Requester approval resolves the platform gate.

## Phase 3: User Story 2 - Change my password (Priority: P1)

**Goal**: A user changes their own password only after satisfying UC-03's current-password, minimum-length, and confirmation requirements.

**Independent Test**: A correct current password and valid matching replacement succeeds; incorrect current password, short replacement, or mismatch fails without changing the saved password.

### Tests

- [X] T011 [P] [US2] Add or extend server tests for current-password verification, the eight-character minimum, secure hashing, and unchanged credentials after rejection. Password confirmation is validated by the frontend and is not sent to the server. **Verified:** Server password tests and real-schema integration pass for incorrect/short inputs, bcrypt replacement, and unchanged credentials after rejection.
- [X] T012 [P] [US2] Add client tests for current/new password validation, eight-character minimum, matching confirmation, success feedback, and error handling without echoing password values. **Verified:** Client tests cover validation, frontend-only confirmation, success/failure and sensitive-field clearing.

### Implementation

- [X] T013 [US2] Implement the authenticated `PATCH /profile/password` endpoint and integrate the existing client auth service with this official path; do not add a parallel password mechanism. **Verified:** Official password path is used through the authenticated same-origin bridge; real client method/body regression and backend persistence tests pass.
- [X] T014 [US2] Enforce current-password verification and the eight-character minimum in the server business layer; retain secure hashing and message-only success responses. Password confirmation is frontend-only and is not sent to the server. **Verified:** Existing bcrypt verification/hashing and compare-and-replace persistence pass unit and database integration tests.
- [X] T015 [US2] Add or integrate the password-change form in the approved profile experience; clear sensitive form values after completion or rejection. **Verified:** Password form is integrated in the approved Next.js experience and clears sensitive values after completion/rejection.

## Phase 4: User Story 3 - Set or remove my profile picture (Priority: P2) (Approved PostgreSQL storage)

**Goal**: Users can set a valid image or remove it to restore the default picture, without losing the previous picture on failure.

**Independent Test**: A valid JPG/PNG at or below 10 MB is displayed after reload; unsupported, oversized, or failed uploads preserve the current image; removal restores the default.

### Tests

- [X] T016 [P] [US3] Add server tests for JPG/PNG acceptance, exact 10 MB boundary, oversized and unsupported files, cross-user upload attempts, removal, and failed-storage preservation. **Verified:** Server tests accept real JPG/PNG and the inclusive 10 MiB boundary, reject corrupt/oversized content and cross-user fields, and verify removal plus database-failure preservation.
- [X] T017 [P] [US3] Add client tests for picture preview, upload rejection feedback, removal confirmation/behavior, and restored default display. **Verified:** Client tests cover preview, upload failure/rejection, removal confirmation, default restoration, and image-load retry.

### Implementation

- [X] T018 [US3] Implement authenticated picture upload and removal using the storage approach approved in T004; validate content type and size at the server boundary. **Verified:** Authenticated multipart upload and bodyless removal use the existing server architecture and approved PostgreSQL storage. Actual content and size are checked at the boundary.
- [X] T019 [US3] Persist the picture reference only after successful storage; retain the existing reference on upload or persistence failure. **Verified:** Image and reference are one User.avatar_url value updated atomically. A PostgreSQL trigger-induced write failure preserves the previous value for upload and removal.
- [X] T020 [US3] Integrate upload, removal, and default-picture states into the approved profile UI with explicit operation feedback. **Verified:** Avatar controls, default initials, upload/removal feedback, image-load retry, and retained saved state are implemented and client-tested.

**US3 status**: Implemented and verified using approved PostgreSQL storage. See T016–T020 and T031–T033 for automated verification evidence.

## Phase 5: Verification

- [X] T021 Run the full client and server test suites for the currently implemented US1/US2 work and fix regressions caused by the feature. **Verified:** Latest complete run: 154 client tests and 93 server tests pass; real-schema integration enabled with no skipped tests.
- [X] T022 Verify the acceptance scenarios in `spec.md`, including authorization, protected fields, invalid inputs, image boundaries, and failure preservation. **Verified:** All specified workflows have automated unit/integration coverage, including ownership, protected values, reloads, image boundaries, failure preservation and overlapping updates. No full-browser end-to-end run is claimed.
- [X] T023 Update directly related API or user documentation if implementation changes or adds profile behavior not already documented. **Verified:** Updated docs/api/openapi.yaml with approved phone/size/storage behavior; implementation.md documents schema differences, runtime envelopes, configuration, and usage.

## Dependencies

- T006-T010 depend on T001-T003.
- T007, T010, T012, T015, T017, and T020 depend on T005.
- T011-T015 depend on T001 and use the resolved password-change contract: `PATCH /profile/password`, an eight-character minimum, frontend-only confirmation, and a message-only success response. The endpoint and client form are implemented; T013 and T015 are verified; the platform decision is approved.
- T016-T020 depend on T004.
- T021-T023 depend on completion of the user-story implementation tasks.

## Completion

**Overall status: complete.** All 35 tasks are checked with evidence. Runtime behavior follows the executable schema; documented design-only identity fields remain unavailable.

## Phase 6: Convergence

Assessment of the current implementation against spec.md, plan.md, all existing tasks, and the constitution. Existing tasks and completion markers above are preserved. Approval tasks precede dependent implementation; this phase does not grant unresolved approvals.

- [X] T024 CRITICAL — Obtain and record review of the existing specification and implementation plan before further implementation; resolve the Draft/pending-review status through the approved specification workflow, without assuming approval from implemented code, per Constitution III and plan: reviewed specification (partial). [F1; existing prerequisite] **Verified:** Requester approval and schema-reference condition are recorded in spec.md/plan.md; Draft/pending-review status resolved.
- [X] T025 CRITICAL — Resolve and record the frontend platform exception with the team before further client implementation: approve the current Next.js profile experience or define the required compliant alternative; reconcile the feature artifacts through the appropriate planning/governance workflow per Constitution Governance/Core tech stack, plan: platform decision, and T005/T010/T015 (contradicts). [F2] **Verified:** Feature-scoped Next.js exception approved by requester and documented without changing the global constitution.
- [X] T026 CRITICAL — Extract current-password presence, eight-character minimum, and confirmation-matching rules from client/src/features/profile/components/PasswordChangeForm.tsx into a profile validation module; keep the component responsible for presentation and interaction state, preserve clearing behavior and frontend-only confirmation, and add focused validation tests per Constitution I, FR-006/007, and T012/T015 (contradicts). [F3] **Verified:** Password rules are isolated in password.validation.ts; focused Unicode-length/confirmation tests and form tests pass.
- [X] T027 CRITICAL — Pass the requested HTTP method to fetch in client/src/libs/api-client.ts and add transport regression tests in client/src/libs/api-client.test.ts proving profile/password PATCH requests carry their JSON bodies with PATCH rather than the default GET; preserve GET and abort behavior per US1/AC2, US2/AC1, and T008/T013 (partial). [F4] **Verified:** HTTP method is forwarded to fetch. PATCH/POST/DELETE method/body tests and real client transport against the API/database pass.
- [X] T028 CRITICAL — Connect the existing signed-in profile experience to verified backend authentication: replace the mock-only identity path for this workflow, carry a valid backend access token through the existing client/server auth boundaries, and handle absent/expired credentials without enabling any bypass; verify GET/PATCH /api/v1/profile and PATCH /api/v1/profile/password use the authenticated owner per FR-001/002, plan: reuse existing authentication, and T008/T013 (missing). [F5; after platform decision] **Verified:** Production AuthProvider uses real authentication. Next.js validates database-backed roles, stores HTTP-only cookies and forwards verified backend credentials; absent/expired credentials are rejected and cookie tests pass.
- [X] T029 CRITICAL — Add integrated profile/password workflow coverage that exercises the real API transport, verified identity, and repository persistence rather than mocking all those boundaries: assert saved phone survives a new read/reload, password replacement invalidates the old password, rejected/cross-user changes preserve stored data, and overlapping updates never report an unpersisted success; cover student, manager, and administrator profiles as applicable per Constitution IV, SC-001/002/003/004, spec: overlapping-update edge case, and T021/T022 (partial). [F6; after transport/auth repairs] **Verified:** Real-schema test exercises actual login, client API transport, JWT middleware, production profile/password repositories and PostgreSQL for all three roles, rereads, rejection preservation, password invalidation and concurrent updates.
- [X] T030 Obtain and record the approved phone-number policy, including whether the current domestic/+84 rule, clearing, and equivalent-number duplicate behavior are intended; align client/src/features/profile/validation/profile.validation.ts, server/src/services/ProfileService.ts, tests, and directly related contract/user documentation to that decision per FR-004, plan: reuse established validation, and T003/T009/T023 (partial). [F7; HIGH] **Verified:** Approved phone policy is recorded in spec.md/plan.md/implementation.md and OpenAPI, with matching validation tests.
- [X] T031 Obtain and record an approved avatar-storage design covering JPG/PNG content validation, the inclusive 10 MB boundary, replacement/removal, default display, and recovery from storage/persistence failures; justify any new dependency before adding it per plan: storage decision and T004 (missing). [F8; HIGH; blocks avatar implementation] **Verified:** Approved design stores validated image data URIs in existing User.avatar_url TEXT. No schema migration, provider or dependency added.
- [X] T032 Implement authenticated avatar upload/removal through the existing route/controller/service/repository structure using only the approved storage design; derive ownership from verified identity, validate actual image content and the inclusive size boundary, persist the active reference only after successful storage, and preserve the prior image/reference on failure; add server tests for valid JPG/PNG, exactly 10 MB, oversized/spoofed content, unauthorized/cross-user attempts, replacement, removal, and storage/persistence failures per FR-008/009/010, SC-005/006, and T016/T018/T019 (missing). [F9; HIGH; after storage approval] **Verified:** Avatar API/persistence/content/size/authorization/replacement/removal and failure tests pass, including PostgreSQL trigger-simulated storage failures.
- [X] T033 Integrate avatar preview/upload/removal and default-picture states into the approved profile UI; provide retryable operation and image-load failure feedback while retaining the saved picture on failed changes; add client tests for preview, valid upload/reload, invalid input, removal/default restoration, and failure preservation per US3/AC1–AC4, FR-011, spec: picture-load failure edge case, and T017/T020 (missing). [F10; HIGH; after platform/storage decisions and avatar API] **Verified:** Avatar UI and tests cover preview, upload rejection, saved-state preservation, removal/default behavior, image-load failure and retry.
- [X] T034 Confirm and record the authoritative student-number source against db/schema.sql and the approved identity model; retain the explicit unavailable/null read-only state if no source exists, or integrate only an approved source with repository/client tests; never infer student number from user_id per FR-003, plan: academic identity source, and T002 (partial). [F11; MEDIUM] **Verified:** Authoritative SQL and design differences are documented; student number remains unavailable and is never inferred from user_id. Faculty follows the existing Student relationship.
- [X] T035 After the preceding work, run the full client/server test suites and relevant static checks, verify every acceptance scenario and edge case including avatar boundaries/failure preservation and real signed-in persistence, and update directly related API/user documentation with the approved phone and avatar behavior; record actual results and any remaining blockers without treating earlier mocked test passes as full acceptance per plan: cross-cutting verification and T021/T022/T023 (partial). [F12; MEDIUM] **Verified:** Full client/server suites, PostgreSQL integration, TypeScript checks and changed-file lint pass; schema/API/user/configuration documentation updated. See final verification below.

### Final implementation verification (2026-11-28)

- Client: `npm test` — 154/154 passed across 28 files.
- Server: `PROFILE_TEST_DATABASE_URL=... npm test` — 93/93 passed, no skipped tests. The URL pointed to a disposable PostgreSQL instance initialized from the complete `db/schema.sql`; no production database or credentials were used.
- Both projects: `tsc --noEmit` passed. ESLint passed for changed client implementation/tests. `git diff --check` passed.
- Tests used source copies and existing locked dependencies under `/tmp/profile-management-check` because repository dependency directories are not writable. No dependency manifest/lock changes were needed.
- Real-schema integration covers actual login, real client API transport (with a browser-origin adapter), verified ownership, all three independently assigned roles, saved phone rereads, protected/invalid input, concurrent updates, bcrypt password replacement, JPEG/PNG uploads, the exact size limit, replacement/removal, and database-trigger failure preservation. Unit tests separately cover the Next.js cookie/session bridge and UI interactions. This does not claim a full browser end-to-end test.
- Reference/usage/configuration details are in [implementation.md](implementation.md), the updated OpenAPI contract, and `client/.env.example`. The schema itself is unchanged.

## Phase 7: Setup — UC-03 alignment

**Purpose**: Apply the requester's updated identity and password decisions before changing behavior. Earlier checked tasks record the previous baseline; the unchecked tasks below supersede conflicting details without changing their historical status.

- [X] T036 Update `specs/004-profile-management/spec.md`, `specs/004-profile-management/plan.md`, and `specs/004-profile-management/implementation.md` to state that a student profile's read-only student number is `Student.user_id` (which references `User.user_id`), while accounts without a `Student` row have no student number; cite `db/schema.sql` and UC-03 A6, and replace the previous “never infer it from user_id” decision with this explicit approved mapping.
- [X] T037 Reconcile the minimum new-password length in `specs/004-profile-management/spec.md`, `specs/004-profile-management/plan.md`, `specs/004-profile-management/implementation.md`, and `docs/api/openapi.yaml` to UC-03 A7's **six characters**, superseding the earlier eight-character profile rule; record the decision against `docs/requirements/use-case-specifications.md` and `docs/analysis-and-design/business-rules.md` BR-ACC-09.

## Phase 8: User Story 1 — View and update my profile (Priority: P1) 🎯 MVP

**Goal**: Show the authenticated student's schema-backed ID read-only and complete UC-03 basic flow plus A1, A5, and A6.

**Independent Test**: Sign in as a student, see `Student.user_id` as the student number, edit/cancel and edit/save a phone number, then confirm invalid input and protected/cross-user writes do not change stored data; manager and administrator profiles show no student number.

- [X] T038 [P] [US1] Add regression tests in `server/tests/unit/ProfileRepository.test.ts` and `server/tests/integration/profilePersistence.test.ts` that assert `Student.user_id` is returned as `academicInfo.studentNumber` only when a `Student` row exists, including student accounts with separately assigned staff duties; verify a manager/administrator without a `Student` row receives no academic student number and that the field is absent from account-owner writes (UC-03 A6).
- [X] T039 [US1] Map `s.user_id AS student_user_id` to the read-only `academicInfo.studentNumber` in `server/src/repositories/ProfileRepository.ts`; preserve `User.user_id TEXT` exactly and keep ownership derived from verified JWT identity, with no account-owner route to edit student number (UC-03 basic flow and A6).
- [X] T040 [P] [US1] Add client tests in `client/src/features/profile/components/ProfilePage.test.tsx` for student-number display, absent student record, cancel/discard (A1), invalid phone field highlighting plus retained draft (A5), and rejection of read-only/cross-user attempts (A6) without reporting a save.
- [X] T041 [US1] Review and correct `client/src/features/profile/components/ProfilePage.tsx` and `client/src/features/profile/services/profile.service.ts` so the student ID is rendered read-only from the API, server validation errors mark the phone field while retaining the draft, and no stale/failed profile state is shown as newly saved (UC-03 basic flow, A1, A5, A6).

## Phase 9: User Story 2 — Change my password (Priority: P1)

**Goal**: Apply UC-03 A2/A7 and BR-ACC-09: verify current password, require at least six Unicode characters, confirm in the client, hash securely, and preserve the old password on failure.

**Independent Test**: A matching six-character replacement succeeds; five characters, incorrect current password, and mismatched confirmation fail with a correction message and unchanged stored hash.

- [X] T042 [P] [US2] Update tests in `server/tests/unit/AuthService.test.ts`, `server/tests/unit/PasswordRoute.test.ts`, `server/tests/integration/profilePersistence.test.ts`, `client/src/features/profile/validation/password.validation.test.ts`, and `client/src/features/profile/components/PasswordChangeForm.test.tsx` for UC-03 A2/A7's exact five/six-character boundary, wrong current password, confirmation mismatch, message-only responses, and unchanged salted hash on rejection; verify `confirmPassword` is never sent to the API.
- [X] T043 [US2] Change the password minimum to six Unicode characters in `server/src/services/AuthService.ts` and `client/src/features/profile/validation/password.validation.ts`; update the hint and correction feedback in `client/src/features/profile/components/PasswordChangeForm.tsx` without exposing either password in responses/logs (UC-03 A2/A7 and BR-ACC-09).

## Phase 10: User Story 3 — Set or remove my profile picture (Priority: P2)

**Goal**: Verify UC-03 A3, A4, A8, and A9 against the approved PostgreSQL avatar implementation.

**Independent Test**: Upload JPG/PNG at the inclusive 10 MB limit, reload, remove to restore the default, and confirm invalid content, oversized upload, storage failure, and database failure preserve the previous avatar and allow retry.

- [X] T044 [P] [US3] Extend `server/tests/unit/AvatarValidation.test.ts`, `server/tests/unit/AvatarService.test.ts`, `server/tests/integration/profilePersistence.test.ts`, `client/src/features/profile/components/AvatarEditor.test.tsx`, and `client/src/features/profile/components/ProfilePage.test.tsx` with a traceable UC-03 A3/A4/A8/A9 matrix: valid JPEG/PNG, exact-size boundary, unsupported/spoofed and oversized files, removal/default display, upload/storage/database failure preservation, retry after failure, and unauthenticated/cross-user attempts.
- [X] T045 [US3] Fix any A3/A4/A8/A9 gaps revealed by T044 in `server/src/routes/AvatarRoute.ts`, `server/src/services/AvatarService.ts`, `server/src/repositories/AvatarRepository.ts`, `client/src/features/profile/components/AvatarEditor.tsx`, and `client/src/features/profile/components/ProfilePage.tsx`; retain the previously saved `User.avatar_url` and phone value on all rejected or failed operations.

## Phase 11: Polish and cross-cutting verification

- [X] T046 Run the full `client` Vitest suite, full `server` Node test suite with `PROFILE_TEST_DATABASE_URL` pointing to a disposable database loaded from `db/schema.sql`, both TypeScript checks, and changed-file ESLint; record results in `specs/004-profile-management/tasks.md` and verify UC-03 basic flow and every alternative A1–A9 explicitly.
- [X] T047 Update `docs/api/openapi.yaml` and `specs/004-profile-management/implementation.md` so the published profile response describes `Student.user_id` as the student number only for student records and the password contract states the UC-03 six-character minimum; verify documented status/error bodies and the 10 MB boundary match runtime behavior.

## Dependencies and execution order for Phase 7–11

- T036–T037 establish the approved source rules and precede dependent story changes. T038/T040 and T042/T044 are test-first tasks; each can be prepared in parallel when they touch separate files. T039 depends on T038. T041 depends on T040 and T039. T043 depends on T042. T045 depends on T044. T046–T047 follow the story work.
- US1 is the MVP and is independently testable after T036, T038–T041. US2 is independently testable after T037 and T042–T043. US3 is independently testable after T044–T045 and can proceed separately from US1/US2.
- Parallel examples: write `server/tests/unit/ProfileRepository.test.ts` and `client/src/features/profile/components/ProfilePage.test.tsx` concurrently for US1; write server password boundary tests and client password-validation tests concurrently for US2; write avatar server validation tests and client avatar interaction tests concurrently for US3. Do not edit the same file concurrently.

## Implementation strategy for the new work

Complete Setup decisions T036–T037, then US1 and its independent test as the MVP. Complete US2 and US3 as separately verified increments. Finish with the full UC-03 A1–A9 check and contract alignment in T046–T047.

### UC-03 verification for T036–T047 (2026-11-28)

The requester superseded the prior eight-character/unavailable-student-number decisions. `db/schema.sql` is the executable identity reference: `Student.user_id` references `User.user_id` and is displayed read-only only for accounts with a Student row. UC-03 A7 and BR-ACC-09 set the new-password minimum at six Unicode characters. `docs/api/openapi.yaml`, the feature spec/plan, implementation notes, server, client, and tests now agree.

| Flow | Verified behavior and evidence |
| --- | --- |
| Basic flow | Real-schema `profilePersistence.test.ts` signs in, reads each owner's profile, saves phone values, and rereads them. |
| A1 | `ProfilePage.test.tsx` verifies cancel discards the draft and makes no update. |
| A2 | Password form/service and real-schema tests verify current password, confirmation, salted hash replacement, and no password echo. |
| A3 | Avatar service, UI, and real-schema tests verify JPEG/PNG upload and display. |
| A4 | Real-schema and UI tests verify removal restores the default picture. |
| A5 | Client tests verify invalid phone highlighting and retained draft, including a server rejection. |
| A6 | Route/service and real-schema tests reject protected fields and cross-user writes; repository tests verify read-only Student.user_id display only for Student rows. |
| A7 | Unit/form/real-schema tests verify five characters fail, six Unicode characters pass, wrong current password and confirmation mismatch fail without changing the saved hash. |
| A8 | Server content/size tests and client tests verify unsupported/spoofed or oversized files are rejected without replacing the existing picture. |
| A9 | Real PostgreSQL trigger test simulates an avatar write failure and verifies avatar and phone retention; client retry test verifies a later successful upload. |

Final checks: client Vitest 156/156 across 28 files; server Node tests 95/95 with `PROFILE_TEST_DATABASE_URL` pointing to a disposable PostgreSQL database loaded from `db/schema.sql`, with no skipped tests; both `tsc --noEmit` checks passed; changed client files passed ESLint; OpenAPI YAML parsed successfully and `git diff --check` passed. The checks use locked dependencies and source copies in `/tmp/profile-management-check` because repository `node_modules` is not writable. They do not claim a full browser end-to-end run.

## Phase 12: Convergence

- [X] T048 Use Sharp to fully decode uploaded JPG/PNG files and reject malformed pixel data; store accepted files in the configured persistent directory, validate the generated same-origin URL, and persist only that URL in `User.avatar_url`. Preserve the prior URL/file when a write fails, and add decoder, URL legality, authenticated read, malformed-image, and inclusive 10 MiB boundary regressions per FR-008, US3/AC1, and T044–T045 (partial). **Verified:** Sharp-backed decoder, file storage, URL-only database reference, authenticated same-origin image bridge, rollback cleanup, and coverage are implemented; final results recorded below.

### Convergence implementation verification (2026-11-28)

- Client: Vitest 158/158 across 29 files; TypeScript check passed.
- Server: Node suite 98 passed, 1 disposable PostgreSQL integration test skipped because `PROFILE_TEST_DATABASE_URL` was not set (99 discovered). This includes malformed image/JPEG decode, file storage, URL legality, failure cleanup, overlapping updates, and authenticated image-route tests.
- Server TypeScript check passed. Tests used the existing locked dependency tree and source copies in `/tmp/profile-management-check`; the installed Sharp package already present in the client lock supplied the runtime binary for these checks after adding the same pinned dependency to the server manifest/lock. Network access prevented downloading a separate server `node_modules` tree.
- `User.avatar_url` stores a URL only. Image bytes live under `AVATAR_STORAGE_DIRECTORY` (default `server/data/avatars`); deployments must mount persistent storage there. The same-origin Next.js bridge protects image reads with the backend session.
- This implementation supersedes the earlier PostgreSQL data-URI decisions recorded in T004, T031, and T045; those completed entries remain as historical context.

## Phase 13: Convergence

- [X] T049 Run `server/tests/integration/profilePersistence.test.ts` with `PROFILE_TEST_DATABASE_URL` set to a disposable database loaded from `db/schema.sql` after the URL-only avatar storage change; verify persisted avatar URLs, authenticated file retrieval, compare-and-set replacement, removal, and failure cleanup, fix any failures, and record a non-skipped result per plan: cross-cutting verification, T046, US3/AC4, and FR-010 (partial). **Verified:** The integration passed against a disposable PostgreSQL 18 cluster loaded from `db/schema.sql`; the full server suite passed 99/99 with no skips.

### T049 verification details (2026-11-28)

- Created a disposable PostgreSQL cluster under `/tmp`, loaded `db/schema.sql` (which creates and connects to `myHCMUS`), and ran `profilePersistence.test.ts` with that database URL; it passed without skipping.
- The integration verified persisted avatar URL references, authenticated image retrieval, replacement/removal, and file cleanup/preservation after a trigger-simulated database write failure.
- Ran the full server suite against the same disposable database: 99/99 passed, no skipped tests. The temporary cluster and its files were stopped/removed after the run.
