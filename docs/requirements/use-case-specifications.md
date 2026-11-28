# myHCMUS - Use-Case Specifications
**Workers:** Phạm Vân Trang
**Reviewers:** Quách Thiên Lạc, Nguyễn Khang Thịnh
**Editors:** Phạm Vân Trang

## 1. Purpose and modeling conventions

This document specifies **all 33 use cases** in the use case model document, ordered by ID and grouped by the same four areas. Each **Basic Flow** describes a main success path as a dialogue between actor and system; **Alternative Flows** identify variations, error states and exceptional cases. A step reference refers to the numbered step in the current use-case table. An alternative stops or returns to the relevant step as described. The use cases preserve the model’s `extend` relationships (UC-13 → UC-10, UC-16 → UC-15).

**Interpretation of completeness:** “All alternative flows” means reasonably identifiable domain paths, validation outcomes, permissions, concurrency conflicts, and service failures grounded in the current baseline.

**Roles and scope:** User is the abstract parent actor of Student, Activity Manager and University Administrator. Each account has one assigned role; users needing additional roles use separate accounts. Staff permissions remain limited by the authorized activity, organization, faculty, or request assignment. External Email Service supports UC-17. Recognition requests are routed to authorized Student Affairs Office Managers for the submitting student's faculty; activity appeals go to the responsible Activity Manager. Existing university services are external links, not backend integrations.

## 2. Use-Case Catalog

| ID | Use case | Actor(s) |
|---|---|---|
| UC-01 | Log in | User (Student, Activity Manager, University Administrator) |
| UC-02 | Log out | User (Student, Activity Manager, University Administrator) |
| UC-03 | Manage own profile | User (Student, Activity Manager, University Administrator) |
| UC-04 | Discover activities | Student, Activity Manager |
| UC-05 | Follow an activity | Student |
| UC-06 | Chat with AI Student Assistant | Student |
| UC-07 | Access university services | User (Student, Activity Manager, University Administrator) |
| UC-08 | Change interface language | User (Student, Activity Manager, University Administrator) |
| UC-09 | View help and FAQ | User (Student, Activity Manager, University Administrator) |
| UC-10 | Register for an activity | Student |
| UC-11 | Cancel a registration | Student |
| UC-12 | Track registration status | Student |
| UC-13 | Join an activity waiting list | Student |
| UC-14 | Manage activity registrations | Activity Manager |
| UC-15 | View personal activity calendar | Student |
| UC-16 | Export activity calendar | Student |
| UC-17 | Receive activity notifications | Student; External Email Service (supporting actor for email delivery) |
| UC-18 | Manage activities | Activity Manager |
| UC-19 | Publish activity announcements | Activity Manager |
| UC-20 | View activity statistics and reports | Activity Manager |
| UC-21 | Manage participation records | Activity Manager |
| UC-22 | Manage training-score results | Activity Manager |
| UC-23 | View participation history | Student |
| UC-24 | View training scores | Student |
| UC-25 | Submit activity recognition request | Student |
| UC-26 | Appeal participation record or score | Student |
| UC-27 | Manage submitted requests and appeals | Student |
| UC-28 | Review and resolve requests | Activity Manager (assigned/authorized) |
| UC-29 | Manage users and permissions | University Administrator |
| UC-30 | Configure criteria and categories | University Administrator |
| UC-31 | View system reports | University Administrator |
| UC-32 | View personalized homepage | User (Student, Activity Manager, University Administrator) |
| UC-33 | Manage non-activity training scores | Activity Manager (authorized Student Affairs Office Manager) |

## 3. Use-Case Specifications

### 3.1 Account, Activity Discovery and Student Services

#### UC-01 - Log in

| **Use case: Log in** |
| :--- |
| **Use-case name and ID:**<br>Log in - UC-01 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>Authenticate an existing account with one assigned role and open the appropriate authorized workspace. |
| **Preconditions:**<br>User has an account; user is not authenticated; the sign-in page is reachable. |
| **Basic flow (main success scenario):**<br>1. User opens the login page.<br>2. System displays the credential form.<br>3. User enters account credentials and selects **Log in**.<br>4. System validates the input and authenticates the account.<br>5. System establishes an authenticated session, resolves the account's single assigned role and permitted resource scope, and displays the appropriate role-based homepage. |
| **Alternative flows:**<br>A1 - Step 3: Empty or malformed input; show field-level guidance, retain non-sensitive input, return to Step 3.<br>A2 - Step 4: Incorrect credentials; show a generic failure and allow retry without exposing whether the account exists.<br>A3 - Step 4: Account is disabled or not permitted to sign in; deny access and display an appropriate message.<br>A4 - Step 4: Repeated failed attempts trigger a temporary lock **only if optional NFR-SEC-05 is implemented**; explain when retry is allowed.<br>A5 - Step 4: Authentication service is unavailable; show a retryable error and do not create a session.<br>A6 - Step 5: Role is missing or session creation fails; do not grant access and report the problem.<br>A7 - Step 1: User is already authenticated; redirect to an authorized page without starting a duplicate session. |
| **Postconditions:**<br>On success, the user has a valid session and role-appropriate access; otherwise no new authorized session exists. |
| **Special requirements:**<br>NFR-SEC-02, SEC-03; SEC-05 optional; PER-01, USA-05. |



#### UC-02 - Log out

| **Use case: Log out** |
| :--- |
| **Use-case name and ID:**<br>Log out - UC-02 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>End the current authenticated session and prevent further access through that session. |
| **Preconditions:**<br>User has an authenticated session. |
| **Basic flow (main success scenario):**<br>1. User selects **Log out** from the account menu.<br>2. System receives the logout request and invalidates the active session.<br>3. System clears the authenticated UI state.<br>4. System displays the sign-in/public entry page. |
| **Alternative flows:**<br>A1 - Step 1: User closes the menu or chooses not to log out; session remains active.<br>A2 - Step 2: Session is already expired; system safely treats the user as logged out.<br>A3 - Step 2: Logout request cannot reach the server; system removes local credentials, explains that server invalidation could not be confirmed, and requires authentication before protected pages are shown.<br>A4 - Step 4: User navigates back to a protected page; system blocks access and returns to sign-in. |
| **Postconditions:**<br>On success, the previous session can no longer authorize requests. |
| **Special requirements:**<br>NFR-SEC-03, SEC-04; REL-05. |


#### UC-03 - Manage own profile

| **Use case: Manage own profile** |
| :--- |
| **Use-case name and ID:**<br>Manage own profile - UC-03 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>View and update allowed profile details, including phone numbers; change password; and avatar control. Users can also view read-only academic information, including their full name, ID, and faculty. |
| **Preconditions:**<br>User is authenticated and has a profile. |
| **Basic flow (main success scenario):**<br>1. User opens **My Profile**.<br>2. System displays saved profile values, editable field (phone number), avatar controls, and any read-only academic fields.<br>3. User selects **Edit**, modifies permitted information, and saves.<br>4. System checks field validity, account ownership, and read-only restrictions.<br>5. System saves the permitted changes and displays the updated profile. |
| **Alternative flows:**<br>A1 - Step 3: User cancels editing; system discards unsaved changes.<br>A2 - Step 3: User chooses **Change password**; system asks for the current password, new password, and confirmation, validates them, and securely updates the password.<br>A3 - Step 3: User chooses **Change avatar**; system accepts JPG or PNG image up to 10 MB, validates the upload, and updates the displayed avatar.<br>A4 - Step 3: User removes the current avatar; system restores the default profile picture.<br>A5 - Step 4: Phone number is invalid; system highlights the invalid field and preserves entered values.<br>A6 - Step 4: User attempts to edit read-only academic information (full name, ID, faculty) or another user's data; system denies the change.<br>A7 - Step 4: Current password is incorrect, new password is shorter than eight characters, or confirmation differs; password remains unchanged and a correction message is shown.<br>A8 - Step 4: Avatar file is not JPG/PNG or exceeds 10 MB; system rejects the upload and retains the existing avatar.<br>A9 - Step 5: Avatar upload, storage, or database update fails; system retains previously saved values and allows retry. |
| **Postconditions:**<br>On success, allowed profile fields/password/avatar reflect committed changes; student academic identifiers remain read-only. |
| **Special requirements:**<br>NFR-SEC-02, SEC-04, SEC-09; USA-05.|



