# Feature Specification: Role-Based Dashboard Shell, Authentication, and Administrator Account Registration

**Feature Branch**: `003-auth-dashboard-admin-users`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Common role-based dashboard, authentication (login/logout), and administrator account registration for myHCMUS frontend. A user who has an account can log in, land on the dashboard for their role, and log out; an administrator can register new user accounts, and those new accounts can log in immediately afterwards. All data comes from a mock that follows docs/api/openapi.yaml; switching to the real backend must require configuration only."

**Traceability**: UC-01 Log in, UC-02 Log out, UC-29 Manage users and permissions (subset), UC-32 View personalized homepage (draft shell only), UC-03 A2/A7 Change password (only the first-sign-in password change).
**Contract**: `docs/api/openapi.yaml` v1.2.0 and `docs/api/openapi-changes.md` (API-GAP-002 proposal for login/logout).
**Business rules**: BR-ACC-01, BR-ACC-02, BR-ACC-05, BR-ACC-06, BR-ADM-12, BR-OVR-01. **NFRs**: NFR-SEC-02, SEC-03, SEC-04, SEC-05 (optional), PER-01, REL-05, USA-02, USA-05, USA-13.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log in and land on my role's dashboard (Priority: P1)

A student, manager, or administrator opens the sign-in page, enters their email and password, and is taken to the dashboard for the single role assigned to their account. No role is chosen on the sign-in page: the role always comes from the account.

**Why this priority**: Nothing else in the product is reachable without it; it is the entry point for every role.

**Independent Test**: Using each seeded account (one per role), sign in and confirm the user lands on that role's dashboard with their name and role visible in the header.

**Acceptance Scenarios** (UC-01 basic flow):

1. **Given** a seeded student account, **When** the user submits the correct email and password, **Then** the student dashboard opens and the header shows the user's name and the role "Student".
2. **Given** a seeded manager account, **When** the user signs in, **Then** the manager dashboard opens.
3. **Given** a seeded administrator account, **When** the user signs in, **Then** the administrator dashboard opens.
4. **Given** the user arrived at sign-in because they tried to open a protected page of their own role, **When** they sign in successfully, **Then** they are returned to that page instead of the dashboard.
5. **Given** the user signed in and then reloads the page, **When** the page loads, **Then** they remain signed in on the same page.
6. **Given** the sign-in request is in progress, **When** the user looks at the form, **Then** the submit control shows a pending state and cannot be submitted again.

---

### User Story 2 - Sign-in failures are explained safely (Priority: P1)

When sign-in cannot succeed, the user sees a clear, non-technical message that tells them what to do next, without revealing whether an account exists.

**Why this priority**: UC-01 alternative flows A1–A7 are explicitly required in this phase and protect account privacy.

**Independent Test**: Trigger each alternative flow against the mock using the dedicated seeded accounts and inputs listed in Assumptions, and confirm the outcome listed below.

**Acceptance Scenarios**:

1. **(A1)** **Given** the email field is empty or not a valid email, or the password is empty, **When** the user submits, **Then** each invalid field is marked with a correction hint, no request is sent, and the entered email is kept (the password field may be cleared).
2. **(A2)** **Given** a wrong password for an existing account **or** an email that does not exist, **When** the user submits, **Then** the same generic message is shown in both cases (e.g., "Email or password is incorrect"), and the user can retry.
3. **(A3)** **Given** an account whose status is inactive (disabled), **When** the user submits correct credentials, **Then** access is denied with a message saying the account is disabled and to contact the administrator, and no session is created.
4. **(A4, optional NFR-SEC-05)** **Given** 5 consecutive failed attempts for the same account, **When** the user tries again within 15 minutes, **Then** sign-in is refused with a message stating that the account is temporarily locked and the time when retry is allowed.
5. **(A5)** **Given** the authentication service is unreachable or returns a server error, **When** the user submits, **Then** a retryable "service unavailable" message is shown, the entered email is kept, and no session is created.
6. **(A6)** **Given** credentials are accepted but the account has no valid role (missing or not one of student/manager/administrator) or the session cannot be established, **When** sign-in completes, **Then** the user is not admitted to any protected page and sees a message that the account cannot be signed in and to contact the administrator.
7. **(A7)** **Given** the user is already signed in, **When** they open the sign-in page, **Then** they are redirected to their role's dashboard and no second session is started.

---

### User Story 3 - Log out and keep protected pages closed (Priority: P1)

A signed-in user opens the account menu in the header, chooses Log out, and is returned to the sign-in page. Afterwards, protected pages cannot be opened, even with the browser back button.

**Why this priority**: Required by UC-02 and needed to verify the admin end-to-end scenario (create account → log out → sign in as the new account).

**Independent Test**: Sign in, log out, press Back, and attempt to open a dashboard URL directly; both must land on sign-in.

**Acceptance Scenarios** (UC-02):

