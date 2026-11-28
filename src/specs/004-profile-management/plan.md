# Implementation Plan: Profile Management

**Branch**: `feat/profile/profile-management` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: UC-03 - Manage own profile in `docs/requirements/use-case-specifications.md`

## Summary

Deliver self-service profile management for authenticated users: display the current user's own profile, update their phone number, securely change their password, and set or remove a profile picture. Preserve read-only academic identity fields and derive profile ownership from the authenticated identity. Reuse existing authentication services and validation patterns; the requester approved a configurable local avatar file store and Sharp image decoder on 2026-11-28.

## Technical Context

**Language/Version**: TypeScript; existing project versions

**Primary Dependencies**: Existing Next.js client, Express API, authentication, and validation modules

**Storage**: PostgreSQL holds profile values and only the avatar URL in `User.avatar_url`; avatar bytes are stored separately in a configurable persistent filesystem directory. Student identity fields are held in role-specific profile data where defined.

**Testing**: Existing client Vitest and server Node test conventions; add focused unit/integration coverage for profile authorization, validation, password change, and avatar boundaries.

**Target Platform**: Existing web client and API deployment

**Project Type**: Web application with frontend, API server, and PostgreSQL database

**Performance Goals**: Profile reads and saves should follow existing API response expectations; no new performance target is introduced by this feature.

**Constraints**:

- Follow the repository's authenticated API, service/repository, validation, and error-response patterns.
- Do not allow client-supplied identity values to select the profile being read or changed.
- Keep account-owner edits separate from staff-controlled academic identity changes.
- Store passwords only through the existing secure password-verification and hashing workflow.
- Store only a legal avatar URL in PostgreSQL; keep image bytes in the configured persistent file store. Sharp is approved for full JPG/PNG decode validation.
- Use the current `tasks.md` artifact for implementation and convergence tracking.

**Scale/Scope**: Self-service profile operations for existing authenticated student, activity-manager, and administrator accounts. No administrative profile editor or account-registration redesign.

## Constitution Check

| Principle | Plan alignment | Status |
|---|---|---|
| I. Architecture | Align implementation with UC-03 and existing API/client patterns; keep business rules out of UI components and HTTP handlers. | Pass |
| II. Maintainability | Reuse existing auth, validation, and service boundaries rather than duplicating them. | Pass |
| III. Reviewed specification | Requester approved the specification and plan on 2026-11-28. | Approved |
| IV. Testing | Add automated tests for new business logic and integration coverage for protected profile workflows. | Pass |
| V. Security and data integrity | Derive ownership from authenticated identity, validate input, preserve password secrecy, and reject writes to protected identity fields. | Pass |
| V. Simplicity | Use the approved local file store and Sharp decoder; no external storage provider is selected. | Pass |
| Core tech stack | The constitution lists Flutter for the frontend, while the current `src/client` is Next.js/React. Requester approved a feature-scoped Next.js exception on 2026-11-28 to reuse the established web client. | Approved exception |

## Project Structure

### Documentation (this feature)

```text
src/specs/004-profile-management/
├── spec.md
├── plan.md
└── tasks.md
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

- The current database schema has `User.phone_number`, `User.password_hash`, and `User.avatar_url`; role-specific student data is separate. The approved source for student number is `Student.user_id`, referencing `User.user_id`; expose it read-only only for student records.
- The existing client exposes current-user and password-change service methods. Verify corresponding backend behavior before adding endpoints so the feature does not duplicate existing capability.
- The requester approved storing image files in a configurable local persistent directory, storing only a legal URL in `User.avatar_url`, and adding Sharp for complete image decoding. The external destination beyond this feature's file store remains independent.
- The constitution names Flutter, but the current client is Next.js/React. Do not silently change platforms as part of this feature.

## Complexity Tracking

Store avatar bytes in a configurable filesystem directory and store only the URL in the existing `User.avatar_url TEXT` column. Use Sharp for full decode validation; no schema migration or external storage provider is introduced. Deployed environments must mount persistent storage at `AVATAR_STORAGE_DIRECTORY`. See implementation.md for behavior and verification.

## Resolved design decisions (2026-11-28)

- Requester approved the existing specification/plan and keeping Next.js for this feature. This is a documented feature exception to the constitution's Flutter baseline, avoiding a platform migration in profile work.
- `db/schema.sql` is the executable source of truth: `User.user_id` is TEXT; profile fields are `phone_number`, `password_hash`, `full_name`, `email`, and `avatar_url`; faculty comes from `Student.faculty_id`. The design documents describe additional User student-number/faculty fields that the SQL schema does not yet contain. Student number is Student.user_id only for a Student row; accounts without that row return null. No owner-editable identity field is added.
- Phone numbers accept `0` plus 9 digits or `+84` plus 9 digits, allow null clearing, and retain existing equivalent-format duplicate checks.
- Avatar files are stored separately from PostgreSQL; `User.avatar_url` contains only the validated URL. Upload writes a uniquely named file, then atomically updates the URL; a failed database write removes the new file and preserves the previous reference. Removal clears the URL and deletes the old file. Sharp fully decodes JPG/PNG content. The inclusive upload limit is 10 MiB (10 × 1024 × 1024 bytes).
- Browser authentication uses a same-origin server bridge with HTTP-only cookies. Backend JWTs and database-backed role assignments authorize operations; mock identities are not used by the production provider. `administrator` maps to the existing UI name `admin` only at that boundary.

**UC-03 alignment (2026-11-28)**: User clarified `Student.user_id` as the student number and selected UC-03 A7/BR-ACC-09’s six-character password minimum over the previous eight-character feature rule.