#### UC-04 - Discover activities
| **Use case: Discover activities** |
| :--- |
| **Use-case name and ID:**<br>Discover activities - UC-04 |
| **Actor(s):**<br>Student, Activity Manager |
| **Description:**<br>Browse, search, filter, and inspect extracurricular activities and their eligibility, schedule, and registration information. |
| **Preconditions:**<br>User is authenticated; visible activity data exists or the catalog can report an empty state. |
| **Basic flow (main success scenario):**<br>1. User opens the **Activities** section.<br>2. System shows currently visible activities with key details such as capacity, deadline, and score value.<br>3. User searches or filters by faculty, date, location, specialized topic (A/B), training-score criteria, or registration status.<br>4. System updates the matching list and displays active filters.<br>5. User selects an activity.<br>6. System displays description, associated semester, schedules, applicable campus/room or online access, eligibility by faculty/year, capacity, registration and cancellation deadlines, waiting-list availability, activity status, and published announcements. |
| **Alternative flows:**<br>A1 - Step 2: No visible activities exist; show an empty-state message.<br>A2 - Step 3: User clears all filters; return to the unfiltered list.<br>A3 - Step 3: Invalid date/filter values; show validation feedback without losing valid filters.<br>A4 - Step 4: No results match; show a no-results state and reset option.<br>A5 - Step 4: Search ignores missing Vietnamese diacritics as required by NFR-LOC-03.<br>A6 - Step 6: Activity was cancelled, hidden, or removed; show an unavailable/not-found state rather than permitting registration.<br>A7 - Steps 2/4/6: Retrieval fails; show a retry option without changing records. |
| **Postconditions:**<br>User can inspect matching activity details; no registration or activity record is changed. |
| **Special requirements:**<br>NFR-LOC-03, USA-01, USA-06, PER-02, SEC-03, BR-ACT-02/05/08/15/17/18/23 |


#### UC-05 - Follow an activity

| **Use case: Follow an activity** |
| :--- |
| **Use-case name and ID:**<br>Follow an activity - UC-05 |
| **Actor(s):**<br>Student |
| **Description:**<br>Save an activity of interest without registering, and receive activity-related updates. |
| **Preconditions:**<br>Student is authenticated and can view the selected activity. |
| **Basic flow (main success scenario):**<br>1. Student opens the selected activity from the catalog or a recommendation.<br>2. System displays current **Follow/Following** status.<br>3. Student selects **Follow**.<br>4. System verifies the activity and stores the student–activity follow relation.<br>5. System displays **Following** and includes the student in relevant future activity updates. |
| **Alternative flows:**<br>A1 - Step 3: Student selects **Unfollow** for an already-followed activity; remove the follow relation and show **Follow**.<br>A2 - Step 4: Student already follows the activity; leave the relation unchanged and show current status.<br>A3 - Step 4: Activity is no longer accessible or closed; do not create a follow relation.<br>A4 - Step 4: Save fails or session expires; preserve the previous state and show an error.<br>A5 - Step 5: Followed activity is changed or a relevant deadline approaches; corresponding notifications appear through UC-17.<br>A6 - Step 5: Student follows but does not register; no seat is reserved and no registration is created. |
| **Postconditions:**<br>Follow relation is added/removed as chosen; following does not create an activity registration. |
| **Special requirements:**<br>Vision 5.3 and 5.8; NFR-SEC-04, COM-05. |



#### UC-06 - Chat with AI Student Assistant

| **Use case: Chat with AI Student Assistant** |
| :--- |
| **Use-case name and ID:**<br>Chat with AI Student Assistant - UC-06 |
| **Actor(s):**<br>Student |
| **Description:**<br>Interact with the AI Student Assistant through a chatbot to receive personalized activity recommendations based on interests, schedules, and training-score needs, or obtain information about activities and relevant university procedures. |
| **Preconditions:**<br>Student is authenticated; the AI Student Assistant is available, and relevant activity or university information is accessible. |
| **Basic flow (main success scenario):**<br>1. Student opens the AI Student Assistant chatbot.<br>2. System displays the chat interface and available assistance scope.<br>3. Student enters a question or requests activity recommendations in natural language.<br>4. System identifies the student's intent and retrieves relevant, authorized student context, activity details, or university information.<br>5. AI chatbot processes the request and generates personalized activity recommendations or an informational answer.<br>6. System displays the chatbot's response, including relevant explanations and activity links where applicable.<br>7. Student reviews the response and may open a recommended activity or continue the conversation with a follow-up message. |
| **Alternative flows:**<br>A1 - Step 3: Student submits an empty message; system requests valid input.<br>A2 - Step 3: Student asks a question outside the supported scope; chatbot explains its limitations and suggests relevant topics.<br>A3 - Step 4: Student preferences or participation history are incomplete; chatbot asks follow-up questions or uses available information, explaining any limitations.<br>A4 - Step 4: Request requires unauthorized access to another student's personal information; system denies access to that information.<br>A5 - Step 4: Relevant activity or university information cannot be retrieved; chatbot explains that the response may be unavailable or incomplete.<br>A6 - Step 5: AI service times out or is unavailable; system displays an error message and allows the student to retry. Other system features remain available.<br>A7 - Step 5: No suitable activities match the student's preferences; chatbot informs the student and suggests adjusting the search criteria.<br>A8 - Step 5: Available information is insufficient or uncertain; chatbot explains the limitation rather than presenting an unverified answer as an official university policy.<br>A9 - Step 7: A recommended activity is full, expired, or unavailable; system displays its current status without promising registration.<br>A10 - Step 7: Student asks a follow-up question or provides additional preferences; chatbot processes the new message using relevant conversation context and returns to Step 4. |
| **Postconditions:**<br>Student receives activity recommendations, an informational answer, or an explanation of unavailable information. No activity registration, participation record, or training-score data is modified. |
| **Special requirements:**<br>NFR-SEC-10, NFR-SCA-PHY-06, NFR-REL-04; protect student-specific information, use current activity data where available, and avoid presenting uncertain information as official university decisions. |



#### UC-07 - Access university services

| **Use case: Access university services** |
| :--- |
| **Use-case name and ID:**<br>Access university services - UC-07 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>Find and open links to existing university platforms from a centralized hub. |
| **Preconditions:**<br>User is authenticated; the hub has configured service links. |
| **Basic flow (main success scenario):**<br>1. User opens the **University Services Hub**.<br>2. System displays categorized links such as Moodle, Student Portal, and tuition payment.<br>3. User selects an external service link.<br>4. System opens the destination URL in the browser. |
| **Alternative flows:**<br>A1 - Step 2: No configured links; show an informative empty state.<br>A2 - Step 3: User closes the hub without selecting a link; no action occurs.<br>A3 - Step 4: Link is invalid or unavailable; browser shows the external result, and myHCMUS does not claim responsibility for the external service.<br>A4 - Step 2: Service link data cannot load; show a retryable error. |
| **Postconditions:**<br>The selected external page is opened when available; myHCMUS user data is not synchronized with that site. |
| **Special requirements:**<br>Vision 4.1 and 5.11; NFR-COM-01; external links are not direct university database integrations. |

#### UC-08 - Change interface language
| **Use case: Change interface language** |
| :--- |
| **Use-case name and ID:**<br>Change interface language - UC-08 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>Switch visible interface text between Vietnamese and English. |
| **Preconditions:**<br>User can open the interface and its language selector. |
| **Basic flow (main success scenario):**<br>1. User opens the interface language control.<br>2. System displays supported languages: Vietnamese and English.<br>3. User selects a language.<br>4. System renders interface labels, validation messages, and navigation in the selected language. |
| **Alternative flows:**<br>A1 - Step 3: User selects the language already active; leave the UI unchanged.<br>A2 - Step 4: A translation key is missing; show a safe fallback without blocking navigation.<br>A3 - Step 4: A language resource fails to load; show an error or fallback and retain usability.<br>A4 - Step 3: User cancels selection; no change is made. |
| **Postconditions:**<br>The interface uses the selected language for the current session/context; other application data is unchanged. |
| **Special requirements:**<br>NFR-LOC-01, LOC-02, LOC-06; default language is Vietnamese. |

#### UC-09 - View help and FAQ

| **Use case: View help and FAQ** |
| :--- |
| **Use-case name and ID:**<br>View help and FAQ - UC-09 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>Access role-relevant help information, short usage guides and frequently asked questions. |
| **Preconditions:**<br>User can access the Help page. |
| **Basic flow (main success scenario):**<br>1. User opens **Help / FAQ**.<br>2. System presents available topics and role-relevant guidance.<br>3. User selects a topic or FAQ item.<br>4. System displays the guide or answer. |
| **Alternative flows:**<br>A1 - Step 2: No help items are available for the current context; show a useful empty state.<br>A2 - Step 3: User selects another topic; return to Step 3.<br>A3 - Step 4: A help item is unavailable; show a not-found message and navigate back.<br>A4 - Steps 2/4: Content fails to load; show a retry option. |
| **Postconditions:**<br>Help content is displayed without changing business records. |
| **Special requirements:**<br>NFR-USA-08; maintain role-appropriate instructions. |


### 3.2 Registration, Calendar and Notifications