1. **(Basic)** **Given** a signed-in user, **When** they choose Log out from the account menu, **Then** the session is ended, all signed-in UI state is cleared, and the sign-in page is shown.
2. **(A1)** **Given** the account menu is open, **When** the user closes it or does not choose Log out, **Then** the session remains active and the page is unchanged.
3. **(A2)** **Given** the session has already expired, **When** the user chooses Log out, **Then** the user is treated as logged out without an error and is shown the sign-in page.
4. **(A3)** **Given** the logout request cannot reach the server, **When** the user chooses Log out, **Then** local credentials are still removed, the sign-in page shows a notice that sign-out could not be confirmed with the server, and protected pages require signing in again.
5. **(A4)** **Given** the user has logged out, **When** they press Back or enter a protected URL, **Then** no protected content is displayed (including from browser cache) and they are sent to sign-in.
6. **Given** a signed-in user whose session expires while using the app, **When** their next action needs the server, **Then** they are sent to sign-in with a message that the session expired, and after signing in they return to the page they were on.

---

### User Story 4 - Shared, role-aware application shell (Priority: P2)

Every signed-in page uses the same shell: a header with the product logo and an account menu (name, role, Log out), a navigation area listing only the destinations of the user's role, and a content area. Each role has a draft dashboard that greets the user, shows their account details, and offers shortcuts to that role's available features.

**Why this priority**: It gives all roles a consistent home and the frame into which future features are added; draft content is acceptable for this phase.

**Independent Test**: Sign in as each role and compare: same header, same menu behavior, same layout; only the navigation items and dashboard content differ.

**Acceptance Scenarios**:

1. **Given** a signed-in user of any role, **When** any protected page is shown, **Then** it uses the same header, account menu, navigation area, and page-title pattern.
2. **Given** a student, **When** the navigation is shown, **Then** it contains only student destinations and no manager or administrator destinations (and likewise for the other roles).
3. **Given** a student, **When** they type a manager or administrator page address, **Then** a "no permission" page is shown inside the same visual style, with a link back to their own dashboard; no content of the other role is shown.
4. **Given** a dashboard is loading its content, **When** the data is pending, an error occurs, or there is nothing to show, **Then** the shared loading, error (with retry), and empty presentations are used.
5. **Given** a dashboard section whose data has no contract endpoint yet, **When** the dashboard is shown, **Then** that section states that it is not yet available rather than showing invented numbers.
6. **Given** a narrow (phone-width) screen, **When** a protected page is shown, **Then** the navigation collapses into a menu that can be opened and closed with keyboard and touch.

---

### User Story 5 - Administrator views user accounts (Priority: P2)

An administrator opens User Management and sees a paginated list of accounts showing name, email, role, and status.

**Why this priority**: The administrator must see accounts before and after creating one (UC-29 steps 1–2, 8).

**Independent Test**: Sign in as the seeded administrator, open User Management, and confirm the seeded accounts are listed with their roles; page through the list.

**Acceptance Scenarios**:

1. **Given** an administrator, **When** they open User Management, **Then** accounts are listed with full name, email, role, status, and creation date, newest first, 10 per page with page controls.
2. **Given** the administrator searches by name/email/student number or filters by role, **When** no account matches, **Then** an empty state explains that no accounts match and offers to clear the filters (UC-29 A1).
3. **Given** the list cannot be loaded, **When** the error occurs, **Then** an error state with a retry action is shown.
4. **Given** a manager or student, **When** they try to open User Management, **Then** they see the "no permission" page; the navigation never offered it to them.

---

### User Story 6 - Administrator registers a single account with exactly one role (Priority: P1)

An administrator chooses "Create account", fills in the account details and selects exactly one role, reviews a summary (including the permissions that role grants), confirms, and sees the result. The new account appears in the list and can sign in immediately.

**Why this priority**: It is the core end-to-end acceptance scenario of this phase.

**Independent Test**: As the administrator, create a new student account, log out, sign in with the new account, set a new password (User Story 7), and land on the student dashboard.

**Acceptance Scenarios** (UC-29 subset):

