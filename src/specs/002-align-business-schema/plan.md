# Implementation Plan: Align Business Schema

**Branch**: `feat/db/schema` | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-align-business-schema/spec.md`

## Summary

Align the initial PostgreSQL schema with the 25 entities and explicit constraints in `docs/analysis-and-design/db/business-requirements.md`, preserving the setting and audit records required by `docs/requirements/vision-document.md`. Implement and validate one dependency-ordered entity group at a time, then make one focused commit after that group's schema, tests, and documentation pass. Catalog cross-record authorization, capacity, scoring provenance, and audit-event coverage as explicit follow-on workflow rules; this schema feature does not implement those protected operations.

## Technical Context

**Language/Version**: PostgreSQL 18 SQL; TypeScript 6.0 for later service work
**Primary Dependencies**: `psql`, PostgreSQL 18; no new runtime dependency for schema work
**Storage**: PostgreSQL 18
**Testing**: Disposable PostgreSQL instance, `psql -v ON_ERROR_STOP=1`, `db/schema_constraints_test.sql`; `git diff --check`
**Target Platform**: Linux development environment and PostgreSQL 18 container
**Project Type**: Web service with a database schema; application service is under `server/`
**Performance Goals**: Support 200 registration requests per minute for one activity and 2,000 activities per semester as stated in the vision document; query and concurrency design are later service tasks
**Constraints**: No invalid references or duplicate business keys; historical score records retained; evidence PDF/JPEG/PNG up to 10 MB; new schema must not be applied destructively to populated databases
**Scale/Scope**: 25 database business entities plus `SystemSetting` and `AuditLog`; initial schema and focused constraint tests

## Constitution Check

*Gate: reviewed before research and again after design.*

| Principle | Plan response | Status |
| --- | --- | --- |
| Architecture follows `docs/` | Use the dedicated database business requirements and product vision as source documents; retain the entity audit and document source differences. | Pass |
| Clear interfaces and separated business logic | Define schema contract for record-level invariants. Put cross-record permissions and transactions in service-layer follow-on work. | Pass |
| Reviewed spec before implementation | The user directed resolution of all custom checklist items and continuation; the revised specification and checked requirements review are recorded. | Pass |
| Tests and static checks | Each group gets valid and invalid database cases before its commit; run schema load and `git diff --check`. | Pass |
| Data integrity and existing data | Treat `schema.sql` as initial creation; use a separate migration and data audit for any populated installation. | Pass |
| Simplicity | Use native keys, foreign keys, uniqueness, and checks for explicit rules. Add transactional logic only where a simple constraint cannot express the rule. | Pass |

The reviewed specification and completed requirements checklist now permit implementation. Earlier uncommitted schema edits predate the review and must be evaluated as existing work before any group is declared complete. No protected operation is made available by the bootstrap schema alone.

## Project Structure

### Documentation (this feature)

```text
specs/002-align-business-schema/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── entity-audit.md
├── quickstart.md
├── contracts/
│   └── schema-contract.md
└── checklists/
    ├── requirements.md
    └── schema.md
```

### Source Code (repository root)

```text
db/
├── schema.sql
└── schema_constraints_test.sql
server/
├── package.json
└── src/
```

**Structure Decision**: Keep schema and its focused tests in `db/`, with feature decisions and contracts in `specs/002-align-business-schema/`. Later cross-record rules belong in the server's business modules, separated from HTTP handlers.

## Entity Groups and Commit Boundaries

1. **Reference and access**: `Role`, `Permission`, `RolePermission`, `Faculty`, `ActivityCategory`, `Semester`, `ScoreCriterion`, `User`, `UserInterest`. Validate controlled values, uniqueness, dates, role references, and student identity fields. Commit after schema, focused tests, and audit notes for this group pass.
2. **Activities and enrollment**: `Activity`, `ActivityOrganizer`, `ActivitySchedule`, `ActivityEligibility`, `ActivityScore`, `Registration`, `Attendance`. Validate category and semester links, assignments, session ordering, eligibility keys, duplicate applications, and same-activity attendance. Commit after the group passes.
3. **Participation, appeals, and scoring**: `Participation`, `Appeal`, `AppealEvidence`, `Recognition`, `TrainingScore`, `ScoreChange`. Validate verified participation uniqueness, appeal types and ownership, evidence bounds, exclusive score sources, source/criterion uniqueness, and required change history fields. Create the mutually referencing entities in dependency order and add the deferred `Appeal.score_id` foreign key after `TrainingScore` exists; commit only after the full schema loads and tests pass.
4. **Communication and administration**: `ActivityAnnouncement`, `Notification`, `ServiceLink`, `SystemSetting`, `AuditLog`. Validate announcement content, notification state, settings, and required audit fields. Commit after the group passes.

For each boundary: stage only the group's files or hunks; run the full schema load, relevant invalid-case regression checks, and `git diff --check`; inspect `git diff --cached`; then commit with a message naming the entity group. Do not include unrelated changes under `.specify/` or `docs/`. Because the current working tree already has changes spanning all four groups in one file, split them into reviewable commits only after the specification review gate and after each group's validation. Use a temporary index or a new worktree if needed to stage accurate group snapshots without discarding current work.

## Post-Design Constitution Check

The design artifacts preserve the documented entity model, specify record-level contracts, and isolate transactional rules for later service work. No additional dependency or architectural exception is required. The reviewed-spec gate is satisfied by the user-directed requirements review. Entity-group implementation and validation remain subject to the tasks and commit gates.
