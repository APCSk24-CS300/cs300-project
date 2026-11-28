# Business Requirements Document Checklist

**Purpose**: Review the quality of the in-place business requirements amendment  
**Created**: 2026-11-13  
**Scope**: `docs/analysis-and-design/db/business-requirement.md` only

**Ownership**: `[x]` records a requirements-quality review decision, not software implementation.

## Structure and Scope

- [x] CHK001 Are the original heading names, levels, and order preserved without a new section? [Consistency]
- [x] CHK002 Are unaffected purpose and aligned business statements retained in their original sections? [Completeness]
- [x] CHK003 Are newly needed entities placed as rows in existing tables, with related cardinalities and constraints in existing sections? [Consistency]
- [x] CHK004 Is the feature explicitly limited to the business requirements document, with no product code or test work? [Scope]

## Gap Coverage

- [x] CHK005 Are independent duties, organization ownership, manager scope, profile rules, follows, and Ongoing status specified consistently? [Coverage, DB-01–DB-05]
- [x] CHK006 Are seat reservation, repeat attempts, waiting order, promotion, and capacity reduction specified without conflicting uniqueness rules? [Coverage, DB-06–DB-07]
- [x] CHK007 Are request states, revisions, assignments, recognition submission data, missing-score references, and evidence rules present? [Coverage, DB-08–DB-12]
- [x] CHK008 Are semester-effective scoring rules, adjustments, missing-score creation, and atomic approval stated without retrospective changes? [Coverage, DB-13–DB-14]
- [x] CHK009 Are attendance verification, notification email retries, general audit history, and closed request decisions stated without unsupported mandatory procedures? [Coverage, DB-15–DB-18]

## Clarity and Consistency

- [x] CHK010 Do status values in entity rows agree with explicit and semantic constraints? [Consistency]
- [x] CHK011 Are evidence access, scoped decisions, account retention, and audit protection stated clearly enough for business review? [Clarity]
- [x] CHK012 Is each gap resolved in active text, without a superseding addendum or contradictory historical copy in the same file? [Consistency]

## Notes

- Reviewed against the original Git version and `docs/analysis-and-design/db/br-gap-analysis.md`; original headings match exactly.
- Stakeholder approval before any later software implementation belongs to a separate workflow under the constitution.
