# Development seed data

## Administrator login

**Email: `admin@example.com`**  
**Password: `DemoPassword123!`**  
**User ID: `SEED-ADMIN` — Role: Administrator**

This active demo account has the Administrator profile and administrative permissions.

## Running the seed

Apply `schema.sql` to a PostgreSQL server, then run the activator:

```sh
cd src/db
psql -v ON_ERROR_STOP=1 -d postgres -f schema.sql
psql -d myHCMUS -f seed.sql
```

Add your connection flags (`-h`, `-p`, `-U`) as needed. `schema.sql` creates and connects to `myHCMUS`. All three subscripts are resolved relative to `seed.sql`, so the activator can also run from any working directory using its absolute path. `activities.csv` is not required at runtime.

`seed.sql` runs these three subscripts in order within one transaction:

1. `seed_lookups_and_junctions.sql` inserts lookup/reference values and defines a temporary helper containing all junction-table inserts.
2. `seed_entities.sql` creates all non-AI entity fixtures, including demo accounts, the 100 embedded original activities, schedules, registrations, participation, appeals, scores, and notifications. The activator then calls the junction helper and removes it. The helper also checks that all 45 core tables contain data and that all 100 original activities were inserted.
3. `seed_ai.sql` adds fixtures for the seven AI tables when the AI schema is installed; otherwise it skips them.

The CSV remains a source reference; changes to it must also be reflected in the embedded rows in `seed_entities.sql`. A separate completed demo activity provides coherent historical registrations, attendance, participation, recognition, appeals, and score adjustments. The 100 original activities also receive schedules, managers, eligibility, and scoring policies.

Run once against a fresh schema. The seed uses one transaction with error stopping: a conflict or invalid row rolls back the entire seed. It does not delete or overwrite existing application records. No semester or creator command-line variables are required. The seeded semester covers September 2026 through January 2027.

Demo accounts (all use `DemoPassword123!`, stored as a bcrypt hash):

| Email | Role |
| --- | --- |
| **admin@example.com** | **Administrator** |
| manager@example.com | Manager |
| student1@example.com | Student |
| student2@example.com | Student |
| student3@example.com | Student |

Evidence rows contain sample storage metadata; matching files are not uploaded. The refresh-token row is a synthetic identifier, not an issued login token. Email delivery rows are pending demo intents.

For AI table fixtures, apply `ai_schema.sql` before `seed.sql` on a server with pgvector installed. `seed_ai.sql` then supplies examples for all seven AI tables; otherwise it skips them. The AI schema supplies its own default settings, and seed permissions work with either installation order. The knowledge chunk uses a synthetic 768-dimensional embedding and is inactive; replace it through the indexing pipeline before enabling it. AI usage, requests, consent, and flags are synthetic historical fixtures.

## Lookup table values

The following tables list every lookup/reference row supplied by `seed_lookups_and_junctions.sql`. Identity IDs are shown for a fresh schema; PostgreSQL assigns them, and the seed resolves references by code or name. Empty optional values are shown as `—`. `seed time` means the transaction timestamp. Existing permission and appeal-status rows are preserved on conflict, so their descriptions/names can differ if previously populated.

### `Role`

| `role_id` | `code` | `name` | `description` |
| --- | --- | --- | --- |
| 1 | student | Student | — |
| 2 | manager | Manager | — |
| 3 | administrator | Administrator | — |

### `Permission`

| `permission_id` | `code` | `description` |
| --- | --- | --- |
| 1 | registration.create | Register for activities |
| 2 | registration.review | Review registrations |
| 3 | activity.manage | Manage assigned activities |
| 4 | attendance.record | Record attendance |
| 5 | score.submit | Award training scores |
| 6 | score.adjust | Adjust training scores |
| 7 | appeal.submit | Submit requests and appeals |
| 8 | appeal.review | Review assigned appeals |
| 9 | criteria.manage | Manage scoring criteria |
| 10 | reports.view | View administrative reports |
| 900 | ai.chat | Use the AI assistant |
| 901 | ai.chat.manager_tools | Use event-planning tools |
| 902 | ai.usage.read | View AI usage |
| 903 | ai.flags.review | Review AI flags |
| 904 | ai.settings.manage | Manage AI settings |
| 905 | ai.knowledge.manage | Manage AI knowledge |

### `Faculty`

