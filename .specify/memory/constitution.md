# myHCMUS Frontend Constitution

## Core Principles

### I. Client-Only Scope

- All code, specs, plans, and tasks produced for this frontend MUST create or modify files only
  inside `src/client/`.
- `docs/`, `src/server/`, `src/db/`, and every other path outside `src/client/` are read-only
  context; they MAY be read but MUST NOT be edited.
- If a change outside `src/client/` appears necessary (e.g., an API change), it MUST be recorded
  as an issue or an "API gaps" entry in the feature spec, not performed.

**Rationale**: The backend, database, and documentation are owned by other parts of the team;
scoping the frontend keeps ownership clear and prevents silent contract drift.

### II. Traceability to Use Cases and API Contract

- Every feature, screen, and user-facing action MUST cite at least one UC-ID from
  `docs/requirements/use-case-specifications.md`.
- Every data read or write MUST map to an operation (method + path) defined in
  `docs/api/openapi.yaml` (v1.2.0, with `docs/api/openapi-changes.md`).
- Request/response fields MUST match the OpenAPI schemas, including the `{ success, data | message }`
  envelope and `ErrorResponse`. Endpoints or fields MUST NOT be invented.
- When a required endpoint or field is missing, the spec MUST list it under "API gaps" and the UI
  MUST NOT fake it with hard-coded data. The development mock MAY serve a recorded gap so the flow
  can be built and tested, but in real mode the UI MUST NOT substitute mock or invented data for it.
- Business rules MUST follow `docs/analysis-and-design/business-rules.md`; NFRs follow
  `docs/requirements/vision-document.md`.

**Rationale**: Traceability lets reviewers verify each screen against agreed requirements and keeps
the frontend in step with the server contract.

### III. Single Role per Account

- The only valid roles are `student`, `manager`, and `administrator`. No other role name
  (in particular "organizer") may appear in code, copy, types, or specs.
- Each account has exactly one role. Role is modeled as a single value (e.g., a TypeScript union
  `'student' | 'manager' | 'administrator'`), never as an array or a set of flags.
- Role-dependent UI MUST be expressed as a function of that single role value.

**Rationale**: The domain model defines exactly one role per account; multi-role logic in the
UI would introduce states the system can never be in.

### IV. Server-Side Enforcement; UI Role Checks Are Cosmetic

- Frontend role checks (in components, layouts, or `proxy.ts` routing) MAY only show, hide,
  disable, or redirect UI. They MUST NOT be treated as an authorization boundary.
- Every protected action MUST still be sent to the server, which is the sole source of
  enforcement. The UI MUST handle `401` (re-authenticate) and `403` (show a forbidden state)
  responses gracefully even when the UI believed the action was allowed.
- Secrets, tokens, and privileged logic MUST NOT be exposed to client bundles beyond what the
  auth flow requires.

**Rationale**: Client code is fully controlled by the user; only the server can enforce access.

### V. Complete Screen States (Loading / Empty / Error)

- Every screen and every independently-loaded data region MUST implement three explicit states
  in addition to the success state:
  - **Loading**: a visible indicator (skeleton or spinner) while data is pending.
  - **Empty**: a meaningful message (and next action where relevant) when the result is empty.
  - **Error**: a user-readable message derived from `ErrorResponse`, with a retry action where
    retrying makes sense.
- Mutations (forms, buttons) MUST show pending state, prevent duplicate submission, and display
  success or error feedback.
- Specs MUST describe these states per screen, and tests MUST cover at least the error and empty
  states of each screen.

**Rationale**: Unhandled intermediate states are the most common source of broken-looking UI and
confused users.

### VI. Consistent UI and Behavior

- Screens MUST reuse shared components, layout, design tokens (Tailwind theme), and copy
  conventions; a new one-off variant of an existing pattern (button, table, form field, dialog,
  state view) MUST NOT be introduced when a shared one exists.
- Loading, empty, and error states MUST use the same shared state components across all screens.
- Logic MUST be consistent: API access goes through a single shared client/fetch layer; form
  validation uses `zod` schemas with `react-hook-form`; error mapping, date/number formatting,
  and role checks use shared helpers rather than per-screen reimplementation.
- The same action MUST behave the same way everywhere (same confirmation, same feedback, same
  navigation outcome).

**Rationale**: Consistency reduces cognitive load for users and maintenance cost for the team,
and keeps behavior predictable across roles.

## Technology & Contract Constraints

- Stack: Next.js (App Router, v16) with React 19 and TypeScript; Tailwind CSS v4 for styling;
  `zod` + `react-hook-form` for forms; `jose` for token handling; Vitest + Testing Library for
  tests; `axe-core` for accessibility checks.
- The API contract is `docs/api/openapi.yaml` v1.2.0. Client types for requests and responses
  MUST be derived from or kept in sync with that file.
- Authentication uses the bearer scheme defined in the OpenAPI document.
- Every service contract MUST have a real implementation that calls the shared API client. The
  mock MAY be a network-level mock (MSW handlers following `docs/api/openapi.yaml` paths, envelope
  and status codes) that drives the real implementation, instead of a separate mock class.
  Switching mock ↔ real MUST require configuration only (`NEXT_PUBLIC_API_MODE`,
  `NEXT_PUBLIC_API_BASE_URL`), with no change to pages or components (client constitution
  Principle IV).
- New runtime dependencies MUST be justified in the feature plan.

## Development Workflow & Quality Gates

- Spec Kit flow: `/speckit-specify` → `/speckit-clarify` (as needed) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`.
- Every spec MUST contain: UC-ID references, the endpoints used, role visibility per screen,
  loading/empty/error state descriptions, and an "API gaps" section (may state "none").
- Every plan MUST include a Constitution Check covering Principles I–VI; any violation MUST be
  justified in the plan's complexity tracking or the plan is rejected.
- Before merge: `npm run lint`, `npm run test`, and `npm run build` in `src/client/` MUST pass,
  and the diff MUST touch only `src/client/`.

## Governance

- This constitution supersedes other frontend practices. `CLAUDE.md` and `src/client/AGENTS.md`
  provide runtime guidance and MUST NOT contradict it.
- Amendments are made through `/speckit-constitution`, reviewed in a pull request, and approved by
  at least one other frontend team member.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR for
  adding a principle or materially expanding guidance, PATCH for clarifications and wording.
- All PR reviews MUST verify compliance with Principles I–VI; `/speckit-analyze` SHOULD be run
  before implementation to catch inconsistencies.

**Version**: 1.1.0 | **Ratified**: 2026-11-27 | **Last Amended**: 2026-11-27
