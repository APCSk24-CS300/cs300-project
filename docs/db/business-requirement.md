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
| **ActivityScore** | `activity_id` (FK), `criterion_id` (FK), `points` | Composite PK (`activity_id`, `criterion_id`). Advertised score for verified participation; points are nonnegative and cannot exceed the criterion maximum. |
| **Registration** | `registration_id` (PK), `activity_id` (FK), `user_id` (FK), `status`, `registered_at`, `decided_at` (nullable), `decided_by_user_id` (nullable FK) | UQ (`activity_id`, `user_id`) prevents duplicate applications. Status covers pending, approved, waitlisted, rejected, and cancelled. The registrant must have the student role. |
| **Attendance** | `schedule_id` (FK), `registration_id` (FK), `status`, `recorded_by_user_id` (FK), `recorded_at` | Composite PK (`schedule_id`, `registration_id`). Status covers present, absent, and excused. The schedule and registration must belong to the same activity. |
| **Participation** | `participation_id` (PK), `registration_id` (FK, UQ), `verified_by_user_id` (FK), `verified_at`, `status` | One final participation result per registration. Verification is based on attendance or other documented evidence; only approved registrations can become verified. |
| **TrainingScore** | `score_id` (PK), `participation_id` (nullable FK), `recognition_id` (nullable FK), `criterion_id` (FK), `semester_id` (FK), `points_awarded`, `awarded_at`, `awarded_by_user_id` (FK) | Exactly one of `participation_id` and `recognition_id` is set. UQ (`participation_id`, `criterion_id`) and UQ (`recognition_id`, `criterion_id`) prevent duplicate awards. Internal scores use the activity's semester and advertised criterion; recognition scores use the approved recognition's semester and criterion. Points are nonnegative and within the criterion maximum. |
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

- **User ↔ Role** is many-to-many through UserRole; **Role ↔ Permission** is many-to-many through RolePermission. Application authorization checks both the permission and the scope of the target record.
- **Faculty → User**, **ActivityCategory → Activity**, and **Semester → Activity** are one-to-many. **User ↔ ActivityCategory** is many-to-many through UserInterest.
- **Activity ↔ organizer User** is many-to-many through ActivityOrganizer. **Activity → ActivitySchedule**, **Activity → Registration**, and **Activity → ActivityAnnouncement** are one-to-many. **Activity ↔ Faculty** and **Activity ↔ ScoreCriterion** use ActivityEligibility and ActivityScore.
- **User → Registration** is one-to-many; a user has at most one registration per activity. **Registration → Attendance** is one-to-many across its activity's sessions. **Registration → Participation** is zero-or-one. **Participation → TrainingScore** and **Recognition → TrainingScore** are one-to-many, with one score per criterion and exactly one source per score.
- **User → Appeal** and **Appeal → AppealEvidence** are one-to-many. **Appeal → Recognition** is zero-or-one. A reviewer user may handle many appeals. **User → Notification** is one-to-many.
- Registration is allowed only while a published activity's registration window is open and its eligibility rules are met. Approved registrations cannot exceed capacity; overflow goes to the waiting list. Cancellation and promotion from the waiting list must be handled atomically.
- Schedule conflict detection compares the sessions of a student's approved registrations. Scores are issued only after participation is verified. Score and appeal decisions retain the acting user and timestamps for traceability.
- The AI assistant derives recommendations from UserInterest, activity category and schedule, registration history, and training-score gaps. A stored recommendation entity is unnecessary unless the product later needs to preserve recommendation history.