| `faculty_id` | `code` | `name` |
| --- | --- | --- |
| SEED-FAC-IT | IT | Faculty of Information Technology |
| SEED-FAC-MCS | MCS | Faculty of Mathematics and Computer Science |

### `Major`

| `major_id` | `faculty_id` | `name` |
| --- | --- | --- |
| SEED-MAJ-CS | SEED-FAC-MCS | Computer Science |
| SEED-MAJ-SE | SEED-FAC-IT | Software Engineering |

### `Department`

| `department_id` | `code` | `name` |
| --- | --- | --- |
| SEED-DEP-AFFAIRS | AFFAIRS | Student Affairs Office |
| SEED-DEP-CAREER | CAREER | Career Services Center |

### `Club`

| `club_id` | `code` | `name` |
| --- | --- | --- |
| SEED-CLUB-1 | CLUB-1 | Academic Skills Club |
| SEED-CLUB-10 | CLUB-10 | Robotics and AI Club |
| SEED-CLUB-11 | CLUB-11 | Student Union |
| SEED-CLUB-12 | CLUB-12 | Student Volunteer Network |
| SEED-CLUB-13 | CLUB-13 | University Sports Club |
| SEED-CLUB-2 | CLUB-2 | Arts and Culture Club |
| SEED-CLUB-3 | CLUB-3 | Business and Economics Club |
| SEED-CLUB-4 | CLUB-4 | Computer Science Club |
| SEED-CLUB-5 | CLUB-5 | English Speaking Club |
| SEED-CLUB-6 | CLUB-6 | Environmental Research Group |
| SEED-CLUB-7 | CLUB-7 | Green Campus Club |
| SEED-CLUB-8 | CLUB-8 | International Student Club |
| SEED-CLUB-9 | CLUB-9 | Photography Club |

### `Organization`

| `organization_id` | `name` | `type` | `is_active` |
| --- | --- | --- | --- |
| 1 | Academic Skills Club | club | true |
| 2 | Arts and Culture Club | club | true |
| 3 | Business and Economics Club | club | true |
| 4 | Career Services Center | department | true |
| 5 | Computer Science Club | club | true |
| 6 | English Speaking Club | club | true |
| 7 | Environmental Research Group | club | true |
| 8 | Faculty of Mathematics and Computer Science | faculty | true |
| 9 | Green Campus Club | club | true |
| 10 | International Student Club | club | true |
| 11 | Photography Club | club | true |
| 12 | Robotics and AI Club | club | true |
| 13 | Student Affairs Office | student_affairs_office | true |
| 14 | Student Union | club | true |
| 15 | Student Volunteer Network | club | true |
| 16 | University Sports Club | club | true |

### `ActivityCategory`

| `category_id` | `name` | `description` |
| --- | --- | --- |
| 1 | Academic Workshop | Activities in the academic workshop category. |
| 2 | Arts and Creativity | Activities in the arts and creativity category. |
| 3 | Career Development | Activities in the career development category. |
| 4 | Community Service | Activities in the community service category. |
| 5 | Cultural Event | Activities in the cultural event category. |
| 6 | Environmental Sustainability | Activities in the environmental sustainability category. |
| 7 | Health and Wellbeing | Activities in the health and wellbeing category. |
| 8 | Leadership and Personal Development | Activities in the leadership and personal development category. |
| 9 | Sports and Recreation | Activities in the sports and recreation category. |
| 10 | Technology and Innovation | Activities in the technology and innovation category. |

### `AppealStatus`

| `appeal_status_id` | `code` | `name` |
| --- | --- | --- |
| 1 | pending_assignment | Pending Assignment |
| 2 | pending_review | Pending Review |
| 3 | under_review | Under Review |
| 4 | additional_information_required | Additional Information Required |
| 5 | approved | Approved |
| 6 | rejected | Rejected |
| 7 | withdrawn | Withdrawn |

### `Semester`

| `semester_id` | `quarter_academic_year` | `starts_at` | `ends_at` |
| --- | --- | --- | --- |
| 20261 | 12026  | 2026-09-01 | 2027-01-31 |

### `ScoreCriterion`

| `criterion_id` | `code` | `name` | `description` | `is_active` |
| --- | --- | --- | --- | --- |
| 1 | SEED-COMMUNITY | Community engagement | Demo community-service scoring criterion. | true |
| 2 | SEED-ACADEMIC | Academic development | Demo academic-development scoring criterion. | true |

