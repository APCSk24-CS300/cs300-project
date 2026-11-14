# Data Model: Align Business Schema

Source: `docs/analysis-and-design/db/business-requirements.md`. The product-wide additions come from `docs/requirements/vision-document.md`. `db/schema.sql` is the intended initial-schema artifact; this document describes the design contract.

## 1. Reference and access

| Entity | Key fields | Relationships and validation |
| --- | --- | --- |
| Role | `role_id`, unique `code`, `name`, `description` | Code is student, organizer, reviewer, or administrator. One role per user. |
| Permission | `permission_id`, unique `code`, `description` | Action names are nonblank. |
| RolePermission | `role_id`, `permission_id` | Composite key; references role and permission. Cumulative grants are policy-managed. |
| Faculty | `faculty_id`, unique `code`, `name` | Referenced by users and activity eligibility. |
| ActivityCategory | `category_id`, unique `name`, `description` | Referenced by interests and activities. |
| Semester | `semester_id`, `academic_year`, `term`, `starts_at`, `ends_at` | Unique year/term; start precedes end. |
| ScoreCriterion | `criterion_id`, unique `code`, `name`, `description`, `max_points`, `is_active` | Maximum is nonnegative; criterion meaning and maximum freeze after use. |
| User | `user_id`, `role_id`, unique `email`, `password_hash`, `full_name`, optional unique `student_number`, optional `faculty_id`, `avatar_url`, `is_active`, `created_at` | One role, optional faculty; university verification precedes student actions. |
| UserInterest | `user_id`, `category_id` | Composite key; student preference mapping. |

## 2. Activities and enrollment

| Entity | Key fields | Relationships and validation |
| --- | --- | --- |
| Activity | `activity_id`, `title`, `description`, `eligibility_notes`, `category_id`, `semester_id`, `capacity`, registration window, `status`, creator, creation time | One category, semester, creator; positive capacity; opening precedes closing. |
| ActivityOrganizer | `activity_id`, `user_id` | Composite key; assigned organizer needs activity-management permission. |
| ActivitySchedule | `schedule_id`, `activity_id`, start/end, `location` | Session belongs to activity; start precedes end; session must fit semester. |
| ActivityEligibility | `activity_id`, `faculty_id` | Composite key; zero rows means all faculties eligible. |
| ActivityScore | `activity_id`, `criterion_id`, `points` | Composite key; signed magnitude must not exceed criterion maximum. |
| Registration | `registration_id`, `activity_id`, `user_id`, `status`, `registered_at`, optional decision actor/time | Unique activity/student pair; capacity counts approved rows only. |
| Attendance | `schedule_id`, `registration_id`, `activity_id`, `status`, recorder/time | Composite session/registration key; both must belong to the same activity. |

**Activity states**: draft → published → completed, with cancellation from draft or published. Other transitions require explicit product decision.
**Registration states**: pending → approved, waitlisted, rejected, or cancelled; waitlisted → approved or cancelled. Rejected/cancelled applications retain the unique activity/student pair.
**Attendance states**: present, absent, or excused. A correction must preserve who made the change and why at the workflow level.

## 3. Participation and scoring

| Entity | Key fields | Relationships and validation |
| --- | --- | --- |
| Participation | `participation_id`, unique `registration_id`, verifier/time | One verified participation per approved registration after attendance review. |
| TrainingScore | `score_id`, optional `participation_id`, optional `recognition_id`, `criterion_id`, `semester_id`, `points_awarded`, awarder/time | Exactly one source; unique source/criterion pair; period, criterion, sign, and maximum follow source. |
| ScoreChange | `change_id`, `score_id`, optional `appeal_id`, old/new points, actor/time, reason | Each adjustment has one history row in the same transaction as the score update. |

Score totals are calculated from current awards with their changes; they are not stored as a separate mutable total. Historical criterion rows remain available even after deactivation.

## 4. Appeals and communication

| Entity | Key fields | Relationships and validation |
| --- | --- | --- |
| Appeal | `appeal_id`, submitter, optional activity/registration/score references, `type`, `description`, `status`, optional reviewer/response/time | Type determines permitted reference; resolved decisions require actor, response, and time. Registration reference belongs to submitter. |
| AppealEvidence | `evidence_id`, `appeal_id`, `file_url`, description, content type, byte size, upload time | PDF/JPEG/PNG and 1–10 MB; file content and access checked outside row constraint. |
| Recognition | `recognition_id`, unique `appeal_id`, student, title, event time, target semester/criterion, verifier/time | Student matches appeal submitter; approved recognition appeal required. |
| ActivityAnnouncement | `announcement_id`, activity, author, title/body, publication time | Assigned organizer authority. |
| Notification | `notification_id`, recipient, optional activity, type/message, channel, delivery state, creation/send/read times | Sent state requires send time; timestamps follow creation. |
| ServiceLink | `service_id`, unique name, URL, description, display order, active flag | Administrator-managed external link. |
| SystemSetting | `setting_key`, value, updater/time | Product-wide configuration; changes require authorization and audit. |
| AuditLog | `audit_id`, actor, entity type/id, action, before/after values, time | Append-only history for protected changes. |

**Appeal types**: recognition (no registration or score reference), participation correction (registration reference), score correction (score reference).
**Appeal states**: submitted → in_review → approved or rejected. A decision change returns to in_review before a new decision.

## Cross-Record Invariants

- Assigned organizer and role permissions govern activity, registration, attendance, and scoring actions.
- Registration admission checks published state, window, verified student identity, eligibility, capacity, and serialized waitlist order.
- Participation requires approved registration and complete attendance or an approved correction.
- Internal scores require verified participation and the activity's semester and advertised criterion. Recognition scores require approved recognition and its target semester/criterion.
- Score updates and ScoreChange insertion are atomic. Appeal ownership and review authority precede decisions.
- These invariants need transaction-level design and dedicated integration tests; row-local constraints alone do not establish them.
