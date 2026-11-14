# Quickstart: Validate Schema Alignment

Use this after implementing the plan. The only product file to inspect is `db/schema.sql`; `docs/analysis-and-design/db/business-requirements.md` is the read-only source. These steps do not require a new test file.

## 1. Check scope and preserved backend block

- Review the change set and confirm no product file other than `db/schema.sql` changed.
- Compare the `CREATE TABLE "RefreshToken"` block in the working file with the baseline block. They must match byte-for-byte.
- Check that existing table groups remain in broadly the same order and that missing business entities were inserted near their related tables.

## 2. Check the business mapping

Use [data-model.md](data-model.md) and [spec.md](spec.md) to review every reference, access, activity, request, scoring, communication, and audit entity. Check all ten functional requirements and the three story scenarios. In particular, verify multi-role users, one active registration attempt, a missing-score appeal without a Score FK, applied policy-version retention, linked adjustment and change history, and distinct Notification/NotificationDelivery records.

## 3. Validate local SQL rules

Review representative valid and invalid rows for controlled values, unique keys, same-activity Attendance references, date ordering, positive capacity, evidence size and type, one score source, and delivery status. Record which checks are enforced by SQL and which are explicitly documented as workflow or transaction obligations. Do not credit a SQL `CHECK` with inspecting another table.

If a disposable PostgreSQL instance is available, execute the full schema there:

```sh
psql -v ON_ERROR_STOP=1 -f db/schema.sql
```

The script creates and connects to `myHCMUS`, so use an empty disposable instance and never a populated project database. Report the actual full-file result.

## 4. Report the limitation

Report full-file validation results and confirm the untouched `RefreshToken` block. A populated installation also needs a separately reviewed migration and data audit before applying any schema change.
