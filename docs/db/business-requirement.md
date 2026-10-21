# Business requirements analysis

This document describes the business purpose, actors, entities and attributes, relationships and cardinalities, and constraints of the app myHCMUS. The source of product requirements is the [project proposal](../management/project-proposal.md), supported by the [product survey](../survey/existing-apps-survey.md).

# Business purpose

myHCMUS helps university students discover and take part in extracurricular activities while keeping their participation history and training scores visible in one web-based platform. Students can browse activities, check eligibility and schedules, register or cancel within the permitted period, follow registration updates, and view their activities in a personal calendar. They can also review scores by semester and evaluation criterion, receive relevant reminders, and request recognition or correction when a participation record or score is missing or inaccurate.

Activity organizers use the platform to create and manage activities, capacity, schedules, eligibility and training-score criteria; review registrations and waiting lists; record attendance; and submit verified participation results. Staff review appeals and supporting evidence, while administrators manage system-wide criteria and use reports and statistics to monitor participation, registration trends, and score distribution. Accounts and roles control access to each workflow, and profiles hold the personal and academic information needed to support them.

The business record connects **activity → registration → attendance and verified participation → training score → appeal or correction** so students and staff can trace how a score was earned or changed. The platform also provides a hub for university services and an AI student assistant that recommends activities using students' interests, schedules, participation history, and training-score needs.

# Actors

| Actor | Role |
| --- | --- |
| **Student** | Maintains a profile; discovers activities; checks schedules, eligibility, and training-score criteria; registers or cancels within the allowed period; tracks registration, participation, and scores; and submits recognition requests or appeals with supporting evidence. The student also receives activity updates and recommendations. |
| **Activity organizer** | Creates and manages activities, schedules, capacity, requirements, announcements, and participant lists; reviews applications and waiting lists; records attendance and verified participation; submits results for training scores; and views activity statistics or exports reports. |
| **Staff reviewer** | Reviews requests to recognize activities and appeals about participation records or training scores, verifies submitted evidence, responds to students, and updates request status. |
| **System administrator** | Configures system-wide settings and training-score criteria, and views reports and statistics covering activities, registrations, and score distribution. |

A person may hold more than one staff responsibility. The system uses account roles to determine which actions and information each person can access.

# Real-world working assumptions

- Each user has one university identity in myHCMUS, which translates to one User row; they also get one role only, prioritizing the one with higher privilege. For example, a student working as a club board member or class monitor can receive user role Organizer instead of Student so they can post activities.
- The university provides or verifies a student's number and faculty before those details are used for registration eligibility. Staff accounts may have no student number or faculty.
- Administrators maintain the faculty list, academic semesters, score criteria, and staff role assignments. Organizers manage only activities assigned to them, and reviewers decide appeals using submitted evidence.
- Each activity is managed within one semester. If a activity spans one semester but its evidence can be used for score addition in another, such as blood donation, user receives no score until they submit an appeal. This is how the current training score system is designed too.
- Registration capacity counts approved students. Pending and waitlisted applications do not reserve seats (we have to define the limit of waitlisted students also); an organizer **may** need to review applications before approval in certain cases, so it is reasonable to provide them the ability to do that.
- An organizer records attendance for each scheduled session and verifies participation before scores are awarded. The current flow is successful registration -> verified attendance -> participation update. An attendance record alone does not automatically earn a score.
- Training-score criteria and their maximum points are treated as fixed for records already awarded. A later policy change is applied to future activities or semesters without silently changing historical scores.
- Recognition of an activity outside the platform requires a student request and reviewer approval. The approved recognition is recorded separately from ordinary activity registrations; staff may put it in one of the existing criteria of their choice (putting external activity in a new criterion is not encouraged because it would not follow the training score calculation scheme of our university).
- University services, if they are of relevant concern, are external destinations linked from the hub; their account data and transactions remain with those services. 
- AI recommendations are advisory and do not change any important information such as registrations or scores.

# Schema design

