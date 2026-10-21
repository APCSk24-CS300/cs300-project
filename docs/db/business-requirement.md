# Business requirements analysis

This document describes the business purpose, actors, data entities, relationships, assumptions, and constraints of myHCMUS. It draws on the [project proposal](../management/project-proposal.md) and [product survey](../survey/existing-apps-survey.md).

# Business purpose

myHCMUS helps university students discover extracurricular activities and track participation and training scores in one web platform. Students can browse activities, check eligibility and schedules, register or cancel within the permitted period, follow registration updates, and view activities in a personal calendar. They can review scores by semester and criterion, receive reminders, and request recognition or correction when a participation record or score is missing or inaccurate.

Activity organizers create activities, set capacity and eligibility, manage schedules and registrations, record attendance, and submit verified participation results. Staff reviewers decide appeals using submitted evidence. Administrators manage system-wide score criteria and use reports to monitor participation, registration trends, and score distribution. An account's role controls access to each workflow, while its profile holds the personal and academic information needed for that work.

The core record links **activity → registration → attendance → verified participation → training score**. Appeals and score-change history show how a missing or incorrect record was resolved. The platform also links to university services and recommends activities using students' interests, schedules, participation history, and score needs.

# Actors

| Actor | Role |
| --- | --- |
| **Student** | Maintains a profile; discovers activities; checks schedules, eligibility, and training-score criteria; registers or cancels within the allowed period; tracks registration, participation, and scores; and submits recognition requests or appeals with supporting evidence. The student also receives activity updates and recommendations. |
| **Activity organizer** | Creates and manages activities, schedules, capacity, requirements, announcements, and participant lists; reviews applications and waiting lists; records attendance and verified participation; submits results for training scores; and views activity statistics or exports reports. |
| **Staff reviewer** | Reviews requests to recognize activities and appeals about participation records or training scores, verifies submitted evidence, responds to students, and updates request status. |
| **System administrator** | Configures system-wide settings and training-score criteria, and views reports and statistics covering activities, registrations, and score distribution. |

Each account has one role. Staff roles retain student actions for users who are also students; assigned activities and record ownership still limit what they can access.

# Real-world working assumptions

- One verified university identity maps to one `User` row and one assigned role. For example, student who is also a club board member, class monitor (or any role capable of posting activities) receives the role whose permission set covers those duties; that role also grants personal student actions.
- The university verifies each student's number and faculty before they are used for registration or eligibility. A staff member who is not a student may leave those fields empty.
- Administrators maintain faculties, semesters, score criteria, and role assignments. Organizers manage only assigned activities; reviewers decide appeals using submitted evidence.
- Each `Activity` belongs to one semester. When evidence from an earlier activity qualifies for a later semester, the student requests recognition; no later-semester score is issued before approval.
- Capacity counts approved registrations. Pending and waitlisted registrations do not reserve seats. The initial design sets no separate limit on the number of waitlisted registrations; organizers may review applications before approval.
- Organizers record attendance by session and verify participation on their side before a score is issued (one way to do this is via a camera-only QR check with an on-site signature collection fallback). Attendance alone does not guarantee points.
- Once a score criterion is used for an award, its meaning and maximum remain fixed. A changed policy uses a new criterion record so historical scores retain their original basis.
- Recognition covers activities outside the registration workflow and earlier activities credited in a later semester.
- The services hub stores links to external university systems, not their account data or transactions. AI recommendations are advisory and do not change registrations or scores.

# Schema design

The schema uses one **User** entity for every student or staff member. `User.role_id` selects one **Role** reference row, and **RolePermission** maps that role to allowed actions. Staff roles include the permissions needed for a student's personal actions. Activity assignment and record ownership narrow access to specific records.

`PK` denotes a primary key, `FK` a foreign key, and `UQ` a unique constraint. IDs are surrogate keys unless an external identifier is explicitly named.

