# Feature Specification: Core Schema Constraint Test Alignment

**Feature Branch**: `005-core-constraint-test`

**Created**: 2026-11-28

**Status**: Draft

**Input**: User description: "update the core constraint test to match the current schem design"

## Scope

Update the core database constraint verification so its valid fixtures and rejected cases describe the current approved database design. The current design has separate account-role assignments and role-specific profile records. A student's identity is the `Student.user_id` relationship to `User.user_id`; identity, faculty, and roles are not flattened onto the account record. The current model also includes the organization, request, scoring-policy, notification-delivery, and refresh-token records introduced after the original constraint test was written.

The database design documents define intended business rules; the current executable schema defines the deployed table, column, key, and constraint names. The constraint verification must follow both, recording any unresolved difference instead of restoring obsolete model fields.

## User Scenarios & Testing

### User Story 1 - Verify the current database design (Priority: P1)

As a database maintainer, I want the core constraint check to use the current data model so that it can detect regressions in valid relationships and required database rules.

**Why this priority**: A stale test suite cannot validate the schema and may reject correct changes or pass while important current constraints are untested.

**Independent Test**: Apply the current database design to a disposable database, run the core constraint verification, and confirm valid fixtures pass, invalid fixtures are rejected for the expected reasons, and test data is rolled back.

**Acceptance Scenarios**:

1. **Given** the current database design is installed, **When** the constraint verification runs, **Then** every valid fixture is accepted and the verification finishes without error.
2. **Given** a fixture violates a declared required value, relationship, uniqueness rule, or check, **When** the constraint verification attempts it, **Then** the database rejects it and the test confirms the expected rejection category.
3. **Given** an account has one or more duties, **When** role and profile fixtures are created, **Then** roles are represented by account-role assignments and student, manager, and administrator details use their corresponding profile records.
4. **Given** a student record exists, **When** its student identity is represented, **Then** the student record's `user_id` references the matching account; fixtures do not require account-level `role_id`, `student_number`, or `faculty_id` fields.
5. **Given** test fixtures have completed, **When** the verification transaction ends, **Then** no fixture records remain in the database.

### Edge Cases

- A user can have multiple independent role assignments.
- A user may have role-specific profile data only for the applicable profile type.
- A student number is represented by `Student.user_id`, and faculty is represented through the student's faculty relationship.
- Optional references remain nullable where the current design permits them.
- The current design changes its table set; the verification must not rely on an obsolete hard-coded table count.
- A design document and executable schema disagree; the conflict is reported for resolution and the test does not silently reintroduce a retired column or relationship.

## Requirements

### Functional Requirements

- **FR-001**: The verification MUST use the current approved database design as its business-rule reference and the current executable database definition for exact stored names and constraints.
- **FR-002**: The verification MUST create at least one valid fixture for each table in the current design, with valid relationships and representative nullable references where allowed.
- **FR-003**: The verification MUST exercise each declared primary-key, foreign-key, unique, not-null, and check constraint category in the current design with valid and invalid cases where applicable.
- **FR-004**: Fixtures MUST represent account roles through the role-assignment relationship and role-specific information through the corresponding Student, Manager, and Administrator records.
- **FR-005**: Student fixtures MUST use `Student.user_id` as the student identity relationship and MUST NOT assume `User.student_number` or account-level faculty or role columns.
- **FR-006**: The verification MUST cover the current organization and membership model, scoring policy and adjustment records, request assignment and revision records, notification delivery records, and refresh-token records.
- **FR-007**: Each invalid case MUST assert that the database rejects the operation; unexpected success or a different failure category MUST fail the verification.
- **FR-008**: The verification MUST run without leaving fixture data behind, including when an assertion fails.
- **FR-009**: The verification MUST not modify the database design or implement application-level workflow rules that are outside database constraints.

### Key Entities

- **Account and role assignment**: User, Role, UserRole, Permission, and RolePermission.
- **Role-specific profiles**: Student, Manager, and Administrator.
- **Constraint fixture**: A valid or invalid row set used to verify one declared database rule.
- **Database design**: The approved entity and relationship definitions plus the current executable schema.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every table in the current database design has at least one accepted valid fixture.
- **SC-002**: Every declared database constraint category has at least one invalid fixture that is rejected for the expected reason, where such an invalid value can be expressed as a row-level database operation.
- **SC-003**: The verification completes successfully against a fresh database created from the current design, with zero remaining test fixtures afterward.
- **SC-004**: No fixture references a retired account-level role, student-number, or faculty field.
- **SC-005**: The verification does not depend on a fixed count of tables; adding a table requires adding its valid fixture before the suite can be considered complete.

## Assumptions

- `db/schema.sql` is the executable source for current table, column, and constraint names.
- `docs/analysis-and-design/db/business-requirements.md` and the associated schema-design documentation define the intended business relationships and constraints.
- This work updates verification coverage only; it does not change the database model or perform a migration.
- Cross-row authorization, concurrency, and transaction workflows remain outside a core row-constraint verification unless represented by explicit database constraints.