The schema uses one **User** entity for every student or staff member. Roles are assigned through **UserRole** and resolved through the **Role** and **RolePermission** reference data. A user can therefore act as both an organizer and a reviewer without duplicate accounts or separate person tables. Role checks grant access to a workflow; ownership checks still restrict a student to their own records and an organizer to activities they manage.

`PK` denotes a primary key, `FK` a foreign key, and `UQ` a unique constraint. IDs are surrogate keys unless an external identifier is explicitly named.

## Reference entities

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Role** | `role_id` (PK), `code` (UQ), `name`, `description` | Controlled values: `student`, `organizer`, `reviewer`, `administrator`. A role describes access, not a separate kind of user. |
| **Permission** | `permission_id` (PK), `code` (UQ), `description` | Named actions such as `activity.manage`, `registration.review`, `attendance.record`, `score.submit`, `appeal.review`, `criteria.manage`, and `reports.view`. |
| **RolePermission** | `role_id` (FK), `permission_id` (FK) | Composite PK (`role_id`, `permission_id`); defines which actions each role grants. Seeded and maintained by administrators. |
| **Faculty** | `faculty_id` (PK), `code` (UQ), `name` | Academic unit used in profiles, activity filters, and eligibility rules. |
| **ActivityCategory** | `category_id` (PK), `name` (UQ), `description` | Activity classification and student interest matching. |
| **Semester** | `semester_id` (PK), `academic_year`, `term`, `starts_at`, `ends_at` | UQ (`academic_year`, `term`); score reporting period. `starts_at` must precede `ends_at`. |
| **ScoreCriterion** | `criterion_id` (PK), `code` (UQ), `name`, `description`, `max_points`, `is_active` | Administrator-controlled training-score criterion. `max_points` is nonnegative. Historical scores keep their criterion link even when it is deactivated. |

## Users and access

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **User** | `user_id` (PK), `email` (UQ), `password_hash`, `full_name`, `student_number` (nullable, UQ), `faculty_id` (nullable FK), `avatar_url` (nullable), `is_active`, `created_at` | The sole account and profile entity. Student academic fields are populated when applicable; staff can leave them null. Never store a plaintext password. |
| **UserRole** | `user_id` (FK), `role_id` (FK), `assigned_at`, `assigned_by_user_id` (nullable FK to User) | Composite PK (`user_id`, `role_id`). Allows multiple roles per user and records who granted them. Only an administrator may assign privileged roles. |
| **UserInterest** | `user_id` (FK), `category_id` (FK) | Composite PK (`user_id`, `category_id`). Optional preferences for discovery and recommendations. |

The initial permission mapping is: students can manage their own profile and registrations, view their own scores, and submit appeals; organizers can manage assigned activities, registrations, attendance, announcements, and participation results; reviewers can review and resolve appeals; administrators can assign roles, maintain criteria and settings, and view system-wide reports. A permission does not override record ownership or activity assignment.

