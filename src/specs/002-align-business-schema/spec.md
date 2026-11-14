# Feature Specification: Align Business Schema

**Feature Branch**: `feat/db/schema`
**Created**: 2026-11-08
**Status**: Reviewed for implementation (user directed checklist resolution and continuation)
**Input**: User description: "in schema.sql, validate all entities against the business requirements. then add constraints based on the requirements as well"

## User Scenarios & Testing

### User Story 1 - Record activity enrollment and attendance accurately (Priority: P1)

Students and organizers need activities with multiple sessions, registrations, and attendance to remain linked to the correct activity and person.

**Why this priority**: This is the core enrollment record and the prerequisite for later score reporting.

**Independent Test**: Create an activity with sessions, registrations, and attendance; then try duplicate applications and attendance for a different activity.

**Acceptance Scenarios**:

1. **Given** an activity and student, **When** the student applies twice, **Then** the second application is rejected.
2. **Given** a session for one activity and a registration for another, **When** attendance links them, **Then** it is rejected.
3. **Given** an activity or session, **When** its capacity or date order violates the documented boundary, **Then** it is rejected.

### User Story 2 - Preserve participation, appeals, and score history (Priority: P2)

Students need verified participation and recognition scores to have a clear source. Recognition and correction requests retain evidence and decisions; staff retain previous and new values for score changes.

**Why this priority**: These records explain exceptional awards and corrections.

**Independent Test**: Create participation, each request type, recognition, both score-source variants, and a score change; test malformed source and decision combinations.

**Acceptance Scenarios**:

1. **Given** each request type, **When** its required record reference is missing or an incompatible reference is supplied, **Then** it is rejected.
2. **Given** a resolved request, **When** reviewer, response, or review time is absent, **Then** it is rejected.
3. **Given** a score, **When** it has both participation and recognition sources or neither, **Then** it is rejected.
4. **Given** a score change, **When** its previous or new value, actor, time, or reason is absent, **Then** it is rejected.

### User Story 3 - Maintain communication and administration records (Priority: P3)

Organizers and administrators need announcements, notifications, service links, settings, and audit records with complete content and consistent delivery history.

**Why this priority**: These records support communication and oversight once the activity and participation data exists.

**Independent Test**: Create valid records of each type, then try blank required content, unsupported delivery states, and missing send time for a sent notification.

**Acceptance Scenarios**:

1. **Given** an announcement or service link, **When** required content is blank, **Then** the record is rejected.
2. **Given** a sent notification, **When** no send time is provided, **Then** the record is rejected.
3. **Given** an audit or setting record, **When** its required identifiers or value are blank, **Then** the record is rejected.

### Edge Cases

- A recognition for an outside activity has no activity, registration, or score reference at submission.
- A student who also organizes retains personal student permissions through their assigned role.
- A participation-correction appeal for a missing participation row still references the student’s existing registration. When no registration exists, the student submits a recognition request for the activity instead.
- Historical scores remain linked to their original criterion after a policy change.
- Existing installations require a data audit and migration before replacing the current schema.

## Requirements

### Functional Requirements

- **FR-001**: The records MUST cover every entity in the database business requirements: roles, permissions, faculties, categories, semesters, score criteria, users, interests, activities, organizers, sessions, eligibility, activity scores, registrations, attendance, participation, training scores, score changes, appeals, evidence, recognition, announcements, notifications, service links, settings, and audit records.
- **FR-002**: Every required relationship MUST refer to an existing record; every documented unique key MUST reject duplicates.
- **FR-003**: Controlled role codes, activity and registration states, attendance states, and appeal types and states MUST reject unrecognized values.
- **FR-004**: Semester and session periods MUST end after they start; registration windows MUST close after they open; capacity MUST exceed zero; criterion maxima MUST be nonnegative.
- **FR-005**: An attendance result MUST link a session and registration for the same activity; a student MUST have at most one registration per activity; a registration MUST have at most one verified participation record.
- **FR-006**: Each score MUST have exactly one source, participation or recognition, and a student MUST receive at most one score per source and criterion.
- **FR-007**: Each appeal type MUST use only its compatible record references; a completed appeal decision MUST include reviewer, response, and time.
- **FR-008**: Each recognition MUST originate from one appeal; each score change MUST retain old and new values, actor, time, and reason.
- **FR-009**: The feature contract MUST enumerate which protected activity, registration, attendance, score, and appeal actions require role permission, assignment, or record ownership checks, and mark those checks as workflow obligations outside this initial-schema change.
- **FR-010**: The feature contract MUST enumerate the cross-record rules for published activities, capacity, waiting lists, scoring policy, score adjustments, and historical criteria, and identify the follow-on transaction or service work needed to enforce each rule.
- **FR-011**: Appeal evidence MUST be limited to PDF, JPEG, or PNG files of at most 10 MB, with a positive file size.
- **FR-012**: Notification records MUST retain recipient, channel, delivery state, and delivery time. Audit records MUST support actor, time, action, entity, and before and after values. Creation and immutability of audit events for setting changes, score changes, and appeal decisions remain follow-on workflow obligations.

