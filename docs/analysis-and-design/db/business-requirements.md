# Business requirements analysis

**Worker:** Quách Thiên Lạc  
**Reviewer(s):** Trần Tôn Minh Kỳ  
**Editor(s):** Quách Thiên Lạc

**Version:** 1.2.0  
**Amendment:** 13/11/2026

---
This document describes the business purpose, actors, data entities, relationships, assumptions, and constraints of myHCMUS. It draws on the [project proposal](../../management/project-proposal.md) and [product survey](../../survey/existing-apps-survey.md).

# Business purpose

myHCMUS helps university students discover extracurricular activities and track participation and training scores in one web platform.  

Students can browse activities, check eligibility and schedules, register or cancel within the permitted period, follow registration updates, and view activities in a personal calendar. They can review scores by semester and criterion, receive reminders, and request recognition or correction when a participation record or score is missing or inaccurate.

Activity managers can create and manage activities, including schedules, locations, participation requirements, capacity, and training-score criteria. They can also publish announcements, track activity statistics, and export reports.   

Administrators can assign user roles and manage access permissions, configure system-wide settings, such as training-score criteria and activity categories, and access reports and statistics on activity organization, registration trends, and training-score distribution.  

An account's independently assigned duties and resource assignments control access to each workflow, while its profile holds the personal and academic information needed for that work.

The core record links **activity → registration → attendance → verified participation → training score**. Appeals and score-change history show how a missing or incorrect record was resolved. The platform also links to university services and recommends activities using students' interests, schedules, participation history, and score needs.

# Actors

| Actor | Role |
| --- | --- |
| **Student** | Maintains a profile; discovers activities; checks eligibility; follows or registers for activities; views participation and scores; and submits recognition or correction requests with evidence. A student may also hold separately assigned staff duties. |
| **Activity manager** | Creates and manages activities, including schedules, locations, participation requirements, capacity, and training-score criteria; publishes announcements, tracks activity statistics, and exports reports.    |
| **System administrator** | Configures system-wide settings and training-score criteria, and views reports and statistics covering activities, registrations, and score distribution. |

One account may hold student, manager, and administrator duties independently. A student who manages an activity keeps personal student access, but management and review require an active assignment to the relevant unit, activity, or request. Administrator duty alone grants no operational authority.

# Real-world working assumptions

- The choices to allow independent roles, assign exactly one activity owner, reserve seats for Pending Approval, allow a new attempt after rejection or cancellation, prioritize displaced participants, and apply weighted scoring are provisional business policies pending stakeholder review. The constraints below state the proposed behavior.
- One account maps to one identity; student and staff duties can coexist without automatic permission inheritance. An authorized administrator may provision student number and faculty when live university verification is unavailable; both fields must be staff-validated before eligibility-dependent registration or requests.
- Each activity has one owning club, faculty unit, department, or Student Affairs Office unit and may have several assigned managers. Faculty is also a student's academic attribute, not a substitute for every management unit.
- An activity has one target semester; earlier or external work credited in a later semester uses recognition after approval. Cross-semester activity scheduling is outside the current baseline.
- Managers record attendance by session. An activity may publish a verification threshold before its first session; otherwise an assigned manager records a reasoned verification decision. QR and signature procedures are optional, not required.
- Scoring policy versions have effective semesters and activation times. An award retains its applied version; later rule changes do not alter historical awards.
- Recognition covers activities outside registration and earlier activities credited later. Negative scores and violation deductions require a separate approved policy and are not assumed here.
- The services hub stores external university-service links, not external accounts or transactions. Recommendations are advisory. FAQ, exports, calendar views, and chatbot context need no dedicated persistent entity solely for this design.

# Schema design

The schema uses one **User** account with independently assigned **Role** records through **UserRole**. **RolePermission** grants actions; organization membership, activity assignment, request assignment, and student record ownership further limit each action. No role inherits another role's permissions automatically. An inactive account cannot act.

`PK` denotes a primary key, `FK` a foreign key, and `UQ` a unique constraint. IDs are surrogate keys unless an external identifier is explicitly named.

