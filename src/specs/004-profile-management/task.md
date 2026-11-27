# Tasks: Profile Management

**Input**: [spec.md](spec.md), [plan.md](plan.md), and UC-03 in `docs/requirements/use-case-specifications.md`

**Prerequisites**: Team review of `spec.md` and `plan.md`; confirm the current client platform and approved avatar-storage mechanism before implementation.

**Organization**: Tasks are ordered by user story and keep each workflow independently testable. Test work is included to satisfy the project constitution's testing requirements.

**Verification status (2026-11-28)**: The full client and server test suites passed for the current worktree. US1/US2 code and test status is recorded per task below. T002, T004, and T005 remain unresolved; the shared authentication bypass and unapproved phone-number rule prevent final acceptance of US1/US2. US3 remains deferred and unverified.

## Phase 1: Foundation and contract verification

**Purpose**: Confirm existing capabilities and decisions that profile work depends on.

- [x] T001 Inspect the current-user, profile, and password-change flows in the client and server; record which UC-03 behaviors exist so they are reused rather than duplicated. **Verified:** the client calls `GET/PATCH /api/v1/profile` and `PATCH /api/v1/profile/password`; server routes, controllers, services, and repositories implement these operations. The shared access-token middleware still contains a hard-coded bearer-token bypass; see T006/T008/T013.
- [ ] T002 Confirm the authenticated identity fields and profile data available from `src/db/schema.sql`; identify the approved source for student number without making protected identity fields user-editable. **Blocked:** the current schema provides `Student.faculty_id` but has no student-number field. An authoritative student-number source must be identified; do not infer it from `user_id`.
- [x] T003 Confirm existing phone-number validation and error-response conventions. **Verified:** no established phone format was found; registration checks nonempty values and exact duplicates. The feature currently enforces `0` plus 9 digits or `+84` plus 9 digits, permits `null`, and checks equivalent-format duplicates. This format is not specified in `spec.md`/`openapi.yaml`; obtain product/team approval before treating T009 as accepted.
- [ ] T004 Confirm the approved avatar storage mechanism and verify it supports JPG/PNG validation, the 10 MB limit, replacement, and removal. Do not add a storage provider or dependency without approval. **Blocked:** no approved avatar storage mechanism has been selected, and no existing implementation was found. The API contract specifies JPG/PNG files up to 10 MB inclusive, matching UC-03, but does not select a provider or establish that these behaviors are implemented. Storage approval is required before implementation.
- [ ] T005 Resolve the frontend platform mismatch between the constitution and the current Next.js client with the team before frontend implementation. **Blocked:** the constitution specifies Flutter, while the team contract and current client use Next.js/React. Team resolution is required before frontend implementation.

## Phase 2: User Story 1 - View and update my profile (Priority: P1)

**Goal**: Authenticated users view only their own profile, update their phone number, and cannot edit protected identity fields.

**Independent Test**: Read the signed-in user's profile, save a valid phone number, reload to verify persistence, then verify invalid and cross-user changes are rejected without altering saved data.

### Tests

- [ ] T006 [P] [US1] Add server tests for self-only profile reads and updates, including unauthenticated access, cross-user target attempts, invalid phone input, and protected identity-field tampering. **Partially verified:** route/service tests pass for missing/invalid JWTs, ownership, field protection, and rejected updates. **Blocked:** `ValidatorMiddleware.validateAccessToken` accepts the hard-coded bearer token `MIKU_MIKU_OO_EE_OO` and assigns `sub: 'dev'`, so unauthenticated access is not fully denied. Fixing this shared middleware is broader than Profile Management and remains outstanding.
- [x] T007 [P] [US1] Add client tests for profile loading, valid phone updates, validation feedback, failure handling, and discarding edits on cancel. **Verified:** covered by `ProfilePage.test.tsx`; full client suite passed (127 tests).

### Implementation

- [ ] T008 [US1] Add or extend the authenticated profile read/update API using the existing route, controller, service, and repository patterns; derive the target user only from verified request identity. **Implemented and tested, but blocked from acceptance:** routes derive the user ID from verified JWT `sub` and ownership tests pass; the shared hard-coded bearer bypass described in T006 means the authentication requirement is not satisfied for all requests. Student number remains unavailable in the schema (T002) and is returned as `null`, not fabricated.
- [ ] T009 [US1] Limit profile writes to the permitted phone field and apply the approved phone validation before persistence. **Implemented and tested, but blocked from acceptance:** only phone-number changes are persisted and rejected requests leave data unchanged. The current domestic/`+84` rule is not established by existing project convention or specified in the contract; approval is needed before treating this rule as final.
- [ ] T010 [US1] Build the profile view and edit flow under the approved client feature structure; render available academic identity fields read-only and preserve entered values when validation fails. **Implemented and client-tested; pending T005:** current code uses Next.js, while the constitution names Flutter and team resolution is not recorded.

## Phase 3: User Story 2 - Change my password (Priority: P1)

**Goal**: A user changes their own password only after satisfying UC-03's current-password, minimum-length, and confirmation requirements.

**Independent Test**: A correct current password and valid matching replacement succeeds; incorrect current password, short replacement, or mismatch fails without changing the saved password.