## Activities and participation

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Activity** | `activity_id` (PK), `title`, `description`, `category_id` (FK), `semester_id` (FK), `capacity`, `registration_opens_at`, `registration_closes_at`, `status`, `created_by_user_id` (FK), `created_at` | An activity belongs to one category and semester. Capacity is positive; the registration window is ordered. Status covers draft, published, cancelled, and completed. |
| **ActivityOrganizer** | `activity_id` (FK), `user_id` (FK) | Composite PK (`activity_id`, `user_id`). Only users with the organizer role may be assigned. Supports multiple organizers per activity. |
| **ActivitySchedule** | `schedule_id` (PK), `activity_id` (FK), `starts_at`, `ends_at`, `location` | One activity may have several sessions. Start precedes end; these intervals support calendar and conflict checks. |
| **ActivityEligibility** | `activity_id` (FK), `faculty_id` (FK) | Composite PK (`activity_id`, `faculty_id`). If an activity has no rows here, it is open to all faculties; otherwise, only listed faculties are eligible. |
| **ActivityScore** | `activity_id` (FK), `criterion_id` (FK), `points` | Composite PK (`activity_id`, `criterion_id`). Advertised score for verified participation; positive points award credit, while negative points mark a violation deduction. The point magnitude cannot exceed the criterion maximum. |
| **Registration** | `registration_id` (PK), `activity_id` (FK), `user_id` (FK), `status`, `registered_at`, `decided_at` (nullable), `decided_by_user_id` (nullable FK) | UQ (`activity_id`, `user_id`) prevents duplicate applications. Status covers pending, approved, waitlisted, rejected, and cancelled. The registrant must have the student role. |
| **Attendance** | `schedule_id` (FK), `registration_id` (FK), `status`, `recorded_by_user_id` (FK), `recorded_at` | Composite PK (`schedule_id`, `registration_id`). Status covers present, absent, and excused. The schedule and registration must belong to the same activity. |
| **Participation** | `participation_id` (PK), `registration_id` (FK, UQ), `verified_by_user_id` (FK), `verified_at`, `status` | One final participation result per registration. Verification is based on attendance or other documented evidence; only approved registrations can become verified. |
| **TrainingScore** | `score_id` (PK), `participation_id` (nullable FK), `recognition_id` (nullable FK), `criterion_id` (FK), `semester_id` (FK), `points_awarded`, `awarded_at`, `awarded_by_user_id` (FK) | Exactly one of `participation_id` and `recognition_id` is set. UQ (`participation_id`, `criterion_id`) and UQ (`recognition_id`, `criterion_id`) prevent duplicate scores. Internal scores use the activity's semester and advertised criterion; recognition scores use the approved recognition's semester and criterion. Points may be negative for a violation deduction, with magnitude within the criterion maximum. |
| **ScoreChange** | `change_id` (PK), `score_id` (FK), `appeal_id` (nullable FK), `old_points`, `new_points`, `changed_by_user_id` (FK), `changed_at`, `reason` | Audit trail for score adjustments. `old_points` must match the previous value; the history retains the original award and every change. |

## Appeals, updates, and services

| Entity | Main attributes | Purpose and constraints |
| --- | --- | --- |
| **Appeal** | `appeal_id` (PK), `submitted_by_user_id` (FK), `activity_id` (nullable FK), `registration_id` (nullable FK), `score_id` (nullable FK), `type`, `description`, `status`, `reviewed_by_user_id` (nullable FK), `response` (nullable), `submitted_at`, `reviewed_at` (nullable) | Covers recognition of an activity, a participation correction, or a score correction. A correction links to the affected record; outside-activity recognition may have no existing activity. The submitter must be a student and the reviewer must have the reviewer role. |
| **AppealEvidence** | `evidence_id` (PK), `appeal_id` (FK), `file_url`, `description`, `uploaded_at` | Supporting files or links for an appeal. An appeal can have multiple evidence items. |
| **Recognition** | `recognition_id` (PK), `appeal_id` (FK, UQ), `student_user_id` (FK), `title`, `occurred_at`, `semester_id` (FK), `criterion_id` (FK), `verified_by_user_id` (FK), `verified_at` | An approved recognition appeal creates one verified record for an activity outside the registration workflow. The student matches the appeal submitter. This record can support a training score. |
| **ActivityAnnouncement** | `announcement_id` (PK), `activity_id` (FK), `author_user_id` (FK), `title`, `body`, `published_at` | Organizer updates tied to an activity. |
| **Notification** | `notification_id` (PK), `recipient_user_id` (FK), `activity_id` (nullable FK), `type`, `message`, `created_at`, `read_at` (nullable) | Delivery record for reminders, schedule changes, registration updates, and appeal outcomes. |
| **ServiceLink** | `service_id` (PK), `name`, `url`, `description`, `display_order`, `is_active` | Administrator-managed links in the university services hub. |

## Relationships and business rules

### Cardinalities