## Reference entities

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Role** | `role_id` (PK), `code` (UQ), `name`, `description` | Controlled duties: `student`, `manager`, `administrator`. Users may hold multiple independent roles; permissions do not accumulate by hierarchy. |
| **Permission** | `permission_id` (PK), `code` (UQ), `description` | Named actions such as `registration.create`, `registration.review`, `activity.manage`, `attendance.record`, `score.submit`, `score.adjust`, `appeal.submit`, `appeal.review`, `criteria.manage`, and `reports.view`. |
| **RolePermission** | `role_id` (FK), `permission_id` (FK) | Composite PK (`role_id`, `permission_id`); defines which actions each role grants. Seeded and maintained by administrators. |
| **UserRole** | `user_id` (FK), `role_id` (FK), `granted_by_user_id` (FK), `granted_at` | Composite PK (`user_id`, `role_id`); roles are assigned independently and changes are audited. |
| **Faculty** | `faculty_id` (PK), `code` (UQ), `name` | Academic unit for students or staff associated with a faculty. |
| **Department** | `department_id` (PK), `code` (UQ), `name` | Administrative unit; ownership and staff scope use `Organization` rather than department alone. |
| **Club** | `club_id` (PK), `code` (UQ), `name` | Non-academic unit for clubs. |
| **Organization** | `organization_id` (PK), `name`, `type`, `is_active` | One owning unit per activity; type identifies club, faculty unit, department, or Student Affairs Office. |
| **OrganizationMember** | `membership_id` (PK), `organization_id` (FK), `user_id` (FK), `responsibility`, `starts_at`, `ends_at` (nullable) | Membership and active management scope; ended rows retain prior assignments. |
| **ActivityCategory** | `category_id` (PK), `name` (UQ), `description` | Activity classification and student interest matching. |
| **AppealStatus** | `appeal_status_id` (PK), `code` (UQ), `name` | Pending Assignment, Pending Review, Under Review, Additional Information Required, Approved, Rejected, Withdrawn. |
| **Semester** | `semester_id` (PK),  `quarter_academic_year`, `starts_at`, `ends_at` |; score reporting period. `starts_at` must precede `ends_at`. |
| **ScoreCriterion** | `criterion_id` (PK), `code` (UQ), `name`, `description`, `is_active` | Stable criterion identity; effective weight, range, cap, and semester belong to `ScoringPolicyVersion`. |
| **ScoringPolicyVersion** | `policy_version_id` (PK), `criterion_id` (FK), `semester_id` (FK), `activation_at`, `weight`, `min_points`, `max_points`, `semester_cap` | Effective semester rule; used versions are immutable and later versions do not change past awards. |

## Users and access

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **User** | `user_id` (PK), `status`, `email` (UQ), `phone_number`, `password_hash`, `full_name`, `student_number` (nullable, UQ), `faculty_id` (nullable FK), `avatar_url` (nullable), `created_at` | One account per identity. Student number and faculty are staff-validated. Users may edit phone, password, and avatar. Full name, student number, and faculty are read-only to the account owner and staff-controlled. Store only password hashes. |
| **Student** | `user_id` (PK, FK), `major_id` (nullable FK), `faculty_id` (FK), `enrollment_year` | Student profile; may coexist with staff profiles when independently assigned. |
| **Manager** | `user_id` (PK, FK), `position_title` (nullable) | Manager profile; operational authority also requires organization, activity, or request assignment. |
| **Administrator** | `user_id` (PK, FK), `office_name` (nullable), `position_title` (nullable) | Administrator profile; does not automatically grant manager duties. |
| **UserInterest** | `user_id` (FK), `category_id` (FK) | Composite PK (`user_id`, `category_id`). Optional preferences for discovery and recommendations. |
| **ActivityFollow** | `user_id` (FK), `activity_id` (FK), `followed_at` | Composite PK (`user_id`, `activity_id`); one active activity follow, independent of Registration. Unfollow removes the active row. |

