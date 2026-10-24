# myHCMUS Constitution

## Core Principles

### I. Architecture
- Architecture design must always references documents and diagrams in `docs/`. Make sure to always align to them; in the case where a better solution is thought up, always consult with me first.
- Modules **MUST** expose clear interfaces. 
- UI components **MUST NOT** contain business logic.
- Business logic **MUST** be separated from presentation and HTTP handling.

Rationale: Reduces coupling and make sure architecture is simple and explainable.

### II. Codebase quality and Maintainability
- Functions and modules **SHOULD** have clear responsibilities.
- Duplicate business logic **MUST** be consolidated when practical.
- Public interfaces **MUST** document non-obvious behavior and constraints.
- Comments **SHOULD** be present to explain important/complex components. When implementing a component whose scale and complexity is more than what comments can reasonably explain, consider writing a document clearly explaining it instead. 

Rationale: Keeps the codebase understandable as it grows.

### III. Development workflow    
- Every feature **MUST** have a reviewed specification before implementation.
- Implementation plans **MUST** identify applicable constitutional constraints.
- Changes **MUST** satisfy their documented acceptance criteria.
- Changes **MUST** pass relevant tests and static checks.

Rationale: follow an agile framework, prioritize flexibility and release-driven development.

### IV. Testing 
- New business logic **MUST** have automated tests.
- Bug fixes **MUST** include a regression test where practical.
- Critical user workflows **MUST** have integration or end-to-end tests.
- All relevant tests **MUST** pass before a change is considered complete.
- Small unit-level tests **SHOULD** be run intermittently during implementation.
- Always reason edge cases after done with a change and test them.

Rationale: Prevents regressions and verifies expected behavior.

### V. Security and Data Integrity

- Untrusted input **MUST** be validated at system boundaries.
- Protected operations **MUST** enforce authorization.
- Secrets **MUST** NOT be committed to source control. dotenv files **MUST NEVER** be exposed.
- Passwords **MUST** NOT be stored in plaintext.
- Database schema changes **MUST** consider existing data.

Rationale: Protects users and prevents data corruption.

### V. Simplicity and Controlled Complexity

- Prefer the simplest solution satisfying current requirements.
- New dependencies MUST have a documented justification.
- Abstractions SHOULD be introduced when they solve a concrete problem. Code **SHOULD** follow design patterns and adhere to general OOP principles wherever applicable.
- Speculative features MUST NOT be implemented.

Rationale: Avoids unnecessary maintenance costs.

## UI/UX design
- UI components **SHOULD** always be interactive, attractive, and intuitive to use. 
- UX design **MUST** be straightforward and reduce as much friction as possible. 
- Visual design choices regarding aspects such as fonts, colors, or button appearances **MUST** be simple, modern-looking, and coherent.

## Core tech stack
- FE: Flutter
- BE: Typescript
- DB: PostgreSQL
- Infra: Docker
- External services: Existing university systems

## Governance

- This constitution applies to every feature.
- Plans and implementations MUST comply with its principles.
- Exceptions MUST document their rationale and receive approval.
- Amendments MUST record their rationale and impact.
- Changes to principles MUST increment the constitution version.

**Version**: 1.0.0 | **Ratified**: 2026-10-24 | **Last Amended**: 2026-10-24