#### UC-10 - Register for an activity
| **Use case: Register for an activity** |
| :--- |
| **Use-case name and ID:**<br>Register for an activity - UC-10 |
| **Actor(s):**<br>Student |
| **Description:**<br> Register for an activity, selecting one or more sessions where required; the system validates eligibility, dates, scheduling conflicts, and applicable activity/session capacity and confirms automatically when possible. |
| **Preconditions:**<br>Student is authenticated; activity exists and is visible; enrollment can be attempted. |
| **Basic flow (main success scenario):**<br>1. Student opens an activity and selects Register.<br>2. System displays the registration window, eligibility rules, session choices (if selectable), available capacity, and minimum session-attendance requirement.<br>3. Student selects at least one session when selectable and confirms the registration attempt.<br>4. System validates the registration window, eligibility, duplicate activity registration, and selected sessions.<br>5. System checks scheduling conflicts and applicable activity/session capacity constraints.<br>6. System atomically records Confirmed registration and any selected sessions without Manager approval.<br>7. System displays Confirmed status, updates the personal calendar and prepares applicable notifications. |
| **Alternative flows:**<br>A1 - Step 3: Student abandons or cancels confirmation; no registration is created.<br>A2 - Step 4: Deadline has passed or activity is unavailable; show registration closed and stop.<br>A3 - Step 4: Student fails one or more activity eligibility requirements; explain the restriction and stop.<br>A4 - Step 4: Student already has an active Confirmed or Waitlisted entry for this activity; do not create a duplicate.<br>A5 - Step 5: Applicable activity or session capacity is full. If the activity has exactly one scheduled session and its waiting list is enabled, offer UC-13; otherwise show the unavailable option and any remaining eligible session alternatives.<br>A6 - Step 5: Scheduling conflict is detected; show a warning; student may continue or cancel.<br>A7 - Step 6: Automatic confirmation is not possible because concurrent capacity changed; re-evaluate availability.<br>A8 - Step 6: Two students compete for the last slot; system accepts only a transaction that fits capacity and handles the other as full.<br>A9 - Step 6: Save fails; do not leave a partial registration and show retry/error.<br>A10 - Step 7: Notification delivery fails; keep committed registration and report/retry notification separately.<br>A11 - Step 3: Activity offers selectable sessions but none was selected; require at least one selection.<br>A12 - Step 3: Fewer sessions than the minimum required for training-score eligibility were selected; warn that the student may not qualify for score credit, while allowing a valid registration to proceed.<br>A13 - Step 4: A selected session does not belong to the activity or is no longer available; reject invalid selections and show available alternatives.<br>A14 - Step 5: One or more selected sessions reaches its capacity limit; do not confirm over-capacity selections and show alternatives. |
| **Postconditions:**<br>At most one active Confirmed activity registration exists for the student, linked to the selected sessions where applicable. Neither activity nor session capacity is exceeded. |
| **Special requirements:**<br> NFR-REL-01, SCA-PHY-02, SCA-PHY-03, SEC-04, USA-01, USA-06. |


#### UC-11 - Cancel a registration

| **Use case: Cancel a registration** |
| :--- |
| **Use-case name and ID:**<br>Cancel a registration - UC-11 |
| **Actor(s):**<br>Student |
| **Description:**<br>Cancel an existing registration within the permitted period; release confirmed capacity and allow FIFO waiting-list promotion when applicable. |
| **Preconditions:**<br>Student is authenticated and owns a cancellable registration. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Registrations** and selects a registration.<br>2. System displays current status and whether cancellation is allowed.<br>3. Student selects **Cancel Registration**.<br>4. System asks for confirmation.<br>5. Student confirms the cancellation.<br>6. System checks that cancellation is permitted before the activity's configured cancellation deadline (default 72 hours before its start, with Manager override not later than its end) and atomically changes a Confirmed registration to Cancelled.<br>7. If a confirmed seat is released, system handles FIFO waiting-list promotion; the student sees the updated status. |
| **Alternative flows:**<br>A1 - Step 4: Student dismisses the confirmation; leave registration unchanged.<br>A2 - Step 6: Cancellation period has ended or status is non-cancellable; explain why and retain existing state.<br>A3 - Step 6: Registration was already cancelled or changed by another action; refresh current status.<br>A4 - Step 6: User attempts to cancel another student’s registration; deny access.<br>A5 - Step 6: Save or concurrent transaction fails; retain the previous committed record and offer retry.<br>A6 - Step 7: No student is waiting; released capacity remains available.<br>A7 - Step 7: The activity has an enabled waiting list; system promotes the next eligible entry automatically under the applicable priority/FIFO rules, without Manager approval.<br>A8 - Step 7: Notification delivery for promotion fails; do not reverse a valid cancellation and handle notification failure separately.<br>A9 - Step 6: Activity schedule changes; system uses the recalculated cancellation deadline and displays the current applicable cutoff before allowing or rejecting cancellation. |
| **Postconditions:**<br>On success, registration is cancelled and any released seat is processed without duplicate promotion. |
| **Special requirements:**<br>NFR-REL-01, REL-02, SCA-PHY-03, SEC-04, USA-04; waiting-list promotion is automatic behavior, not another actor-goal use case. |


#### UC-12 - Track registration status

| **Use case: Track registration status** |
| :--- |
| **Use-case name and ID:**<br>Track registration status - UC-12 |
| **Actor(s):**<br>Student |
| **Description:**<br>Inspect the current status of the student’s activity registrations and waiting-list entries. |
| **Preconditions:**<br>Student is authenticated and is permitted to see only their registrations. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Registrations**.<br>2. System retrieves the student’s registrations and applicable waiting-list records.<br>3. System displays each activity and its latest status.<br>4. Student selects a registration to view details and associated selected sessions, cancellation deadline, and waiting-list information where applicable. |
| **Alternative flows:**<br>A1 - Step 2: No registrations or waiting-list entries exist; show an empty state.<br>A2 - Step 3: Registration is Confirmed, Waitlisted, or Cancelled; show only the current applicable state and next available actions.<br>A3 - Step 3: A Waitlisted entry is automatically promoted or a Confirmed entry is moved to Waitlisted after an authorized capacity reduction; show the updated status on refresh/notification.<br>A4 - Step 2: Retrieval fails; show a retryable error.<br>A5 - Step 4: Record is not owned by the student; deny access. |
| **Postconditions:**<br>Current registration states are visible; no registration is modified. |
| **Special requirements:**<br>Vision 5.4 and 5.8; NFR-SEC-04, USA-09. |


#### UC-13 - Join an activity waiting list

| **Use case: Join an activity waiting list** |
| :--- |
| **Use-case name and ID:**<br>Join an activity waiting list - UC-13 |
| **Actor(s):**<br>Student |
| **Description:**<br>Join the FIFO waiting list when an eligible student wants to register for an activity that has reached capacity; later promotion is automatic. |
| **Preconditions:**<br>Student is authenticated; the activity has exactly one scheduled session, its applicable capacity is full, and its Manager has enabled a waiting list. |
| **Basic flow (main success scenario):**<br>1. Student attempts registration for an activity with no available seats.<br>2. System explains that the activity is full and offers **Join Waiting List** (if enabled).<br>3. Student selects **Join Waiting List**.<br>4. System checks registration availability, student eligibility, and duplicate entries.<br>5. System atomically records the student’s waiting-list position in arrival order.<br>6. System confirms **Waitlisted** status and displays available status information. |
| **Alternative flows:**<br>A1 - Step 3: Student declines the waiting list; no entry is created.<br>A2 - Step 4: Registration deadline is closed; explain and stop.<br>A3 - Step 4: Student does not meet participation requirements; explain and do not add an entry.<br>A4 - Step 4: Student is already registered or on the list; display the existing state without a duplicate.<br>A5 - Step 5: Concurrent seat availability changes; re-evaluate capacity and present the updated registration path without breaking FIFO.<br>A6 - Step 5: Waiting-list save fails; show an error and leave no partial/duplicate entry.<br>A7 - After Step 6: Student leaves the waiting list; system removes the entry without creating a Cancelled registration and without affecting other queue entries.<br>A8 - After Step 6: Promotion notification cannot be delivered; preserve the committed queue/registration state and retry/report messaging failure.<br>A9 - Step 2: Waiting list is disabled, activity has multiple sessions, or activity is unlimited capacity; the system does not offer waiting-list enrollment.<br>A10 - Step 5: A confirmed participant is moved to the front of the enabled waiting list because of an authorized capacity reduction; system preserves the explicit priority group ahead of normal FIFO entries. |
| **Postconditions:**<br>On success a unique FIFO waiting-list entry exists; future promotion follows queue order without exceeding capacity. |
| **Special requirements:**<br>Vision 5.4/Workflow 1; NFR-REL-02 (strict FIFO), REL-01, SCA-PHY-03; UC-13 `extend` UC-10 when full. |


#### UC-14 - Manage activity registrations