`Student`, `Manager`, and `Administrator` profiles are optional and may coexist for one `User` when the corresponding role is assigned. Provisioning each profile and its role assignment is atomic. Removing a duty does not remove historical actions or student-owned records. Full name, student number, and faculty are read-only to the account owner; authorized staff changes require an audit reason. The owner may edit phone number, password, and avatar. For a student account, `Student.faculty_id` must equal the staff-validated `User.faculty_id`; authorized staff changes update both values together before any faculty-based eligibility check.

## Activities and participation

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Activity** | `activity_id` (PK), `organization_id` (FK), `title`, `description`, `eligibility_notes` (nullable), `category_id` (FK), `semester_id` (FK), `capacity`, `registration_opens_at`, `registration_closes_at`, `status`, `approval_required`, `attendance_rule` (nullable), `created_by_user_id` (FK), `created_at` | Exactly one owning organization. States: draft, published, ongoing, completed, cancelled. An attendance threshold, if used, is published with the activity before its first session. |
| **ActivityManage** | `activity_id` (FK), `user_id` (FK) | Composite PK (`activity_id`, `user_id`) for event managers. An assigned user needs `activity.manage` permission. An activity may have several managers. |
| **ActivitySchedule** | `schedule_id` (PK), `activity_id` (FK), `starts_at`, `ends_at`, `location` | One activity may have several sessions. Start precedes end; these intervals support calendar and conflict checks. |
| **ActivityEligibility** | `activity_id` (FK), `faculty_id` (FK) | Composite PK (`activity_id`, `faculty_id`). If an activity has no rows here, it is open to all faculties; otherwise, only listed faculties are eligible. |
| **ActivityScore** | `activity_id` (FK), `policy_version_id` (FK), `base_points` | Composite PK (`activity_id`, `policy_version_id`); advertised nonnegative base award under an effective scoring rule. |
| **Registration** | `registration_id` (PK), `activity_id` (FK), `user_id` (FK), `attempt_number`, `status`, `registered_at`, `waitlisted_at` (nullable), `queue_sequence` (nullable), `confirmed_at` (nullable), `decided_at` (nullable), `decided_by_user_id` (nullable FK) | Historical attempts are retained. At most one active attempt per activity–student pair. Pending Approval and Confirmed reserve seats; Waitlisted does not. Queue sequence breaks timestamp ties. |
| **Attendance** | `schedule_id` (FK), `registration_id` (FK), `status`, `recorded_by_user_id` (FK), `recorded_at` | Composite PK (`schedule_id`, `registration_id`). No information may be represented by an absent row; recorded outcomes are attended or absent. Both references must belong to one activity. |
| **Participation** | `participation_id` (PK), `registration_id` (FK, UQ), `verified_by_user_id` (FK), `verified_at`, `verification_reason` (nullable) | One verified outcome for a Confirmed registration; published threshold or reasoned manager decision governs verification. |
| **TrainingScore** | `score_id` (PK), `participation_id` (nullable FK), `recognition_id` (nullable FK), `policy_version_id` (FK), `criterion_id` (FK), `semester_id` (FK), `base_points`, `weighted_points`, `points_awarded`, `awarded_at`, `awarded_by_user_id` (FK) | Exactly one source; applied policy version is retained. `points_awarded` is the current value derived from weighted points and approved adjustments. Awards are nonnegative and unique per source and criterion. Missing-score approval may create a row. |
| **ScoreChange** | `change_id` (PK), `score_id` (FK), `appeal_id` (nullable FK), `old_points`, `new_points`, `changed_by_user_id` (FK), `changed_at`, `reason` | Domain history of an approved adjustment; broader sensitive changes also use `AuditLog`. |
| **ScoreAdjustment** | `adjustment_id` (PK), `score_id` (FK), `change_id` (FK, UQ), `appeal_id` (nullable FK), `delta`, `approved_by_user_id` (FK), `approved_at`, `reason` | One approved delta links one ScoreChange; the current score value and semester total count it once. |

