# Tasks: Align Business Schema

**Input**: `specs/002-align-business-schema/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/schema-contract.md`
**Tests**: Required by the project constitution for data-integrity rules.
**Organization**: Tasks follow user-story priority and the four entity-group commit boundaries in `plan.md`. All task boxes remain unchecked until completed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Independent file work after its prerequisite phase.
- **[Story]**: User story in `spec.md`.
- Paths are relative to the repository root.

## Phase 1: Setup

**Purpose**: Establish the reviewed-spec and validation baseline.

- [X] T001 Record reviewer approval or required revisions for `specs/002-align-business-schema/spec.md` and `specs/002-align-business-schema/checklists/schema.md` before implementing or committing any entity group.
- [X] T002 Inventory existing uncommitted `db/schema.sql` and `db/schema_constraints_test.sql` against `specs/002-align-business-schema/entity-audit.md`; record unresolved differences in `specs/002-align-business-schema/research.md` while preserving unrelated `.specify/` and `docs/` changes.
- [X] T003 Document reproducible disposable PostgreSQL 18 bootstrap and test commands in `specs/002-align-business-schema/quickstart.md`.

## Phase 2: Foundational — Reference and Access

**Purpose**: Provide parent entities for all stories; first commit group.

- [X] T004 Add valid and invalid cases to `db/schema_constraints_test.sql` for Role codes (`student`, `organizer`, `reviewer`, `administrator`), unique Permission and Faculty codes, unique ActivityCategory names, unique Semester year/term with `starts_at < ends_at`, nonnegative ScoreCriterion `max_points`, unique User email and nullable unique student number, and composite RolePermission and UserInterest keys.
- [X] T005 Define Role, Permission, RolePermission, Faculty, ActivityCategory, Semester, ScoreCriterion, User, and UserInterest in `db/schema.sql` with the fields, required relationships, and constraints in `specs/002-align-business-schema/data-model.md`.
- [X] T006 Load `db/schema.sql` and run reference cases in `db/schema_constraints_test.sql` on a fresh disposable database; update the nine reference/access rows of `specs/002-align-business-schema/entity-audit.md`.
- [X] T007 Stage only reference/access changes in `db/schema.sql`, `db/schema_constraints_test.sql`, and `specs/002-align-business-schema/entity-audit.md`; inspect the staged snapshot, repeat its full schema load and tests, then commit as `schema: align reference and access entities`.

**Checkpoint**: Parent data and access mappings can be created with valid values, and invalid values are rejected.

## Phase 3: User Story 1 — Record Activity Enrollment and Attendance Accurately (Priority: P1) 🎯 MVP

**Goal**: Represent activities, sessions, applications, and same-activity attendance.

**Independent Test**: A valid activity/session/registration/attendance chain loads; duplicate applications, cross-activity attendance, invalid capacity, and reversed periods are rejected.

### Tests for User Story 1

- [X] T008 [US1] Add cases to `db/schema_constraints_test.sql` for Activity category/semester/creator references, `capacity > 0`, registration open before close, ActivitySchedule start before end, unique Registration activity/student pair, and Attendance schedule and registration belonging to the same activity.

### Implementation for User Story 1

- [X] T009 [US1] Define Activity, ActivityOrganizer, ActivitySchedule, ActivityEligibility, ActivityScore, Registration, and Attendance in `db/schema.sql` with the keys, references, statuses, ordered periods, and same-activity attendance rule in `specs/002-align-business-schema/data-model.md`.
- [X] T010 [US1] Load `db/schema.sql` and run US1 cases in `db/schema_constraints_test.sql`; update the seven activity/enrollment rows of `specs/002-align-business-schema/entity-audit.md`.
- [X] T011 [US1] Stage only activity/enrollment changes in `db/schema.sql`, `db/schema_constraints_test.sql`, and `specs/002-align-business-schema/entity-audit.md`; inspect the staged snapshot, repeat its full schema load and tests, then commit as `schema: align activity and enrollment entities`.

**Checkpoint**: US1 is independently testable without score or appeal tables.

## Phase 4: User Story 2 — Preserve Participation, Appeals, and Score History (Priority: P2)

**Goal**: Preserve verified participation, typed appeals, recognition, exclusive score sources, and change history.

**Independent Test**: Both score-source variants and all appeal types accept valid references; malformed combinations, mismatched owners, incomplete decisions, duplicate awards, and invalid evidence are rejected.

### Tests for User Story 2

- [X] T012 [US2] Add cases to `db/schema_constraints_test.sql` for unique Participation registration, Appeal type-specific references and registration owner, resolved reviewer/response/time, unique Recognition appeal and matching student, exactly one TrainingScore source, unique source/criterion pairs, and required ScoreChange old/new values, actor, time, and reason.
- [X] T013 [US2] Add cases to `db/schema_constraints_test.sql` for AppealEvidence PDF/JPEG/PNG types and byte sizes 1 through 10,485,760, including zero, excess, and unsupported-type rejection.

### Implementation for User Story 2

- [X] T014 [US2] Define Participation, Appeal, AppealEvidence, Recognition, TrainingScore, and ScoreChange together in `db/schema.sql`; order creation so Participation and Appeal precede Recognition and TrainingScore, then add the Appeal score reference after TrainingScore exists, with all FR-005–FR-008 and FR-011 constraints from `specs/002-align-business-schema/data-model.md`.
- [X] T015 [US2] Load `db/schema.sql` and run US2 cases in `db/schema_constraints_test.sql`; update all six participation/appeal/score rows of `specs/002-align-business-schema/entity-audit.md`.
- [X] T016 [US2] Stage only the coupled participation/appeal/score changes in `db/schema.sql`, `db/schema_constraints_test.sql`, and `specs/002-align-business-schema/entity-audit.md`; inspect the staged snapshot, repeat its full schema load and tests, then commit as `schema: align participation appeals and scores`.