- Each `UserRole` links exactly one `User` `(1, 1)` and exactly one `Role` `(1, 1)`; each user may have `(0, N)` role assignments, and each role may be assigned to `(0, N)` users.
- Each `RolePermission` links exactly one `Role` `(1, 1)` and exactly one `Permission` `(1, 1)`; each role may grant `(0, N)` permissions, and each permission may be granted by `(0, N)` roles.
- Each `User` belongs to at most one `Faculty` `(0, 1)`; each faculty may have `(0, N)` users.
- Each `UserInterest` links exactly one `User` `(1, 1)` and exactly one `ActivityCategory` `(1, 1)`; each user may select `(0, N)` categories, and each category may be selected by `(0, N)` users.
- Each `Activity` has exactly one `ActivityCategory` `(1, 1)` and exactly one `Semester` `(1, 1)`; each category and semester may contain `(0, N)` activities.
- Each `Activity` has exactly one creator `User` `(1, 1)`; each user may create `(0, N)` activities.
- Each `ActivityOrganizer` links exactly one `Activity` `(1, 1)` and exactly one organizer `User` `(1, 1)`; each activity may have `(0, N)` assigned organizers, and each organizer may manage `(0, N)` activities.
- Each `ActivitySchedule` belongs to exactly one `Activity` `(1, 1)`; each activity may have `(0, N)` scheduled sessions.
- Each `ActivityEligibility` links exactly one `Activity` `(1, 1)` and exactly one `Faculty` `(1, 1)`; each activity may allow `(0, N)` faculties, and each faculty may be allowed for `(0, N)` activities.
- Each `ActivityScore` links exactly one `Activity` `(1, 1)` and exactly one `ScoreCriterion` `(1, 1)`; each activity may offer `(0, N)` criteria, and each criterion may be offered by `(0, N)` activities.
- Each `Registration` links exactly one `Activity` `(1, 1)` and exactly one student `User` `(1, 1)`; each activity and each student may have `(0, N)` registrations. Each student may register for a given activity at most once.
- Each `Attendance` links exactly one `Registration` `(1, 1)` and exactly one `ActivitySchedule` `(1, 1)`; each registration and each session may have `(0, N)` attendance records. The registration and session must refer to the same activity.
- Each `Participation` belongs to exactly one `Registration` `(1, 1)`; each registration may have `(0, 1)` participation result.
- Each `TrainingScore` belongs to exactly one `ScoreCriterion` `(1, 1)` and exactly one `Semester` `(1, 1)`; each criterion and each semester may have `(0, N)` scores.
- Each `TrainingScore` has either one `Participation` `(1, 1)` and no `Recognition` `(0, 0)`, or one `Recognition` `(1, 1)` and no `Participation` `(0, 0)`; each participation or recognition may support `(0, N)` scores, limited to one per criterion.
- Each `ScoreChange` belongs to exactly one `TrainingScore` `(1, 1)` and may reference one `Appeal` `(0, 1)`; each score and each appeal may have `(0, N)` score changes.
- Each `Appeal` is submitted by exactly one student `User` `(1, 1)` and may be reviewed by one reviewer `User` `(0, 1)`; each student may submit `(0, N)` appeals, and each reviewer may handle `(0, N)` appeals.
- Each `Appeal` may reference one `Activity` `(0, 1)`, one `Registration` `(0, 1)`, and one `TrainingScore` `(0, 1)` according to its type; each of those records may be referenced by `(0, N)` appeals.
- Each `AppealEvidence` belongs to exactly one `Appeal` `(1, 1)`; each appeal may include `(0, N)` evidence items.
- Each `Recognition` belongs to exactly one approved `Appeal` `(1, 1)`, one student `User` `(1, 1)`, one `Semester` `(1, 1)`, and one `ScoreCriterion` `(1, 1)`; each appeal may produce `(0, 1)` recognition, while each student, semester, and criterion may be associated with `(0, N)` recognitions.
- Each `ActivityAnnouncement` belongs to exactly one `Activity` `(1, 1)` and has exactly one author `User` `(1, 1)`; each activity and each author may have `(0, N)` announcements.
- Each `Notification` belongs to exactly one recipient `User` `(1, 1)` and may reference one `Activity` `(0, 1)`; each user and each activity may have `(0, N)` notifications.

## Constraints

### Explicit constraints