| **Use case: Manage activity registrations** |
| :--- |
| **Use-case name and ID:**<br>Manage activity registrations - UC-14 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Inspect and manage activity-level Confirmed, Waitlisted and Cancelled registrations within the Manager's authorized scope, including applicable session selections and permitted audited changes. |
| **Preconditions:**<br>Manager is authenticated and assigned permission for the selected activity. |
| **Basic flow (main success scenario):**<br>1. Manager opens Registrations and selects an activity within their authorized scope.<br>2. System displays Confirmed, Waitlisted and Cancelled registrations, selected sessions where applicable, current counts and capacity information.<br>3. Manager searches, filters (by year and falcuty) or opens an individual registration.<br>4. System displays the student's relevant eligibility, selected sessions and current registration status.<br>5. Manager reviews the participant list and optionally performs an authorized permitted registration update.<br>6. System checks permissions, eligibility, deadlines, capacity, queue rules and concurrency, then records any approved modification with audit information.<br>7. System updates registration lists, counts and affected-student notifications. |
| **Alternative flows:**<br>A1 - Step 2: No registrations exist; display a meaningful empty state.<br>A2 - Step 5: Manager requests a permitted change to a Confirmed or Waitlisted registration; validate it against BR-REG-25, capacity, eligibility and queue integrity before saving.<br>A3 - Step 5: Manager exits without changes; leave registrations unchanged.<br>A4 - Step 6: The selected registration changed concurrently; refresh and prevent stale overwrites.<br>A5 - Step 6: Proposed modification would violate an activity or session capacity, registration rule, or waiting-list priority; reject and explain.<br>A6 - Step 6: Manager is not authorized for the activity; deny read/update access.<br>A7 - Step 6: Concurrent update or save fails; preserve consistent participant totals and allow retry.<br>A8 - Step 7: Student notification delivery fails; preserve the committed registration change and handle delivery separately.<br>A9 - Step 2: The activity has an enabled waiting list; the Manager may inspect it but cannot manually bypass approved priority/FIFO rules.<br>A10 - Step 5: Manager initiates a permitted cancellation; system confirms authorization, validates policy, records audit details, releases confirmed capacity as applicable, processes any eligible queue entry and notifies the student.<br>A11 - Step 5: Manager attempts to move a student into a full session: show a warning, manager may continue or cancel.|
| **Postconditions:**<br>Authorized changes are recorded consistently with audit history and notifications; participant and session counts remain valid. |
| **Special requirements:**<br>Vision 5.4/Workflow 1; NFR-SEC-03, SCA-PHY-03, REL-01, REL-02, USA-10. |


#### UC-15 - View personal activity calendar

| **Use case: View personal activity calendar** |
| :--- |
| **Use-case name and ID:**<br>View personal activity calendar - UC-15 |
| **Actor(s):**<br>Student |
| **Description:**<br>View registered activity schedules in a personal calendar and identify potential overlapping times. |
| **Preconditions:**<br>Student is authenticated. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Calendar**.<br>2. System retrieves the student's Confirmed registrations and associated selected sessions or flexible participation windows, plus permitted followed/Waitlisted activities, excluding cancelled or unavailable entries.<br>3. System renders each scheduled session as a separate entry with its actual start/end times, relevant campus/room or online access information, and current registration status.<br>4. Student selects an entry to inspect schedule details.<br>5. System flags any detected scheduling conflicts. |
| **Alternative flows:**<br>A1 - Step 2: No registered activities exist; show an empty calendar.<br>A2 - Step 2: Waiting registrations are displayed on the calendar with corresponding status flags, without being treated as confirmed.<br>A3 - Step 5: Two activities overlap; show a conflict warning rather than silently cancelling a registration.<br>A4 - Step 4: Activity rescheduled, relocated, or cancelled sessions; display current schedule and any updated conflict status.<br>A5 - Steps 2/4: Data cannot load or entry is no longer available; show a clear error/unavailable state.<br>A6 - Step 3: Student changes calendar period or view; update the displayed entries.<br>A7 - Step 3: A session spans multiple dates; display its true start/end range without merging separate sessions into a single continuous event. |
| **Postconditions:**<br>Calendar shows available registration-related events; no registration is changed. |
| **Special requirements:**<br>NFR-SEC-04 and LOC-04; UC-16 may extend calendar view. |



#### UC-16 - Export activity calendar

| **Use case: Export activity calendar** |
| :--- |
| **Use-case name and ID:**<br>Export activity calendar - UC-16 |
| **Actor(s):**<br>Student |
| **Description:**<br>Download eligible activities' selected sessions and flexible participation windows in iCalendar (.ics) format, using the latest authorized schedule and location or online access information. |
| **Preconditions:**<br>Student is authenticated and can access personal calendar (UC-15). |
| **Basic flow (main success scenario):**<br>1. Student opens their activity calendar.<br>2. Student selects **Export Calendar**.<br>3. System gathers current exportable selected sessions or participation windows belonging to the student's authorized calendar records.<br>4. System generates distinct event entries for separate sessions, preserving current start/end times, location or online access details, and applicable timezone.<br>5. Browser downloads the generated file and displays an export result. |
| **Alternative flows:**<br>A1 - Step 2: Student cancels the action; no file is created.<br>A2 - Step 3: Calendar contains no exportable activities; show an empty-export message or a valid empty calendar according to chosen product behavior.<br>A3 - Step 3: Some entries were cancelled or changed; export current eligible records, not stale dates.<br>A4 - Step 4: Export generation fails; show retry and do not provide a corrupt file.<br>A5 - Step 5: Browser blocks download; provide a new download action or error guidance. |
| **Postconditions:**<br>An `.ics` file with authorized activities is made available; no external calendar is modified directly. |
| **Special requirements:**<br>NFR-COM-03, LOC-04, SEC-04; UC-16 `extend` UC-15. External Google Calendar is not an integrated system actor. |


#### UC-17 - Receive activity notifications

| **Use case: Receive activity notifications** |
| :--- |
| **Use-case name and ID:**<br>Receive activity notifications - UC-17 |
| **Actor(s):**<br>Student, Activity Manager; External Email Service (supporting actor for email delivery) |
| **Description:**<br>Deliver relevant in-app notifications and applicable email notifications to students and Activity Managers for registrations, activities, requests and participation verification duties. |
| **Preconditions:**<br>Student account exists; an activity/registration/follow/waiting-list event meets notification criteria. |
| **Basic flow (main success scenario):**<br>1. A relevant event occurs, such as Confirmed registration, Waitlisted promotion, activity change, announcement, a three-day pre-activity reminder, request submission/decision, Manager request assignment/update, or participation verification deadline/overdue status.<br>2. System identifies recipients based on registration, follow, request ownership, Manager assignment and authorized activity scope; unrelated users receive no private notification.<br>3. System creates corresponding in-app notifications and submits email delivery through External Email Service.<br>4. Recipient opens the Notifications panel to read the message and its related activity/status.<br>5. System marks the viewed notification as read. |
| **Alternative flows:**<br>A1 - Step 1: No subscribed/affected student matches; no notification is created for unrelated users.<br>A2 - Step 2: Student is waiting-listed; send promotion and other applicable queue notices even though they are not confirmed.<br>A3 - Step 3: Email service is unavailable; preserve the in-app message and retry/report email delivery failure separately.<br>A4 - Step 3: In-app notification creation fails; report/retry event without corrupting the related business transaction.<br>A5 - Step 4: Student has no notifications; show an empty state.<br>A6 - Step 4: Link points to an activity no longer visible; show a safe unavailable state.<br>A7 - Step 5: Student does not open a notification; keep it unread.A8 - Step 1: A confirmed activity is three (or less) days away; send the applicable activity reminder to Confirmed students.<br>A9 - Step 1: A request is assigned, updated, resubmitted or withdrawn; notify its assigned authorized Manager.<br>A10 - Step 1: Participation verification is approaching its five-day completion deadline; remind the responsible Manager.<br>A11 - Step 1: Verification has exceeded its deadline; mark it overdue and notify the responsible Manager. |
| **Postconditions:**<br>Applicable notification is visible in-app and email delivery is attempted; failed external delivery does not roll back registration/score changes. |
| **Special requirements:**<br>Vision 5.8; NFR-COM-05, REL-04, SCA-PHY-05, SEC-04. Email Service is an external supporting actor, not part of the system. |


### 3.3 Activity, Participation and Training Scores

#### UC-18 - Manage activities

| **Use case: Manage activities** |
| :--- |
| **Use-case name and ID:**<br>Manage activities - UC-18 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Create and manage activities, session schedules, limited/unlimited capacity, eligibility, semester, scoring semester, location/access mode, registration and cancellation policies, and valid lifecycle transitions. |
| **Preconditions:**<br>Manager is authenticated and authorized to manage activities for the relevant organizational unit. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Manage Activities** and selects **Create Activity**.<br>2. System presents an activity form covering description, category, specialized topic (A/B/Neither), associated semester(s), designated scoring semester, eligibility (student year/faculty), registration period, cancellation deadline, waiting-list availability, limited/unlimited activity capacity, and scheduled sessions or flexible participation window. For sessions, configure start/end, online/offline/hybrid access, location/link and optional session capacity, plus minimum attended sessions for score eligibility.<br>3. Manager enters the activity details and saves a draft.<br>4. System validates the fields (<= 2 consecutive semesters; valid scoring semester; session selection/schedule; minimum attendance; capacity; single-session waiting-list rule) and records the draft within the Manager’s organization.<br>5. Manager reviews the draft and chooses **Publish**.<br>6. System checks publish eligibility, changes the status to **Published**, and makes the activity discoverable to eligible students.<br>7. System displays the updated activity management list and status. |
| **Alternative flows:**<br>A1 - Step 3: Manager cancels without saving; discard pending changes.<br>A2 - Step 3: Manager opens an existing activity to edit schedule, requirements, capacity or other allowed fields; validate and save, then notify affected students if needed.<br>A3 - Step 4: Required fields, time intervals, registration/cancellation periods, faculty/year eligibility, session capacities, minimum attendance threshold, semester span or scoring semester are invalid; preserve fields and show errors.<br>A4 - Step 4: Manager is not authorized for the organizational unit or activity; deny create/edit access.<br>A5 - Step 5: Manager keeps the item as Draft, rather than publishing; retain unpublished state.<br>A6 - Step 6: Activity cannot be published because required information is missing or dates are invalid; keep Draft and explain.<br>A7 - After Step 7: Manager transitions an activity to Ongoing, Completed or Cancelled when appropriate; system updates status and related UI.<br>A8 - After Step 7: If the new capacity is below the number of confirmed participants, the system displays a warning and requires confirmation from the Activity Manager before applying the capacity change.<br>A9 - After Step 7: Published activity schedule/status changes; system updates information and queues relevant notices to followers/registrants.<br>A10 - Steps 4/6: Database or concurrent update fails; preserve previously committed data and offer retry.<br>A11 - Step 2: Manager imports activities from a CSV/XLSX file; the system validates the data, imports valid records, and reports rejected rows with reasons.<br>A12 - Step 2: Manager chooses unlimited activity capacity; do not require a positive numeric activity capacity, but continue enforcing any separately configured session limits.<br>A13 - Step 2: Multiple selectable sessions are defined; require each session's start/end time, exactly one schedule/location/capacity configuration, and online/offline/hybrid access rules.<br>A14 - Step 4: A session or scoring threshold changes; revalidate minimum attended sessions so the requirement remains within 1 and the number of scheduled sessions.<br>A15 - Step 4: Activity spans more than two semesters, spans non-consecutive semesters, or designates multiple/out-of-range scoring semesters; reject publication.<br>A16 - Step 4: Manager tries to enable a waiting list for an activity with multiple sessions; reject the configuration.<br>A17 - Step 4: Manager updates an activity schedule; recalculate the applicable cancellation deadline according to BR-REG-19 and notify affected registrants. The precise treatment of a start-only change or manual override remains a policy decision. |
| **Postconditions:**<br>An activity is saved as Draft/Published or modified to another valid lifecycle state; no invalid partial changes occur. |
| **Special requirements:**<br>Vision 5.5, 5.4 eligibility, NFR-USA-10/11/12, COM-04 (import), SCA-PHY-03, SEC-03. |



