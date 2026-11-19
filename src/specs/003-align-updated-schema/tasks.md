# Tasks: Align Updated Business Schema

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), and [quickstart.md](quickstart.md)

**Scope**: The only product file to edit is `db/schema.sql`. Keep its broad table sequence and recognizable definitions. Leave the entire `RefreshToken` block byte-for-byte unchanged. Do not create migrations, backend code, test files, or another product artifact.

**Tests**: No test-file tasks were requested. The checkpoints use read-only review and, if an isolated PostgreSQL instance is available, a disposable full-file execution.

## Phase 1: Setup

**Purpose**: Establish the baseline and scope before any SQL edits.

- [x] T001 Inventory `db/schema.sql` against `docs/analysis-and-design/db/business-requirements.md`, recording the existing table order and exact `CREATE TABLE "RefreshToken"` block for later comparison; do not edit either file in this task.

## Phase 2: Foundational

**Purpose**: Align shared reference records before dependent tables.

- [x] T002 Update `db/schema.sql` reference tables: restrict `Role.code` to `student`, `manager`, `administrator`; retain `RolePermission`; add `Department`, `Club`, `Organization`, and `AppealStatus` near current reference tables with non-null keys and documented unique codes where applicable. `AppealStatus` must support Pending Assignment, Pending Review, Under Review, Additional Information Required, Approved, Rejected, and Withdrawn.
- [x] T003 Update `db/schema.sql` scoring references: keep `ScoreCriterion` as stable identity without effective weight, range, or cap; add `ScoringPolicyVersion` linked to one criterion and one semester, with activation time, nonnegative weight, allowed base-point range, and semester cap. Preserve links needed for awards to retain their applied version; document that used-version immutability and policy preview need controlled workflow enforcement.

**Checkpoint**: Shared roles, organizations, statuses, and policy versions exist before story-specific foreign keys.

## Phase 3: User Story 1 - Preserve identity and activity records (Priority: P1) 🎯 MVP

**Goal**: Represent independent duties and activity participation without obsolete single-role, status, or single-attempt assumptions.

**Independent Test**: Trace a user with student and manager duties, one activity with scoped managers and sessions, two historical registration attempts after a terminal first attempt, and valid same-activity attendance. A second active attempt and cross-activity attendance must fail.

- [x] T004 [US1] Update `db/schema.sql` `User` and add `UserRole`, `Student`, `Manager`, and `Administrator` beside it: remove the single-role restriction; include phone number and staff-controlled full name, student number, and faculty; permit independently assigned duties and coexisting profiles. Make `Student.faculty_id` agree with the staff-validated `User.faculty_id` through focused integrity design or explicitly document the transaction boundary if this cannot be guaranteed locally.
- [x] T005 [US1] Add `OrganizationMember` and align the existing `ActivityOrganizer` two-key assignment shape with documented `ActivityManage` in `db/schema.sql`: preserve membership history, permit several assigned managers, and ensure every activity has exactly one owning `Organization` reference. Keep permission and assignment-eligibility enforcement identified as workflow work.
- [x] T006 [US1] Update `db/schema.sql` `Activity` with `organization_id`, `approval_required`, nullable `attendance_rule`, and the five states `draft`, `published`, `ongoing`, `completed`, `cancelled`; retain positive capacity and ordered registration dates. Document publication readiness, valid transitions, semester-contained sessions, and capacity serialization as cross-row or workflow obligations.
- [x] T007 [US1] Add `ActivityFollow` in `db/schema.sql` with one active follow per student/activity, independent of `Registration`; preserve the existing `UserInterest` category relationship.
- [x] T008 [US1] Update `db/schema.sql` `Registration` to retain `attempt_number`, `waitlisted_at`, stable `queue_sequence`, and `confirmed_at`; use `pending_approval`, `confirmed`, `waitlisted`, `rejected`, `cancelled`. Replace global activity/user uniqueness with uniqueness of active attempts only so rejected or cancelled history permits a later attempt; retain the activity/user pairs needed by attendance and appeal foreign keys. Document seat reservation, FIFO promotion, and displacement as transaction obligations.
- [x] T009 [US1] Update `db/schema.sql` `Attendance` to record only `attended` or `absent`, with no row meaning no information; retain the composite foreign keys proving schedule and registration share an activity. Update `Participation` with nullable `verification_reason` while retaining its unique registration link; identify Confirmed-only verification and threshold/manager decision as workflow obligations.
- [x] T010 [US1] Review the edited `db/schema.sql` identity and activity statements against US1 and FR-003–FR-004: verify independent roles, scoped assignments, active-attempt uniqueness, repeat attempts, same-activity attendance, state domains, and existing table order without writing a test file.

**Checkpoint**: US1's schema representation and local constraints are reviewable independently.

## Phase 4: User Story 2 - Preserve requests and score history (Priority: P1)

**Goal**: Represent request revisions and decisions, recognition details, policy-linked awards, and approved score adjustments.

**Independent Test**: Trace one missing-score appeal without a Score FK, one recognition request with detail and evidence, one revised unresolved appeal, one initial award, and one existing-score adjustment. Invalid source combinations and duplicate source/criterion credit must fail.