## Appeals, updates, and services

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Appeal** | `appeal_id` (PK), `submitted_by_user_id` (FK), `activity_id` (nullable FK), `registration_id` (nullable FK), `score_id` (nullable FK), `type`, `issue_type` (nullable), `description`, `status`, `assigned_to_user_id` (nullable FK), `reviewed_by_user_id` (nullable FK), `response` (nullable), `submitted_at`, `reviewed_at` (nullable), `withdrawn_by_user_id` (nullable FK), `withdrawn_at` (nullable) | Covers recognition, participation correction, and missing or incorrect score correction. The current assignee records routing; `reviewed_by_user_id` records the eligible assignee who made a final decision, including after reassignment. Missing-score appeals have no score FK. |
| **AppealEvidence** | `evidence_id` (PK), `appeal_id` (FK), `storage_key`, `mime_type`, `size_bytes`, `description`, `uploaded_at` | Private PDF/JPG/PNG evidence, at most 10 MB per file. At least one valid file is required on submission; external links alone do not qualify. |
| **RecognitionRequestDetail** | `appeal_id` (PK, FK), `title`, `occurred_at`, `is_internal`, `category`, `target_semester_id` (FK), `proposed_criterion_id` (nullable FK) | Submission details exist before a recognition decision. Submission category is volunteering, academic, or other; it is separate from the catalog `ActivityCategory` assigned to activities. |
| **RequestAssignment** | `assignment_id` (PK), `appeal_id` (FK), `manager_user_id` (FK), `assigned_by_user_id` (FK), `assigned_at`, `ended_at` (nullable) | Current and historical routing; recognition goes to Student Affairs Office, activity appeals to responsible managers. |
| **RequestRevision** | `revision_id` (PK), `appeal_id` (FK), `edited_by_user_id` (FK), `edited_at`, `previous_values`, `new_values` | Same-request edits, evidence changes, and resubmission history. |
| **Recognition** | `recognition_id` (PK), `appeal_id` (FK, UQ), `student_user_id` (FK), `title`, `occurred_at`, `semester_id` (FK), `criterion_id` (FK), `policy_version_id` (FK), `verified_by_user_id` (FK), `verified_at` | Approved outcome only; original submission details remain with `RecognitionRequestDetail`. |
| **ActivityAnnouncement** | `announcement_id` (PK), `activity_id` (FK), `author_user_id` (FK), `title`, `body`, `published_at` | manager updates tied to an activity. |
| **Notification** | `notification_id` (PK), `recipient_user_id` (FK), `activity_id` (nullable FK), `announcement_id` (nullable FK), `appeal_id` (nullable FK), `type`, `message`, `created_at`, `read_at` (nullable) | In-app notice linked to the relevant event; email delivery is tracked separately. |
| **NotificationDelivery** | `delivery_id` (PK), `notification_id` (FK), `channel`, `status`, `attempt_count`, `last_error`, `sent_at` (nullable) | One durable email delivery record per notification and channel; status tracks Pending, Retrying, Sent, or Exhausted. Attempts and recovery do not repeat the business transaction. |
| **AuditLog** | `audit_id` (PK), `actor_user_id` (FK), `action`, `entity_type`, `entity_id`, `occurred_at`, `reason`, `before_values`, `after_values` | Protected append-only history of decisions, request edits, permissions, policy, imports, score creation, and score changes. |
| **ServiceLink** | `service_id` (PK), `name`, `url`, `description`, `display_order`, `is_active` | Administrator-managed links in the university services hub. |

## Relationships and cardinalities

