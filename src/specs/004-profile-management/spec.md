# Feature Specification: Profile Management

**Feature Branch**: `feat/profile/profile-management`

**Created**: 2026-11-27

**Status**: Approved by requester (2026-11-28); schema alignment documented in implementation.md

**Input**: UC-03 - Manage own profile; profile-management scope clarified by the requester.

## Scope

Authenticated users manage their own profile. They can view their saved profile, update their phone number, change their password, and set or remove a profile picture. Academic identity fields, such as a student's full name, student number, and faculty, are displayed read-only when available. This feature does not let users edit another person's profile or change staff-controlled academic identity.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and update my profile (Priority: P1)

As an authenticated user, I want to view my profile and update my phone number so my contact information stays current.

**Why this priority**: Viewing and maintaining one's own profile is the core value of profile management and an independently useful first release.

**Independent Test**: Sign in, open My Profile, update a valid phone number, save, and reload the page to confirm the saved value is shown.

**Acceptance Scenarios**:

1. **Given** an authenticated user with a profile, **When** they open My Profile, **Then** the system shows their own saved profile details and applicable academic identity fields.
2. **Given** an authenticated user, **When** they save a valid phone number, **Then** the system persists it and displays the updated value.
3. **Given** an authenticated user, **When** they submit an invalid phone number, **Then** the system explains the validation error, preserves their entered form value, and does not change the saved phone number.
4. **Given** a user viewing their profile, **When** they try to change a read-only identity field or target another user's profile, **Then** the system rejects the change and leaves both profiles unchanged.
5. **Given** a user editing their profile, **When** they cancel, **Then** unsaved edits are discarded.

### User Story 2 - Change my password (Priority: P1)

As an authenticated user, I want to change my password after verifying my current password so I can maintain control of my account.

**Why this priority**: Password maintenance is a security-critical part of managing an account and is explicitly included in UC-03.

**Independent Test**: Change a password using the correct current password and matching new-password confirmation, then verify that the old password no longer works and the new password does.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they submit the correct current password, a new password of at least six characters, and a matching confirmation, **Then** the system securely updates the password and confirms success.
2. **Given** an authenticated user, **When** the current password is incorrect, the new password is shorter than six characters, or confirmation does not match, **Then** the system explains the correction needed and leaves the password unchanged.
3. **Given** a password change request, **When** it is rejected, **Then** neither the current nor new password is included in the response or persisted as plaintext.

### User Story 3 - Set or remove my profile picture (Priority: P2)

As an authenticated user, I want to set or remove my profile picture so my profile displays the image I choose.

**Why this priority**: Avatar management is useful but is not required to view or maintain the core account details.

**Independent Test**: Upload a valid image, confirm it is displayed after reload, then remove it and confirm the default profile picture is shown.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they upload a JPG or PNG image no larger than 10 MB, **Then** the system stores the image and displays it as their profile picture.
2. **Given** an authenticated user with a profile picture, **When** they remove it, **Then** the system restores the default profile picture.
3. **Given** an authenticated user, **When** they upload an unsupported format or an image larger than 10 MB, **Then** the system rejects it, explains why, and retains the existing profile picture.
4. **Given** an image upload or profile update fails, **When** the operation completes unsuccessfully, **Then** the existing profile remains intact and the user can retry.

### Edge Cases

