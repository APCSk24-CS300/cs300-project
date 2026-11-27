# Implementation Plan: Profile Management

**Branch**: `feat/profile/profile-management` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: UC-03 - Manage own profile in `docs/requirements/use-case-specifications.md`

## Summary

Deliver self-service profile management for authenticated users: display the current user's own profile, update their phone number, securely change their password, and set or remove a profile picture. Preserve read-only academic identity fields and derive profile ownership from the authenticated identity. Reuse existing authentication services and validation patterns; do not introduce a new storage service or dependency without approval.

## Technical Context

**Language/Version**: TypeScript; existing project versions

**Primary Dependencies**: Existing Next.js client, Express API, authentication, and validation modules

**Storage**: PostgreSQL; current `"User"` schema includes phone number, password hash, and avatar URL. Student identity fields are held in role-specific profile data where defined.

**Testing**: Existing client Vitest and server Node test conventions; add focused unit/integration coverage for profile authorization, validation, password change, and avatar boundaries.

**Target Platform**: Existing web client and API deployment

**Project Type**: Web application with frontend, API server, and PostgreSQL database

**Performance Goals**: Profile reads and saves should follow existing API response expectations; no new performance target is introduced by this feature.

**Constraints**:

- Follow the repository's authenticated API, service/repository, validation, and error-response patterns.
- Do not allow client-supplied identity values to select the profile being read or changed.
- Keep account-owner edits separate from staff-controlled academic identity changes.
- Store passwords only through the existing secure password-verification and hashing workflow.
- Do not select or add a new avatar-storage provider/dependency without an approved design decision.
- Keep the requested artifact filename `task.md`; existing Spec Kit folders commonly use `tasks.md`.

**Scale/Scope**: Self-service profile operations for existing authenticated student, activity-manager, and administrator accounts. No administrative profile editor or account-registration redesign.

## Constitution Check

| Principle | Plan alignment | Status |
|---|---|---|
| I. Architecture | Align implementation with UC-03 and existing API/client patterns; keep business rules out of UI components and HTTP handlers. | Pass |
| II. Maintainability | Reuse existing auth, validation, and service boundaries rather than duplicating them. | Pass |
| III. Reviewed specification | This specification is a draft and requires team review before implementation. | Pending review |
| IV. Testing | Add automated tests for new business logic and integration coverage for protected profile workflows. | Pass |
| V. Security and data integrity | Derive ownership from authenticated identity, validate input, preserve password secrecy, and reject writes to protected identity fields. | Pass |
| V. Simplicity | Reuse existing infrastructure; avatar storage remains an explicit design constraint rather than an assumed new dependency. | Pass |
| Core tech stack | The constitution lists Flutter for the frontend, while the current `src/client` is Next.js/React. Follow the established client implementation only after the team confirms this pre-existing mismatch. | Review needed |

## Project Structure

### Documentation (this feature)

```text
src/specs/004-profile-management/
├── spec.md
├── plan.md
└── task.md
```

### Expected implementation areas

```text
src/client/src/features/auth/                 # Reuse auth identity and password service patterns
src/client/src/features/profile-management/   # Profile view and edit experience, if approved for current client
src/client/src/app/(protected)/               # Authenticated profile page integration
src/server/src/routes/                        # Authenticated profile endpoints
src/server/src/controllers/                   # HTTP validation and response mapping
src/server/src/services/                      # Profile and credential business rules
src/server/src/repositories/                  # Persist profile fields using existing database patterns
src/server/tests/                             # Focused automated tests
src/client/tests/                             # Client interaction and validation tests
```

**Structure Decision**: Keep profile functionality within the existing authenticated web application. Reuse existing auth endpoints where they already satisfy UC-03; add only missing profile behavior. Confirm exact endpoint and storage locations during implementation rather than creating duplicate auth flows.

## Delivery Sequence

1. **Foundation and contract check**: Review the current auth routes, identity/session shape, DB profile fields, validation conventions, and approved image-storage approach. Confirm the academic identity source and resolve the frontend-stack mismatch before implementation.
2. **US1 - View and update profile**: Implement a self-only profile read/update flow for permitted fields, keep protected identity fields read-only, and test ownership and invalid-input behavior.
3. **US2 - Change password**: Reuse the current authenticated password-change flow if present; verify current password, minimum length, confirmation, and no-change behavior on failure.
4. **US3 - Manage profile picture**: Implement format and 10 MB boundary validation, upload/removal, failure preservation, and default-picture behavior using only approved storage infrastructure.
5. **Cross-cutting verification**: Run relevant client and server test suites; verify unauthorized, cross-user, invalid-input, and storage-failure paths.

## Design Decisions to Confirm Before Implementation

- The current database schema has `User.phone_number`, `User.password_hash`, and `User.avatar_url`; role-specific student data is separate. Confirm the authoritative source for student number before exposing it.
- The existing client exposes current-user and password-change service methods. Verify corresponding backend behavior before adding endpoints so the feature does not duplicate existing capability.
- The use case specifies accepted avatar formats and maximum size but not a storage provider. Use the existing approved storage mechanism or request approval for a design change.
- The constitution names Flutter, but the current client is Next.js/React. Do not silently change platforms as part of this feature.

## Complexity Tracking

No new dependency, storage provider, or architectural abstraction is approved by this plan.