- Every row has a non-null primary key.
- Every non-null foreign key references an existing row.
- Every field marked `UQ` in the entity tables rejects duplicate non-null values.
- Each composite primary key in the entity tables rejects duplicate key tuples.
- `Registration(activity_id, user_id)` is unique, including when the existing registration is cancelled or rejected.
- `Participation.registration_id` is unique.
- `Recognition.appeal_id` is unique.
- `TrainingScore(participation_id, criterion_id)` is unique when `participation_id` is present.
- `TrainingScore(recognition_id, criterion_id)` is unique when `recognition_id` is present.
- A `TrainingScore` row has exactly one non-null source: `participation_id` or `recognition_id`.
- `Activity.status` is one of `draft`, `published`, `cancelled`, or `completed`.
- `Registration.status` is one of `pending`, `approved`, `waitlisted`, `rejected`, or `cancelled`.
- `Attendance.status` is one of `present`, `absent`, or `excused`.
- `Appeal.type` is one of `recognition`, `participation_correction`, or `score_correction`.
- `Semester.starts_at` is earlier than `Semester.ends_at`.
- `Activity.registration_opens_at` is earlier than `Activity.registration_closes_at`.
- `ActivitySchedule.starts_at` is earlier than `ActivitySchedule.ends_at`.
- `Activity.capacity` is greater than zero.
- `ScoreCriterion.max_points` is at least zero.

### Semantic constraints

- Before creating a `User`, account provisioning must check the verified university identity for an existing account and reuse it when found.
- A student's `student_number` must be university-verified before the account is used for registration or appeals.
- A student's `faculty_id` must be university-verified before it is used for activity eligibility.
- A request from a user with `is_active = false` must be denied.
- A protected action must match a `Permission` linked through one of the user's assigned roles.
- Only a user with the administrator role may add or remove a `UserRole` assignment.
- Only a user with the reviewer role may approve or reject an `Appeal`.
- Only a user assigned through `ActivityOrganizer` may manage that activity or record its attendance.
- A user may read or change a student-owned record only when it belongs to that user, unless a staff permission grants access to the relevant workflow.
- A registration request must come from a user with registration permission.
- An activity may be published only when it has at least one `ActivitySchedule` and one `ActivityOrganizer`.
- A registration request must target an activity whose status is `published`.
- A registration request at time `t` is accepted only when `registration_opens_at <= t < registration_closes_at`.
- If an activity has `ActivityEligibility` rows, the student's `faculty_id` must match one of them.
- A registration with status `cancelled` must not transition to `approved`.
- The count of `approved` registrations for an activity must never exceed `Activity.capacity`.
- Approval, cancellation, and waiting-list promotion must each lock or otherwise serialize the affected activity's registrations until the transaction commits.
- Before approval, the application must report a schedule conflict when a new session starts before an approved session ends and the approved session starts before the new session ends.
- An `Attendance` row may be created only when its registration and session belong to the same activity.
- A `Participation` row may be verified only when its registration status is `approved`.
- Before verifying participation, every scheduled session must have an `Attendance` result for the registration, or an approved correction appeal must document the missing attendance.
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
- An appeal for a participation correction must reference a `Registration` owned by its submitter.
- An appeal for a score correction must reference a `TrainingScore` earned by its submitter.
- A `Recognition` may be created only from an approved recognition appeal.
- `Recognition.student_user_id` must equal its appeal's `submitted_by_user_id`.
- A resolved appeal must not be edited until it has been reopened through the review workflow.
- When an appeal is resolved, `reviewed_by_user_id`, `response`, and `reviewed_at` must all be present.
- Each score adjustment must create a `ScoreChange` with non-null `old_points`, `new_points`, `reason`, `changed_by_user_id`, and `changed_at`.
- `ScoreChange.old_points` must equal `TrainingScore.points_awarded` immediately before the adjustment.
- `ScoreChange.new_points` must equal `TrainingScore.points_awarded` immediately after the adjustment.
- `ScoreChange.appeal_id` is required when the adjustment resolves an appeal.
- Updating `TrainingScore.points_awarded` and inserting its `ScoreChange` must succeed or fail in the same transaction.

