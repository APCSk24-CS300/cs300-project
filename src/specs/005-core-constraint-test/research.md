# Research: Core Schema Constraint Test Alignment

## Findings

| Topic | Finding |
|---|---|
| Authoritative executable structure | `db/schema.sql` currently declares 45 tables. It uses `UserRole` for independent duties; `Student`, `Manager`, and `Administrator` reference `User`; `Student.user_id` is the student identity; Student faculty is stored on `Student`. |
| Business model reference | `specs/003-align-updated-schema/data-model.md` documents the updated entity groups and workflow-only boundaries. The database business requirements under `docs/analysis-and-design/db/` provide the business rules; older schema planning notes contain superseded inventories. |
| Existing test mismatch | `db/schema_constraints_test.sql` still inserts obsolete role codes and uses the removed `User.role_id`, `User.student_number`, and `User.faculty_id` columns. Its final assertion expects 27 tables, while the current DDL declares 45. |
| Existing test conventions | The test already wraps fixtures in one transaction and uses `expect_sqlstate` to distinguish expected database rejection from unexpected success. Preserve that pattern. |
| Safety boundary | `db/schema.sql` creates the fixed `myHCMUS` database. Running it against a shared or populated PostgreSQL instance risks colliding with existing state; verification must use a disposable instance. |

## Decisions

| Decision | Rationale | Alternatives considered |
|---|---|---|
| Use current `db/schema.sql` for exact table and constraint names, with the updated data model and business requirements for intent. | This reflects both the actual DDL and approved relationship semantics while exposing any design/document drift. | Use the original `002-align-business-schema` spec or old test inventory, both of which describe a superseded model. |
| Replace total-only table-count checking with an explicit table-name coverage manifest compared with the installed schema. | A table-set mismatch identifies an untested addition or obsolete expectation; a count alone can pass when one table is missing and another is unexpected. | Keep the hard-coded count of 27 or update it to 45, which repeats the same blind spot on the next model change. |
| Create valid fixtures in foreign-key dependency order and group invalid cases by entity. | This makes failures local and keeps test setup understandable. | Broad fixture inserts that obscure which required parent or constraint is missing. |
| Retain transaction rollback and SQLSTATE assertions. | These are already established in the test and ensure fixture cleanup plus precise rejection checks. | Deleting fixtures manually or accepting any SQL error, which can hide bad test setup. |
| Keep cross-row and workflow behavior out of the SQL constraint suite unless explicitly enforced by DDL. | The schema itself documents authorization, transition, and aggregate rules as service/transaction responsibilities. | Testing workflow behavior as if a row constraint guaranteed it. |

## Resolved Unknowns

- **Table inventory**: 45 tables at planning time, sourced from the current schema file; new table additions require a fixture and an inventory update.
- **PostgreSQL version and runner**: PostgreSQL 18 and `psql`, matching the existing schema plan and repository quickstart.
- **External interface**: None. The test is an internal SQL artifact, so a contracts directory is not applicable.

No unresolved `[NEEDS CLARIFICATION]` item remains.