#### UC-19 - Publish activity announcements

| **Use case: Publish activity announcements** |
| :--- |
| **Use-case name and ID:**<br>Publish activity announcements - UC-19 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Publish information and changes about an activity to its relevant student audience. |
| **Preconditions:**<br>Manager is authenticated, has permission for the activity, and the activity exists. |
| **Basic flow (main success scenario):**<br>1. Manager opens a managed activity.<br>2. Manager selects **Announcements** and **New Announcement**.<br>3. System displays an announcement form associated with the selected activity.<br>4. Manager enters a title/message and submits.<br>5. System validates the content and Manager’s ownership, then publishes the announcement.<br>6. System displays the published announcement on the corresponding activity detail page and triggers notifications to applicable recipients. |
| **Alternative flows:**<br>A1 - Step 4: Manager cancels composition; publish nothing.<br>A2 - Step 5: Announcement is blank/invalid; show field errors and preserve text.<br>A3 - Step 5: Manager lacks activity permission; reject publication.<br>A4 - Step 5: Activity is unavailable or in a status that forbids announcements under team policy; reject and explain.<br>A5 - Step 5: Save fails; leave announcement unpublished and allow retry.<br>A6 - Step 6: Notification delivery fails; keep the published announcement and report/retry delivery independently.<br>A7 - After Step 6: Manager edits an existing announcement **only if supported**; change policy/version history needs confirmation. |
| **Postconditions:**<br>The announcement is visible on the related activity, or no message is published on failure. |
| **Special requirements:**<br>Vision 5.5 and 5.8; NFR-SEC-03, COM-05, REL-04. |


#### UC-20 - View activity statistics and reports

| **Use case: View activity statistics and reports** |
| :--- |
| **Use-case name and ID:**<br>View activity statistics and reports - UC-20 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>View and export statistics and reports for individual activities or the Manager's department, including total activities, student registrations, participation, and distribution by training-score criteria. |
| **Preconditions:**<br>Manager is authenticated and authorized to access activities and reports within their department. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Activity Reports / Statistics**.<br>2. System displays available reporting scopes and filters.<br>3. Manager selects an individual activity or their department and specifies a reporting period.<br>4. System calculates statistics from current authorized activity-level registrations, session attendance and verified participation, distinguishing Confirmed from Waitlisted/Cancelled and excluding unverified results from awarded-score statistics.<br>5. System presents the statistics in tables and charts with applicable totals and breakdowns.<br>6. Manager chooses **Export Report** and downloads a report when needed. |
| **Alternative flows:**<br>A1 - Step 2: No activities are available; system displays an empty dashboard.<br>A2 - Step 3: Invalid dates or filters; system requests correction.<br>A3 - Step 4: No data exists for the selected period; system displays zero or empty results rather than estimated metrics.<br>A4 - Step 4: Manager attempts to access another department's private data; system denies access.<br>A5 - Step 4: Data aggregation fails; system displays an error message and allows retry.<br>A6 - Step 6: Manager does not export; use case completes with displayed statistics.<br>A7 - Step 6: PDF export fails or browser blocks download; system displays an error message and allows retry without modifying underlying records. |
| **Postconditions:**<br>Authorized activity-level or department-level statistics are displayed and optionally exported; no source data is modified. |
| **Special requirements:**<br>Vision 5.5; NFR-COM-02, NFR-SEC-03, NFR-PER-01; department-level reports must be restricted to the Manager's authorized department. |


#### UC-21 - Manage participation records


| **Use case: Manage participation records** |
| :--- |
| **Use-case name and ID:**<br>Manage participation records - UC-21 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Record attendance for individual sessions, review automatically identified eligible participants after activity completion, and verify participation before Participation records and score credit are created. |
| **Preconditions:**<br>Manager is authenticated and authorized for the selected activity; valid activity/session, registration, and attendance information is available. |
| **Basic flow (main success scenario):**<br>1. Manager opens a managed activity and selects Attendance / Participation.<br>2. System lists the activity's sessions and their registered students; unrecorded session attendance is shown as No information.<br>3. Manager selects a session and records attendance manually or imports a file.<br>4. System validates registered student/session matching, duplicate identifiers, permissions and proposed attendance updates.<br>5. Manager reviews and confirms attendance changes for the selected session.<br>6. After the activity reaches Completed, the system evaluates each confirmed student's attended-session count against the activity's minimum attendance requirement and generates an eligible-participant review list.<br>7. Manager reviews and verifies the generated participation list within five days after activity completion.<br>8. System creates verified Participation records and awards the corresponding applicable training-score credit only after verification, recording audit details and the result. |
| **Alternative flows:**<br>A1 - Step 2: No registered students or sessions exist; show an appropriate empty state.<br>A2 - Step 3: Manager records attendance manually as Attended or Absent; unrecorded entries remain No information.<br>A3 - Step 3: Unsupported or invalid attendance file; reject and explain.<br>A4 - Step 4: File contains duplicate or invalid student/session identifiers; flag rejected entries.<br>A5 - Step 4: Student is not registered for this activity or selected session is invalid; exclude unmatched entries and explain.<br>A6 - Step 5: Manager corrects proposed statuses before confirmation; apply only the reviewed changes.<br>A7 - Step 5: Manager cancels the import/edit; leave records unchanged.A8 - Steps 5/7: Manager lacks activity permission or activity state forbids the operation; deny without mutation.<br>A9 - Steps 5/8: Save or concurrent update fails; avoid partial attendance, participation or score changes.<br>A10 - After Step 8: Authorized correction is requested for a previously verified record; revalidate eligibility, update related participation/score consistently, and audit the change.<br>A11 - After Step 8: Manager exports permitted attendance/participation records in the supported report format.<br>A12 - Step 6: Student attended fewer than the minimum required sessions; exclude the student from the eligible-participant list and do not grant activity score credit.<br>A13 - Step 7: Manager has not verified the generated list; display Pending Verification and do not create verified Participation records or award activity scores.<br>A14 - Step 7: Verification exceeds five days after completion; mark it Overdue and notify the responsible Manager.<br>A15 - Step 7: Manager finds an incorrect attendance count or list entry; correct session attendance and regenerate the eligibility list before verifying. |
| **Postconditions:**<br>Session attendance is recorded independently. Only the Manager-verified eligible students receive Participation records and corresponding activity-score credit, with appropriate audit history and no double counting. |
| **Special requirements:**<br>Vision 5.6; NFR-COM-02, NFR-REL-03, NFR-SEC-03, NFR-SEC-06. Attendance and participation must remain synchronized, with changes reflected in training scores and audit history. |

#### UC-22 - Manage training-score results