1. **(Steps 3–4)** **Given** the administrator opens Create account, **When** the form is shown, **Then** it asks for email, full name, role (one choice among Student, Manager, Administrator), and optional phone number; when Student is chosen, student number and faculty become required fields; required and optional fields are clearly marked.
2. **(Step 5)** **Given** valid input, **When** the administrator selects Review, **Then** a review step shows every entered value, the chosen single role, the permissions that role grants, and the temporary password generated from the entered information (e.g., student "Nguyễn Văn An", student number 23127001 → `KHTN@NVA7001`); nothing is saved yet.
3. **(Temporary password override)** **Given** the review step shows the generated temporary password, **When** the administrator chooses to change it and enters a different one, **Then** the new value replaces the generated one if it meets the password rules (FR-036b); otherwise the field is marked with the rule it breaks and confirmation is blocked.
4. **(Steps 6–8)** **Given** the review step, **When** the administrator confirms, **Then** the account is created, a result view shows the created account and its temporary password with a copy action, and the account list includes it.
5. **(A2)** **Given** the form or review step, **When** the administrator cancels, **Then** nothing is saved, the list is unchanged, and if any field had been filled in, the administrator is asked to confirm discarding the input.
6. **(A6)** **Given** the server rejects the proposed role assignment as a policy violation, **When** the administrator confirms, **Then** the account is not created and the message explains which part of the proposal violates policy; the input is kept for correction.
7. **(A9)** **Given** creation fails because of a server or network error, **When** the administrator confirms, **Then** an error is shown, no partial account appears in the list, all input is kept, and the administrator can retry from the review step.
8. **(A11)** **Given** an attempt to assign more than one role to one account (the form only allows one choice; a request carrying several roles is also rejected by the server), **When** it is submitted, **Then** it is rejected with a message stating that each account has exactly one role and that distinct roles require separate accounts.
9. **Given** the email or student number already belongs to an account, **When** the administrator confirms, **Then** the corresponding field is marked as already in use and no account is created.
10. **Given** the account was created, **When** the administrator logs out and signs in with the new account's email and temporary password (generated or overridden), **Then** the new user is asked to set a new password (User Story 7), and after doing so lands on the dashboard of the new account's role.

---

### User Story 7 - Change the temporary password at first sign-in (Priority: P2)

A user whose account was just created by an administrator signs in with the temporary password. Before they can use anything else, they must choose their own password. After that they land on their role's dashboard, and the temporary password no longer works.

**Why this priority**: Temporary passwords can be guessed from the name and student number (GAP-L). Forcing a change limits how long a guessable password stays valid.

**Independent Test**: Create an account as the administrator, sign in with it, confirm that only the "Set a new password" screen is reachable, set a new password, and confirm the dashboard opens. Then log out and confirm the temporary password is rejected while the new one works.

**Acceptance Scenarios** (UC-01 step 5 + UC-03 A2/A7):

1. **Given** an account that requires a password change, **When** the user signs in successfully, **Then** the "Set a new password" screen is shown instead of the dashboard. It explains why the change is needed.
2. **Given** the "Set a new password" screen, **When** the user tries to open any other protected page (navigation, typed address, Back), **Then** they are returned to the "Set a new password" screen.
3. **Given** the user enters the current (temporary) password, a new password of at least 8 characters that differs from the temporary one, and a matching confirmation, **When** they submit, **Then** the password is changed and they land on their role's dashboard (or the safe return page they originally requested).
4. **Given** the new password is shorter than 8 characters, equals the temporary password, or the confirmation differs, **When** they submit, **Then** the affected field shows the rule it breaks, nothing is sent, and the entered values are kept (passwords may be cleared).
5. **Given** the current password entered is wrong, **When** they submit, **Then** a message says the current password is incorrect, the password is unchanged, and the user can retry (UC-03 A7).
6. **Given** the request fails because of a server or network error, **When** they submit, **Then** a retryable error is shown and the password is unchanged.
7. **Given** the "Set a new password" screen, **When** the user chooses Log out, **Then** they are logged out (User Story 3), and the next sign-in with the temporary password shows this screen again.
8. **Given** the password was changed, **When** the user logs out and signs in again, **Then** the temporary password is rejected with the generic failure message and the new password opens the dashboard directly.

---

### Edge Cases

- A sign-in redirect target that points to another site, to the sign-in page itself, or to a page of another role is ignored; the user goes to their own dashboard instead.
- The same user signed in on two tabs logs out in one tab: the other tab must require sign-in on its next navigation or server request.
- The account is disabled by an administrator while the user is signed in: the user's next server request is refused with "account disabled" (GAP-N), the session is cleared, and they are sent to sign-in with the disabled message (FR-018a, BR-ACC-06, UC-29 A10).
- The administrator creates an account, then signs in again as administrator: the new account still appears in the list (mock data persists until the mock is reset).
- The administrator double-clicks Confirm: only one account is created (FR-037).
- The administrator overrides the temporary password, then changes the full name or student number: the override is kept (no silent regeneration); clearing the override restores the generated value.
- Two students with the same initials and the same last 4 student-number digits get the same generated temporary password: this is allowed; each still signs in with its own email.
- A full name contains extra spaces, hyphens, or a single word: initials are taken from non-empty words only (a one-word name gives one initial; the password is still at least 10 characters).
- The session expires while the user is on "Set a new password": they are sent to sign-in, and signing in again with the temporary password returns them to that screen.
- A user who must change their password opens the app in a second tab: that tab also shows only "Set a new password" until the change is done.
- The result view is closed or reloaded before the temporary password is copied: it is not shown again. Recovering it requires a password reset, which is out of scope in this phase.
- The administrator switches the role from Student to Manager after filling in student number and faculty: those values are not sent for non-student roles.
- The faculty list cannot be loaded while creating a student account: the form shows an error with retry for that field and cannot be confirmed with Student selected.
- The administrator creates an account with an email that differs only by letter case from an existing one: treated as a duplicate.
- Keyboard-only and screen-reader users can complete sign-in, logout, and account creation; errors are announced.
- The mock data source is selected in a production build: this is visibly flagged (e.g., a "Demo data" indicator) so mock data is never mistaken for real data.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication — UC-01**