### `ScoringPolicyVersion`

| `policy_version_id` | `criterion_id` | `semester_id` | `activation_at` | `weight` | `min_points` | `max_points` | `semester_cap` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 20261 | 2026-09-01T00:00:00+07:00 | 1.0 | 0.0 | 10.0 | 30.0 |
| 2 | 2 | 20261 | 2026-09-01T00:00:00+07:00 | 1.0 | 0.0 | 10.0 | 30.0 |

### `ServiceLink`

| `service_id` | `name` | `url` | `description` | `display_order` | `is_active` |
| --- | --- | --- | --- | --- | --- |
| 1 | HCMUS | https://hcmus.edu.vn | University website | 1 | true |
| 2 | Student Portal | https://portal.hcmus.edu.vn | Student academic services | 2 | true |

### `SystemSetting`

| `setting_key` | `setting_value` | `updated_by_user_id` | `updated_at` |
| --- | --- | --- | --- |
| app.name | myHCMUS | SEED-ADMIN | 2026-09-01T08:00:00+07:00 |
| seed.dataset_version | 2026-11-v1 | SEED-ADMIN | seed time |
| semester.current_id | 20261 | SEED-ADMIN | 2026-09-01T08:00:00+07:00 |

### Optional AI settings in `SystemSetting`

When `ai_schema.sql` is applied, it also adds these defaults with no updater user; `updated_at` defaults to that schema transaction's time. They are defined by `ai_schema.sql`, rather than the development seed, and existing values are preserved.

| `setting_key` | `setting_value` |
| --- | --- |
| ai.enabled | true |
| ai.monthly_budget_usd | 5.00 |
| ai.budget_alert_percent | 80 |
| ai.limit.5h.student | 40000 |
| ai.limit.week.student | 200000 |
| ai.limit.5h.manager | 80000 |
| ai.limit.week.manager | 400000 |
| ai.limit.min_units | 500 |
| ai.limit.project_rpm | 8 |
| ai.limit.project_rpd | 200 |
| ai.model.chat | gemini-2.5-flash |
| ai.model.classifier | gemini-2.5-flash-lite |
| ai.model.embedding | gemini-embedding-001 |
| ai.price.gemini-2.5-flash | {"in_per_1m": 0.30, "out_per_1m": 2.50} |
| ai.price.gemini-2.5-flash-lite | {"in_per_1m": 0.10, "out_per_1m": 0.40} |
| ai.notice.version | 1 |

## Junction table fixtures

All non-AI junction inserts live in `seed_lookups_and_junctions.sql`. Its temporary helper runs after the entity inserts so all referenced rows exist. It also links the three base system settings to `SEED-ADMIN` as their updater.

| Table | Rows | Seeded relationships |
| --- | --- | --- |
| `RolePermission` | 17 | Student: `registration.create`, `appeal.submit`, `ai.chat`. Manager: `registration.review`, `activity.manage`, `attendance.record`, `score.submit`, `score.adjust`, `appeal.review`, `ai.chat`, `ai.chat.manager_tools`. Administrator: `criteria.manage`, `reports.view`, `ai.usage.read`, `ai.flags.review`, `ai.settings.manage`, `ai.knowledge.manage`. |
| `UserRole` | 5 | Admin → administrator; manager → manager; three students → student. Granted by `SEED-ADMIN`. |
| `OrganizationMember` | 16 | `SEED-MANAGER` coordinates every seeded organization from September 1, 2026, with no end date. |
| `UserInterest` | 6 | Every seeded student has interests in Academic Workshop and Community Service. |
| `ActivityManage` | 101 | `SEED-MANAGER` manages every seeded activity. |
| `ActivityEligibility` | 202 | Both seeded faculties are eligible for every seeded activity. |
| `ActivityScore` | 101 | Every activity offers 5 base points under the `SEED-COMMUNITY` semester policy. |
| `ActivityFollow` | 6 | Every seeded student follows `ACT001` and `ACT008`. |
| `Attendance` | 2 | For the completed demo activity, student 1 attended and student 2 was absent. |
| `RequestAssignment` | 3 | All three seeded appeals are assigned to `SEED-MANAGER` by `SEED-ADMIN`; reviewed assignments are closed and the participation correction remains open. |

AI associations, including `AiConsent` and `AiUsageWindow`, remain with all other AI data in `seed_ai.sql`.
