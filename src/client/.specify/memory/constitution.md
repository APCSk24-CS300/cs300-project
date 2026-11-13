<!--
Sync Impact Report
==================
Version change: unratified template -> 1.0.0
Ratification: initial adoption on 2026-11-13
Modified principles:
  - Principle 1 placeholder -> I. App Router and TypeScript First
  - Principle 2 placeholder -> II. Feature-First Architecture
  - Principle 3 placeholder -> III. Centralized HTTP Through the API Client
  - Principle 4 placeholder -> IV. Service Contracts with Paired Mock Implementations
  - Principle 5 placeholder -> V. DTO and Domain Separation via Explicit Mappers
  - Added -> VI. Token-Based Design System and Component Layering
  - Added -> VII. Explicit Data States in Every Data-Driven Section
  - Added -> VIII. Accessibility and Separation of Concerns
Added sections:
  - Additional Constraints (technology and repository rules)
  - Development Workflow and Quality Gates
Removed sections: none
Deferred TODOs: none
-->
# myHCMUS Frontend Constitution

## Core Principles

### I. App Router and TypeScript First (NON-NEGOTIABLE)

All application code MUST use the Next.js App Router and TypeScript. Routes live under `src/app`,
and route grouping such as `(public)` and `(protected)` MUST be preserved. Strict type safety is
mandatory: no `any` in new production code, no type assertions used to bypass validation, and no
JavaScript source files for application logic. Server Components MUST be the default; `"use client"`
is added only when interactivity, browser APIs, or client-only hooks require it.

Rationale: the App Router and TypeScript are the project's established foundation, and their
consistent use keeps routing, rendering, and data boundaries predictable.

### II. Feature-First Architecture (NON-NEGOTIABLE)

Business capabilities MUST be organized as self-contained features under
`src/features/<name>/` with the internal structure `components/`, `hooks/`, `services/`,
`types/`, and `mappers/`, creating each directory only when the feature needs it. Feature code
MUST NOT import another feature's internals directly; cross-feature reuse happens through shared
modules in `src/libs`, `src/components`, or `src/types`. Application routes remain thin and MUST
delegate behavior to feature modules.

Rationale: feature isolation limits coupling, makes ownership clear, and prevents the application
from collapsing into a shared pile of unrelated modules.

### III. Centralized HTTP Through the API Client (NON-NEGOTIABLE)

All HTTP communication MUST go through `src/libs/api-client.ts` (imported as `@/libs/api-client`).
Direct use of `fetch`, `axios`, `XMLHttpRequest`, or any other transport outside that module is
prohibited. Features MUST NOT construct base URLs; the API client owns base URL resolution,
headers, serialization, and error normalization. New transport behavior MUST be added to the
shared API client rather than reimplemented per feature.

Rationale: one transport boundary guarantees consistent authentication, error handling, and
observability, and prevents divergent network behavior across features.

### IV. Service Contracts with Paired Mock Implementations (NON-NEGOTIABLE)

Every feature MUST expose its data operations through a service contract: a TypeScript
`interface` in `features/<name>/services/`. Each contract MUST have two implementations: a real
implementation that calls the API client, and a mock implementation that returns deterministic
fixtures with simulated latency. Both MUST implement the same interface, be interchangeable
through a single selection point, and remain behaviorally compatible. The existing
`features/auth/services` pair is the reference pattern; extend that pattern rather than invent
a new one. Mock implementations MUST NOT be imported by production code paths except through
the selection point.

Rationale: interface-backed services enable parallel frontend/backend work, reliable UI state
testing, and safe replacement of implementations without touching consumers.

### V. DTO and Domain Separation via Explicit Mappers

API DTOs and UI/domain types MUST be defined separately. Transport shapes live in
`features/<name>/types/*.dto.ts` and mirror the wire contract exactly. Domain and UI types live
in `features/<name>/types/` and express application meaning, including discriminated unions and
narrowed role or status models. Conversion between DTOs and domain types MUST happen in explicit
functions located in `features/<name>/mappers/`. Components and hooks MUST consume domain types,
never raw DTOs. Inline transformation inside components or services is prohibited.

Rationale: explicit mapping isolates the UI from backend contract churn and makes every
translation visible, testable, and reviewable.

### VI. Token-Based Design System and Component Layering

Colors MUST NOT be hardcoded in components, styles, or inline props. All colors MUST be declared
as design tokens in `src/app/globals.css` (CSS custom properties exposed through the Tailwind
`@theme` layer) and consumed as token-backed utilities or variables. New tokens MUST be added to
the token layer instead of introducing one-off values. Generic, reusable UI primitives MUST live
in `src/components/ui`. Shared layout and structural chrome (headers, shells, navigation frames)
MUST live in `src/components/layout`. Existing specialized groups such as `src/components/forms`
and `src/components/icons` remain valid for their scope and MUST NOT be duplicated into `ui`.
Feature-specific components stay inside their feature.