- **FR-001**: The sign-in page MUST collect only email and password; it MUST NOT offer a role choice. The role MUST be taken from the account returned by the authentication service.
- **FR-002**: The system MUST validate input before sending (email present and well-formed, password present), show field-level guidance, and keep the entered email after any failure (A1, NFR-USA-05).
- **FR-003**: The system MUST show one identical generic message for unknown email and wrong password (A2).
- **FR-004**: The system MUST deny sign-in for inactive accounts with a specific "account disabled" message (A3, BR-ACC-01).
- **FR-005**: The system MUST support a temporary lock after 5 consecutive failed attempts for 15 minutes, displaying when retry is allowed (A4, NFR-SEC-05). The lock is decided by the authentication service; the UI only displays it.
- **FR-006**: The system MUST show a retryable service-unavailable message when the authentication service cannot be reached or fails, without creating a session (A5, NFR-REL-05).
- **FR-007**: The system MUST NOT admit the user to any protected page when the returned account has no valid single role or when session establishment fails, and MUST report the problem (A6). The current-user context MAY report a missing role (GAP-O); the client, not the service, then applies A6. The same check applies when a session is restored on reload: an account without a valid role is signed out locally and shown the "cannot be signed in" message on the sign-in page.
- **FR-007a**: If loading the current-user context right after a successful sign-in fails because of a server error or a network failure, the system MUST discard the new credentials, admit the user nowhere, and show the retryable service-unavailable message (A5/A6).
- **FR-008**: The system MUST redirect an already-signed-in user away from the sign-in page to their role's dashboard without starting a new session (A7).
- **FR-009**: After successful sign-in, the system MUST obtain the current user context (user, single role, permissions) and route the user to their role's dashboard, or to a safe same-role return page if one was requested.
- **FR-010**: The session MUST survive page reloads until it expires or the user logs out. Mirroring the server, which returns a bearer token in the sign-in response and accepts it only in the `Authorization` header (Q4), the browser keeps the token in local storage, never in a cookie. The token MUST be attached only to requests to the configured API origin, MUST expire together with the server token, and MUST be removed on logout or expiry. The route guard MUST use only a separate, non-sensitive session hint (role, password-change mark, expiry) that grants nothing by itself. Because page scripts can read the token, the server MUST remain the only enforcement point (Constitution IV).
- **FR-011**: No message shown to the user may contain technical details (status codes, stack traces, raw server text) (NFR-REL-05).
- **FR-012**: The "Forgot password" link and the third-party sign-in buttons MUST be hidden in this phase, because the contract defines no such operations.

**Logout and session — UC-02**

- **FR-013**: Every protected page MUST offer Log out from the account menu in the shared header; closing the menu MUST leave the session untouched (A1).
- **FR-014**: Log out MUST request server-side invalidation, clear all signed-in UI state and stored credentials, and show the sign-in page.
- **FR-015**: If the session is already expired at logout, the system MUST complete logout silently (A2).
- **FR-016**: If the logout request cannot reach the server, the system MUST still remove local credentials and MUST inform the user that server sign-out could not be confirmed (A3).
- **FR-017**: After logout, protected pages MUST NOT be displayed from history or cache; any attempt MUST end on sign-in (A4).
- **FR-018**: When any server request reports that the session is missing, invalid, or expired, the system MUST clear the session and send the user to sign-in with an explanatory message and a safe return path.
- **FR-018a**: When any authenticated server request reports that the account is disabled (GAP-N), or the current-user context loaded on reload shows the account as inactive, the system MUST clear the session and show the "account disabled" message on the sign-in page.
- **FR-018c**: Whenever the client finds no valid token, it MUST also clear the route-guard hint, so a stale hint can never cause a redirect loop between protected pages and the sign-in page.
- **FR-018b**: Logging out or losing the session in one browser tab MUST end the signed-in state in the user's other open tabs of the same browser, at the latest on their next navigation or server request.

**Route protection and role separation**

- **FR-019**: Protected pages MUST be inaccessible without a valid session; the user MUST be sent to sign-in.
- **FR-020**: Each role's pages MUST be reachable only by that role; other roles MUST see the shared "no permission" page with a link to their own dashboard.
- **FR-021**: The UI role checks MUST only show, hide, or redirect; every protected data operation MUST still be sent to the server, and a server "forbidden" response MUST render the "no permission" presentation even if the UI expected access (Constitution IV, BR-ACC-02).
- **FR-022**: The role model MUST contain exactly the values student, manager, administrator, held as a single value per account; the term "organizer" MUST NOT appear in UI or code.

**Shared shell and dashboards — UC-32 (draft)**