## Reference entities

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Role** | `role_id` (PK), `code` (UQ), `name`, `description` | Controlled values: `student`, `organizer`, `reviewer`, `administrator`. Each user has one role; the role's permissions determine available actions. |
| **Permission** | `permission_id` (PK), `code` (UQ), `description` | Named actions such as `registration.create`, `registration.review`, `activity.manage`, `attendance.record`, `score.submit`, `score.adjust`, `appeal.submit`, `appeal.review`, `criteria.manage`, and `reports.view`. |
| **RolePermission** | `role_id` (FK), `permission_id` (FK) | Composite PK (`role_id`, `permission_id`); defines which actions each role grants. Seeded and maintained by administrators. |
| **Faculty** | `faculty_id` (PK), `code` (UQ), `name` | Academic unit used in profiles, activity filters, and eligibility rules. |
| **ActivityCategory** | `category_id` (PK), `name` (UQ), `description` | Activity classification and student interest matching. |
| **Semester** | `semester_id` (PK), `academic_year`, `term`, `starts_at`, `ends_at` | UQ (`academic_year`, `term`); score reporting period. `starts_at` must precede `ends_at`. |
| **ScoreCriterion** | `criterion_id` (PK), `code` (UQ), `name`, `description`, `max_points`, `is_active` | Administrator-controlled training-score criterion. `max_points` is nonnegative. Once referenced by a score, its meaning and maximum are fixed; deactivation preserves historical links. |

## Users and access

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **User** | `user_id` (PK), `role_id` (FK), `email` (UQ), `password_hash`, `full_name`, `student_number` (nullable, UQ), `faculty_id` (nullable FK), `avatar_url` (nullable), `is_active`, `created_at` | The sole account and profile entity. `role_id` is required. Student academic fields are populated when applicable; other staff may leave them null. Store only password hashes. |
| **UserInterest** | `user_id` (FK), `category_id` (FK) | Composite PK (`user_id`, `category_id`). Optional preferences for discovery and recommendations. |

The initial permission mapping is cumulative: `student` can manage personal profiles and registrations, view personal scores, and submit appeals; `organizer` adds management of assigned activities, registrations, attendance, announcements, participation results, and score adjustments; `reviewer` adds appeal review; `administrator` adds role assignment, criteria and settings management, and system-wide reports. Possessing a permission does not override record ownership or activity assignment.

## Activities and participation

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Activity** | `activity_id` (PK), `title`, `description`, `eligibility_notes` (nullable), `category_id` (FK), `semester_id` (FK), `capacity`, `registration_opens_at`, `registration_closes_at`, `status`, `created_by_user_id` (FK), `created_at` | An activity belongs to one category and semester. `eligibility_notes` describes any requirements beyond faculty membership. Status covers draft, published, cancelled, and completed. |
| **ActivityOrganizer** | `activity_id` (FK), `user_id` (FK) | Composite PK (`activity_id`, `user_id`). An assigned user needs `activity.manage` permission. An activity may have several organizers. |
| **ActivitySchedule** | `schedule_id` (PK), `activity_id` (FK), `starts_at`, `ends_at`, `location` | One activity may have several sessions. Start precedes end; these intervals support calendar and conflict checks. |
| **ActivityEligibility** | `activity_id` (FK), `faculty_id` (FK) | Composite PK (`activity_id`, `faculty_id`). If an activity has no rows here, it is open to all faculties; otherwise, only listed faculties are eligible. |
| **ActivityScore** | `activity_id` (FK), `criterion_id` (FK), `points` | Composite PK (`activity_id`, `criterion_id`). Advertised score for verified participation; positive points award credit, while negative points mark a violation deduction. The point magnitude cannot exceed the criterion maximum. |
| **Registration** | `registration_id` (PK), `activity_id` (FK), `user_id` (FK), `status`, `registered_at`, `decided_at` (nullable), `decided_by_user_id` (nullable FK) | UQ (`activity_id`, `user_id`) prevents duplicate applications. Status covers pending, approved, waitlisted, rejected, and cancelled. The registrant needs a verified student number and registration permission. |
| **Attendance** | `schedule_id` (FK), `registration_id` (FK), `status`, `recorded_by_user_id` (FK), `recorded_at` | Composite PK (`schedule_id`, `registration_id`). Status covers present, absent, and excused. The schedule and registration must belong to the same activity. |
| **Participation** | `participation_id` (PK), `registration_id` (FK, UQ), `verified_by_user_id` (FK), `verified_at` | A row records verified participation for one approved registration. Unverified attendance does not create a participation row. |
| **TrainingScore** | `score_id` (PK), `participation_id` (nullable FK), `recognition_id` (nullable FK), `criterion_id` (FK), `semester_id` (FK), `points_awarded`, `awarded_at`, `awarded_by_user_id` (FK) | Exactly one source FK is set. UQ (`participation_id`, `criterion_id`) and UQ (`recognition_id`, `criterion_id`) prevent duplicate scores. Internal scores use the activity's semester and advertised criterion; recognition scores use the approved recognition's target semester and criterion. Negative points represent a violation deduction, bounded in magnitude by the criterion maximum. |
| **ScoreChange** | `change_id` (PK), `score_id` (FK), `appeal_id` (nullable FK), `old_points`, `new_points`, `changed_by_user_id` (FK), `changed_at`, `reason` | Audit trail for score adjustments. `old_points` must match the previous value; the history retains the original award and every change. |

