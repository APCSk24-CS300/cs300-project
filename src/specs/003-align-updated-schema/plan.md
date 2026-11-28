# Implementation Plan: Align Updated Business Schema

**Branch**: `003-align-updated-schema` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Align `db/schema.sql` with `docs/analysis-and-design/db/business-requirements.md`, preserving the broad SQL layout and the exact `RefreshToken` block.

## Summary

Update the existing initial PostgreSQL schema in place. Add missing business entities beside related tables, correct obsolete role, activity, registration, appeal, scoring, and notification definitions, and strengthen local integrity with focused keys and constraints. Leave backend `RefreshToken` unchanged. Record rules that require a service or transaction as SQL comments rather than claiming they are enforced by a row-local constraint.

## Technical Context

**Language/Version**: PostgreSQL SQL; current script uses `psql` meta-command `\connect`  
**Primary Dependencies**: PostgreSQL and `psql` for isolated validation; no new runtime dependency  
**Storage**: PostgreSQL initial schema definition in `db/schema.sql`  
**Testing**: Static entity/constraint review, exact `RefreshToken` block comparison, and full-file execution on a disposable PostgreSQL instance while preserving the `RefreshToken` block  
**Target Platform**: Project's PostgreSQL database  
**Project Type**: Schema-only change  
**Performance Goals**: Keep uniqueness and foreign-key lookups indexable; no throughput target is established in the requirements  
**Constraints**: Only `db/schema.sql` as product output; preserve table order broadly, avoid a wholesale rewrite, leave `RefreshToken` bytes unchanged, no migration or backend changes  
**Scale/Scope**: Existing 28-table script; align all business entities and named relationships, adding only missing tables needed by the updated document

## Constitution Check

- **I. Architecture**: The design follows `docs/analysis-and-design/db/business-requirements.md` and the existing schema. No alternative architecture is proposed.
- **II. Maintainability**: Use explicit keys, constraints, and short comments for non-obvious workflow boundaries; avoid duplicating the same rule through incompatible mechanisms.
- **III. Workflow**: The user directed implementation after specification and planning, satisfying the feature review gate for this scoped change. Verify acceptance criteria and relevant static or isolated SQL checks during implementation.
- **IV. Testing**: This plan changes no application business logic. Validate the full schema on a disposable database where available and report actual results. No new test file is in scope.
- **V. Security and Data Integrity**: Preserve password hashes, ownership references, protected audit/evidence metadata, and historical records; do not claim that schema metadata alone enforces actor authorization. Populated-database migration is separate.
- **Simplicity**: Prefer targeted columns, FK/UNIQUE/CHECK constraints, and a partial unique index over broad trigger or service redesign. No new dependency.

**Gate result**: Planning passes; the subsequent user-directed implementation satisfies the specification review gate under Constitution III.

## Project Structure

### Documentation (this feature)

```text
specs/003-align-updated-schema/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
db/schema.sql                         # sole product file to edit
docs/analysis-and-design/db/business-requirements.md  # read-only business source
```

**Structure Decision**: Maintain the existing script's broad sequence: reference/access, activity/participation, requests/scores, communications/administration, then the untouched `RefreshToken` tail. Extend or rename existing tables only where necessary; place missing tables adjacent to their related records. Do not create a migration, backend file, or test file. There is no external interface contract in this schema-only feature, so `contracts/` is intentionally omitted. A table rename may affect existing backend queries; record that integration risk for separate work rather than changing backend code here.

## Delivery Sequence

1. Record the exact `RefreshToken` block and inventory existing tables against the updated business entity rows.
2. Align reference/access and activity/registration tables, retaining existing keys and same-activity attendance where valid.
3. Align appeal, recognition, scoring-version, adjustment, notification-delivery, and audit tables; remove obsolete state and negative-score assumptions.
4. Review every named relationship and constraint in the business document. Enforce row-local and key rules in SQL; comment on workflow and transaction obligations that remain outside a focused schema change.
5. Validate entity and status coverage, representative invalid cases, table order, and unchanged `RefreshToken` bytes. Execute the full file on a disposable PostgreSQL instance when available, and report the result without altering `RefreshToken`.

## Complexity Tracking

No constitutional exception or additional dependency is proposed. The number of added tables reflects missing entities in the updated business requirements; the existing script is extended in place rather than replaced.
