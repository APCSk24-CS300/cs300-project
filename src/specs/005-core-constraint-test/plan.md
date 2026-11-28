# Implementation Plan: Core Schema Constraint Test Alignment

**Branch**: `fix/db/update-core-schema-test` | **Date**: 2026-11-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-core-constraint-test/spec.md`

## Summary

Replace the stale core constraint fixtures with fixtures for the current schema design. Treat `db/schema.sql` as authoritative for actual table and constraint names, and `specs/003-align-updated-schema/data-model.md` plus the database business requirements as references for intended entity relationships. Cover the current 45-table inventory, including separate `UserRole`, `Student`, `Manager`, and `Administrator` records, with dependency-ordered valid fixtures and focused invalid cases for row-local constraints. Keep the test transactional and leave the schema and application code unchanged.

## Technical Context

**Language/Version**: PostgreSQL 18 SQL

**Primary Dependencies**: PostgreSQL 18 server and `psql`; no new runtime dependency

**Storage**: Disposable PostgreSQL database created by `db/schema.sql`

**Testing**: `db/schema_constraints_test.sql`, `psql -X -v ON_ERROR_STOP=1`; verify the suite reaches its completion assertion and transaction rollback

**Target Platform**: Linux development environment or isolated PostgreSQL 18 container

**Project Type**: Database schema and SQL verification suite

**Performance Goals**: No new performance target; suite should finish as a local verification step

**Constraints**: Test only declared schema-level rules; do not assert workflow guarantees that the DDL does not enforce. The bootstrap creates the fixed `myHCMUS` database, so validation must use an empty disposable PostgreSQL instance. Keep fixtures in a transaction and roll them back.

**Scale/Scope**: All 45 tables currently declared in `db/schema.sql`, with valid fixture coverage and representative invalid cases for declared PK, FK, UNIQUE, NOT NULL, partial-unique, and CHECK constraints.

## Constitution Check

| Principle | Plan alignment | Status |
|---|---|---|
| I. Architecture references `docs/` | Use the database business requirements and updated schema design as business references; use the executable DDL for exact structure. | Pass |
| I. Clear boundaries | Change only the core SQL verification; no application business logic or schema behavior is added. | Pass |
| II. Maintainability | Reuse the existing SQLSTATE assertion helper and organize cases by schema entity groups and FK dependency order. | Pass |
| III. Reviewed specification and acceptance | This plan follows the new spec and its checklist. Implementation remains gated on requester review of the spec and plan. | Review before implementation |
| IV. Automated tests | The feature is the database regression suite itself; execute it on a fresh disposable instance and record the actual outcome. | Pass |
| V. Data integrity and security | Schema remains unchanged; test fixtures never target a populated database and are rolled back. | Pass |
| V. Simplicity | Use native SQL inserts, constraint failures, and transaction rollback; add no dependency or trigger framework. | Pass |

No constitution MUST violation is introduced. The implementation gate for a reviewed specification is not waived by this plan.

## Project Structure

### Documentation (this feature)

```text
specs/005-core-constraint-test/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

No external contract is required; this feature changes an internal SQL verification artifact.

### Source Code (repository root)

```text
db/
├── schema.sql                       # Read-only executable schema reference
└── schema_constraints_test.sql      # Replace obsolete fixtures and assertions
```

**Structure Decision**: Keep the test beside the bootstrap schema. Do not modify `db/schema.sql`, application code, seed data, or other schema-specific test suites.

## Implementation Sequence

1. **Schema inventory and fixture foundation**: Build an explicit table-name coverage manifest from the current 45-table schema. Replace obsolete User and Role fixtures with `UserRole` plus role-specific records; add parent/reference fixtures in dependency order.
2. **Valid coverage and current relationships**: Add at least one valid record for every table, including optional-reference cases and composite relationship cases. Keep fixture values internally consistent across Student, Manager, Administrator, organization, request, score, and notification records.
3. **Invalid constraint regressions**: Replace outdated rejection statements with focused cases for current PK/FK, unique and partial unique, not-null, and check constraints. Preserve the existing SQLSTATE assertion style and ensure a test fails on unexpected success or an unexpected SQLSTATE.
4. **Disposable verification**: Load `db/schema.sql` and run the complete constraint test on a fresh PostgreSQL 18 instance. Confirm the entity inventory matches the schema, all valid/invalid cases pass, and the transaction leaves no test rows.

## Validation Boundaries

- Direct DDL rules belong in this test: foreign keys, uniqueness, nullability, controlled-value checks, row-local date/value checks, and composite foreign-key consistency.
- Rules explicitly identified in schema comments as workflow responsibilities remain outside this test, including role authorization, multi-row capacity, request transition authorization, score aggregation, and audit-event generation.
- The expected entity inventory is compared by table names rather than a total-count-only assertion. A new schema table must be added to the fixture coverage manifest and receive a valid fixture.
- When a business design document differs from the executable DDL, record the discrepancy and follow the approved current schema design; do not revive fields absent from the current schema.

## Post-Design Constitution Check

The test-only scope keeps business rules out of application modules, adds no dependency, and isolates all database writes in a disposable instance and rollback transaction. The reviewed-spec gate remains required before implementation. No unresolved technical choices remain.
