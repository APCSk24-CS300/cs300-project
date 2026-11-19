# Feature Specification: Align Updated Business Schema

**Feature Branch**: `feat/db/schema`

**Created**: 2026-11-13

**Status**: Reviewed for implementation — user directed `$speckit-implement` after specification and planning

**Input**: Align the current `db/schema.sql` with `docs/analysis-and-design/db/business-requirements.md`. Change that SQL file only during implementation, preserve its overall table layout and design where possible, correct gaps and pitfalls, and leave the backend `RefreshToken` table intact.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve identity and activity records (Priority: P1)

A database reviewer can trace independent user duties, scoped activity management, follows, activity life cycle, registration attempts, attendance, and participation from the updated requirements to the schema without finding obsolete single-role or single-attempt assumptions.

**Why this priority**: These records form the core activity and eligibility flow.

**Independent Test**: Inspect the schema and representative valid and invalid records for role combinations, activity ownership, follows, state values, repeat attempts, queue ordering, and same-activity attendance.

**Acceptance Scenarios**:

1. **Given** one user with student and manager duties, **when** their assignments are represented, **then** both duties coexist without inherited permissions, and the applicable organization or activity scope is identifiable.
2. **Given** a cancelled or rejected registration, **when** the same student registers again during an open window, **then** the prior attempt remains and the new attempt can be represented while a second active attempt is rejected.
3. **Given** a session and registration from different activities, **when** an attendance row links them, **then** the mismatch is rejected.

### User Story 2 - Preserve requests and score history (Priority: P1)

A student and reviewer can account for a recognition or correction request, its evidence and revisions, its eligible assignee, and any resulting score without losing the original policy version or adjustment history.

**Why this priority**: A missing-score request and a later correction must remain explainable and auditable.

**Independent Test**: Map each request type and state, valid evidence, recognition detail, policy version, initial award, and linked adjustment to the schema; check invalid source combinations and duplicate credit.

**Acceptance Scenarios**:

1. **Given** an appeal about a missing score, **when** the request is stored, **then** it references the activity and student without requiring a nonexistent score row.
2. **Given** a decision on an existing score, **when** an approved adjustment is recorded, **then** one adjustment links one score change and the award retains its applied policy version.
3. **Given** an unresolved request, **when** details or evidence change, **then** the same request retains revision history; Approved, Rejected, and Withdrawn remain terminal.

### User Story 3 - Track communications and audit evidence (Priority: P2)

A reviewer can distinguish an in-app notification from its email delivery state and see an audit record for protected changes, while existing backend refresh-token storage remains untouched.

**Why this priority**: Delivery failures and sensitive changes must be visible without corrupting business records.

**Independent Test**: Inspect notification and delivery relationships, retry state and uniqueness, audit attributes, and an exact before-and-after comparison of the `RefreshToken` block.

**Acceptance Scenarios**:

1. **Given** a notification with failed email attempts, **when** retries are exhausted, **then** a durable delivery record can represent exhaustion and later authorized recovery without a duplicate delivery record.
2. **Given** an audited change, **when** its record is stored, **then** actor, action, affected entity, time, reason, and before/after values can be retained.
3. **Given** the existing `RefreshToken` definition, **when** schema alignment is reviewed, **then** that definition is byte-for-byte unchanged.

### Edge Cases

