# Tasks: Profile Management

**Input**: [spec.md](spec.md), [plan.md](plan.md), and UC-03 in `docs/requirements/use-case-specifications.md`

**Prerequisites**: Team review of `spec.md` and `plan.md`; confirm the current client platform and approved avatar-storage mechanism before implementation.

**Organization**: Tasks are ordered by user story and keep each workflow independently testable. Test work is included to satisfy the project constitution's testing requirements.

**Investigation status (2026-11-27)**: T001 and T003 are complete based on repository inspection. T002, T004, and T005 are blocked as noted below. No implementation task is complete.

## Phase 1: Foundation and contract verification

**Purpose**: Confirm existing capabilities and decisions that profile work depends on.

- [x] T001 Inspect the authenticated current-user and change-password flows in `src/client/src/features/auth/` and matching `src/server/src/routes/`, controllers, services, and repositories; record which UC-03 behaviors already exist so they are reused rather than duplicated. **Verified:** the client declares `getMe()` and `changePassword()`, but its provider uses a mock service; the server exposes register/login only and has no current-user or password-change endpoint.
- [ ] T002 Confirm the authenticated identity fields and profile data available from `src/db/schema.sql`; identify the approved source for student number without making protected identity fields user-editable. **Blocked:** the current schema provides `Student.faculty_id` but has no student-number field. An authoritative student-number source must be identified; do not infer it from `user_id`.
- [x] T003 Confirm the existing phone-number validation and error-response conventions; document any phone-format rule not already established before implementing validation. **Verified:** no phone-format rule was found. Registration checks for a nonempty number and exact-value duplicates; the profile API contract allows a nullable string without format constraints. The format and nullable/duplicate behavior still need agreement before T009.
- [ ] T004 Confirm the approved avatar storage mechanism and verify it supports JPG/PNG validation, the 10 MB limit, replacement, and removal. Do not add a storage provider or dependency without approval. **Blocked:** no avatar storage provider or implementation was found. The database stores only `avatar_url`; the API contract says 5 MB while UC-03 and the current vision requirement say 10 MB. Approve storage and align the contract before implementation.
- [ ] T005 Resolve the frontend platform mismatch between the constitution and the current Next.js client with the team before frontend implementation. **Blocked:** the constitution specifies Flutter, while the team contract and current client use Next.js/React. Team resolution is required before frontend implementation.

## Phase 2: User Story 1 - View and update my profile (Priority: P1)

**Goal**: Authenticated users view only their own profile, update their phone number, and cannot edit protected identity fields.

**Independent Test**: Read the signed-in user's profile, save a valid phone number, reload to verify persistence, then verify invalid and cross-user changes are rejected without altering saved data.

### Tests

- [ ] T006 [P] [US1] Add server tests for self-only profile reads and updates, including unauthenticated access, cross-user target attempts, invalid phone input, and protected identity-field tampering. **Blocked:** T002 and the phone-format/nullable policy from T003 must be resolved to define the expected profile fields and validation cases.
- [ ] T007 [P] [US1] Add client tests for profile loading, valid phone updates, validation feedback, and discarding edits on cancel. **Blocked:** T005 must resolve the client platform; phone validation behavior also depends on the policy from T003.

### Implementation

- [ ] T008 [US1] Add or extend the authenticated profile read/update API using the existing route, controller, service, and repository patterns; derive the target user only from verified request identity. **Blocked:** confirm the real client/server authentication contract and resolve T002's student-number source before finalizing the profile response.
- [ ] T009 [US1] Limit profile writes to the permitted phone field and apply the established phone validation before persistence. **Blocked:** no established phone-format rule exists; define accepted formats and nullable/duplicate behavior first.
- [ ] T010 [US1] Build the profile view and edit flow under the approved client feature structure; render available academic identity fields read-only and preserve entered values when validation fails. **Blocked:** T005 and T002 require resolution before the client platform and academic fields can be finalized.

## Phase 3: User Story 2 - Change my password (Priority: P1)

**Goal**: A user changes their own password only after satisfying UC-03's current-password, minimum-length, and confirmation requirements.

**Independent Test**: A correct current password and valid matching replacement succeeds; incorrect current password, short replacement, or mismatch fails without changing the saved password.

### Tests

- [ ] T011 [P] [US2] Add or extend server tests for current-password verification, the eight-character minimum, and unchanged credentials after rejection. Password confirmation is validated by the frontend and is not sent to the server.
- [ ] T012 [P] [US2] Add client tests for current/new password validation, eight-character minimum, matching confirmation, success feedback, and error handling without echoing password values. **Blocked:** T005 must resolve the client platform.

### Implementation

- [ ] T013 [US2] Implement the authenticated `PATCH /profile/password` endpoint and integrate the existing client auth service with this official path; do not add a parallel password mechanism.
- [ ] T014 [US2] Enforce current-password verification and the eight-character minimum in the server business layer; retain secure hashing and message-only success responses. Password confirmation is frontend-only and is not sent to the server.
- [ ] T015 [US2] Add or integrate the password-change form in the approved profile experience; clear sensitive form values after completion or rejection. **Blocked:** T005 must resolve the frontend platform.

## Phase 4: User Story 3 - Set or remove my profile picture (Priority: P2)

**Goal**: Users can set a valid image or remove it to restore the default picture, without losing the previous picture on failure.

**Independent Test**: A valid JPG/PNG at or below 10 MB is displayed after reload; unsupported, oversized, or failed uploads preserve the current image; removal restores the default.

### Tests

- [ ] T016 [P] [US3] Add server tests for JPG/PNG acceptance, exact 10 MB boundary, oversized and unsupported files, cross-user upload attempts, removal, and failed-storage preservation. **Blocked:** T004 must approve a storage mechanism and align the 5 MB API contract with the 10 MB requirement.
- [ ] T017 [P] [US3] Add client tests for picture preview, upload rejection feedback, removal confirmation/behavior, and restored default display. **Blocked:** T005 must resolve the frontend platform; T004 must confirm the upload contract and default-picture behavior.

### Implementation

- [ ] T018 [US3] Implement authenticated picture upload and removal using the storage approach approved in T004; validate content type and size at the server boundary. **Blocked:** T004 has not identified an approved storage mechanism or resolved the size-contract mismatch.
- [ ] T019 [US3] Persist the picture reference only after successful storage; retain the existing reference on upload or persistence failure. **Blocked:** T004 must approve storage before the persistence flow can be implemented.
- [ ] T020 [US3] Integrate upload, removal, and default-picture states into the approved profile UI with explicit operation feedback. **Blocked:** T004 and T005 must resolve storage/default-picture behavior and frontend platform.

## Phase 5: Verification

- [ ] T021 Run targeted server and client tests for all three user stories and fix regressions caused by the feature.
- [ ] T022 Verify the acceptance scenarios in `spec.md`, including unauthorized access, protected fields, invalid inputs, image boundaries, and failure preservation.
- [ ] T023 Update directly related API or user documentation if implementation changes or adds profile behavior not already documented.

## Dependencies

- T006-T010 depend on T001-T003.
- T007, T010, T012, T015, T017, and T020 depend on T005.
- T011-T015 depend on T001 and use the resolved password-change contract: `PATCH /profile/password`, an eight-character minimum, frontend-only confirmation, and a message-only success response. T001 verified that the server endpoint still needs implementation.
- T016-T020 depend on T004.
- T021-T023 depend on completion of the user-story implementation tasks.

## Completion

The feature is complete when the reviewed acceptance criteria pass, profile ownership and protected fields are enforced server-side, password values remain protected, avatar failure paths preserve existing data, and relevant automated tests pass.