- An unauthenticated request to view or change a profile is denied.
- A request cannot choose a different user ID to read or change another user's profile.
- A request attempts to modify full name, student number, faculty, or another read-only identity field.
- Profile data or the profile picture cannot be loaded; the system reports the failure and offers a retry without showing stale data as newly saved.
- Two profile updates overlap; the system must not report success for a change that was not persisted.
- Image content, not only its filename, must be checked against the accepted image formats before it is stored.
- A file exactly at the 10 MB limit is accepted; a file above the limit is rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require authentication to view or change profile information.
- **FR-002**: The system MUST show only the authenticated user's profile to that user. The user identity used for reads and writes MUST come from the authenticated session, not an untrusted target-user identifier in the request.
- **FR-003**: The system MUST display the user's saved phone number and applicable identity information, including full name, student number, and faculty when those fields are available.
- **FR-004**: The user MUST be able to update their own phone number only after it passes the application's established phone-number validation. Invalid input MUST NOT alter the saved value.
- **FR-005**: Full name, student number, and faculty MUST remain read-only to the account owner. Attempts to change them MUST be rejected without modifying stored values.
- **FR-006**: The system MUST allow an authenticated user to change their own password only after verifying the current password, requiring a new password of at least six characters, and confirming that the new-password confirmation matches. The frontend MUST validate the confirmation; `confirmPassword` MUST NOT be included in the API request.
- **FR-007**: A failed password change MUST leave the existing password unchanged. Passwords MUST NOT be stored or returned in plaintext.
- **FR-008**: The system MUST allow an authenticated user to set a JPG or PNG profile picture of no more than 10 MB and MUST reject unsupported formats or larger files.
- **FR-009**: The system MUST allow a user to remove their profile picture and display the default profile picture afterward.
- **FR-010**: A failed profile-picture upload or save MUST preserve the previously saved profile picture and profile values.
- **FR-011**: The system MUST provide clear validation and operation-failure feedback without discarding valid unsaved form input.

### Key Entities

- **User profile**: The authenticated user's editable contact detail and displayed identity information.
- **Academic identity**: Staff-controlled identity information, including full name and, for students, student number and faculty where available.
- **Profile picture**: An optional image selected by the user, subject to the supported format and size limit.
- **Credential**: The user's existing password verifier and the values supplied during a password-change attempt; plaintext credentials are never retained.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all authorization tests, unauthenticated requests are denied and a user cannot read or modify another user's profile.
- **SC-002**: 100% of rejected phone-number changes and read-only-field edits leave the stored profile unchanged.
- **SC-003**: A valid phone-number update is visible after reloading the profile.
- **SC-004**: A password changes only when the current password is correct, the new password is at least six characters, and confirmation matches.
- **SC-005**: An image at or below 10 MB in JPG or PNG format can be saved; unsupported formats and images above 10 MB are rejected without replacing the current picture.
- **SC-006**: Removing a saved profile picture results in the default picture being displayed.

## Assumptions

- UC-03 is the product source of truth for profile-management behavior; email, role assignments, and staff-controlled identity fields are not editable in this feature.
- Existing authentication, password verification, phone validation, and response conventions should be reused where available.
- Profile-picture files are stored outside PostgreSQL; the existing `User.avatar_url` column stores only a legal URL reference. This feature uses a configurable local file directory and Sharp for full JPG/PNG decoding, as approved by the requester on 2026-11-28. Deployed environments must mount persistent storage at the configured directory.
- The approved source for a student number is `Student.user_id`, which references `User.user_id`; accounts without a Student row have no student number. The field is read-only to account owners.
- The minimum new-password length is six characters. The frontend validates confirmation, which is not sent in the API request.

## Approved implementation decisions (2026-11-28)

The requester approved the existing specification/plan and Next.js exception for this feature, domestic `0` + 9 digits / international `+84` + 9 digits phone validation with nullable clearing, student number equal to Student.user_id when a Student row exists, and storing avatar files separately while persisting only a legal URL in PostgreSQL. The requester additionally directed that schema design be checked as the source of truth/reference. Sharp and a configurable local file store are approved for avatar decoding/storage. See [implementation.md](implementation.md) for the executable-schema cross-check and storage/session behavior. These decisions do not grant account-owner edits to protected identity fields.

**UC-03 alignment (2026-11-28)**: The requester clarified that `Student.user_id` is the student number and directed the password minimum to follow UC-03 A7 and BR-ACC-09: six characters. These decisions supersede the earlier unavailable-number and eight-character assumptions.