- **FR-023**: All protected pages MUST share one shell: header (logo, account menu with name, role label, Log out), role-filtered navigation, page title area, and content area, built from reusable components consistent with the existing visual language (colors, radii, shadows, typography, buttons, cards, and state components already used on the landing and sign-in pages).
- **FR-024**: Navigation MUST list the full set of destinations for the user's role as defined in `user-flow.md` §1.5 (with "Organizer" read as Manager), plus Dashboard for every role:
  - **Student**: Dashboard, Activities, DRS Management, My Registrations, Calendar, AI Student Assistant, University Services, Profile.
  - **Manager**: Dashboard, Activity Management, Registration Management, Attendance and Results, Appeals, Reports, Profile.
  - **Administrator**: Dashboard, User Management, Activity Categories, System Configuration, Reports and Analytics, Audit Logs, Profile.

  Destinations built in this phase (all Dashboards; administrator User Management) MUST be active links, with the current page clearly indicated. Every other destination MUST be shown as disabled with a "Coming soon" marker, using one shared presentation; it MUST NOT be clickable or keyboard-activatable as a link, and it MUST be announced to assistive technology as unavailable. Adding a feature later MUST only require marking that destination as available.
- **FR-024a**: Shortcut cards on dashboards MUST follow the same rule: built destinations are actionable, unbuilt ones use the shared "Coming soon" presentation.
- **FR-025**: Each role MUST have a draft dashboard showing a greeting, the user's account details from the current user context, and shortcut cards to the role's available features; any summary without a contract endpoint MUST be shown as "not yet available" and MUST NOT display invented values (UC-32 A2).
- **FR-026**: Every screen in scope (sign-in, set a new password, dashboards, user list, create account, no-permission) MUST implement loading, empty (where data can be empty), error-with-retry, and success presentations using the same shared state components.
- **FR-027**: The shell MUST be usable at phone width and by keyboard, with visible focus and accessible names for menu and navigation controls.

**Administrator — user accounts (UC-29 subset)**

- **FR-028**: Administrators MUST be able to open User Management and see a paginated account list (full name, email, role, status, creation date), sorted newest first, 10 per page.
- **FR-029**: The list MUST support search (name, email, student number) and a role filter, and MUST show an empty state with a "clear filters" action when nothing matches (A1).
- **FR-030**: Administrators MUST be able to start creating a single account from User Management. The form MUST include email, full name, exactly one role, optional phone number, and, for the Student role, required student number and faculty chosen from the faculty list.
- **FR-031**: The role selection MUST allow exactly one value; the system MUST reject any attempt (UI or request) to assign more than one role and explain that distinct roles require separate accounts (A11, BR-ADM-12).
- **FR-032**: Before saving, the system MUST show a review step with all values, the chosen role, and the permissions that role grants (UC-29 step 5, NFR-USA-13); confirming is a separate, explicit action (step 6).
- **FR-033**: Cancelling from the form or review MUST save nothing; if input exists, the system MUST ask before discarding it (A2).
- **FR-034**: Policy-violation rejections MUST leave no account created and MUST show which part of the proposal violates policy (A6).
- **FR-035**: Creation failures MUST leave no partial account, keep all input, and allow retry from the review step; duplicate email or student number MUST be shown on the affected field (A9).
- **FR-036**: The system MUST automatically generate a temporary password for every new account from the entered information, using the rule `KHTN@` + initials + 4-character suffix:
  - **Initials**: the first letter of each word of the full name, with Vietnamese diacritics removed (Đ/đ → D) and uppercased (e.g., "Nguyễn Văn An" → `NVA`).
  - **Suffix**: for students, the last 4 characters of the student number (e.g., 23127001 → `7001`); if the student number is shorter than 4 characters, it is left-padded with random digits to 4. For managers and administrators, 4 random digits.
  - Examples: student "Nguyễn Văn An" / 23127001 → `KHTN@NVA7001`; manager "Trần Thị Bích" → `KHTN@TTB` + 4 random digits, e.g. `KHTN@TTB8203`.

  The generation rule MUST be defined in one place so it can be made stricter later without changing screens. Generated values are always at least 10 characters.
- **FR-036a**: The review step MUST show the generated temporary password and let the administrator replace it manually before confirming. Changing the full name, student number, or role MUST regenerate it unless the administrator has already overridden it. The random digits stay the same within one creation session unless the role changes.
- **FR-036b**: A manually entered temporary password MUST be at least 8 characters (satisfying both NFR-SEC-02's minimum of 6 and the contract's minimum of 8, see GAP-I); the generated default always satisfies this.
- **FR-036c**: The result view MUST show the created account and its temporary password once, with a copy action; the temporary password MUST NOT appear in the account list or be retrievable after leaving the result view.
- **FR-036d**: The new account MUST be able to sign in with its email and temporary password immediately after creation.
- **FR-037**: Confirm MUST be protected against double submission.
- **FR-038**: After creation, the account list MUST reflect the new account without a manual reload.

**First-sign-in password change (UC-03 A2/A7)**

