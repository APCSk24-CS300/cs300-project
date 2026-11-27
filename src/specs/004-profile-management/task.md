# Tasks: Profile Management

**Input**: [spec.md](spec.md), [plan.md](plan.md), and UC-03 in `docs/requirements/use-case-specifications.md`

**Prerequisites**: Team review of `spec.md` and `plan.md`; confirm the current client platform and approved avatar-storage mechanism before implementation.

**Organization**: Tasks are ordered by user story and keep each workflow independently testable. Test work is included to satisfy the project constitution's testing requirements.

## Phase 1: Foundation and contract verification

**Purpose**: Confirm existing capabilities and decisions that profile work depends on.

- [ ] T001 Inspect the authenticated current-user and change-password flows in `src/client/src/features/auth/` and matching `src/server/src/routes/`, controllers, services, and repositories; record which UC-03 behaviors already exist so they are reused rather than duplicated.
- [ ] T002 Confirm the authenticated identity fields and profile data available from `src/db/schema.sql`; identify the approved source for student number without making protected identity fields user-editable.
- [ ] T003 Confirm the existing phone-number validation and error-response conventions; document any phone-format rule not already established before implementing validation.
- [ ] T004 Confirm the approved avatar storage mechanism and verify it supports JPG/PNG validation, the 10 MB limit, replacement, and removal. Do not add a storage provider or dependency without approval.
- [ ] T005 Resolve the frontend platform mismatch between the constitution and the current Next.js client with the team before frontend implementation.

## Phase 2: User Story 1 - View and update my profile (Priority: P1)

**Goal**: Authenticated users view only their own profile, update their phone number, and cannot edit protected identity fields.

**Independent Test**: Read the signed-in user's profile, save a valid phone number, reload to verify persistence, then verify invalid and cross-user changes are rejected without altering saved data.

### Tests

- [ ] T006 [P] [US1] Add server tests for self-only profile reads and updates, including unauthenticated access, cross-user target attempts, invalid phone input, and protected identity-field tampering.
- [ ] T007 [P] [US1] Add client tests for profile loading, valid phone updates, validation feedback, and discarding edits on cancel.

### Implementation

- [ ] T008 [US1] Add or extend the authenticated profile read/update API using the existing route, controller, service, and repository patterns; derive the target user only from verified request identity.
- [ ] T009 [US1] Limit profile writes to the permitted phone field and apply the established phone validation before persistence.
- [ ] T010 [US1] Build the profile view and edit flow under the approved client feature structure; render available academic identity fields read-only and preserve entered values when validation fails.

## Phase 3: User Story 2 - Change my password (Priority: P1)

**Goal**: A user changes their own password only after satisfying UC-03's current-password, minimum-length, and confirmation requirements.

**Independent Test**: A correct current password and valid matching replacement succeeds; incorrect current password, short replacement, or mismatch fails without changing the saved password.

### Tests

- [ ] T011 [P] [US2] Add or extend server tests for current-password verification, minimum six-character replacement, confirmation mismatch, and unchanged credentials after rejection.
- [ ] T012 [P] [US2] Add client tests for password-change validation, success feedback, and error handling without echoing password values.

### Implementation

- [ ] T013 [US2] Reuse the existing authenticated password-change endpoint and client service if they meet UC-03; otherwise extend the established auth flow without adding a parallel password mechanism.
- [ ] T014 [US2] Enforce current-password verification, minimum length, and matching confirmation in the server business layer; retain existing secure hashing and response conventions.
- [ ] T015 [US2] Add or integrate the password-change form in the approved profile experience; clear sensitive form values after completion or rejection.

## Phase 4: User Story 3 - Set or remove my profile picture (Priority: P2)

**Goal**: Users can set a valid image or remove it to restore the default picture, without losing the previous picture on failure.

**Independent Test**: A valid JPG/PNG at or below 10 MB is displayed after reload; unsupported, oversized, or failed uploads preserve the current image; removal restores the default.

### Tests

- [ ] T016 [P] [US3] Add server tests for JPG/PNG acceptance, exact 10 MB boundary, oversized and unsupported files, cross-user upload attempts, removal, and failed-storage preservation.
- [ ] T017 [P] [US3] Add client tests for picture preview, upload rejection feedback, removal confirmation/behavior, and restored default display.

### Implementation

- [ ] T018 [US3] Implement authenticated picture upload and removal using the storage approach approved in T004; validate content type and size at the server boundary.
- [ ] T019 [US3] Persist the picture reference only after successful storage; retain the existing reference on upload or persistence failure.
- [ ] T020 [US3] Integrate upload, removal, and default-picture states into the approved profile UI with explicit operation feedback.

## Phase 5: Verification

- [ ] T021 Run targeted server and client tests for all three user stories and fix regressions caused by the feature.
- [ ] T022 Verify the acceptance scenarios in `spec.md`, including unauthorized access, protected fields, invalid inputs, image boundaries, and failure preservation.
- [ ] T023 Update directly related API or user documentation if implementation changes or adds profile behavior not already documented.

## Dependencies

- T006-T010 depend on T001-T003.
- T011-T015 depend on T001 and reuse or extend the existing password-change flow.
- T016-T020 depend on T004.
- T021-T023 depend on completion of the user-story implementation tasks.

## Completion

The feature is complete when the reviewed acceptance criteria pass, profile ownership and protected fields are enforced server-side, password values remain protected, avatar failure paths preserve existing data, and relevant automated tests pass.