### Data and Rule Definitions

**Entity coverage**: The 25 database-business entities are Role, Permission, RolePermission, Faculty, ActivityCategory, Semester, ScoreCriterion, User, UserInterest, Activity, ActivityOrganizer, ActivitySchedule, ActivityEligibility, ActivityScore, Registration, Attendance, Participation, TrainingScore, ScoreChange, Appeal, AppealEvidence, Recognition, ActivityAnnouncement, Notification, and ServiceLink. SystemSetting and AuditLog are the two product-wide additions. [data-model.md](data-model.md) specifies each entity's required and optional attributes, relationships, and unique keys; FR-001 and FR-002 require those definitions to be complete, including nullable references.

**Controlled values**: Role codes are `student`, `organizer`, `reviewer`, `administrator`; Activity statuses are `draft`, `published`, `cancelled`, `completed`; Registration statuses are `pending`, `approved`, `waitlisted`, `rejected`, `cancelled`; Attendance statuses are `present`, `absent`, `excused`; Appeal types are `recognition`, `participation_correction`, `score_correction`; Appeal statuses are `submitted`, `in_review`, `approved`, `rejected`. Notification channels are `in_app` and `email`; delivery states are `pending`, `sent`, `failed`. The vision's “ongoing” activity presentation is derived from a published activity's session dates; it is not an additional stored status. The detailed database business requirements govern stored entity names and states when the vision uses broader terminology.

**Score values and sources**: ScoreCriterion.max_points is nonnegative. ActivityScore.points and TrainingScore.points_awarded may be positive, zero, or negative; the absolute value of either cannot exceed the criterion maximum. A positive value grants credit and a negative value records a violation deduction. An internal award has one Participation source, no Recognition source, the activity's semester, an advertised activity criterion, and the same sign as the advertised points or zero. A recognition award has one Recognition source, no Participation source, the recognition's target semester and criterion, and nonnegative points. Each source has at most one award per criterion. ScoreChange requires old and new points, actor, time, and a nonblank reason; the old value equals the immediately preceding award and the new value equals the updated award. The score update and history record form one atomic action. The row-local source and uniqueness rules belong to this feature; source validity, maximum comparisons, and atomic updates are catalogued as follow-on workflow rules.

**Participation and ownership**: A verified Participation is a record linked to exactly one approved Registration after all sessions have an Attendance result or an approved correction explains a missing result. A Recognition is approved only when its Appeal is an approved recognition request and its student matches the submitter. A student-owned registration, appeal, score, or evidence record belongs to the user identified by its registration or appeal chain. Role permissions grant staff access only to assigned activities and relevant records. One account has one role; organizer, reviewer, and administrator permission sets cumulatively include the student permissions.

**Appeal references**: Recognition requests have no registration or score reference and may omit the activity reference for outside activities. Participation corrections require an existing registration owned by the submitter and no score reference. Score corrections require an existing score earned by the submitter and no registration reference. A missing participation row does not mean the registration is missing. If no registration exists, the student uses recognition. A resolved appeal has reviewer, nonblank response, and review time; changing a resolution first returns it to in_review.