## Appeals, updates, and services

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Appeal** | `appeal_id` (PK), `submitted_by_user_id` (FK), `activity_id` (nullable FK), `registration_id` (nullable FK), `score_id` (nullable FK), `type`, `description`, `status`, `reviewed_by_user_id` (nullable FK), `response` (nullable), `submitted_at`, `reviewed_at` (nullable) | Covers recognition, participation correction, or score correction. An earlier-semester recognition may link an existing activity; outside-activity recognition may have no activity FK. The submitter needs a verified student number, and the reviewer needs appeal-review permission. |
| **AppealEvidence** | `evidence_id` (PK), `appeal_id` (FK), `file_url`, `description`, `uploaded_at` | Supporting files or links for an appeal. An appeal can have multiple evidence items. |
| **Recognition** | `recognition_id` (PK), `appeal_id` (FK, UQ), `student_user_id` (FK), `title`, `occurred_at`, `semester_id` (FK), `criterion_id` (FK), `verified_by_user_id` (FK), `verified_at` | An approved appeal creates one verified record for an external activity or a prior activity credited in a later semester. `semester_id` is the target scoring semester; the student matches the appeal submitter. |
| **ActivityAnnouncement** | `announcement_id` (PK), `activity_id` (FK), `author_user_id` (FK), `title`, `body`, `published_at` | Organizer updates tied to an activity. |
| **Notification** | `notification_id` (PK), `recipient_user_id` (FK), `activity_id` (nullable FK), `type`, `message`, `created_at`, `read_at` (nullable) | Delivery record for reminders, schedule changes, registration updates, and appeal outcomes. |
| **ServiceLink** | `service_id` (PK), `name`, `url`, `description`, `display_order`, `is_active` | Administrator-managed links in the university services hub. |

## Relationships and cardinalities

