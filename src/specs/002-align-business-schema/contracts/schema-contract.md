# Schema Contract

## Scope

`db/schema.sql` is a bootstrap contract for a new PostgreSQL 18 database. It creates `myHCMUS` and connects to it through `psql`. It is not an in-place migration contract.

## Inputs and observable outcomes

- Input: an empty PostgreSQL cluster and an account allowed to create a database.
- Successful outcome: all 27 entities in [data-model.md](../data-model.md) exist with primary keys, documented references, uniqueness, controlled values, and row-level checks.
- Invalid record outcome: a violated key, reference, or check rejects that statement without persisting the invalid row.
- Existing database outcome: bootstrap is not run; a separately reviewed migration maps and validates existing data.

## Group contracts

| Group | Required invariants | Commit gate |
| --- | --- | --- |
| Reference and access | Unique role, permission, faculty, category, criterion, and student identifiers; valid role codes and semester order | Valid seed and invalid-value cases pass |
| Activities and enrollment | Required parent links; positive capacity; ordered windows and sessions; one application per student/activity; attendance links same activity | Valid chain and duplicate/cross-activity cases pass |
| Participation, appeals, and scoring | One participation per registration; type-specific appeals and evidence bounds; score has exactly one source; unique source/criterion; complete change fields; appeal score reference added after score entity exists | Both score-source branches and all appeal variants pass in one complete staged snapshot |
| Communication and administration | Announcements, notifications, services, settings, and audit records have required references and controlled delivery states | Valid and invalid communication and administration cases pass |

## Deferred workflow contract

The future business-service implementation must establish permission, ownership, published readiness, semester alignment, capacity serialization, first-come-first-served waitlist order, participation prerequisites, score provenance and maximum, immutable criterion meaning, and atomic score changes with audit. This bootstrap schema supplies storage and row-level constraints only; it exposes no protected operation. See [entity-audit.md](../entity-audit.md) for the rule-by-rule boundary. Each workflow writes all related records in one transaction or writes none.

## Compatibility

The previous schema used different entities and columns (`Category`, `StudentRequest`, `ScoreAward`, `ScoreAdjustment`, and others). Consumers of those names need a deliberate migration and interface update; this bootstrap contract does not promise backward compatibility.

## Deferred rule ownership

The following rules are product obligations, not guarantees of the bootstrap schema. “Owner” names the future module or migration workstream that must implement and test the rule before exposing its protected operation.

| Rule | Enforcement boundary | Owner |
| --- | --- | --- |
| One verified university identity per account; student number and faculty verified before protected student actions; inactive accounts denied | Account provisioning and request authorization | Identity service |
| Cumulative role permissions; only administrator changes roles and grants | Every protected action and role update | Authorization service |
| Assigned organizer only manages an activity or records its attendance | Activity and attendance commands | Activity service |
| Student reads or changes only their own registrations, scores, appeals, and evidence except authorized staff | Read and write authorization | Authorization service |
| Published activity has at least one schedule and organizer; sessions lie within its semester | Publish transaction | Activity service |
| Registration targets a published activity during its open interval and a verified, eligible student | Admission transaction | Registration service |
| Approved count never exceeds capacity; approval and cancellation serialize per activity | Seat allocation transaction | Registration service |
| Earliest eligible waitlisted registration by registered_at then registration_id receives the next seat exactly once | Promotion transaction | Registration service |
| Cancelled registrations cannot become approved; completed/cancelled activities cannot approve registrations | State transition | Registration service |
| Schedule overlap warning compares each new session with approved sessions | Admission response | Registration service |
| Participation requires approved registration and attendance for every session or approved correction | Verification transaction | Participation service |
| Internal award uses verified participation, activity semester, and advertised criterion; recognition award uses approved recognition, target semester, and criterion | Award transaction | Score service |
| Signed score magnitude does not exceed criterion maximum; internal sign matches advertised points or zero; recognition points are nonnegative | Activity score and award commands | Score service |
| Criterion code, meaning, and maximum remain fixed after first award; a policy change adds a new criterion | Criterion change command | Criteria service |
| Recognition uses an approved recognition appeal, matching student, and valid later target semester; no duplicate credit for a prior activity and criterion | Recognition approval transaction | Appeal service |
| Only authorized reviewer resolves appeals; score-correction appeal references a score earned by its submitter | Appeal review command | Appeal service |
| Appeal decision changes return to in_review before a new resolution | Appeal state transition | Appeal service |
| Score change matches the previous and new award values and is atomic with award update; approved appeal reference is required when correcting an appeal | Score adjustment transaction | Score service |
| Successful score adjustments, appeal decisions, and setting changes create one append-only before/after audit event; failed attempts enter security/error logs | Protected mutation transaction and audit store | Audit service |
| Evidence file content is checked against declared type and size; only submitter and authorized staff can access it; retain for three years after resolution | Upload, download, and retention jobs | Evidence service |
| Notification delivery failure is retried or reported without blocking the main workflow | Delivery worker | Notification service |
| Invalid legacy rows are identified before cutover; failed migration restores the last consistent snapshot | Populated deployment migration | Migration workstream |

The service workstreams above are named follow-on owners for SC-004. They do not imply those modules currently exist.