- **FR-043**: Every account created by an administrator MUST be marked as requiring a password change. The mark comes from the current user context returned by the service (GAP-M); the UI MUST NOT decide it on its own.
- **FR-044**: While an account requires a password change, the only protected screen it can reach MUST be "Set a new password". All other protected addresses MUST redirect there. Log out MUST stay available. The server is expected to refuse other protected operations for such accounts (GAP-M); the UI redirect only shows/hides.
- **FR-045**: The "Set a new password" screen MUST ask for the current (temporary) password, a new password, and a confirmation. Before sending, it MUST check that the new password has at least 8 characters, differs from the current one, and matches the confirmation, marking each failing field (NFR-USA-05).
- **FR-046**: An incorrect current password MUST show a specific "current password is incorrect" message and leave the password unchanged (UC-03 A7). Server or network failures MUST show a retryable error.
- **FR-047**: After a successful change, the system MUST refresh the current user context, clear the password-change mark, and continue to the role's dashboard or the safe return page. The temporary password MUST stop working.
- **FR-048**: The submit control MUST show a pending state and prevent double submission. The screen MUST use the same shell styling and state components as the other screens. Its title, navigation label and any links to it MUST use the wording "Set a new password" everywhere in the UI.

**Data source (mock vs. real)**

- **FR-039**: All data in this phase MUST come through the same service boundary used by the rest of the client, with a real and a mock implementation selected by one configuration setting; pages and components MUST NOT change when switching.
- **FR-040**: The mock MUST follow the request and response shapes, response envelope, and error codes of the contract (and, for login/logout, the API-GAP-002 proposal), including the error cases needed to reproduce every alternative flow in this spec.
- **FR-041**: Accounts created through the mock administrator flow MUST be usable for mock sign-in and MUST persist until the mock data is reset.
- **FR-042**: The mock MUST seed at least: one active account per role, one inactive (disabled) account, one account without a valid role (for A6), and one account that requires a password change (for User Story 7). It MUST also provide a reproducible "service unavailable" sign-in case (A5) that is not a stored account.

### Key Entities

- **Account (user)**: identity used to sign in; email, full name, optional phone number, temporary password (set at creation; never displayed after the result view), a "must change password" mark (set at creation, cleared after the first password change), status (active/inactive), exactly one role, creation date, version; for students also student number and faculty.
- **Role**: one of student, manager, administrator; has a display name and a set of permissions.
- **Permission**: a code granted by a role (e.g., role.manage); displayed on review and used only for showing/hiding UI.
- **Session / current user context**: proof that a user is signed in, plus the user's profile, role, permissions, and active assignments; ends on logout or expiry.
- **Faculty**: reference list used when creating student accounts.
- **Sign-in attempt record (server-side, mock)**: consecutive failures and lock-until time per account, used for A4.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of seeded accounts (one per role) sign in and land on their own role's dashboard on the first attempt.
- **SC-002**: The end-to-end scenario "administrator creates account → logs out → new account signs in with the temporary password → sets a new password → correct role dashboard" succeeds for each of the three roles.
- **SC-002a**: After the first password change, the temporary password is rejected in 100% of attempts, and 0 protected pages other than "Set a new password" are reachable before the change.
- **SC-003**: Each listed alternative flow (UC-01 A1–A7, UC-02 A1–A4, UC-29 A1, A2, A6, A9, A11, UC-03 A7 on first sign-in) has a reproducible test with the expected outcome, and 100% pass.
- **SC-004**: For every role and every other role's page address, 0 pages of another role display content; all redirect to sign-in (no session) or the no-permission page (wrong role).
- **SC-005**: After logout, 0 protected pages are viewable via Back or direct address.
- **SC-006**: Unknown-email and wrong-password failures produce identical user-visible messages in 100% of cases.
- **SC-007**: Sign-in to dashboard, and confirm to result view, each complete in under 3 seconds under normal conditions (NFR-PER-01). On the mock this is not meaningfully measurable, because latency is simulated; it is recorded as a manual timing check and must be re-verified against the real backend.
- **SC-008**: An administrator can create a single account (form → review → result) in under 2 minutes.
- **SC-009**: Switching from mock to real data source requires changing configuration only; 0 page or component files change.
- **SC-010**: All screens in scope pass automated accessibility checks with no serious or critical violations, and all flows are completable by keyboard.
- **SC-011**: The three role dashboards share the same header, menu, navigation, and state components (visual and structural review finds no one-off variants).

## Assumptions

