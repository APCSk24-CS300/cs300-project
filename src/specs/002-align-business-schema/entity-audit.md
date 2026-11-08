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

## Cross-record enforcement boundary

| Rule family | Required condition | Boundary | Follow-on owner |
| --- | --- | --- | --- |
| Published readiness | At least one assigned organizer and one session; sessions fit the semester | Publish transaction | Activity service |
| Capacity and waiting list | Approved count at most capacity; serialize seat changes; promote earliest eligible waitlist entry by registered_at then registration_id once | Seat transaction | Registration service |
| Permission and ownership | Role grants action, activity is assigned, student data belongs to requester, inactive users are denied | Every protected command and query | Authorization service |
| Participation and score provenance | Approved registration and complete attendance precede participation; scores use their source's semester and criterion | Verification and award transactions | Participation and score services |
| Criterion history | Code, meaning, and maximum remain fixed after first award; new rules create new records | Criterion update | Criteria service |
| Score adjustment | Old/new values match the award immediately before/after; history and update are atomic | Adjustment transaction | Score service |
| Appeal and recognition | Only authorized review, approved source appeal, matching owner, and no duplicate prior-activity credit | Review and recognition transaction | Appeal service |
| Audit and notification | Protected successful changes create immutable before/after events; delivery failure does not block core workflow | Mutation and delivery transactions | Audit and notification services |
| Evidence | Actual file type/size checked; access limited to student and authorized staff; three-year retention after resolution | File boundary and retention job | Evidence service |

The detailed action and rule list is in contracts/schema-contract.md. These are follow-on obligations; the bootstrap schema enforces only the direct keys, references, and row-level checks shown in the main table.

## Reconciliation notes

- The database business requirements govern stored names and statuses. The product vision's “ongoing” activity state is derived for presentation from published activity sessions.
- Category becomes ActivityCategory, StudentRequest becomes Appeal and Recognition, and ScoreAward becomes TrainingScore with ScoreChange history. The populated-database mapping is documented in research.md.
- SystemSetting and AuditLog remain because the product vision requires configuration and audit history even though the dedicated database entity list omits them.
- All 27 current schema table names match the 27 audited entity rows. The complete regression suite includes valid fixtures for every table and 53 expected constraint rejections.