| **Use case: Manage activity training-score results** |
| :--- |
| **Use-case name and ID:**<br>Manage training-score results - UC-22 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Manage authorized activity-score results after participation verification and authorized criterion-based adjustments. |
| **Preconditions:**<br>Manager is authenticated and authorized for activity scoring; criteria and verified records are available. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Training-Score Results** for a managed activity.<br>2. System lists students, verified participation records and applicable criteria.<br>3. Manager selects a student record and enters or reviews a permitted score result/adjustment.<br>4. System checks verification, scoring rules, permission and score consistency.<br>5. Manager confirms the update.<br>6. System saves the score-related change and audit information.<br>7. System displays the revised score result available to authorized viewers. |
| **Alternative flows:**<br>A1 - Step 2: No verified records; show that scoring is not yet available.<br>A2 - Step 3: Manager cancels; preserve current score.<br>A3 - Step 4: Student record is unverified or criterion does not apply; reject the change.<br>A4 - Step 4: Entered score violates allowed range/criteria; show validation error.<br>A5 - Step 4: Manager lacks authority; deny write access.<br>A6 - Step 4: Historical criteria differ from current criteria; use rules applicable to the selected semester, preserving old results as required.<br>A7 - Step 6: Save fails or concurrent adjustment conflicts; do not leave an inconsistent score; allow retry.<br>A8 - Step 7: A related appeal is approved later; approved adjustment is reflected in calculated totals after UC-28.<br>A9 - Step 4: Proposed result exceeds the criterion's positive maximum or causes an invalid semester total; block and explain.<br>A10 - Step 4: A credit already exists for the same underlying verified participation or recognition; reject the duplicate. |
| **Postconditions:**<br>Only accepted, authorized score changes are committed and recorded, keeping totals consistent with verified participation and approved adjustments. |
| **Special requirements:**<br>Vision 5.6; NFR-REL-03, SCA-INT-05, SEC-06, SEC-03, MAI-07. |


#### UC-23 - View participation history

| **Use case: View participation history** |
| :--- |
| **Use-case name and ID:**<br>View participation history - UC-23 |
| **Actor(s):**<br>Student |
| **Description:**<br>Inspect personal participation records and verification outcomes across activities and semesters. |
| **Preconditions:**<br>Student is authenticated. |
| **Basic flow (main success scenario):**<br>1. Student opens **Participation History**.<br>2. System retrieves participation records belonging to that student.<br>3. System groups or filters records by semester and activity.<br>4. Student selects a record to see activity details and verification status. |
| **Alternative flows:**<br>A1 - Step 2: Student has no history; show an empty state.<br>A2 - Step 3: Student selects a different semester/filter; show applicable records.<br>A3 - Step 4: Record is still pending verification, missing, or corrected; clearly label current status without claiming verified participation.<br>A4 - Step 2: Data retrieval fails; show a retryable error.<br>A5 - Step 4: Student attempts to open another student’s private record; deny access. |
| **Postconditions:**<br>Only the student’s own participation history is displayed; no records change. |
| **Special requirements:**<br>Vision 5.6; NFR-SEC-04, LOC-05. |


#### UC-24 - View training scores

| **Use case: View training scores** |
| :--- |
| **Use-case name and ID:**<br>View training scores - UC-24 |
| **Actor(s):**<br>Student |
| **Description:**<br>Inspect accumulated training scores by semester and evaluation criterion. |
| **Preconditions:**<br>Student is authenticated and permitted to view their own score records. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Training Scores**.<br>2. System retrieves verified activity credits, approved recognition and non-activity awards, authorized deductions, and approved adjustments for the selected semester.<br>3. System calculates criterion totals using the scoring rules effective for that semester, applying criterion maxima and the 0–100 semester range without duplicate credit.<br>4. System presents the semester total and criterion breakdown, including sources and authorized deductions/adjustments.<br>5. Student changes semester or opens a criterion to inspect contributing records. |
| **Alternative flows:**<br>A1 - Step 2: No score data yet; show empty/zero state with clear explanation.<br>A2 - Step 3: A record remains unverified; do not include it as verified in the final total.<br>A3 - Step 3: An approved appeal adds/corrects a record; reflect the updated approved adjustment and total.<br>A4 - Step 3: Criteria changed for a later semester; preserve prior-semester rules/results.<br>A5 - Step 2: Data retrieval fails; show retry rather than inaccurate totals.<br>A6 - Step 5: Student attempts to view another student’s scores; deny access.<br>A7 - Step 3: An authorized deduction or non-activity award exists; include it under its assigned criterion without counting an underlying source twice.<br>A8 - Step 3: An activity spans two consecutive semesters; display its score only in its designated scoring semester. |
| **Postconditions:**<br>Student sees authorized score totals and criterion breakdown; no score values are changed. |
| **Special requirements:**<br>NFR-REL-03, SCA-INT-05, SEC-04, LOC-05; Vision 5.6. |

#### UC-33 - Manage non-activity training scores

| **Use case: Manage non-activity training scores** |
| :--- |
| **Use-case name and ID:**<br>Manage non-activity training scores - UC-33 |
| **Actor(s):**<br>Activity Manager (authorized Student Affairs Office Manager) |
| **Description:**<br>Award or deduct training-score points independently of activity participation, under the applicable semester's scoring criteria and authorization rules. |
| **Preconditions:**<br>Manager is authenticated and authorized to manage non-activity training scores; the target student, semester, and applicable scoring criteria exist. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Non-Activity Training Scores**.<br>2. System displays the student selection interface and available scoring criteria.<br>3. Manager selects a student, semester, evaluation criterion, and adjustment type (**Award** or **Deduct**).<br>4. System displays the selected student's current score information and applicable scoring limits.<br>5. Manager enters the number of points and the reason for the adjustment.<br>6. System validates the Manager's authorization, selected student, semester, criterion, point value, and resulting score limits.<br>7. Manager reviews and confirms the adjustment.<br>8. System records the award or deduction and its audit information, then recalculates the affected criterion score and semester total without double counting.<br>9. System displays the updated training-score result. |
| **Alternative flows:**<br>A1 - Step 2: No students or applicable scoring criteria are available; show an appropriate empty state.<br>A2 - Step 3: Manager selects a different student, semester, criterion, or adjustment type; update the displayed score information and applicable limits.<br>A3 - Step 5: Required information is missing or the entered point value is invalid; show validation errors and preserve valid input.<br>A4 - Step 6: Awarded points would exceed the criterion maximum or applicable semester score limit; reject the adjustment and explain the restriction.<br>A5 - Step 6: Deducted points would violate the applicable scoring rules or permitted score limits; reject the adjustment and explain the restriction.<br>A6 - Step 6: Manager lacks Student Affairs Office authorization or permission for the selected operation; deny access without modifying scores.<br>A7 - Step 6: Selected student, semester, or criterion is invalid or unavailable; prevent the adjustment and request correction.<br>A8 - Step 6: An equivalent adjustment has already been recorded; prevent unintended duplicate credit or deduction.<br>A9 - Step 7: Manager cancels the operation; preserve existing score records.<br>A10 - Step 8: Score update or audit recording fails; roll back the operation and allow retry without leaving inconsistent records.<br>A11 - Step 8: The selected semester uses historical scoring criteria; apply the rules associated with that semester without altering unaffected historical results.<br>A12 - Step 9: A related approved score adjustment already exists; recalculate the total using current valid score records without double counting. |
| **Postconditions:**<br>On success, an authorized non-activity award or deduction is recorded with its reason and audit information, and the affected criterion and semester totals are updated consistently. On failure, no partial score adjustment is committed. |
| **Special requirements:**<br>BR-SCO-16, BR-SCO-17, BR-SCO-18; NFR-SEC-03, SEC-06, REL-01, REL-03, SCA-INT-05, MAI-07. |

### 3.4 Recognition, Appeals and System Administration

#### UC-25 - Submit activity recognition request

| **Use case: Submit activity recognition request** |
| :--- |
| **Use-case name and ID:**<br>Submit activity recognition request - UC-25 |
| **Actor(s):**<br>Student |
| **Description:**<br>Submit, edit, or withdraw requests for recognition of participation in activities held inside or outside the university, with supporting evidence. |
| **Preconditions:**<br>Student is authenticated; Requests System is available; applicable submission requirements can be displayed. |
| **Basic flow (main success scenario):**<br>1. Student opens **Requests** and selects **Activity Recognition**.<br>2. System displays the recognition request form and evidence-upload requirements.<br>3. Student enters activity details, specifies whether the activity is internal or external, selects a category, optionally selects the applicable training-score criterion, and attaches supporting evidence.<br>4. Student reviews the submission and confirms.<br>5. System checks required information, evidence type/size, permission and any applicable submission window.<br>6. System creates the request and assigns it to an authorized Student Affairs Office Manager whose assigned faculties include the submitting student's faculty, or leaves it Pending Assignment if none is available.<br>7. System shows the submitted request and tracking status. |
| **Alternative flows:**<br>A1 - Step 3: Student cancels; no request is created.<br>A2 - Step 5: Required activity details or evidence are missing; system shows errors and preserves entries.<br>A3 - Step 5: Evidence exceeds 10 MB or is not PDF/JPG/PNG; system rejects the file and explains the issue.<br>A4 - Step 5: A potentially duplicate request is submitted; system allows it for review. If confirmed as a duplicate, the Manager rejects the request and notifies the student.<br>A5 - Step 6: No authorized manager is available; the request remains pending assignment until an authorized Manager becomes available.<br>A6 - Step 6: Upload/database save fails; system prevents incomplete submissions and allows retry.<br>A7 - Step 7: Submission notification fails; system retains the request and retries notification independently.|
| **Postconditions:**<br>A recognition request is submitted, updated, or withdrawn according to the student's actions. All changes are recorded, and no incomplete request is created. |
| **Special requirements:**<br>Vision 5.9/Workflow 2/assignment note; NFR-SEC-07 (PDF/JPG/PNG, <=10 MB), SEC-04, SEC-06, USA-05. Request modifications and withdrawals must maintain audit history. |