- **Seeded mock accounts** follow the demo accounts in use-case-specifications §5.1: `student1@example.invalid`, `manager1@example.invalid`, `admin@example.invalid`, password `demo2026`. Additional mock accounts: one inactive account (`disabled@`, A3), one account without a valid role (`norole@`, A6), and one account that must set a new password (`newuser@`, User Story 7). Service unavailability (A5) is reproduced by the handler rule for `outage@example.invalid`, which is not a stored account, or by the mock failure switch. The lock (A4) is reproduced by repeated failures.
- **Lock (NFR-SEC-05)** is implemented in the mock as 5 failures → 15-minute lock; the real backend may or may not implement it, and the UI only displays what the service reports.
- **Session lifetime** is decided by the authentication service; the UI reacts to expiry. The optional 30-minute idle timeout of NFR-SEC-05 is not enforced by the UI in this phase.
- **Logout destination** is the sign-in page (UC-02 step 4); user-flow.md's "landing page" is superseded by the use case.
- **Language**: UI copy stays in English to match the existing screens; Vietnamese/English switching (NFR-LOC-01, UC-08) is out of scope.
- **Policy violation (A6)** for account creation is whatever the server reports as `ROLE_POLICY_VIOLATION`; the mock enforces this example policy: student number and faculty are allowed only for the Student role.
- **Login input validation** checks presence and email format only; password length rules apply to password setting/changing, not to sign-in.
- **Phone number** (account creation) is optional and only trimmed; no format rule is applied, because no format is defined in the use cases, business rules or contract (open question, GAP-P).
- **Temporary password**: The generated value is a proposal shown before confirmation. The value actually saved (generated or overridden) is sent with the create request (GAP-C). The user must replace it at first sign-in (User Story 7).
- **Password rules**: New passwords need at least 8 characters, which satisfies both NFR-SEC-02 (6) and the contract (8) (GAP-I). No further complexity rules in this phase.
- **Seeded accounts** (UC demo accounts) do not require a password change, so the basic sign-in tests go straight to the dashboard.
- **Out of scope**: editing, disabling, or deleting accounts; an administrator changing a password after creation; changing one's own password at any time other than first sign-in (full UC-03); role changes; CSV/XLSX import; permission management; audit logs; profile (UC-03); forgot/reset password; real dashboard summaries (UC-32 A3–A6).
- **Existing client code to align** (current deviations this feature corrects): role code `admin` instead of `administrator`; sign-in form has a role selector and a mock that requires it; mock administrator account carries the manager role; already-signed-in redirect on the sign-in page never takes effect; wrong-role redirect points to a misspelled page; dashboard pages are unstyled stubs each with its own logout button; the auth provider uses the mock service directly instead of the shared selection point; the API client throws raw technical text and has no error-code normalization.

## API Gaps / Open Questions

