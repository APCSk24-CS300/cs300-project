# Test Data Model: Core Schema Constraint Test Alignment

This is a fixture and relationship inventory for `db/schema_constraints_test.sql`, not a replacement schema. `db/schema.sql` is authoritative for exact columns and database constraints. Insert valid parent fixtures before their dependents; invalid statements are isolated by the existing SQLSTATE helper.

## Entity inventory and fixture dependencies

| Group | Tables | Fixture relationships and representative row-local rules |
|---|---|---|
| Reference and identity | `Role`, `Permission`, `RolePermission`, `Faculty`, `Major`, `Department`, `Club`, `Organization`, `ActivityCategory`, `AppealStatus`, `Semester`, `ScoreCriterion`, `ScoringPolicyVersion` | Unique/nonblank codes and names; allowed role and organization types; role-permission composite key; Major→Faculty; semester start before end; policy→criterion/semester, nonnegative weight/range/cap, and minimum not greater than maximum. Include every current appeal status. |
| User and profile | `User`, `UserRole`, `Student`, `Manager`, `Administrator`, `OrganizationMember`, `UserInterest` | User has text ID and unique email; roles are separate UserRole rows; grant actor is a User; profile PKs are User FKs; Student requires Faculty and positive enrollment year, with optional Major; membership uses Organization and User with a valid period and at most one active membership per organization/user; interest composite key references User and category. |
| Activities | `Activity`, `ActivityManage`, `ActivityFollow`, `ActivitySchedule`, `ActivityEligibility`, `ActivityScore` | Activity references Organization, Category, Semester, and creator; positive capacity and ordered registration dates; ActivityManage references Manager; ActivityFollow references Student; schedule has nonblank location and ordered dates; composite schedule/activity uniqueness; eligibility joins Activity and Faculty; ActivityScore joins Activity and policy with nonnegative base points. |
| Registration and participation | `Registration`, `Attendance`, `Participation` | Registration references Student and Activity; positive attempt number, valid status/date combinations, unique attempt/queue values, and one active attempt; Attendance's composite FKs must point to the same Activity and status is allowed; Participation has one unique Registration and verifier User. |
| Requests | `Appeal`, `RequestAssignment`, `RequestRevision`, `RecognitionRequestDetail`, `AppealEvidence` | Appeal references Student and AppealStatus; optional Registration must belong to submitter; type-specific nullable references and decision/withdrawal fields must agree; assignments reference Appeal and Manager, with one current assignment; revisions reference Appeal/User and have JSON values; recognition details reference Appeal/Semester and optional criterion; evidence references Appeal and uses allowed MIME type, nonblank storage key, and 1–10,485,760 byte size. |
| Recognition and scores | `Recognition`, `TrainingScore`, `ScoreChange`, `ScoreAdjustment` | Recognition links an approved-source Appeal to the submitter and to Semester, Criterion, and matching policy version; TrainingScore references exactly one Participation or Recognition and retains policy, criterion, and semester; points are nonnegative and source/criterion unique; ScoreChange requires score, actor, old/new values, and nonblank reason; ScoreAdjustment references Manager, ScoreChange, matching Score, and is unique per change. |
| Communication and administration | `ActivityAnnouncement`, `Notification`, `NotificationDelivery`, `ServiceLink`, `SystemSetting`, `AuditLog` | Announcement references Activity/User with nonblank title/body; Notification references User and optional Activity/Announcement/Appeal with nonblank content and valid read time; one email delivery per Notification with valid status/attempt/sent-time combination; ServiceLink has unique nonblank name and nonblank URL; settings have nonblank key/value; AuditLog has valid actor and nonblank entity/action/reason fields. |
| Existing backend token | `RefreshToken` | Token uses nonblank fixed-length primary key and references User. Keep fixture aligned to the exact current DDL without changing the schema definition. |

The groups contain all 45 tables declared by `db/schema.sql` at plan time. The test must compare the actual installed table-name set with its expected fixture inventory, then provide at least one valid row for each table. The inventory is deliberately table-name based rather than a bare count.

## Fixture dependency order

1. `Role`, `Permission`, `Faculty`, `Department`, `Club`, `ActivityCategory`, `AppealStatus`, `Semester`, `ScoreCriterion`, `Organization`.
2. `User`, then `UserRole`, role-specific profiles, `Major`, `ScoringPolicyVersion`, and `SystemSetting`.
3. Activity and policy fixtures, schedules, assignments, eligibility, follows, and activity scores.
4. Registration, attendance, participation, appeals, request histories/details, and evidence.
5. Recognition and score records, then score changes and adjustments.
6. Announcements, notifications and deliveries, audit records, and refresh tokens.

Where circular references exist, use the schema's supported nullable or deferred-reference sequence, then update the referencing row after its target exists. Do not use a fixture ordering shortcut that weakens a tested relationship.

## Verification boundaries

- Assert direct PK/FK/unique/not-null/check failures using the expected SQLSTATE where applicable.
- Cover the partial unique rules for active organization membership, current request assignment, and active registration attempt.
- Cover the composite Attendance relationship using a schedule and registration from different activities.
- Do not claim that SQL row constraints enforce authorization, capacity aggregation, eligibility, transitions, score totals, or event generation where the schema marks those rules as workflow responsibilities.