**Evidence, notification, and audit**: Each evidence item has a parent appeal, nonblank file location, PDF/JPEG/PNG content type, and file size from 1 to 10,485,760 bytes. The file is accessible only to the submitter and authorized review staff; retain evidence with its appeal for three years after resolution, then remove it under the project's data-retention procedure. A sent notification has a send time no earlier than creation; a read time cannot precede creation. Audit entries identify actor, entity, action, time, and before and after values. Setting changes, score adjustments, and appeal decisions each require one append-only audit event after a successful state change. Failed attempts produce a security or error log event, not a business AuditLog record. Row storage is in scope; event generation, immutability controls, and delivery retries are follow-on workflow work.

**Cross-record workflow rules (documented here, implemented later)**: An activity can be published only with at least one organizer and scheduled session; sessions fit the activity's semester. Registration requires a published activity, a verified student number and faculty, an open window, and eligibility. At any committed state, approved registrations cannot exceed capacity. Seat decisions serialize per activity; when a seat opens, the earliest eligible waitlisted registration by registered_at, then registration_id, is promoted once. A cancelled registration cannot become approved. Criteria already used by awards retain code, name, and maximum; policy changes create a new criterion. Score adjustments and audit history are atomic. The [schema contract](contracts/schema-contract.md) assigns these rules to later service and transaction work.

**Verification dependency and migration**: If university identity or faculty verification is unavailable, browsing remains available but registration and appeal submission are deferred until verification succeeds; staff fields may remain null for nonstudents. This feature creates a new database only. A populated installation requires a separate migration with a legacy-row audit, explicit mapping, backup, dry run, and rollback to the last consistent snapshot if any validation or data copy fails. Invalid legacy rows are reported and resolved before cutover; the bootstrap schema is never run over a populated database.

**Acceptance mapping**: FR-001–FR-004 are covered by the reference and activity examples and SC-001–SC-002. FR-005–FR-008 are covered by US1–US2 examples and SC-002. FR-009–FR-010 and the workflow portion of FR-012 are covered by the rule catalogue and SC-004. FR-011 and the row-local portion of FR-012 are covered by US2–US3 examples and SC-002. SC-003 adds a reviewer assessment across all categories.

### Key Entities

- **Reference and access**: Role, Permission, RolePermission, Faculty, ActivityCategory, Semester, ScoreCriterion, User, UserInterest.
- **Activity and participation**: Activity, ActivityOrganizer, ActivitySchedule, ActivityEligibility, ActivityScore, Registration, Attendance, Participation, TrainingScore, ScoreChange.
- **Requests and communications**: Appeal, AppealEvidence, Recognition, ActivityAnnouncement, Notification, ServiceLink, SystemSetting, AuditLog.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 27 named entities can store at least one valid example record with its required relationships; examples include present and absent optional references wherever an entity has optional relationships.
- **SC-002**: 100% of explicit invalid-value, duplicate, date-order, source-combination, evidence-size, and delivery-state categories in the database business requirements and product vision are rejected in a repeatable verification set.
- **SC-003**: A peer reviewer classifies 20 mixed valid and invalid sample records against the documented constraints and identifies the expected rejection reason for 100% of invalid cases; the sample and answer key are prepared before review.
- **SC-004**: 100% of cross-record rules in the database business requirements are listed with their enforcement boundary and a named follow-on service or migration work item.

## Scope Boundary

This feature covers the initial data model, record-level constraints, direct relationships, and a complete contract for deferred cross-record rules. It does not deliver registration admission, authorization, waitlist promotion, score calculation, audit-event generation, or a migration for populated installations. Those remain product requirements for follow-on implementation.

## Assumptions

- `docs/analysis-and-design/db/business-requirements.md` is the detailed source for entity names, cardinalities, and explicit constraints; `docs/requirements/vision-document.md` supplies product context.
- This is an initial-schema alignment. Existing deployments require a migration and data audit before applying the new design.
- Rules involving permissions, counts across rows, published readiness, score provenance, and atomic history require workflow-level or transaction-level enforcement beyond simple row constraints.
- The three-year appeal-evidence retention period is a project default aligned with the vision’s minimum three-year activity history; product and privacy review can revise this before service implementation.