- Each `User` has exactly one `Role` `(1, 1)`; each role may be assigned to `(0, N)` users.
- Each `RolePermission` links exactly one `Role` `(1, 1)` and exactly one `Permission` `(1, 1)`; each role may grant `(0, N)` permissions, and each permission may be granted by `(0, N)` roles.
- Each `User` belongs to at most one `Faculty` `(0, 1)`; each faculty may have `(0, N)` users.
- Each `UserInterest` links exactly one `User` `(1, 1)` and exactly one `ActivityCategory` `(1, 1)`; each user may select `(0, N)` categories, and each category may be selected by `(0, N)` users.
- Each `Activity` has exactly one `ActivityCategory` `(1, 1)`; each category may classify `(0, N)` activities.
- Each `Activity` belongs to exactly one `Semester` `(1, 1)`; each semester may contain `(0, N)` activities.
- Each `Activity` has exactly one creator `User` `(1, 1)`; each user may create `(0, N)` activities.
- Each `ActivityOrganizer` links exactly one `Activity` `(1, 1)` and exactly one organizer `User` `(1, 1)`; each activity may have `(0, N)` assigned organizers, and each organizer may manage `(0, N)` activities.
- Each `ActivitySchedule` belongs to exactly one `Activity` `(1, 1)`; each activity may have `(0, N)` scheduled sessions.
- Each `ActivityEligibility` links exactly one `Activity` `(1, 1)` and exactly one `Faculty` `(1, 1)`; each activity may allow `(0, N)` faculties, and each faculty may be allowed for `(0, N)` activities.
- Each `ActivityScore` links exactly one `Activity` `(1, 1)` and exactly one `ScoreCriterion` `(1, 1)`; each activity may offer `(0, N)` criteria, and each criterion may be offered by `(0, N)` activities.
- Each `Registration` links exactly one `Activity` `(1, 1)` and exactly one student `User` `(1, 1)`; each activity and each student may have `(0, N)` registrations. A student may register for a given activity at most once.
- Each `Attendance` links exactly one `Registration` `(1, 1)` and exactly one `ActivitySchedule` `(1, 1)`; each registration and each session may have `(0, N)` attendance records. The registration and session must refer to the same activity.
- Each `Participation` belongs to exactly one `Registration` `(1, 1)`; each registration may have `(0, 1)` verified participation record.
- Each `TrainingScore` belongs to exactly one `ScoreCriterion` `(1, 1)` and exactly one `Semester` `(1, 1)`; each criterion and each semester may have `(0, N)` scores.
- Each `TrainingScore` has either one `Participation` `(1, 1)` and no `Recognition` `(0, 0)`, or one `Recognition` `(1, 1)` and no `Participation` `(0, 0)`; each participation or recognition may support `(0, N)` scores, limited to one per criterion.
- Each `ScoreChange` belongs to exactly one `TrainingScore` `(1, 1)` and may reference one `Appeal` `(0, 1)`; each score and each appeal may have `(0, N)` score changes.
- Each `Appeal` is submitted by exactly one student `User` `(1, 1)` and may be reviewed by one reviewer `User` `(0, 1)`; each student may submit `(0, N)` appeals, and each reviewer may handle `(0, N)` appeals.
- Each `Appeal` may reference one `Activity` `(0, 1)`, one `Registration` `(0, 1)`, and one `TrainingScore` `(0, 1)` according to its type; each of those records may be referenced by `(0, N)` appeals.
- Each `AppealEvidence` belongs to exactly one `Appeal` `(1, 1)`; each appeal may include `(0, N)` evidence items.
- Each `Recognition` belongs to exactly one approved `Appeal` `(1, 1)`, one student `User` `(1, 1)`, one `Semester` `(1, 1)`, and one `ScoreCriterion` `(1, 1)`; each appeal may produce `(0, 1)` recognition, while each student, semester, and criterion may be associated with `(0, N)` recognitions.
- Each `ActivityAnnouncement` belongs to exactly one `Activity` `(1, 1)` and has exactly one author `User` `(1, 1)`; each activity and each author may have `(0, N)` announcements.
- Each `Notification` belongs to exactly one recipient `User` `(1, 1)` and may reference one `Activity` `(0, 1)`; each user and each activity may have `(0, N)` notifications.
- Each `Attendance`, `Participation`, `TrainingScore`, `ScoreChange`, and `Recognition` has exactly one acting `User` `(1, 1)` through its recorder, verifier, awarder, or changer FK; each user may act on `(0, N)` records of each type.

## Constraints

### Explicit constraints

- Every row has a non-null primary key.
- Every non-null foreign key references an existing row.
- Historical `Registration`, `Attendance`, `Participation`, `TrainingScore`, `Appeal`, and `ScoreChange` rows must not be cascade-deleted through their foreign keys.
- `User.role_id` is non-null.
- Every field marked `UQ` in the entity tables rejects duplicate non-null values.
- Each composite primary key in the entity tables rejects duplicate key tuples.
- `Registration(activity_id, user_id)` is unique, including when the existing registration is cancelled or rejected.
- `Participation.registration_id` is unique.
- `Recognition.appeal_id` is unique.
- `TrainingScore(participation_id, criterion_id)` is unique when `participation_id` is present.
- `TrainingScore(recognition_id, criterion_id)` is unique when `recognition_id` is present.
- A `TrainingScore` row has exactly one non-null source: `participation_id` or `recognition_id`.
- `Role.code` is one of `student`, `organizer`, `reviewer`, or `administrator`.
- `Activity.status` is one of `draft`, `published`, `cancelled`, or `completed`.
- `Registration.status` is one of `pending`, `approved`, `waitlisted`, `rejected`, or `cancelled`.
- `Attendance.status` is one of `present`, `absent`, or `excused`.
- `Appeal.type` is one of `recognition`, `participation_correction`, or `score_correction`.
- `Appeal.status` is one of `submitted`, `in_review`, `approved`, or `rejected`.
- A `recognition` appeal has null `registration_id` and `score_id`.
- A `participation_correction` appeal has non-null `registration_id` and null `score_id`.
- A `score_correction` appeal has non-null `score_id` and null `registration_id`.
- `Semester.starts_at` is earlier than `Semester.ends_at`.
- `Activity.registration_opens_at` is earlier than `Activity.registration_closes_at`.
- `ActivitySchedule.starts_at` is earlier than `ActivitySchedule.ends_at`.
- `Activity.capacity` is greater than zero.
- `ScoreCriterion.max_points` is at least zero.
- `ScoreChange.old_points`, `new_points`, `reason`, `changed_by_user_id`, and `changed_at` are non-null.

