# Tasks: Close Business Requirement Gaps

**Input**: [spec.md](spec.md), [plan.md](plan.md), and `docs/analysis-and-design/db/br-gap-analysis.md`.

**Scope**: Documentation only. Do not create code, migrations, endpoints, or tests. Edit the business requirements document in place while preserving its original structure.

## Phase 1: Document correction

- [x] T001 Amend `../docs/analysis-and-design/db/business-requirement.md` within its original sections to address DB-01–DB-18, preserving original heading text, levels, and order.

## Phase 2: Document review

- [x] T002 Compare `../docs/analysis-and-design/db/business-requirement.md` with its original Git version and `../docs/analysis-and-design/db/br-gap-analysis.md`; confirm all 18 gaps are addressed without a new section or active contradiction.

## Dependencies

T001 → T002. There are no parallel software tasks or test tasks.

## Completion

This feature is complete because the in-place document review passed. Any later software implementation requires a separate scoped task and constitutional specification review.

## Phase 3: Convergence

- [x] T003 Amend the existing registration entity and semantic-constraint text in `../docs/analysis-and-design/db/business-requirement.md` to state the outcome when capacity is free or full, automatic promotion after cancellation or rejection, the promoted status when approval is required, and notification/order for displaced participants per FR-005 and DB-06–DB-07 (partial).
- [x] T004 Complete the existing appeal semantic constraints in `../docs/analysis-and-design/db/business-requirement.md` with submission when no eligible assignee exists, assignment and reassignment authority, Additional Information Required resubmission, withdrawal, and valid paths to Approved or Rejected per FR-006 and DB-08–DB-09 (partial).
- [x] T005 Correct the internal score criterion constraint in `../docs/analysis-and-design/db/business-requirement.md` so it matches `ActivityScore.policy_version_id` and the applied `ScoringPolicyVersion.criterion_id`, without referring to a nonexistent `ActivityScore.criterion_id`, per FR-007 and DB-13 (contradicts).
- [x] T006 Add valid Draft, Published, Ongoing, Completed, and Cancelled transitions within the existing Activity semantic constraints in `../docs/analysis-and-design/db/business-requirement.md` per FR-005 and DB-05 (partial).
- [x] T007 Clarify in the existing follow and notification statements of `../docs/analysis-and-design/db/business-requirement.md` that activity followers receive relevant activity updates without a registration per FR-005 and DB-04 (partial).
- [x] T008 Link each approved `ScoreAdjustment` to exactly one `ScoreChange` and define how `TrainingScore.points_awarded` and semester totals avoid counting an adjustment twice, within existing scoring rows and constraints of `../docs/analysis-and-design/db/business-requirement.md`, per FR-007 and DB-14 (partial).
- [x] T009 Identify policy choices not established by the baseline as provisional assumptions within the existing Real-world working assumptions section of `../docs/analysis-and-design/db/business-requirement.md`—including independent roles, one activity owner, pending seat reservation, repeat registration, displacement priority, and scoring formula—pending stakeholder review per US1/AC3 and Constitution I (partial).

## Phase 4: Convergence

- [x] T010 Amend the existing appeal constraints in `../docs/analysis-and-design/db/business-requirement.md` so `reviewed_by_user_id`, `response`, and `reviewed_at` are required for Approved and Rejected decisions, while student withdrawal records its actor and time without a reviewer decision, per FR-006 and DB-08 (contradicts).
- [x] T011 Amend the existing score and approval constraints in `../docs/analysis-and-design/db/business-requirement.md` so creating a previously missing `TrainingScore` records its initial award and audit event without requiring a nonexistent previous value or `ScoreChange`; existing-score adjustments still require one linked `ScoreAdjustment` and `ScoreChange`, and both approval paths remain atomic, per FR-007 and DB-14 (contradicts).

## Phase 5: Convergence

- [x] T012 Define student edits and evidence additions for each unresolved Appeal state, the resulting revision and routing behavior, and the terminal-state prohibition within the existing appeal constraints of `../docs/analysis-and-design/db/business-requirement.md`, per FR-006 and DB-08 (partial).
- [x] T013 State that scoring-policy changes preview affected semesters before activation, while preserving historical awards and the existing version rules, within the scoring constraints of `../docs/analysis-and-design/db/business-requirement.md`, per FR-007 and DB-13 (partial).
- [x] T014 Define recognition submission categories, including volunteering, academic, and other, and clarify whether they are distinct from catalog `ActivityCategory` within the existing RecognitionRequestDetail row or constraints of `../docs/analysis-and-design/db/business-requirement.md`, per FR-006 and DB-10 (partial).
- [x] T015 Specify exhausted email-delivery state, authorized retry or recovery, and protection against dropped or duplicate notifications within the existing NotificationDelivery row and semantic constraints of `../docs/analysis-and-design/db/business-requirement.md`, per FR-007 and DB-16 (partial).
- [x] T016 Explicitly state that full name is read-only to the account owner alongside student number and faculty, while phone, password, and avatar remain self-editable, in the existing User row and access constraints of `../docs/analysis-and-design/db/business-requirement.md`, per FR-005 and DB-03 (partial).

## Phase 6: Convergence

- [x] T017 Correct the existing Appeal entity row in `../docs/analysis-and-design/db/business-requirement.md` so the current assignee and decision-maker fields are described as distinct roles in the record, while an Approved or Rejected decision is made by the current eligible assignee, per FR-006 and DB-08–DB-09 (contradicts).
- [x] T018 Correct the existing Notification–NotificationDelivery relationship in `../docs/analysis-and-design/db/business-requirement.md` to describe one durable delivery record per notification and channel with retries recorded on that record, consistent with the row and semantic constraints, per FR-007 and DB-16 (contradicts).

## Phase 7: Convergence

- [x] T019 State within the existing Users and access or semantic constraints of `../docs/analysis-and-design/db/business-requirement.md` that `Student.faculty_id` equals the staff-validated `User.faculty_id` for a student account, and that staff changes keep both values synchronized before eligibility checks, per FR-005 and DB-03 (partial).

## Phase 8: Convergence

- [x] T020 Declare a non-null primary key for `OrganizationMember` and `ActivityFollow` within their existing entity rows in `../docs/analysis-and-design/db/business-requirement.md`, preserving historical membership and unique active follow behavior, per FR-004–FR-005 and SC-003 (contradicts).