#### UC-26 - Appeal participation record or score

| **Use case: Appeal participation record or score** |
| :--- |
| **Use-case name and ID:**<br>Appeal participation record or score - UC-26 |
| **Actor(s):**<br>Student |
| **Description:**<br>Submit, edit, or withdraw evidence-backed appeals concerning missing or incorrect participation records or training scores for specific activities. |
| **Preconditions:**<br>Student is authenticated; related activity can be identified; appeal period permits submission. |
| **Basic flow (main success scenario):**<br>1. Student opens **Requests** and selects **Record or Score Appeal**.<br>2. System shows the student's related activities and participation/score records.<br>3. Student selects the related activity and disputed participation/score record if it exists, describes the issue, and attaches the required supporting evidence; a missing record may be described without selecting a nonexistent record ID.<br>4. System displays the selected activity and its responsible Activity Manager.<br>5. Student reviews and confirms submission.<br>6. System validates the appeal period, ownership, required details and evidence.<br>7. System creates the appeal and assigns it to the Manager responsible for that activity.<br>8. System shows submitted status and enables subsequent tracking. |
| **Alternative flows:**<br>A1 - Step 3: The record is missing; system allows selection of the related activity and description of the missing record rather than requiring an existing score ID.<br>A2 - Step 3: Student cancels; no appeal is created.<br>A3 - Step 6: Submission is outside the appeal period; system denies the request with an explanation.<br>A4 - Step 6: Missing explanation/evidence, unsupported file type or evidence exceeds 10 MB; system shows validation errors and preserves entered data.<br>A5 - Step 6: Selected record belongs to another student; system denies access.<br>A6 - Step 6: Identical appeal is already pending or resolved; system shows the existing request or applies the agreed duplicate policy.<br>A7 - Step 7: No responsible Activity Manager is mapped; system keeps the appeal pending assignment rather than assigning it to an unrelated Manager.<br>A8 - Step 7: Upload/save fails; system prevents incomplete submissions.<br>A9 - Step 8: Notification channel is unavailable; system retains the appeal and handles notification independently.<br> |
| **Postconditions:**<br>An appeal is submitted, updated, or withdrawn according to the student's actions. All changes are recorded, and no incomplete appeal is created. |
| **Special requirements:**<br>Vision 5.9/Workflow 2/assignment note; NFR-USA-04, USA-06, SEC-04, SEC-07, SEC-06. Appeal modifications and withdrawals must maintain audit history. |


#### UC-27 - Manage submitted requests and appeals

| **Use case: Track submitted requests** |
| :--- |
| **Use-case name and ID:**<br>Track submitted requests - UC-27 |
| **Actor(s):**<br>Student |
| **Description:**<br>View, track, edit, or withdraw submitted recognition requests and appeals, including their statuses and staff responses. |
| **Preconditions:**<br>Student is authenticated and owns the relevant requests. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Requests and Appeals**.<br>2. System retrieves the student's recognition requests and appeals.<br>3. System lists request type, related activity, submission date, and current status.<br>4. Student selects a request.<br>5. System displays request/appeal details, supporting evidence, current status, staff responses, and available actions (**Edit** or **Withdraw**) based on request/appeal status. |
| **Alternative flows:**<br>A1 - Step 2: Student has no requests; system displays an empty state.<br>A2 - Step 3: Request is Pending Assignment, Pending Review, Under Review, Additional Information Required, Approved, Rejected, or Withdrawn; system displays its recorded status.<br>A3 - Step 5: No staff response is available; system displays the current status without a decision or reason.<br>A4 - Step 5: Uploaded evidence cannot be previewed; system displays file metadata and an appropriate error.<br>A5 - Step 2: Retrieval fails; system displays an error and allows retry.<br>A6 - Step 4: Student attempts to access another user's request/appeal; system denies access.<br>A7 - Step 5: Student selects **Edit** for an unresolved request/appeal; system allows editing and resubmission, validates changes, maintains edit history, and notifies the assigned Manager.<br>A8 - Step 5: Request requires additional information; system displays the Manager's note and allows the student to update and resubmit the existing request/appeal.<br>A9 - Step 5: Student selects **Withdraw** for an unresolved request/appeal; system requests confirmation, marks the request/appeal as **Withdrawn**, and notifies the assigned Manager.<br>A10 - Step 5: Student attempts to edit or withdraw an Approved, Rejected, or Withdrawn request/appeal; system disables these actions.<br>A11 - Step 5: Edit or withdrawal fails; system preserves the previous request/appeal state and allows retry. |
| **Postconditions:**<br>Student can view their requests and recorded statuses. Requests may be updated or withdrawn when permitted, with changes recorded in the audit history. |
| **Special requirements:**<br>Vision 5.9; NFR-SEC-04, NFR-SEC-07, NFR-SEC-06. Only request owners may view, edit, or withdraw their requests. Modifications and withdrawals must maintain audit history. |


#### UC-28 - Review and resolve requests

| **Use case: Review and resolve requests** |
| :--- |
| **Use-case name and ID:**<br>Review and resolve requests - UC-28 |
| **Actor(s):**<br>Activity Manager (assigned/authorized) |
| **Description:**<br>Review evidence, decide recognition or appeal requests, respond to the student and apply approved participation/score changes where authorized. |
| **Preconditions:**<br>Manager is authenticated; a request is assigned; Manager has permission for student's request faculty/activity. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Assigned Requests**.<br>2. System displays requests within the Manager’s authorized assignment scope.<br>3. Manager selects a pending request and reviews its activity details, evidence and reported issue.<br>4. System exposes the relevant existing participation or score information where authorized.<br>5. Manager verifies the evidence, selects the appropriate training-score criterion, assigns a score, adds optional notes, and chooses Approve.<br>6. System checks decision rights, request status and affected record consistency.<br>7. System records approval and updates the related participation/score record or approved adjustment where applicable.<br>8. System records the decision, updates the request status, and notifies the student. |
| **Alternative flows:**<br>A1 - Step 2: No assigned requests; show an empty state.<br>A2 - Step 2: A recognition request must be assigned to an authorized Student Affairs Office Manager for the submitting student's faculty; an activity appeal must be assigned to the responsible Activity Manager. Deny decisions outside the relevant authorization scope.<br>A3 - Step 3: Submitted evidence is insufficient; Manager requests additional information with a note. System notifies the student and allows them to edit and resubmit the existing request for review.<br>A4 - Step 5: Manager selects **Reject**; record rejection/reason without adding participation or score credit, and notify student.<br>A5 - Step 5: Manager exits without decision; request remains pending.<br>A6 - Step 6: Request has already been processed; prevent duplicate decision and show the current result.<br>A7 - Step 6: Invalid referenced activity/student, unverified evidence, or score rule conflict; block approval and explain.<br>A8 - Step 6: Manager lacks required permission or request assignment has changed; deny write action.<br>A9 - Step 7: Database update fails; transaction must not leave the request Approved while related score/record changes are incomplete.<br>A10 - Step 8: Email delivery fails; preserve the decision and in-app status, retry/report the notification separately. |
| **Postconditions:**<br>Request has an authorized recorded decision and, on approval, consistent related data; on rejection, no unintended score change. |
| **Special requirements:**<br>Vision 5.9 and Workflow 2 note; NFR-SEC-03, SEC-06 (audit), SEC-07, REL-03, REL-01 (transactional consistency), COM-05. |



#### UC-29 - Manage users and permissions

| **Use case: Manage users and permissions** |
| :--- |
| **Use-case name and ID:**<br>Manage users and permissions - UC-29 |
| **Actor(s):**<br>University Administrator |
| **Description:**<br>Create, update, disable or manage user accounts, each with exactly one assigned role and corresponding permissions, manually or through supported bulk imports. |
| **Preconditions:**<br>Administrator is authenticated and authorized to manage user accounts, roles, and permissions. |
| **Basic flow (main success scenario):**<br>1. Administrator opens **User Management**.<br>2. System displays user accounts and their current roles and permissions.<br>3. Administrator chooses to add, edit, or delete user accounts, or manage roles and permissions manually or through CSV/XLSX file import.<br>4. Administrator enters the required information, selects the affected users, or uploads a CSV/XLSX file.<br>5. System validates the proposed changes (exactly one role per account) and displays them for review.<br>6. Administrator reviews and confirms the changes.<br>7. System applies the confirmed changes and updates the relevant user accounts, roles, or permissions.<br>8. System displays the operation results and updated user information. |
| **Alternative flows:**<br>A1 - Step 2: No matching users; system displays an empty result.<br>A2 - Step 4: Administrator cancels manual editing or file import; no changes are saved.<br>A3 - Step 4: Uploaded file is invalid or unsupported; system rejects the file and requests a valid one.<br>A4 - Step 5: File contains unknown users, duplicate entries, or invalid roles; system flags affected rows and reports validation errors.<br>A5 - Step 5: Some imported records are invalid; system excludes invalid entries and displays valid assignments for confirmation.<br>A6 - Step 5: Proposed role assignments violate permission policies; system rejects the affected changes.<br>A7 - Step 6: Administrator cancels confirmation; existing permissions remain unchanged.<br>A8 - Step 7: Another administrator has modified an affected account; system displays the latest state and requests review.<br>A9 - Step 7: Update fails; system preserves data consistency and allows retry.<br>A10 - Step 8: A user's permissions change during an active session; system enforces updated permissions on subsequent requests.<br>A11 - Step 5: Administrator attempts to assign multiple roles to one account; system rejects the assignment and instructs the administrator to use separately authorized accounts for distinct roles. |
| **Postconditions:**<br>Confirmed role and permission assignments are saved and enforced server-side. Invalid or unsuccessful updates do not modify existing permissions. |
| **Special requirements:**<br>Vision 5.10; NFR-SEC-03, NFR-SEC-06, NFR-USA-13, NFR-COM-04. File imports must validate user identifiers and roles, report rejected rows, and maintain audit history. |