- Each `User` may have `(0, N)` independently assigned `Role` records through `UserRole`; each role may belong to `(0, N)` users.
- Each `User` may have Student, Manager, and Administrator profile rows matching independently assigned duties; each profile belongs to one User.
- Each `RolePermission` links exactly one `Role` `(1, 1)` and exactly one `Permission` `(1, 1)`; each role may grant `(0, N)` permissions, and each permission may be granted by `(0, N)` roles.
- Each student User belongs to at most one academic Faculty; each faculty may have `(0, N)` students. Organization membership is separate.
- Each `UserInterest` links exactly one `User` `(1, 1)` and exactly one `ActivityCategory` `(1, 1)`; each user may select `(0, N)` categories, and each category may be selected by `(0, N)` users.
- Each `ActivityFollow` links one student User and one Activity; each side may have `(0, N)` follows independently of registrations.
- Each `Activity` has exactly one `ActivityCategory` `(1, 1)`; each category may classify `(0, N)` activities.
- Each `Activity` belongs to exactly one `Semester` `(1, 1)`; each semester may contain `(0, N)` activities.
- Each Activity belongs to exactly one Organization; each organization may own `(0, N)` activities and have `(0, N)` active OrganizationMember records.
- Each `Activity` has exactly one creator `User` `(1, 1)`; each user may create `(0, N)` activities.
- Each `ActivityManage` links one activity and one assigned manager; an activity may have several managers, and a manager may manage several activities.
- Each `ActivitySchedule` belongs to exactly one `Activity` `(1, 1)`; each activity may have `(0, N)` scheduled sessions.
- Each `ActivityEligibility` links exactly one `Activity` `(1, 1)` and exactly one `Faculty` `(1, 1)`; each activity may allow `(0, N)` faculties, and each faculty may be allowed for `(0, N)` activities.
- Each `ActivityScore` links one Activity and one effective ScoringPolicyVersion; each activity may advertise `(0, N)` score rules.
- Each `Registration` is one attempt for one Activity and one student User; each pair may have `(0, N)` historical attempts but at most one active attempt.
- Each `Attendance` links exactly one `Registration` `(1, 1)` and exactly one `ActivitySchedule` `(1, 1)`; each registration and each session may have `(0, N)` attendance records. The registration and session must refer to the same activity.
- Each `Participation` belongs to exactly one `Registration` `(1, 1)`; each registration may have `(0, 1)` verified participation record.
- Each `TrainingScore` belongs to exactly one `ScoreCriterion` `(1, 1)` and exactly one `Semester` `(1, 1)`; each criterion and each semester may have `(0, N)` scores.
- Each TrainingScore retains exactly one ScoringPolicyVersion effective for its award; a criterion–semester may have `(0, N)` sequential versions.
- Each `TrainingScore` has either one `Participation` `(1, 1)` and no `Recognition` `(0, 0)`, or one `Recognition` `(1, 1)` and no `Participation` `(0, 0)`; each participation or recognition may support `(0, N)` scores, limited to one per criterion.
- Each `ScoreChange` and `ScoreAdjustment` belongs to exactly one `TrainingScore` `(1, 1)` and may reference one `Appeal` `(0, 1)`; each score and each appeal may have `(0, N)` score changes or approved adjustments.
- Each `Appeal` is submitted by exactly one student `User` `(1, 1)` and may be reviewed by one manager `User` `(0, 1)`; each student may submit `(0, N)` appeals, and each manager may handle `(0, N)` appeals.
- Each Appeal may have `(0, N)` RequestAssignment and RequestRevision records, but at most one current eligible assignee.
- Each `Appeal` may reference one `Activity` `(0, 1)`, one `Registration` `(0, 1)`, and one `TrainingScore` `(0, 1)` according to its type; each of those records may be referenced by `(0, N)` appeals.
- Each `AppealEvidence` belongs to one Appeal; each submitted appeal has `(1, N)` valid evidence files.
- Each `Recognition` belongs to exactly one approved `Appeal` `(1, 1)`, one student `User` `(1, 1)`, one `Semester` `(1, 1)`, and one `ScoreCriterion` `(1, 1)`; each appeal may produce `(0, 1)` recognition, while each student, semester, and criterion may be associated with `(0, N)` recognitions.
- Each recognition Appeal has exactly one RecognitionRequestDetail before decision; an approved appeal may create one Recognition outcome.
- Each `ActivityAnnouncement` belongs to exactly one `Activity` `(1, 1)` and has exactly one author `User` `(1, 1)`; each activity and each author may have `(0, N)` announcements.
- Each `Notification` belongs to one recipient User and may reference an Activity, announcement, or Appeal; email attempts are associated through NotificationDelivery.
- Each Notification may have `(0, N)` NotificationDelivery records across channels, at most one per channel; `attempt_count` tracks retries on the same record. Each audited change produces an AuditLog event.
- Each `Attendance`, `Participation`, `TrainingScore`, `ScoreChange`, and `Recognition` has exactly one acting `User` `(1, 1)` through its recorder, verifier, awarder, or changer FK; each user may act on `(0, N)` records of each type.

