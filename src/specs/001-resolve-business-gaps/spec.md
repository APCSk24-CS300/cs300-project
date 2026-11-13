# Feature Specification: Close Business Requirement Gaps

**Feature Branch**: `chore/refine-business-requirements`  
**Created**: 2026-11-13  
**Status**: Complete — documentation amendment  
**Input**: Close the remaining findings in `docs/analysis-and-design/db/br-gap-analysis.md` by editing only `docs/analysis-and-design/db/business-requirement.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review corrected business rules (Priority: P1)

A reviewer reads the existing business requirements document and finds clear, consistent rules for the gaps listed in the analysis without needing to reconcile conflicting statements elsewhere in the same document.

**Why this priority**: The document is the basis for later design decisions.

**Independent Test**: Compare each DB-01 through DB-18 finding with the revised document and identify its resolution in an existing section.

**Acceptance Scenarios**:

1. **Given** the original document and gap analysis, **when** the reviewer compares headings, **then** the original heading names, hierarchy, and order remain unchanged and no new section appears.
2. **Given** each gap finding, **when** the reviewer reads the relevant existing section, **then** the rule is explicit and does not conflict with another active statement in the document.
3. **Given** a policy choice not established by the project sources, **when** it appears in the revised document, **then** it is identified as an assumption or a decision requiring stakeholder review.

### Edge Cases

- Existing statements that are already aligned remain in their original section.
- A new entity needed to close a gap is added as a row in an existing entity table, with matching cardinality and constraint text in the existing sections.
- Historical rules are edited in place; the document does not gain a superseding section or a duplicate full copy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The edit MUST change only `docs/analysis-and-design/db/business-requirement.md`; feature artifacts in this directory may be updated solely to describe and validate that documentation scope.
- **FR-002**: The revised document MUST preserve every original heading, its level, and its order; it MUST not add a new section or substantially replace an unaffected section.
- **FR-003**: Existing Actors, Real-world working assumptions, Reference entities, Users and access, Activities and participation, Appeals, updates, and services, Relationships and cardinalities, and Constraints sections MUST address DB-01 through DB-18 at their relevant locations.
- **FR-004**: Role and organization statements MUST distinguish independently assigned duties from resource scope and represent activity ownership and authorized managers (DB-01–DB-02).
- **FR-005**: Profile, follow, activity status, registration attempts, reserved capacity, deterministic waiting order, promotion, and capacity reduction rules MUST be consistent across entity rows, cardinalities, and constraints (DB-03–DB-07).
- **FR-006**: Request statuses, revision and assignment history, recognition submission details, missing-score references, protected evidence, and terminal decisions MUST be consistent across existing sections (DB-08–DB-12, DB-18).
- **FR-007**: Semester-effective scoring versions, approved adjustments, missing-score creation, atomic approval, attendance verification, email retries, and general audit history MUST be specified without unsupported mandatory QR or negative-score assumptions (DB-13–DB-17).
- **FR-008**: The document MUST retain its established business purpose, aligned relationships, and useful constraints; corrections MUST not turn it into an implementation plan or create code, migrations, endpoints, or tests.

### Key Entities

The existing Schema design section remains the home for entity rows. Gap closure may add or correct rows for UserRole, Organization and membership, ActivityFollow, registration attempts, request details and assignment, scoring policy versions and adjustments, notification delivery, and audit history. Corresponding relationships and constraints stay within their original sections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 18 of 18 DB findings have a traceable resolution in the revised document.
- **SC-002**: 100% of original headings retain the same text, level, and order; no heading is added.
- **SC-003**: No active constraint contradicts a revised entity row, cardinality, or status value in the same document.
- **SC-004**: The final change set for this request contains only the business requirements document and Markdown files in this feature directory; no source code or test file changes.

## Assumptions

- The original business requirements document is the structural baseline. The gap analysis identifies content to amend, not a replacement outline.
- Stakeholder review is still required by the project constitution before any later implementation work.
- This feature ends with a coherent document; product implementation is outside scope.