- [x] T011 [US2] Update `db/schema.sql` `Appeal` with `issue_type`, nullable `assigned_to_user_id`, and withdrawal actor/time; replace old states with `pending_assignment`, `pending_review`, `under_review`, `additional_information_required`, `approved`, `rejected`, `withdrawn`. Permit missing-score corrections with an activity reference and null `score_id`, require score reference for incorrect-score corrections, keep participation corrections tied to the submitter's registration, and make approved/rejected decision fields distinct from withdrawal fields.
- [x] T012 [US2] Update `db/schema.sql` `AppealEvidence` to store a private storage key, PDF/JPEG/PNG MIME type, positive size no greater than 10 MiB, description, and upload time. Add `RecognitionRequestDetail` with title, occurrence time, internal/external flag, volunteering/academic/other category, target semester, and optional proposed criterion; keep this category separate from `ActivityCategory`. Note that at least one evidence file on submission requires workflow enforcement.
- [x] T013 [US2] Add `RequestAssignment` and `RequestRevision` near `Appeal` in `db/schema.sql`, preserving one current eligible assignee and historical assignments and revisions. Include assignment actor/time/end time and revision editor/time/previous/new values; document state transition, routing, actor eligibility, and latest-revision decision checks as workflow obligations.
- [x] T014 [US2] Align `db/schema.sql` `ActivityScore` with `policy_version_id` and nonnegative `base_points`, replacing direct criterion/possibly negative award assumptions. Ensure the advertised version determines the criterion and effective semester through available foreign-key/unique-key relationships, and identify allowed-range comparison as a cross-record rule if not locally enforceable.
- [x] T015 [US2] Update `db/schema.sql` `Recognition` and `TrainingScore` to retain the applied `policy_version_id`, criterion, semester, nonnegative base/weighted/current points, and exactly one Participation or Recognition source. Preserve unique source/criterion credit and linked student ownership; permit an initial missing-score award without a previous score value or `ScoreChange`.
- [x] T016 [US2] Add `ScoreAdjustment` linked uniquely to one `ScoreChange` in `db/schema.sql`; retain non-null old/new values, actor, time, and reason on `ScoreChange`. Record adjustment delta and approval actor/time/reason; document that old/new/current value agreement, single counting, semester cap, and atomic appeal/score/audit effects need a transaction.
- [x] T017 [US2] Review `db/schema.sql` against US2 and FR-005–FR-006: check every appeal type/state, missing-score nullability, request history, recognition detail, evidence metadata, policy provenance, source exclusivity, and adjustment linkage without writing a test file.

**Checkpoint**: US2's request and score history can be traced without a contradictory old rule.

## Phase 5: User Story 3 - Track communications and audit evidence (Priority: P2)

**Goal**: Separate in-app notifications from email delivery, retain general audit history, and preserve backend token storage.

**Independent Test**: Trace an in-app notification, one email delivery with retries and exhaustion, and an audit event. The same notification/channel pair must not create duplicate delivery rows; `RefreshToken` must remain unchanged.

- [x] T018 [US3] Update `db/schema.sql` `Notification` to represent the in-app message with recipient, optional activity/announcement/appeal links, type, message, creation/read time; move email state out of that row. Add `NotificationDelivery` with one record per notification/channel, attempt count, `pending`/`retrying`/`sent`/`exhausted` states, last error, and nullable sent time. Document durable intent creation and external delivery recovery as workflow obligations.
- [x] T019 [US3] Align `db/schema.sql` `AuditLog` with actor, action, affected entity, time, reason, and before/after values; retain `ServiceLink` and `SystemSetting` usability. Document protected access, append-only history, and audit-event creation as workflow obligations rather than claiming row definitions enforce them.
- [x] T020 [US3] Review `db/schema.sql` against US3 and FR-007: verify notification/delivery separation, unique notification/channel delivery, valid delivery states and sent-time consistency, audit attributes, and an unchanged `RefreshToken` block without writing a test file.

**Checkpoint**: US3's communication and audit records are represented; token storage is untouched.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm scope, integrity, and honest validation claims.

- [x] T021 Review all `db/schema.sql` primary keys, foreign keys, unique constraints, non-null values, controlled domains, date order, positive capacity, evidence metadata, score-source exclusivity, and historical delete behavior against FR-008 and the business requirements; fix only gaps in this file and mark non-local rules accurately in SQL comments per FR-009.
- [x] T022 Validate `db/schema.sql` against all three story scenarios and SC-001–SC-005 using [quickstart.md](quickstart.md): check business-entity coverage and broad layout, compare `RefreshToken` bytes with the baseline, and, if a disposable PostgreSQL instance exists, execute the full file on a disposable PostgreSQL instance. Report the actual result without changing that block.

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6.** Every implementation task edits `db/schema.sql` or depends on its current state, so execute tasks sequentially. No `[P]` markers apply.
- **US1** depends on the shared Role, Organization, AppealStatus, and ScoringPolicyVersion references in Phase 2. Its independent review is T010.
- **US2** depends on identity, activity, and registration references from US1. Its independent review is T017.
- **US3** depends on existing User, Activity, Announcement, and Appeal references. Its independent review is T020; sequencing after US2 prevents concurrent edits to the single SQL file.
- **Polish** depends on all three story checkpoints. A reviewed specification is required by Constitution III before implementation begins.

## Parallel Opportunities

None within implementation: all tasks target the same SQL file or inspect its dependent state. Parallel SQL edits would risk conflicting table order, foreign keys, and the preserved `RefreshToken` tail.

## Implementation Strategy

1. Complete shared references, then US1 as the first independently reviewable increment.
2. Add US2 request and score history, then US3 notification and audit records.
3. Finish with whole-document mapping and the scoped validation in quickstart. Keep product edits in `db/schema.sql` only; any backend integration or populated-database migration remains separate work.
