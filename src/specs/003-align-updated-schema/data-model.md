# Data Model: Updated Business Schema Alignment

This maps the updated business requirements onto the existing initial schema. It is a design inventory for edits to `db/schema.sql`, not a migration or a new implementation file. Use the names in the business requirements; retain the existing table order where dependencies allow. `SystemSetting` remains an existing administrative table; `RefreshToken` remains byte-for-byte untouched.

## Reference, identity, and scope

| Entity | Key fields and relationships | Validation and alignment |
| --- | --- | --- |
| Role, Permission, RolePermission | Existing role and permission keys; composite role-permission key | Role codes become student, manager, administrator; no inherited role hierarchy. |
| UserRole | User and Role composite key; grant actor and time | Replaces the single `User.role_id` assumption; independent duties. |
| Faculty, Major, Department, Club | Existing Faculty; Major supports the documented `Student.major_id` foreign key; Department and Club are reference keys | Stable unit identifiers; a selected Major belongs to the student’s faculty. |
| Organization, OrganizationMember | Organization owner key; membership key with User, responsibility, start/end | Exactly one owner reference per Activity; ended memberships preserve history. |
| ActivityCategory, AppealStatus, Semester | Existing category/semester; new controlled appeal-status reference | Unique codes; semester date order; seven appeal statuses. |
| ScoreCriterion, ScoringPolicyVersion | Stable criterion key; policy-version key links criterion and semester | Version holds weight, nonnegative range and cap, activation time; used versions must not be rewritten. |
| User, Student, Manager, Administrator | User identity; profile PKs also FK to User | Phone, password hash, protected full name/student number/faculty; profile duties may coexist. Student faculty agrees with User faculty. |
| UserInterest, ActivityFollow | User-to-category and User-to-activity composite keys | One active follow per student and activity, independent of Registration. |

## Activities and participation

| Entity | Key fields and relationships | Validation and alignment |
| --- | --- | --- |
| Activity | Existing key; one Organization, Category, Semester, creator | Draft, published, ongoing, completed, cancelled; positive capacity; valid registration window; approval requirement and optional attendance rule. |
| ActivityManage | Existing two-key `ActivityOrganizer` assignment shape aligned to documented name and manager duty | Multiple managers per activity; authorization to act depends on role and active assignment. |
| ActivitySchedule, ActivityEligibility | Existing activity links; schedule key plus activity pair for same-activity FK | Session date order; eligible faculties; semester containment is a cross-row obligation. |
| ActivityScore | Activity and PolicyVersion key; nonnegative base points | Replaces direct criterion/possibly negative points; applied policy determines criterion and allowed range. |
| Registration | Existing key; Activity, student User, attempt number, status, registration and queue times | Pending Approval, Confirmed, Waitlisted, Rejected, Cancelled. Partial uniqueness over active states; terminal attempts retained. Waitlist order uses entry time and stable sequence. |
| Attendance | Existing schedule, registration, and shared activity composite relationships | Attended or absent only; absent row means no information. Keep same-activity composite FK enforcement. |
| Participation | Existing key and unique Registration link | Only a Confirmed registration can be verified; threshold or reasoned manager decision is a workflow rule. |

## Requests and scoring

| Entity | Key fields and relationships | Validation and alignment |
| --- | --- | --- |
| Appeal | Existing key and submitter; optional Activity/Registration/Score references; assignee, decision and withdrawal fields | Recognition, participation correction, missing/incorrect score correction; seven statuses. Missing-score case has no Score FK. Terminal decision and withdrawal fields must agree. |
| AppealEvidence | Existing key and Appeal FK | Private storage key, PDF/JPEG/PNG MIME type, positive size at most 10 MiB; at least one file on submission is a cross-row rule. |
| RecognitionRequestDetail | Appeal PK/FK | Title, occurrence time, internal flag, volunteering/academic/other category, target semester, optional proposed criterion. Distinct from catalog ActivityCategory. |
| RequestAssignment, RequestRevision | History keys and Appeal FK; assignee/assigner or editor, time, prior/new values | At most one current assignment; edits of unresolved requests preserve revisions; actor eligibility is a workflow rule. |
| Recognition | Existing key, unique approved Appeal, student, semester, criterion, policy version | Approved outcome only; submission details remain separate. |
| TrainingScore | Existing key, exactly one Participation or Recognition, PolicyVersion, criterion, semester, base/weighted/current points | Nonnegative award, unique source/criterion, retained policy. Initial missing-score award has no prior ScoreChange. |
| ScoreChange, ScoreAdjustment | Existing change key; new adjustment key with unique Change FK | Old/new score values and reason; approved delta links exactly one change and is counted once. Atomic decision and score effects require a transaction. |

## Communications and administration

| Entity | Key fields and relationships | Validation and alignment |
| --- | --- | --- |
| ActivityAnnouncement | Existing key, Activity and author | Nonblank title and body. |
| Notification | Existing key, recipient and optional Activity, Announcement, Appeal | In-app message and read time; remove the obsolete combined delivery-state interpretation. |
| NotificationDelivery | New key, Notification and channel unique pair | Durable email attempt count, Pending/Retrying/Sent/Exhausted, last error and sent time; retry updates the same row. |
| AuditLog | Existing key, actor, action, entity, time, reason, before/after data | General protected history; event creation and append-only behavior need transaction/authorization enforcement. |
| ServiceLink, SystemSetting | Existing keys and current link/setting attributes | Keep usable; do not introduce unrelated redesign. |
| RefreshToken | Existing backend table | Preserve its entire original SQL block byte-for-byte. |

## State and enforcement boundary

- **Activity**: Draft → Published or Cancelled; Published → Ongoing or Cancelled; Ongoing → Completed or Cancelled. Completed and Cancelled are terminal.
- **Registration**: Pending Approval and Confirmed reserve capacity; Waitlisted does not. Rejected and Cancelled are terminal attempts, after which a new attempt may be made. Admission, promotion, displacement, and capacity serialization require workflow transactions.
- **Appeal**: Pending Assignment, Pending Review, Under Review, Additional Information Required, Approved, Rejected, Withdrawn. Only unresolved requests may be revised or withdrawn; eligibility and transition checks require actor-aware workflow enforcement.
- **Scoring**: A version is applied to each award and retained. Row-local nonnegative and source-exclusivity rules belong in SQL. Policy preview, historical immutability, score-cap aggregation, and atomic approval effects require controlled transactions or later workflow logic.
- **Notification**: The in-app row and email delivery row have different lifecycles. Unique notification/channel delivery and local status validity belong in SQL; reliable creation, retry dispatch, and duplicate external-email avoidance require workflow handling.