#### UC-30 - Configure criteria and categories

| **Use case: Configure criteria and categories** |
| :--- |
| **Use-case name and ID:**<br>Configure criteria and categories - UC-30 |
| **Actor(s):**<br>University Administrator |
| **Description:**<br>Create, update, or remove training-score evaluation criteria and activity categories manually or in bulk through CSV/XLSX file imports. |
| **Preconditions:**<br>Administrator is authenticated and has configuration permission; current settings and historical criteria are accessible. |
| **Basic flow (main success scenario):**<br>1. Administrator opens **System Configuration**.<br>2. System displays training-score criteria, defined ranges, and activity categories.<br>3. Administrator chooses to add, edit, or remove criteria/categories manually or import configurations from a CSV/XLSX file.<br>4. Administrator enters the required information or uploads a file containing criteria/categories and their configuration values.<br>5. System validates the proposed changes and displays their impact, including affected semesters and existing records, for review.<br>6. Administrator reviews and confirms the changes.<br>7. System saves the valid configurations and preserves historical scoring rules.<br>8. System displays the updated configuration and operation results. |
| **Alternative flows:**<br>A1 - Step 3: Administrator cancels manual editing or file import; no changes are saved.<br>A2 - Step 4: Uploaded file is invalid, unreadable, or unsupported; system rejects the file and requests a valid one.<br>A3 - Step 5: File contains duplicate entries, missing fields, invalid criteria, or conflicting score ranges; system flags affected rows and reports validation errors.<br>A4 - Step 5: Some imported records are invalid; system excludes invalid entries and displays valid changes for confirmation.<br>A5 - Step 5: Proposed changes would overwrite historical criteria or results; system prevents retroactive modifications and preserves previous-semester rules.<br>A6 - Step 5: Administrator attempts to remove a category used by existing activities; system blocks the deletion to preserve data consistency.<br>A7 - Step 5: Administrator lacks permission to modify the configuration; system denies the action.<br>A8 - Step 6: Administrator declines confirmation; existing settings remain unchanged.<br>A9 - Step 7: Save fails or concurrent modifications occur; system retains the last valid configuration and allows retry.<br>A10 - Step 8: Configuration applies to a future semester; system displays its effective semester and preserves the currently active configuration until then. |
| **Postconditions:**<br>Confirmed configurations are saved manually or through file imports. Historical scoring rules remain preserved, and invalid or unsuccessful changes do not affect existing configurations. |
| **Special requirements:**<br>Vision 5.10; NFR-SCA-INT-04, NFR-SCA-INT-05, NFR-MAI-07, NFR-SEC-06, NFR-USA-13, NFR-COM-04. File imports must validate configuration values and report rejected rows with reasons. |


#### UC-31 - View system reports

| **Use case: View system reports** |
| :--- |
| **Use-case name and ID:**<br>View system reports - UC-31 |
| **Actor(s):**<br>University Administrator |
| **Description:**<br>Inspect system-wide reports and statistics about activity organization, registration trends and training-score distribution. |
| **Preconditions:**<br>Administrator is authenticated with reporting permission; data required for reporting is available. |
| **Basic flow (main success scenario):**<br>1. Administrator opens **System Reports**.<br>2. System displays reporting areas: activity organization, registration trends, and training-score distribution.<br>3. Administrator selects a reporting area and applicable semester/date/organization filters.<br>4. System aggregates authorized activity/session, Confirmed/Waitlisted/Cancelled registration, verified participation and training-score results, applying current status and semester-scoping rules.<br>5. System displays resulting metrics, charts and a table with the selected scope. |
| **Alternative flows:**<br>A1 - Step 3: Administrator changes filters; refresh results for the new scope.<br>A2 - Step 3: Invalid date range or filter; show validation guidance.<br>A3 - Step 4: No records match; show a meaningful empty/zero-data state.<br>A4 - Step 4: Administrator lacks reporting scope permission; deny access to restricted data.<br>A5 - Step 4: Aggregation or database service fails; show retry/error rather than stale values as current.<br>A6 - Step 5: Administrator opens a chart/table detail; show the available breakdown.<br>A7 - Step 5: User requests exported reports; report export is supported under NFR-COM-02 but whether this admin view exposes export must be confirmed; do not invent mandatory export UI. |
| **Postconditions:**<br>Authorized system-level reporting information is displayed without changing source records. |
| **Special requirements:**<br>Vision 5.10; NFR-COM-02, SEC-03, PER-01; report formulas, granularity and export permission TBD. |

### 3.5 Homepage and Overview

#### UC-32 - View personalized homepage

| **Use case: View personalized homepage** |
| :--- |
| **Use-case name and ID:**<br>View personalized homepage - UC-32 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>View an authorized role-based homepage with relevant summaries, pending tasks, and links to system features. |
| **Preconditions:**<br>User is authenticated with one assigned role. |
| **Basic flow (main success scenario):**<br>1. User logs in or opens **Homepage**.<br>2. System identifies the account's single assigned role and authorized resource scope.<br>3. System retrieves current overview information for the selected semester/reporting period, where applicable.<br>4. System displays role-relevant summaries and shortcuts without including unauthorized or stale records.<br>5. User selects a summary or quick link.<br>6. System navigates to the corresponding authorized feature. |
| **Alternative flows:**<br>A1 - Step 3: No applicable data exists; show meaningful empty/zero states.<br>A2 - Step 3: Some data cannot be retrieved; identify unavailable sections and allow retry without fabricating totals.<br>A3 - Step 4: Student dashboard shows own upcoming Confirmed activities, registration statuses, verified training-score summary and request statuses.<br>A4 - Step 4: Activity Manager dashboard shows only scoped activities, registration counts, upcoming activities, and pending or overdue participation verification.<br>A5 - Step 4: University Administrator dashboard shows authorized system-wide activity, registration, verified participation and training-score summaries.<br>A6 - Step 3: User changes the selected semester or reporting period; recalculate applicable overview values for that period.<br>A7 - Step 4: Cancelled registrations appear in underlying data; do not count them as confirmed, and do not count unverified attendance as awarded score.<br>A8 - Step 6: User attempts to navigate to a resource outside account permissions; deny access.<br>A9 - Step 6: Linked resource is unavailable or removed; show appropriate feedback. |
| **Postconditions:**<br>User sees role-authorized overview information and can navigate to permitted functions; no business record is changed. |
| **Special requirements:**<br>Vision Feature 13; BR-OVR-01–06; NFR-SEC-03, SEC-04, USA-02, USA-09, PER-01. |

## 4. Traceability and alignment checks

| Area | Covered use cases | Vision reference |
|---|---|---|
| Authentication and profile | UC-01–UC-03 | Features 1–2 |
| Discovery, follow, AI and services | UC-04–UC-09 | Features 3, 11, 12; NFR-LOC-01, NFR-USA-08 |
| Registration, waiting list, calendar, notifications | UC-10–UC-17 | Features 4, 7, 8; Workflow 1; NFR-REL-02, COM-03, COM-05 |
| Activity / scores and reports | UC-18–UC-24, UC-33 | Features 5–6 |
Recognition, appeals and administration | UC-25–UC-31| Features 9–10; Workflow 2 |
 Homepage and overview | UC-32 | Feature 13; NFR-USA-02 |

## 5. Interactive Prototype

An interactive prototype of the myHCMUS system was developed using Figma Make to visualize the user interfaces and demonstrate the main workflows described in this document. The prototype includes role-based interfaces for Students, Activity Managers, and University Administrators, supporting the demonstration of basic and alternative use-case flows.

**Figma Prototype:** [View myHCMUS Interactive Prototype](https://flick-curry-05211016.figma.site)

**Demo Scenario Navigator:** [View Use-Case Demonstrations](https://flick-curry-05211016.figma.site/demo/uc-01)

### 5.1. Demo Accounts

The following accounts can be used to explore the prototype with different user roles.

| Role | Email | Password |
|---|---|---|
| Student | student1@example.invalid | demo2026 |
| Activity Manager | manager1@example.invalid | demo2026 |
| University Administrator | admin@example.invalid | demo2026 |

**Note:** The prototype uses simulated authentication and demo data. No real authentication or user sessions are implemented.

### 5.2. Use-Case Demonstrations

The Demo Scenario Navigator provides access to use-case demonstrations, including basic and alternative flows. It allows reviewers to navigate directly to relevant prototype screens and examine the corresponding system behavior.
