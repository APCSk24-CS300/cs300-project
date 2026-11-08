# Research: Align Business Schema

## Source of truth for conflicting entity descriptions

**Decision**: Use `docs/analysis-and-design/db/business-requirements.md` for entity names, cardinality, and explicit database constraints. Use `docs/requirements/vision-document.md` for product-wide requirements such as evidence size, notification channels, settings, and audit history.

**Rationale**: The dedicated database document is more specific about the data model; the vision covers broader product obligations absent from that document.

**Alternatives considered**: Retaining the old `Category`, `StudentRequest`, `ScoreAward`, and `ScoreAdjustment` structure would leave the required session, recognition, and score-history model incomplete.

## Constraint placement

**Decision**: Use primary keys, foreign keys, unique constraints, and checks for row-local and direct-reference invariants. Plan cross-row counts, status prerequisites, authorization, immutable criteria, score provenance, and atomic history in transactional business logic or carefully scoped database procedures during implementation.

**Rationale**: These latter rules depend on other rows, current actor permissions, and concurrent state changes. A single-row check cannot express them.

**Alternatives considered**: Encoding every semantic rule as a trigger would couple business workflows to database side effects and complicate testing and change history. Leaving all checks to the service would allow avoidable invalid rows.

## Initial schema versus migration

**Decision**: Treat `db/schema.sql` as a new-database bootstrap. Require a separate data audit and versioned migration before applying the replacement model to populated databases.

**Rationale**: Renamed and split entities cannot be safely applied as a direct replacement when historical registrations and scores exist. The constitution requires considering existing data.

**Alternatives considered**: Recreating tables in place would risk data loss. A migration without a known deployed data inventory would be speculative.

## Verification environment

**Decision**: Validate against a disposable PostgreSQL 18 cluster with `psql -v ON_ERROR_STOP=1`, run focused constraint cases, and perform a static diff check after each group.

**Rationale**: This catches SQL syntax and actual constraint behavior without touching application data.

**Alternatives considered**: Static reading alone cannot prove PostgreSQL accepts the DDL. Using the configured application database would create unnecessary risk.

No unresolved technical clarifications remain for Phase 1 design. The user directed resolution of the custom checklist and continuation; the revised specification records the resulting scope and business-rule decisions. Existing uncommitted schema work already contains the proposed 27-entity bootstrap and must be split into validated group snapshots for reviewable commits.

## Legacy mapping and cutover for populated installations

| Old entity or field | New destination | Review point |
| --- | --- | --- |
| Category | ActivityCategory | Preserve category identifiers or map each legacy ID explicitly |
| User.student_name | User.full_name and User.student_number | The old field may contain a name rather than a verified student number; never infer identity from it |
| Activity.starts_at, ends_at, location | ActivitySchedule | Create a session only where the interval and location are valid; report incomplete rows |
| Activity.creator_id | Activity.created_by_user_id | Verify creator exists |
| Registration.confirmed | Registration.approved | Map every old status explicitly; do not silently convert unknown states |
| Participation.attended and verification fields | Attendance plus verified Participation | Keep unverified or absent records separate from verified participation |
| ScoreAward | TrainingScore | Verify criterion, semester, owner, and source before award migration |
| ScoreAdjustment | ScoreChange or a separately reviewed correction | Do not invent a previous score when no linked award exists |
| StudentRequest, RequestEvidence | Appeal, AppealEvidence, Recognition | Map request type, ownership, decision, and supporting files; external recognition may lack an activity |
| UniversityService | ServiceLink | Preserve link and display metadata where available |

Before migration, inventory table counts and references, identify invalid legacy rows, take a backup, and rehearse mapping in an isolated copy. A migration failure or unresolved invalid row prevents cutover; restore the last consistent snapshot and keep the old application path available. Reconcile row counts and score totals after a successful dry run. A versioned migration and rollback script are separate follow-on deliverables; db/schema.sql is only a fresh bootstrap.