### Semantic constraints

- Before creating a `User`, account provisioning must check the verified university identity for an existing account and reuse it when found.
- A student's `student_number` must be university-verified before the account is used for registration or appeals.
- A student's `faculty_id` must be university-verified before it is used for activity eligibility.
- A request from a user with `is_active = false` must be denied.
- A protected action must match a `Permission` linked to the user's `role_id` through `RolePermission`.
- The organizer permission set must include every student permission; the reviewer set must include every organizer permission; the administrator set must include every reviewer permission.
- Only a user with the administrator role may change `User.role_id` or edit `RolePermission`.
- Only a user with `appeal.review` permission may approve or reject an `Appeal`.
- Only a user assigned through `ActivityOrganizer` may manage that activity or record its attendance.
- A user may read or change a student-owned record only when it belongs to that user, unless a staff permission grants access to the relevant workflow.
- A registration request must come from a user with registration permission.
- An activity may be published only when it has at least one `ActivitySchedule` and one `ActivityOrganizer`.
- Every `ActivitySchedule` must fall within its activity's `Semester` date range.
- A registration request must target an activity whose status is `published`.
- A registration request at time `t` is accepted only when `registration_opens_at <= t < registration_closes_at`.
- If an activity has `ActivityEligibility` rows, the student's `faculty_id` must match one of them.
- A registration with status `cancelled` must not transition to `approved`.
- A registration must not transition to `approved` after its activity has been cancelled or completed.
- The count of `approved` registrations for an activity must never exceed `Activity.capacity`.
- Approval, cancellation, and waiting-list promotion must each lock or otherwise serialize the affected activity's registrations until the transaction commits.
- Before approval, the application must report a schedule conflict when a new session starts before an approved session ends and the approved session starts before the new session ends.
- An `Attendance` row may be created only when its registration and session belong to the same activity.
- A `Participation` row may be created only when its registration status is `approved`.
- Before creating `Participation`, every scheduled session must have an `Attendance` result for the registration, or an approved correction appeal must document the missing attendance.
- An internal `TrainingScore` may be created only for a verified `Participation`.
- A recognition `TrainingScore` may be created only when its `Recognition` links to an approved `Appeal`.
- An internal `TrainingScore.semester_id` must equal its activity's `semester_id`.
- A recognition `TrainingScore.semester_id` must equal its `Recognition.semester_id`.
- An internal `TrainingScore.criterion_id` must match an `ActivityScore` row for its activity.
- A recognition `TrainingScore.criterion_id` must equal its `Recognition.criterion_id`.
- The absolute value of `ActivityScore.points` must not exceed its `ScoreCriterion.max_points`.
- The absolute value of `TrainingScore.points_awarded` must not exceed its `ScoreCriterion.max_points`.
- An internal `TrainingScore.points_awarded` must have the same sign as its `ActivityScore.points`, or be zero.
- A recognition `TrainingScore.points_awarded` must be nonnegative.
- A `ScoreCriterion` referenced by a `TrainingScore` must not have its `code`, `name`, or `max_points` changed; a new policy requires a new criterion row.
- An internal `TrainingScore` may be adjusted only by an assigned organizer with `score.adjust` permission or by a user with `appeal.review` permission applying an approved score appeal.
- An appeal for a participation correction must reference a `Registration` owned by its submitter.
- An appeal for a score correction must reference a `TrainingScore` earned by its submitter.
- A `Recognition` may be created only from an approved recognition appeal.
- `Recognition.student_user_id` must equal its appeal's `submitted_by_user_id`.
- When `Appeal.activity_id` identifies a previous activity for later recognition, `Recognition.semester_id` must identify a later semester than that activity's semester.
- A prior activity may not receive a recognition score for a student and criterion when that student's participation in the same activity already has a score for that criterion.
- An appeal in `approved` or `rejected` status must return to `in_review` before its decision is changed.
- When an appeal is resolved, `reviewed_by_user_id`, `response`, and `reviewed_at` must all be present.
- Each score adjustment must create exactly one `ScoreChange` row.
- `ScoreChange.old_points` must equal `TrainingScore.points_awarded` immediately before the adjustment.
- `ScoreChange.new_points` must equal `TrainingScore.points_awarded` immediately after the adjustment.
- `ScoreChange.appeal_id` is required when the adjustment resolves an appeal.
- Updating `TrainingScore.points_awarded` and inserting its `ScoreChange` must succeed or fail in the same transaction.

