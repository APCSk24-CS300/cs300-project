---
description: "Implementation tasks for core schema constraint test alignment"
---

# Tasks: Core Schema Constraint Test Alignment

**Input**: Design documents from `specs/005-core-constraint-test/`

**Prerequisites**: `plan.md` and `spec.md`; review the specification and plan before implementation per Constitution III.

**Tests**: The deliverable is the SQL regression suite in `db/schema_constraints_test.sql`; no application test framework or dependency is introduced.

**Organization**: Tasks follow the single P1 user story, with prerequisite inventory and fixture work before invalid-case coverage and disposable verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel on separate files with no incomplete-task dependency.
- **[Story]**: User story label for story-phase tasks.
- Every task includes its target file path.

## Phase 1: Setup

**Purpose**: Establish a current-schema inventory for the constraint suite.

- [X] T001 Replace the fixed 27-table assertion in `db/schema_constraints_test.sql` with a table-name set comparison covering the current 45 tables listed in `specs/005-core-constraint-test/data-model.md`; fail on missing or unexpected tables and keep the expected list independent of a total-only count.

## Phase 2: Foundational — Current Identity and Reference Fixtures

**Purpose**: Build parent rows and account fixtures that match the current schema before dependent story fixtures.

- [X] T002 Replace obsolete role/account fixtures in `db/schema_constraints_test.sql` with current role codes `student`, `manager`, and `administrator`; insert `User` rows before `UserRole` grants; create matching `Student`, `Manager`, and `Administrator` profile rows; ensure `Student.user_id` references `User.user_id`, `Student.faculty_id` references `Faculty.faculty_id`, and `Student.enrollment_year > 0`; remove references to `User.role_id`, `User.student_number`, and `User.faculty_id`.
- [X] T003 Add valid parent/reference fixtures in `db/schema_constraints_test.sql` for Permission, RolePermission, Faculty, Major, Department, Club, Organization, ActivityCategory, AppealStatus, Semester, ScoreCriterion, and ScoringPolicyVersion, respecting their current primary/foreign keys, unique codes/names, nonblank values, and declared date/score checks.

## Phase 3: User Story 1 — Verify the Current Database Design (Priority: P1) 🎯 MVP

**Goal**: The core constraint suite accepts valid fixtures for the current model and rejects invalid rows for current schema constraints.

**Independent Test**: Load `db/schema.sql` in an empty disposable PostgreSQL 18 instance, run `db/schema_constraints_test.sql` with `ON_ERROR_STOP=1`, and confirm the named table inventory matches, all valid rows insert, every invalid case reports its expected SQLSTATE, and the suite reaches rollback without leaving fixture records.

### Valid fixture coverage

- [X] T004 [US1] Add valid user-scope and activity fixtures in `db/schema_constraints_test.sql` for OrganizationMember, UserInterest, Activity, ActivityManage, ActivityFollow, ActivitySchedule, ActivityEligibility, ActivityScore, Registration, Attendance, and Participation; use current role/profile references, allowed statuses, positive attempt/capacity values, ordered registration/session dates, and matching activity IDs in Attendance's composite references.
- [X] T005 [US1] Add valid request and score fixtures in `db/schema_constraints_test.sql` for Appeal, RequestAssignment, RequestRevision, RecognitionRequestDetail, AppealEvidence, Recognition, TrainingScore, ScoreChange, and ScoreAdjustment; satisfy the appeal-type/status field combinations, valid evidence MIME and `size_bytes BETWEEN 1 AND 10485760`, exactly one TrainingScore source, matching policy references, and linked score-change/adjustment keys.
- [X] T006 [US1] Add valid communication and administration fixtures in `db/schema_constraints_test.sql` for ActivityAnnouncement, Notification, NotificationDelivery, ServiceLink, SystemSetting, AuditLog, and RefreshToken; satisfy current reference, nonblank, unique-delivery, email-state, timestamp, and token-key constraints without changing `db/schema.sql`.

### Invalid constraint cases

- [X] T007 [US1] Replace stale reference and identity rejection cases in `db/schema_constraints_test.sql` with current invalid role code, duplicate key/code, missing parent, duplicate User email, duplicate UserRole/RolePermission pair, NULL or blank required values, invalid Student faculty, and nonpositive enrollment-year cases; assert the exact expected SQLSTATE.
- [X] T008 [US1] Add current activity and enrollment rejection cases in `db/schema_constraints_test.sql` for missing references, nonpositive capacity or attempt number, reversed registration/session dates, invalid activity or registration status, duplicate active membership/assignment/registration, invalid waitlist/confirmation timestamps, and Attendance schedule/registration rows from different activities; assert the exact expected SQLSTATE.
- [X] T009 [US1] Add current request, scoring, evidence, notification, and administration rejection cases in `db/schema_constraints_test.sql` for incompatible Appeal references or resolution fields, invalid evidence type/size, invalid Recognition policy links, neither/both TrainingScore sources, negative score values, duplicate source/criterion or adjustment links, invalid NotificationDelivery state/timestamp combinations, and blank required ServiceLink/SystemSetting/AuditLog values; assert the exact expected SQLSTATE.

## Phase 4: Polish and Cross-Cutting Verification

**Purpose**: Confirm safe repeatable execution and record actual validation.

- [X] T010 Run the disposable PostgreSQL 18 procedure in `specs/005-core-constraint-test/quickstart.md`; verify `db/schema.sql` loads, all 45 expected table names are present, `db/schema_constraints_test.sql` reaches its completion assertion and rollback, and no fixture rows remain; record the actual result and any environment limitation in `specs/005-core-constraint-test/quickstart.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 establishes the current table-name inventory.
- **Foundational (Phase 2)**: T002–T003 depend on T001 and establish referenced rows.
- **User Story 1 (Phase 3)**: T004–T009 depend on T001–T003 and build fixtures in foreign-key dependency order.
- **Polish (Phase 4)**: T010 depends on all preceding tasks.

### User Story Dependencies

- **US1 (P1)**: Independent user outcome; requires only the table inventory and parent fixtures in Phases 1–2.

### Parallel Opportunities

- No SQL tasks are marked parallel: all fixture and invalid-case tasks edit the same `db/schema_constraints_test.sql` file and depend on shared transaction fixtures.
- T010 is sequential because it validates the integrated final script and records its result.

## Implementation Strategy

1. Establish the explicit table-name inventory from the current DDL.
2. Replace the obsolete identity assumptions and create valid parent fixtures.
3. Add valid rows for all current schema entities, then replace the outdated invalid cases by entity group.
4. Run the complete suite only against a disposable database following `quickstart.md`; update the recorded result.

The MVP is the complete US1 constraint suite: current table coverage, representative valid rows, and expected rejection cases for declared database constraints. No schema or application behavior is changed.

## Phase 5: Convergence

- [X] T011 Review the extra ignore patterns (`dist/**`, `coverage/**`, `node_modules/**`, `**/*.min.js`) in `client/eslint.config.mjs`; remove them or record an explicit scope justification so this feature remains limited to `db/schema_constraints_test.sql` per plan: Project Structure (unrequested). **Verified:** Retained these tooling-only ignores because Speckit Implement's project-setup check explicitly requires ESLint ignores for `node_modules/`, `dist/`, `build/`, `coverage/`, and minified JavaScript. They do not change schema or application behavior.