**Checkpoint**: US2 stores valid source-linked awards and request decisions without a half-defined foreign-key cycle.

## Phase 5: User Story 3 — Maintain Communication and Administration Records (Priority: P3)

**Goal**: Complete announcements, notification delivery, service links, settings, and audit records.

**Independent Test**: Valid communication and administration records load; blank required fields, unsupported delivery states, missing send times, and invalid references are rejected.

### Tests for User Story 3

- [X] T017 [US3] Add cases to `db/schema_constraints_test.sql` for nonblank ActivityAnnouncement and ServiceLink values, Notification channel/status/timestamp combinations, SystemSetting key/value, and AuditLog entity/action identifiers.

### Implementation for User Story 3

- [X] T018 [US3] Define ActivityAnnouncement, Notification, ServiceLink, SystemSetting, and AuditLog in `db/schema.sql` with required references, nonblank fields, delivery-state checks, timestamp order, and audit fields in `specs/002-align-business-schema/data-model.md`.
- [X] T019 [US3] Load `db/schema.sql` and run US3 cases in `db/schema_constraints_test.sql`; update the five communication/administration rows of `specs/002-align-business-schema/entity-audit.md`.
- [X] T020 [US3] Stage only communication/administration changes in `db/schema.sql`, `db/schema_constraints_test.sql`, and `specs/002-align-business-schema/entity-audit.md`; inspect the staged snapshot, repeat its full schema load and tests, then commit as `schema: align communication and audit entities`.

**Checkpoint**: All 27 entities have valid-record coverage and documented row-level rules.

## Phase 6: Polish and Cross-Cutting Review

- [X] T021 [P] Enumerate protected actions and their role, assignment, and ownership checks in `specs/002-align-business-schema/contracts/schema-contract.md`; label authorization as follow-on workflow work rather than a property of the bootstrap schema.
- [X] T022 [P] Enumerate published readiness, concurrent capacity, waitlist ordering, score provenance, criterion immutability, atomic ScoreChange history, and audit-event generation with enforcement boundary and follow-on owner in `specs/002-align-business-schema/entity-audit.md`.
- [X] T023 Add at least one valid fixture for each of the 27 entities and a 20-case mixed valid/invalid review set with expected rejection reasons to `db/schema_constraints_test.sql`; record the reviewer assessment procedure in `specs/002-align-business-schema/quickstart.md`.
- [X] T024 Document legacy entity mapping, data audit, rollback expectations, and bootstrap restrictions for populated installations in `specs/002-align-business-schema/research.md` and `specs/002-align-business-schema/quickstart.md`.
- [X] T025 Reconcile all 27 entities and every explicit invalid-case category in `specs/002-align-business-schema/entity-audit.md` against `db/schema.sql` and `db/schema_constraints_test.sql`; record unresolved source conflicts.
- [X] T026 Run the full `db/schema_constraints_test.sql` suite against a fresh disposable PostgreSQL 18 database, check `git diff --check`, and record results in `specs/002-align-business-schema/quickstart.md`.
- [X] T027 Stage only final changes in `specs/002-align-business-schema/contracts/schema-contract.md`, `specs/002-align-business-schema/entity-audit.md`, `specs/002-align-business-schema/research.md`, `specs/002-align-business-schema/quickstart.md`, and `db/schema_constraints_test.sql`; inspect the staged diff and commit as `docs: finalize schema validation guidance`.

## Dependencies & Execution Order

- T001 is a constitution gate before any entity implementation or commit. T002–T003 establish the current-worktree and test baseline.
- Foundational T004–T007 precede every story because all stories reference users and reference data.
- US1 T008–T011 provides activities and registrations. US2 T012–T016 depends on US1 and keeps its mutually referencing score and appeal entities in one commit. US3 T017–T020 depends on foundational users and US1 activities.
- T021 and T022 are parallel: they edit different files and both feed T025. T023–T026 provide complete success-criterion coverage before T027.

## Parallel Execution Examples

- **US1**: Review the activity rules in `specs/002-align-business-schema/data-model.md` while preparing T008; merge the review before T009. SQL edits remain sequential because T008–T011 share files.
- **US2**: T012 and T013 cover separate cases but share `db/schema_constraints_test.sql`; prepare separate patches and integrate them before T014. SQL edits and the group commit remain sequential.
- **US3**: Review Notification and AuditLog rules in `specs/002-align-business-schema/data-model.md` while preparing T017; integrate before T018.
- **Cross-cutting**: T021 and T022 can run in parallel because they target different documents.

## Implementation Strategy

1. Complete specification review, inventory existing uncommitted work, and establish disposable validation.
2. Complete the reference/access group and commit it.
3. Deliver US1 as the independently testable MVP and commit its activity/enrollment group.
4. Complete US2's coupled participation/appeal/scoring group and commit it after the full snapshot loads.
5. Complete US3's communication/administration group and commit it.
6. Finish complete fixture coverage, the deferred-rule contract, migration guidance, and final verification; commit only final cross-cutting changes.

## Notes

- Existing `db/schema.sql` and `db/schema_constraints_test.sql` changes span several groups. Accurate staged snapshots must be validated before each commit; task boxes do not mark existing uncommitted work complete.
- `db/schema.sql` is a new-database bootstrap. Populated installations require a separately reviewed migration.
