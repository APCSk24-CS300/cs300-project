# Entity and Relationship Review Map

This file guides edits to the **existing** Schema design section of `docs/analysis-and-design/db/business-requirement.md`. It is not a separate implementation data model or migration design.

| Existing section | Gap findings to resolve within it |
| --- | --- |
| Reference entities | DB-01, DB-02, DB-08, DB-13: independent roles, organizational units, complete request statuses, effective scoring rules. |
| Users and access | DB-01, DB-03, DB-04: account duties and scope, protected academic profile fields, activity follow relationship. |
| Activities and participation | DB-05–DB-07, DB-13–DB-15: lifecycle, attempts and waiting order, capacity changes, policy-linked awards, attendance verification. |
| Appeals, updates, and services | DB-08–DB-12, DB-16–DB-18: assignment, submission details, missing score, private evidence, delivery retries, audit, closed decisions. |
| Relationships and cardinalities | Match each added or changed entity row; permit historical registration attempts and require evidence at submission. |
| Explicit and semantic constraints | Remove old role inheritance, lifetime registration uniqueness, missing-score prohibition, mandatory all-session attendance, negative penalties, and reopening claims. |

Every entity row changed for a gap must have matching relationships and constraints in the original sections. No new document section is required.