Rationale: a single token source and clear component layers keep the interface visually
consistent, themeable, and free of duplicated primitives.

### VII. Explicit Data States in Every Data-Driven Section

Every data-driven section MUST explicitly implement and render four states: loading, empty,
error, and success. Loading MUST use a stable placeholder that preserves layout; empty MUST
explain that no data exists and offer a next step when applicable; error MUST present a
human-readable message and a recovery action; success MUST render the data. Silent failures,
indefinite spinners, and unhandled rejected promises are prohibited in UI code.

Rationale: explicit states make the interface trustworthy under real network conditions and
force failure handling to be designed rather than discovered in production.

### VIII. Accessibility and Separation of Concerns (NON-NEGOTIABLE)

Accessibility is mandatory. All interactive elements MUST be reachable and operable by keyboard,
MUST expose accessible names, MUST show visible focus, and MUST use semantic HTML before ARIA.
Forms MUST associate labels, descriptions, and validation errors with their inputs. Contrast MUST
meet WCAG 2.1 AA using design tokens. UI rendering MUST use React function components and hooks;
class components are prohibited. Service and domain logic SHOULD use object-oriented design where
it improves encapsulation, invariants, and dependency inversion, while remaining free of React
dependencies. Components MUST NOT own transport, mapping, or business rules.

Rationale: accessibility is a correctness requirement, and separating rendering from service and
domain logic keeps each layer independently understandable and replaceable.

## Additional Constraints

Technology and repository constraints are non-negotiable unless this constitution is amended.

- **Approved stack**: Next.js App Router, React, TypeScript, Tailwind CSS v4, React Hook Form,
  Zod, and the existing session/auth libraries. Prefer platform and existing-library
  capabilities over new packages.
- **Dependencies**: A new runtime dependency MUST be justified in the change description with the
  problem it solves and why existing code or platform APIs are insufficient. Dependencies without
  justification MUST NOT be merged.
- **Inspect before introducing**: Contributors MUST inspect the existing codebase before adding a
  convention, component, hook, or utility. Equivalent existing implementations MUST be reused or
  extended.
- **No unnecessary duplication**: Parallel implementations of the same behavior MUST NOT be
  created. If an existing pattern is insufficient, improve it in place and migrate callers.
- **No unnecessary restructuring**: Existing structure MUST NOT be reorganized for preference
  alone. Restructuring requires a concrete maintenance or correctness justification.
- **Route and boundary integrity**: Server-only modules MUST NOT be imported into client
  components. Secrets and server configuration MUST never reach client bundles.
- **Scope discipline**: Features MUST implement only agreed requirements; speculative abstraction
  and unused extension points MUST be avoided.

## Development Workflow and Quality Gates

- Before requesting review, contributors MUST run `npm run lint` and `npm run build`, and MUST
  resolve all new errors and warnings.
- If a dedicated typecheck script exists, it MUST pass; otherwise `npm run build` is the type
  gate.
- Every pull request and review MUST verify compliance with this constitution, including feature
  layout, API client usage, mock parity, mapper boundaries, token usage, the four data states,
  and accessibility.
- A principle violation MUST be fixed or documented as an explicit, time-bound exception approved
  by maintainers in the change description.
- New features MUST ship with their mock service implementation so the feature is usable without a
  live backend.
- Reviewers MUST block changes that introduce hardcoded colors, direct network calls, DTO leakage
  into components, or inaccessible interactive elements.
- `AGENTS.md` provides agent-facing instructions and `DEV_NOTES.md` records working technical
  decisions; neither overrides this constitution.

## Governance

This constitution supersedes conflicting local conventions and preferences. When a conflict is
discovered, the constitution governs until it is formally amended.

Amendments require a written proposal describing the change, its rationale, the affected
principles or sections, and the migration impact on existing code. Amendments MUST be reviewed and
approved by project maintainers before merge. The amendment MUST update the version, the
`Last Amended` date, and remove the temporary Sync Impact Report before commit.

Versioning follows semantic versioning. MAJOR increments require backward-incompatible governance
changes, such as removing or redefining a principle. MINOR increments require a new principle or
section, or materially expanded guidance. PATCH increments cover clarifications, wording, and
non-semantic refinements.

Compliance review is mandatory for every change. Maintainers MUST verify the principles during
review and MAY request changes solely on constitutional grounds. Repeated non-compliance MUST be
addressed through documentation, review guidance, or an explicit amendment rather than tolerated.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13