## Constraints

### Explicit constraints

- Every row has a non-null primary key.
- Every non-null foreign key references an existing row.
- Historical `Registration`, `Attendance`, `Participation`, `TrainingScore`, `Appeal`, `ScoreChange`, and `AuditLog` rows must not be cascade-deleted through their foreign keys.
- `UserRole(user_id, role_id)` is unique; roles are independently assigned and never inherited automatically.
- Student, Manager, and Administrator profiles may coexist for the same User when each duty is assigned.
- A profile belongs to an existing User; profile and corresponding duty changes are committed together.
- Every field marked `UQ` in the entity tables rejects duplicate non-null values.
- Each composite primary key in the entity tables rejects duplicate key tuples.
- At most one active Registration exists for an activity–student pair; Cancelled and Rejected attempts do not block a new attempt.
- `Participation.registration_id` is unique.
- `Recognition.appeal_id` is unique.
- `TrainingScore(participation_id, criterion_id)` is unique when `participation_id` is present.
- `TrainingScore(recognition_id, criterion_id)` is unique when `recognition_id` is present.
- A `TrainingScore` row has exactly one non-null source: `participation_id` or `recognition_id`.
- `Role.code` is one of `student`, `manager`, or `administrator`; a User may hold multiple values through UserRole.
- `Activity.status` is one of `draft`, `published`, `ongoing`, `completed`, or `cancelled`.
- `Registration.status` is one of `pending_approval`, `confirmed`, `waitlisted`, `rejected`, or `cancelled`.
- Recorded `Attendance.status` is `attended` or `absent`; no record means No information.
- `Appeal.type` is one of `recognition`, `participation_correction`, or `score_correction`.
- `Appeal.status` is one of `pending_assignment`, `pending_review`, `under_review`, `additional_information_required`, `approved`, `rejected`, or `withdrawn`.
- A `recognition` appeal has null `registration_id` and `score_id`.
- A `participation_correction` appeal has non-null `registration_id` and null `score_id`.
- A `score_correction` appeal has null `registration_id`; `score_id` is required only for an incorrect score, while a missing score uses `activity_id` and no `score_id`.
- `Semester.starts_at` is earlier than `Semester.ends_at`.
- `Activity.registration_opens_at` is earlier than `Activity.registration_closes_at`.
- `ActivitySchedule.starts_at` is earlier than `ActivitySchedule.ends_at`.
- `Activity.capacity` is greater than zero.
- A submitted Appeal has at least one private PDF/JPG/PNG evidence file of at most 10 MB per file; external links alone do not qualify. Only the submitting student and staff authorized for that request may access its files.
- `ScoringPolicyVersion` defines nonnegative weight, allowed base-point range, and semester cap; used versions are immutable.
- `ScoreChange.old_points`, `new_points`, `reason`, `changed_by_user_id`, and `changed_at` are non-null.

### Semantic constraints

