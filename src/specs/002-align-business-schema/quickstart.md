# Quickstart: Validate Business Schema

## Prerequisites

- PostgreSQL 18 tools (`initdb`, `pg_ctl`, `psql`) or a disposable PostgreSQL 18 container.
- A disposable cluster with database-creation permission. Never run the bootstrap against a populated application database.

## Validation path

1. Start a disposable PostgreSQL 18 instance and connect to its default `postgres` database.
2. Load `db/schema.sql` using `psql -X -v ON_ERROR_STOP=1 -d postgres -f db/schema.sql`. Expect the `myHCMUS` database and all 27 tables to be created without errors.
3. Connect to `myHCMUS` and run `psql -X -v ON_ERROR_STOP=1 -d myHCMUS -f db/schema_constraints_test.sql`. Expect the script to reach `DO` and `ROLLBACK` without error; it leaves no sample rows.
4. Run `git diff --check`. Expect no whitespace errors.
5. Review [schema-contract.md](contracts/schema-contract.md) and [entity-audit.md](entity-audit.md) for group-level and deferred workflow requirements.

## Before each entity-group commit

- Expand the regression cases for that group, including at least one valid case and each documented invalid boundary.
- Recreate the disposable database and rerun the full validation path.
- Review the staged diff for only that group and its related documentation or tests.
- Commit the group after the feature specification review gate is satisfied.

## Existing installations

Inventory current tables and row counts, map old to new identifiers, identify invalid legacy rows, and prepare a reversible migration. The bootstrap script is not a migration procedure.

## Recorded validation

On 2026-11-08, each of the four staged entity-group snapshots loaded in an isolated PostgreSQL 18 cluster and its group regression cases passed. The final 27-table bootstrap and expanded constraint suite also passed, including 53 expected constraint rejections. The suite uses one valid fixture for each table, exercises both score-source branches, and rolls back its sample rows.

## Twenty-case requirements review sample

A peer reviewer should classify each case as accepted or rejected and name the rule behind every rejection before comparing with this answer key. These examples are drawn from db/schema_constraints_test.sql; the assessment concerns the written data requirements, while the SQL suite separately checks implementation behavior.

| Case | Input condition | Expected classification and reason |
| --- | --- | --- |
| 01 | Role code student | Accept: controlled role |
| 02 | Role code other | Reject: unsupported role |
| 03 | Duplicate permission code | Reject: unique action code |
| 04 | Faculty code F1 with unique ID | Accept: distinct faculty |
| 05 | Duplicate faculty code | Reject: unique academic code |
| 06 | Semester with start before end | Accept: ordered semester |
| 07 | Semester with end before start | Reject: ordered semester |
| 08 | Criterion maximum -1 | Reject: maximum is nonnegative |
| 09 | User with no faculty and no student number | Accept: nonstudent staff may omit academic fields |
| 10 | Duplicate student number | Reject: unique verified identifier |
| 11 | Activity capacity 1 | Accept: positive capacity |
| 12 | Activity capacity 0 | Reject: capacity must exceed zero |
| 13 | Registration window closes before opening | Reject: ordered window |
| 14 | Duplicate activity/student registration | Reject: one application per pair |
| 15 | Attendance session and registration from different activities | Reject: same-activity relationship |
| 16 | Participation correction referencing another student's registration | Reject: registration ownership |
| 17 | Approved appeal without reviewer/response/time | Reject: complete decision |
| 18 | Training score with both participation and recognition sources | Reject: exactly one source |
| 19 | PDF evidence of 10,485,760 bytes | Accept: supported type and maximum size |
| 20 | Sent notification without send time | Reject: delivery state requires timestamp |

The reviewer records the classification and reason for all 20 rows. SC-003 passes when all invalid rows have the expected reason; discrepancies lead to a specification correction before implementation is considered complete.