### Tests

- [x] T011 [P] [US2] Add or extend server tests for current-password verification, the eight-character minimum, secure hashing, and unchanged credentials after rejection. Password confirmation is validated by the frontend and is not sent to the server. **Verified:** focused service/route tests pass, including bcrypt replacement and message-only responses; full server suite passed (87 tests).
- [x] T012 [P] [US2] Add client tests for current/new password validation, eight-character minimum, matching confirmation, success feedback, and error handling without echoing password values. **Verified:** covered by `PasswordChangeForm.test.tsx`; full client suite passed (127 tests).

### Implementation

- [ ] T013 [US2] Implement the authenticated `PATCH /profile/password` endpoint and integrate the existing client auth service with this official path; do not add a parallel password mechanism. **Implemented and contract-tested, but blocked from acceptance:** the official path and request/response match the contract; the shared hard-coded bearer bypass described in T006 prevents verifying that authentication is mandatory for every request.
- [x] T014 [US2] Enforce current-password verification and the eight-character minimum in the server business layer; retain secure hashing and message-only success responses. Password confirmation is frontend-only and is not sent to the server. **Verified:** focused tests cover incorrect/short-password rejection without modification, bcrypt hash replacement, old-password invalidation, and response/log secrecy.
- [ ] T015 [US2] Add or integrate the password-change form in the approved profile experience; clear sensitive form values after completion or rejection. **Implemented and client-tested; pending T005:** current code is in the Next.js client, while the constitution specifies Flutter and team resolution is not recorded.

## Phase 4: User Story 3 - Set or remove my profile picture (Priority: P2) (Deferred pending storage approval)

**Goal**: Users can set a valid image or remove it to restore the default picture, without losing the previous picture on failure.

**Independent Test**: A valid JPG/PNG at or below 10 MB is displayed after reload; unsupported, oversized, or failed uploads preserve the current image; removal restores the default.

### Tests

- [ ] T016 [P] [US3] Add server tests for JPG/PNG acceptance, exact 10 MB boundary, oversized and unsupported files, cross-user upload attempts, removal, and failed-storage preservation. **Blocked:** T004 must approve a storage mechanism before upload and removal behavior can be implemented and tested.
- [ ] T017 [P] [US3] Add client tests for picture preview, upload rejection feedback, removal confirmation/behavior, and restored default display. **Blocked:** T005 must resolve the frontend platform; T004 must confirm the upload contract and default-picture behavior.

### Implementation

- [ ] T018 [US3] Implement authenticated picture upload and removal using the storage approach approved in T004; validate content type and size at the server boundary. **Blocked:** T004 has not identified an approved storage mechanism.
- [ ] T019 [US3] Persist the picture reference only after successful storage; retain the existing reference on upload or persistence failure. **Blocked:** T004 must approve storage before the persistence flow can be implemented.
- [ ] T020 [US3] Integrate upload, removal, and default-picture states into the approved profile UI with explicit operation feedback. **Blocked:** T004 and T005 must resolve storage/default-picture behavior and frontend platform.

**US3 status**: Deferred and blocked on T004 storage approval. Avatar requirements remain in `spec.md` and `docs/api/openapi.yaml`; the OpenAPI contract is documentation only and does not select a storage provider or prove runtime behavior. Avatar upload, removal, JPG/PNG content validation, the 10 MB boundary, and failure preservation have not been implemented or verified by tests. Keep T016-T020 unchecked, and do not report avatar acceptance criteria as complete until implementation and focused verification are performed.

## Phase 5: Verification

- [x] T021 Run the full client and server test suites for the currently implemented US1/US2 work and fix regressions caused by the feature. **Verified:** client 127/127 tests passed; server 87/87 tests passed. US3 was not implemented or verified by these runs.
- [ ] T022 Verify the acceptance scenarios in `spec.md`, including authorization, protected fields, invalid inputs, image boundaries, and failure preservation. **Pending:** US1 authentication is blocked by the shared token bypass (T006), the phone format needs approval (T009), and avatar boundaries/removal are unimplemented and unverified (T004, T016-T020). US2 scenarios are covered by passing tests.
- [ ] T023 Update directly related API or user documentation if implementation changes or adds profile behavior not already documented. **Pending:** the password contract is consistent, but the implemented phone-number format is not in the API contract and requires approval before it can be documented as authoritative.

## Dependencies

- T006-T010 depend on T001-T003.
- T007, T010, T012, T015, T017, and T020 depend on T005.
- T011-T015 depend on T001 and use the resolved password-change contract: `PATCH /profile/password`, an eight-character minimum, frontend-only confirmation, and a message-only success response. The endpoint and client form are implemented; T013/T015 remain pending due authentication and platform blockers.
- T016-T020 depend on T004.
- T021-T023 depend on completion of the user-story implementation tasks.

## Completion

**Overall status: incomplete.** US2 business logic and client/server tests are verified. US1 has implemented code and passing tests, but final acceptance is blocked by the shared hard-coded bearer-token bypass and the unapproved phone-number rule; the student-number source is also unresolved. US3 remains deferred until storage is approved, and none of its upload, removal, format, size-boundary, or failure-preservation criteria have been implemented or verified.