- Before creating a User, provisioning checks for an existing identity. Authorized staff may provision and validate academic identity without live university integration.
- A student number must be staff-validated before eligibility-dependent registration or appeal submission; the student cannot edit it or their full name.
- A student faculty must be staff-validated before activity eligibility checks; the student cannot edit it.
- A request from a User whose `status` is inactive must be denied.
- A protected action needs an independently granted Permission and the relevant student ownership or active organization, activity, or request assignment.
- Manager and administrator permissions do not automatically include another duty's permissions.
- Only an authorized administrator may change UserRole or RolePermission, with an AuditLog entry.
- Only the current eligible assignee with appeal.review permission may approve or reject an Appeal.
- Only an active ActivityManage or owning-organization assignment may manage an activity or record its attendance.
- A user may read or change a student-owned record only when it belongs to that user, unless a staff permission grants access to the relevant workflow.
- A registration request must come from a user with registration permission.
- An activity may be published only when it has at least one `ActivitySchedule` and one `ActivityManage`. Valid transitions are Draft → Published or Cancelled, Published → Ongoing or Cancelled, and Ongoing → Completed or Cancelled; Completed and Cancelled are terminal.
- Every `ActivitySchedule` must fall within its activity's `Semester` date range.
- A registration request must target an activity whose status is `published`.
- A registration request at time `t` is accepted only when `registration_opens_at <= t < registration_closes_at`.
- If an activity has `ActivityEligibility` rows, the student's `faculty_id` must match one of them.
- Cancelled or Rejected registration attempts are terminal; a new attempt may be submitted during the open window. Student cancellation after the window follows the activity’s published cancellation policy; without one, cancellation closes with the registration window.
- A registration must not become Confirmed after its activity is Cancelled or Completed.
- When a place is free, an eligible new registration becomes Pending Approval if manager approval is required, otherwise Confirmed; when full, it becomes Waitlisted. Pending Approval and Confirmed each reserve one place, and their combined count must never exceed Activity.capacity after a committed operation.
- Waiting order uses immutable queue-entry time and a stable sequence to break ties. Rejection or cancellation of a reserved place automatically promotes the first still-eligible waiter to Pending Approval when manager review is required, otherwise Confirmed; an ineligible waiter is skipped with the reason recorded. When capacity falls, newest Pending Approval reservations move to waiting first, then newest Confirmed places. Displaced Confirmed students rank before ordinary waiters in original confirmation order, and all affected students are notified.
- Approval, cancellation, capacity reduction, and waiting-list promotion must serialize affected activity registrations until commit.
- Before confirming registration, the application must report a schedule conflict when a new session starts before an approved session ends and the approved session starts before the new session ends.
- An `Attendance` row may be created only when its registration and session belong to the same activity.
- A Participation row may be created only for a Confirmed registration.
- Participation verification uses an activity threshold published before its first session or an assigned manager's recorded reasoned decision; universal all-session results are not required.
- An internal `TrainingScore` may be created only for a verified `Participation`.
- A recognition `TrainingScore` may be created only when its `Recognition` links to an approved `Appeal`.
- An internal `TrainingScore.semester_id` must equal its activity's `semester_id`.
- A recognition `TrainingScore.semester_id` must equal its `Recognition.semester_id`.
- An internal `TrainingScore.policy_version_id` must match an `ActivityScore.policy_version_id` offered by its activity, and `TrainingScore.criterion_id` must equal that applied `ScoringPolicyVersion.criterion_id`.
- A recognition `TrainingScore.criterion_id` must equal its `Recognition.criterion_id`.
- ActivityScore.base_points must be nonnegative and within its applied policy version's allowed range.
- A TrainingScore award retains its applied policy version; weighted points equal base points times weight, rounded to two decimals.
- A recognition `TrainingScore.points_awarded` must be nonnegative.
- A used ScoringPolicyVersion cannot be edited; a new rule receives a version with an effective semester and activation time. Before activation, an authorized administrator previews the affected semesters and resulting score changes. Activation does not recalculate or overwrite historical awards; each award retains its applied version.
- An internal TrainingScore may be adjusted only by an assigned manager with score.adjust permission or an assigned reviewer resolving an approved appeal.
- An appeal for a participation correction must reference a `Registration` owned by its submitter.
- A participation correction without a registration uses recognition; missing-score appeals need no existing score identifier.
- An incorrect-score appeal references the submitter's existing TrainingScore; a missing-score appeal identifies the student and activity without a score row.
- A `Recognition` may be created only from an approved recognition appeal.
- RecognitionRequestDetail captures title, occurrence date, internal/external classification, a volunteering, academic, or other submission category, target semester, and optional proposed criterion before review. This submission category is independent of catalog ActivityCategory; recognition routes to Student Affairs Office, while activity appeals route to responsible managers.
- `Recognition.student_user_id` must equal its appeal's `submitted_by_user_id`.
- When `Appeal.activity_id` identifies a previous activity for later recognition, `Recognition.semester_id` must identify a later semester than that activity's semester.
- A prior activity may not receive a recognition score for a student and criterion when that student's participation in the same activity already has a score for that criterion.
- Approved, Rejected, and Withdrawn appeals are terminal and cannot be reopened under this baseline.
- A submitted appeal enters Pending Review when an eligible manager is assigned, otherwise Pending Assignment. An authorized administrator may assign or reassign only an eligible Student Affairs Office manager for recognition or a responsible activity manager for an activity-specific appeal; when the assignee loses eligibility, the appeal returns to Pending Assignment. The current assignee may move Pending Review → Under Review, Under Review → Additional Information Required, or Under Review → Approved or Rejected. The submitting student may edit request details and add or replace valid evidence in Pending Assignment, Pending Review, Under Review, or Additional Information Required; each change creates a RequestRevision on the same appeal. Edits in Pending Assignment retain that status pending eligible assignment. Edits in Pending Review or Under Review, and resubmission from Additional Information Required, return the appeal to Pending Review if the assignee remains eligible; otherwise they return it to Pending Assignment for reassignment. A changed activity reference triggers routing eligibility reassessment. The assigned reviewer is notified of a new revision and decides only against its latest version; a decision and concurrent edit cannot both commit against different versions. The student may move any unresolved state → Withdrawn; Approved, Rejected, and Withdrawn appeals cannot be edited or resubmitted.
- When an appeal is Approved or Rejected, `reviewed_by_user_id`, `response`, and `reviewed_at` must all be present. A student withdrawal instead records `withdrawn_by_user_id` equal to the submitter and `withdrawn_at`; it requires no reviewer decision or response.
- Each approved ScoreAdjustment must link exactly one unique ScoreChange row; the adjustment delta equals ScoreChange.new_points minus ScoreChange.old_points. A score change resolving an approved adjustment has no second independent adjustment entry.
- `ScoreChange.old_points` must equal `TrainingScore.points_awarded` immediately before the adjustment.
- `ScoreChange.new_points` must equal `TrainingScore.points_awarded` immediately after the adjustment.
- `ScoreChange.appeal_id` is required when the adjustment resolves an appeal.
- Approval that creates a previously missing TrainingScore records the initial award and an AuditLog event without a ScoreChange or previous score value. Approval that adjusts an existing TrainingScore records one linked ScoreAdjustment and ScoreChange plus an AuditLog event. In either path, the appeal decision and its Participation or Recognition result, score effect, and audit event must all commit or fail together; email delivery is separate.
- `TrainingScore.points_awarded` is the current value derived from its weighted base award plus its approved ScoreAdjustment deltas. The student's criterion-semester total is computed either from these current values or from weighted base awards plus the same deltas, never both; it is bounded between zero and the policy cap. Duplicate source–criterion credit is prohibited.
- Students following an activity receive relevant schedule and announcement updates without registering. Relevant follow, registration, waitlist, announcement, and request events durably create one in-app Notification and its Pending email NotificationDelivery intent with the business event. A delivery worker retries failed attempts using the same delivery record; pending or retrying records survive worker interruption. After the configured bounded retry limit, status becomes Exhausted with the last error recorded. Authorized staff may retry an Exhausted delivery, resetting it to Pending without creating another Notification or repeating the business event. Delivery uses a stable notification and channel key to avoid duplicate records or messages; email failure does not roll back the business change.
- AuditLog records actor, action, affected record, time, reason, and before/after values for request changes, score creation and adjustments, attendance imports, role changes, and configuration changes. Only authorized staff can read it; ordinary users cannot alter it.
- Account deactivation preserves activity, registration, attendance, participation, score, request, and audit history for at least three years. Authorized privacy handling may anonymize nonessential contact fields without destroying attribution.