| ID | Topic | Finding | Proposed handling |
|---|---|---|---|
| GAP-A | Login/logout operations | `openapi.yaml` defines only `GET /auth/me`; `POST /auth/login` and `POST /auth/logout` are API-GAP-002 (PROPOSED). | Mock implements the API-GAP-002 shapes (`{email, password}` → same envelope as `/auth/me`; logout → `ApiMessage`). Real integration blocked until accepted. |
| GAP-B | Login error codes | Contract has no codes for wrong credentials, disabled account, lock, or missing role. | Propose `INVALID_CREDENTIALS` (401), `ACCOUNT_DISABLED` (403), `ACCOUNT_LOCKED` (423 or 429, with retry-after time), `ROLE_MISSING` (403); `503` for unavailable. Add to API-GAP-002. |
| GAP-C | Initial password for admin-created accounts | `CreateUserRequest` has no password ("activation/invitation is a separate flow"). Decision (Q1): temporary password `KHTN@` + initials + last 4 student-number digits (staff: 4 random digits), generated only from fields already in the contract; the admin may override it before confirming. | Propose to BE: add `initialPassword` (string, minLength 8) to `CreateUserRequest`. The mock accepts it now; real integration is blocked until it is accepted. Open for BE: should the server generate the password instead (then the override needs a different shape)? |
| GAP-L | Temporary password strength | For students, the password can be derived from the name and student number, which are fairly public. This was accepted for the first draft. | Mitigated by the forced change at first sign-in (User Story 7). A stricter rule (e.g., adding random characters) remains a follow-up. |
| GAP-M | "Must change password" state | The contract has no field marking an account as requiring a password change, and no server rule blocking other operations until it is changed. `PATCH /profile/password` exists (`currentPassword`, `newPassword` min 8; 400 `CURRENT_PASSWORD_INCORRECT`), so the change itself is covered. | Propose to BE: add `mustChangePassword: boolean` to `Profile` (returned by `/auth/me` and login), set to true on `POST /admin/users`, cleared by `PATCH /profile/password`; while true, other protected operations return 403 `PASSWORD_CHANGE_REQUIRED`. The mock implements this now. |
| GAP-D | Session transport | Contract: `bearerAuth` (HTTP bearer, JWT) but no login operation. Server: `POST /api/auth/login` returns the token in the body (`payload.data.token`), 1-hour expiry, claims `sub` and `name` only (no role). Protected routes read only `Authorization: Bearer`; the server sets no cookies and has no refresh or logout. The client today has an http-only cookie set by an ad-hoc local mock route. | Decision (Q4, follows the server): the client keeps the token in local storage and sends it only as `Authorization: Bearer` to the API origin. A separate non-sensitive hint cookie (role, password-change mark, expiry) feeds the route guard only. No refresh; expiry → sign-in. The role comes from `/auth/me`; ask BE whether to add a `role` claim. Proposal recorded in `docs-changes.md` (DOC-03). |
| GAP-E | Server ≠ contract | Server base path `/api/auth/*` (contract `/api/v1`); envelope `{success, statusCode, payload:{message,data}}` (contract `{success, data|message, code}`); login returns **404 "Email not found"** (reveals account existence, violates UC-01 A2) and 401 "Wrong password"; no logout, no `/auth/me`. | Mock follows the contract, not the server. Report to BE. |
| GAP-F | Self-registration endpoint | Server exposes `POST /api/auth/register` (public, student-only, with password); UC-29 and the contract define admin provisioning via `POST /admin/users`. | FE does not use `/auth/register`. BE to confirm whether it is removed or admin-only. |
| GAP-G | Single role vs. data model | DB `UserRole` primary key `(user_id, role_id)` allows multiple roles; server AI identity uses `roles[]` and a "primary role" helper. Contract, UC, and BR-ADM-12 say exactly one role. | FE follows the single-role contract. BE/DB to align. |
| GAP-H | Policy violation on create | `ROLE_POLICY_VIOLATION` is documented for `PUT /admin/users/{userId}/role`, not for `POST /admin/users`. | Ask BE to add a 400 `ROLE_POLICY_VIOLATION` response to `createUser` (UC-29 A6). |
| GAP-I | Password length conflict | NFR-SEC-02 and BR-ACC-09: minimum 6 characters; `ChangePasswordRequest.newPassword`: minLength 8. | This feature uses 8 for manually overridden temporary passwords (satisfies both). Docs owners to reconcile. |
| GAP-J | Dashboard summaries | No contract operations exist for student or manager summaries; admin has `/admin/reports/overview`. | Draft dashboards show "not yet available" sections; no invented values. |
| GAP-K | Navigation docs use "Organizer" | `user-flow.md` and `client/pages/organizer.md` still use Organizer. | FE uses manager; docs owners to rename. |
| GAP-N | Disabled account on authenticated requests | The contract defines no error code for an authenticated request from an account that was disabled after sign-in. Its `ErrorResponse` code list has only `UNAUTHENTICATED` and `FORBIDDEN`. UC-29 A10 and BR-ACC-06 require updated status to apply on the next request. | Propose 403 `code: ACCOUNT_DISABLED` for authenticated requests from an inactive account (same code as the sign-in case in GAP-B), with two exceptions: `GET /auth/me` returns 200 with the profile and `user.status: 'inactive'` (so the client can show the disabled message when restoring a session on reload), and `POST /auth/logout` still succeeds. The client clears the session and shows the disabled message on sign-in in both cases (FR-018a). The mock implements this now. To be raised with BE by the team (DOC-01). |
| GAP-O | Missing role in the current-user context | `Profile.role` is a non-nullable `UserRole` in the contract, so `/auth/me` cannot express an account without a role. UC-01 A6 requires the client to detect that case. | Propose `Profile.role` nullable in `/auth/me` responses (or a documented 403 `ROLE_MISSING` at sign-in). The mock returns `role: null` for the A6 seed account, and the client applies A6 (FR-007). DOC-02. |
| GAP-P | Phone number format | Neither UC-03/UC-29, the business rules nor the contract define a phone format; UC-03 A5 mentions "invalid phone" without a rule. | The client only trims the value; no format is enforced. Open question for docs owners (DOC-07). |

### Clarifications

#### Session 2026-11-27

- Q1: How does a newly created account obtain a password? → A temporary password is generated automatically from information the contract already has, with no new date-of-birth field: `KHTN@` + full-name initials + last 4 student-number digits (staff: 4 random digits), e.g. `KHTN@NVA7001`. The rule may become stricter later. The administrator can change it manually; this happens on the review step before confirming, because editing an existing account is out of scope in this phase. (FR-036–FR-036d, GAP-C, GAP-L)
- Q2: Which navigation items appear per role? → The full role navigation from user-flow.md, with unbuilt items shown disabled and marked "Coming soon". (FR-024, FR-024a)
- Q3: Should users change the temporary password? → Yes. Accounts created by an administrator must set their own password at first sign-in before reaching anything else. (User Story 7, FR-043–FR-048, GAP-M)
- Q4 (plan phase): Where is the sign-in token held? → In the browser, not in a server-side session, following `src/server` (bearer token in the response body, `Authorization` header only, no cookies). Refined during analysis (H1): the token lives in local storage, and only a non-sensitive hint cookie is visible to the route guard. This keeps the mock in the browser with persistent local storage. (FR-010, GAP-D)
- Q5 (analysis remediation): How are disabled accounts and missing roles reported mid-session? → An authenticated request from an inactive account returns 403 `ACCOUNT_DISABLED`; the client clears the session and shows the disabled message on sign-in. `/auth/me` returns the profile even when the role is missing, and the client applies A6. (FR-007, FR-018a, GAP-N, GAP-O)