- A user may be a student and hold multiple staff duties; profile and faculty data must remain consistent.
- An external recognition request can lack an activity reference; an activity-specific request must remain routable.
- A score-correction appeal may concern a missing score, while an incorrect-score appeal references an existing score owned by the submitter.
- A previously missing award has no old score value or ScoreChange; an adjustment of an existing award does.
- The existing `RefreshToken` block is reserved for backend handling and must remain byte-for-byte unchanged; schema execution should be checked without altering it.
- Existing populated installations require a separately reviewed migration; this feature changes the schema definition only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The only product file changed by this feature MUST be `db/schema.sql`. The `RefreshToken` table definition MUST remain byte-for-byte unchanged; no other product file, backend code, migration, or test file is in implementation scope.
- **FR-002**: The schema MUST retain its current broad table sequence and recognizable existing table definitions. Alignment MUST use focused edits and only the additional entities, relationships, and constraints needed by the updated business requirements; it MUST avoid a wholesale rewrite.
- **FR-003**: User duties MUST support independent student, manager, and administrator roles with associated permissions and profiles. Academic identity must include phone and staff-controlled full name, student number, and faculty; student faculty references must agree. Organization membership and assigned activity management MUST support scoped authority without automatic role inheritance.
- **FR-004**: Activities MUST have one owning organization, the documented draft/published/ongoing/completed/cancelled states, an approval requirement, and optional attendance rule. Follows MUST be independent of registrations. Registrations MUST retain historical attempts, permit a new attempt after cancellation or rejection, prevent concurrent active attempts, identify waitlist order, and distinguish Pending Approval and Confirmed seat reservations. Attendance MUST link a registration and session from the same activity and use the documented recorded outcomes.
- **FR-005**: Appeals MUST support the documented types, issue distinction, seven states, optional missing-score reference, current assignment and assignment history, request revisions, evidence, and withdrawal attribution. Recognition submission details MUST be separate from approved recognition outcomes and include the documented classification, category, date, target semester, and proposed criterion. Decision fields MUST agree with approved/rejected versus withdrawn outcomes.
- **FR-006**: Scoring MUST represent stable criteria and semester-effective policy versions, activity base awards, retained applied versions on awards, nonnegative awards, exactly one award source, unique source-and-criterion credit, score changes, and one-to-one linked approved adjustments without double counting. New missing-score awards MUST not require a nonexistent prior value.
- **FR-007**: In-app notifications MUST be distinct from durable email delivery records, with one delivery per notification and channel, attempt count, pending/retrying/sent/exhausted states, and error and sent-time data. Audit records MUST retain actor, action, affected entity, time, reason, and before/after values. Existing service-link and system-setting storage MUST remain usable.
- **FR-008**: Keys, foreign keys, uniqueness, non-null rules, controlled values, date order, positive capacity, evidence type and size, and score-source exclusivity MUST reject invalid records where these are enforceable within the schema file. Historical records named in the business requirements MUST not be cascade-deleted.
- **FR-009**: Cross-row or workflow rules that cannot be reliably enforced by the focused schema change, including role-scope authorization, assignment eligibility, state transitions, seat promotion and capacity serialization, policy previews, atomic approval effects, notification creation, and audit-event generation, MUST be identified accurately in SQL comments as obligations for later workflow or transaction implementation. The schema MUST NOT claim to enforce a rule that it cannot enforce.
- **FR-010**: The `RefreshToken` definition MUST remain outside the alignment edits. Validation MUST compare its bytes with the captured baseline and report the actual full-file execution result on a disposable database without changing the block.

### Key Entities *(include if feature involves data)*

- **Identity and scope**: User, Role, Permission, RolePermission, UserRole, Student, Manager, Administrator, Faculty, Department, Club, Organization, OrganizationMember, ActivityManage, UserInterest.
- **Activity and participation**: ActivityCategory, Activity, ActivitySchedule, ActivityEligibility, ActivityFollow, Registration, Attendance, Participation.
- **Requests and scores**: AppealStatus, Appeal, AppealEvidence, RequestAssignment, RequestRevision, RecognitionRequestDetail, Recognition, Semester, ScoreCriterion, ScoringPolicyVersion, ActivityScore, TrainingScore, ScoreChange, ScoreAdjustment.
- **Communication and administration**: ActivityAnnouncement, Notification, NotificationDelivery, AuditLog, ServiceLink, SystemSetting. `RefreshToken` is a preserved backend table outside this feature's alignment scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every business entity and named relationship in the updated requirements has a traceable schema representation or an explicit, justified workflow-only boundary; no obsolete single-role, old-state, or mandatory-negative-score rule remains active.
- **SC-002**: All documented row-local invalid cases for controlled values, unique active records, incompatible references, date ordering, evidence metadata, and score sources are rejected in representative review cases.
- **SC-003**: A reviewer can trace each of the three user stories and all ten functional requirements to specific schema statements or stated workflow boundaries without an unresolved contradiction.
- **SC-004**: The implementation change set contains one product file, `db/schema.sql`; the broad table layout is preserved and the `RefreshToken` block matches its original bytes exactly.
- **SC-005**: A verification report records full-file execution results on a disposable database and confirms that the `RefreshToken` block matches the captured baseline exactly.

## Assumptions

- `docs/analysis-and-design/db/business-requirements.md` is the governing business source; the older `specs/002-align-business-schema/spec.md` reflects a superseded requirements version.
- This feature updates the initial schema definition. Migration of a populated database and application-service implementation require separate work.
- Simple constraints and relationships belong in the schema; authorization, time-sensitive transitions, multi-row decisions, and external delivery remain workflow obligations unless a focused schema mechanism can enforce them correctly.
- Existing tables may receive targeted columns, constraints, and compatible renames when required, and missing business entities may be added within the existing schema layout. The overall design must remain recognizable.
