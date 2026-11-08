# Entity audit against business requirements

Sources: `docs/analysis-and-design/db/business-requirements.md` and `docs/requirements/vision-document.md`. “Schema” means the relationship or row-level rule is enforced in `db/schema.sql`. “Workflow” identifies rules that require validation against other rows, permissions, or a transaction.

| Entity | Required purpose and schema coverage | Remaining workflow rule |
| --- | --- | --- |
| Role | One controlled role code per account; unique code | Cumulative permission grants and administrator-only changes |
| Permission | Unique action code | Action authorization |
| RolePermission | Unique role/action pair | Administrative maintenance and cumulative mapping |
| Faculty | Unique academic code and name | University verification of student faculty |
| ActivityCategory | Unique category name | Administrator maintenance |
| Semester | Unique year/term; ordered dates | University terminology and reporting |
| ScoreCriterion | Unique code; nonnegative maximum | Freeze code, name, and maximum once awarded |
| User | One role; unique email and student number | Verified identity, student number, active-account access |
| UserInterest | Unique user/category pair | Student-owned preference changes |
| Activity | Required category, semester, creator, capacity, registration window, status | Publish readiness, organizer authority, semester alignment |
| ActivityOrganizer | Unique activity/user assignment | Assigned user has activity management permission |
| ActivitySchedule | Activity session with ordered times | Session within semester, schedule conflicts |
| ActivityEligibility | Unique activity/faculty pair | Eligibility at registration |
| ActivityScore | Unique activity/criterion pair, signed points | Magnitude within criterion maximum |
| Registration | One application per student/activity; controlled status | Deadline, eligibility, capacity, waitlist order, permitted transitions |
| Attendance | One result per session/registration; same-activity links; controlled status | Recorder authority and completion of all sessions |
| Participation | One verified record per registration | Approved registration and verified attendance prerequisite |
| TrainingScore | Exactly one source; unique source/criterion pair | Source approval, semester, criterion, sign, maximum, awarder authority |
| ScoreChange | Required old/new points, actor, time, reason | Atomic previous/new value match and appeal provenance |
| Appeal | Type-specific references; complete resolved decisions; registration ownership | Score ownership, reviewer authority, status transitions |
| AppealEvidence | Supported file type and 1–10 MB size | File-content validation and access control |
| Recognition | Unique appeal and matching submitter | Approved recognition appeal, later-semester rule, duplicate-credit prevention |
| ActivityAnnouncement | Activity/author references and nonblank content | Assigned author authority |
| Notification | Recipient, channel, delivery state and timestamps | Delivery/retry behavior |
| ServiceLink | Unique nonblank name and URL | Link validation and administrator maintenance |
| SystemSetting | Nonblank key/value and updater reference | Authorized changes and immutable audit event |
| AuditLog | Required entity/action identifiers, actor/time and before/after fields | Append-only access and complete audit coverage |

The first 25 entities are specified in the database business requirements. `SystemSetting` and `AuditLog` come from the product vision and were preserved from the prior schema.
