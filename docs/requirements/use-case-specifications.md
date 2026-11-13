# myHCMUS - Use-Case Specifications
 

## 1. Purpose and modeling conventions

This document specifies **all 31 use cases** in the use case model document, ordered by ID and grouped by the same four areas. Each **Basic Flow** describes a main success path as a dialogue between actor and system; **Alternative Flows** identify variations, error states and exceptional cases. A step reference refers to the numbered step in the current use-case table. An alternative stops or returns to the relevant step as described. The use cases preserve the model’s `extend` relationships (UC-13 → UC-10, UC-16 → UC-15).

**Interpretation of completeness:** “All alternative flows” means reasonably identifiable domain paths, validation outcomes, permissions, concurrency conflicts, and service failures grounded in the current baseline.

**Roles and scope:** User is the abstract parent actor of Student, Activity Manager and University Administrator. External Email Service supports UC-17. Requests for activity recognition are routed to an authorized Manager in the Student Affairs Office; appeals for a specific activity are routed to the Manager responsible for that activity. Existing university services are external links, not backend integrations.

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

## 3. Use-Case Specifications

### 3.1 Account, Activity Discovery and Student Services

#### UC-01 - Log in

| **Use case: Log in** |
| :--- |
| **Use-case name and ID:**<br>Log in - UC-01 |
| **Actor(s):**<br>User (Student, Activity Manager, University Administrator) |
| **Description:**<br>Authenticate an existing account, identify its role, and open the appropriate myHCMUS workspace. |
| **Preconditions:**<br>User has an account; user is not authenticated; the sign-in page is reachable. |
| **Basic flow (main success scenario):**<br>1. User opens the login page.<br>2. System displays the credential form.<br>3. User enters account credentials and selects **Log in**.<br>4. System validates the input and authenticates the account.<br>5. System establishes an authenticated session, resolves the assigned role, and displays the appropriate dashboard. |
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
| **Alternative flows:**<br>A1 - Step 3: User cancels editing; system discards unsaved changes.<br>A2 - Step 3: User chooses **Change password**; system asks for the current password, new password, and confirmation, validates them, and securely updates the password.<br>A3 - Step 3: User chooses **Change avatar**; system accepts JPG or PNG image up to 5 MB, validates the upload, and updates the displayed avatar.<br>A4 - Step 3: User removes the current avatar; system restores the default profile picture.<br>A5 - Step 4: Phone number is invalid; system highlights the invalid field and preserves entered values.<br>A6 - Step 4: User attempts to edit read-only academic information (full name, ID, faculty) or another user's data; system denies the change.<br>A7 - Step 4: Current password is incorrect, new password is shorter than eight characters, or confirmation differs; password remains unchanged and a correction message is shown.<br>A8 - Step 4: Avatar file is not JPG/PNG or exceeds 5 MB; system rejects the upload and retains the existing avatar.<br>A9 - Step 5: Avatar upload, storage, or database update fails; system retains previously saved values and allows retry. |
| **Postconditions:**<br>On success, allowed profile fields/password/avatar reflect committed changes; student academic identifiers remain read-only. |
| **Special requirements:**<br>NFR-SEC-02, SEC-04, SEC-09; USA-05.|



#### UC-04 - Discover activities
| **Use case: Discover activities** |
| :--- |
| **Use-case name and ID:**<br>Discover activities - UC-04 |
| **Actor(s):**<br>Student, Activity Manager |
| **Description:**<br>Browse, search, filter, and inspect extracurricular activities and their eligibility, schedule, and registration information. |
| **Preconditions:**<br>User is authenticated; visible activity data exists or the catalog can report an empty state. |
| **Basic flow (main success scenario):**<br>1. User opens the **Activities** section.<br>2. System shows currently visible activities with key details such as capacity, deadline, and score value.<br>3. User searches or filters by faculty, date, location, training-score criteria, or registration status.<br>4. System updates the matching list and displays active filters.<br>5. User selects an activity.<br>6. System displays its description, schedule, eligibility, capacity, registration deadline, and current status. |
| **Alternative flows:**<br>A1 - Step 2: No visible activities exist; show an empty-state message.<br>A2 - Step 3: User clears all filters; return to the unfiltered list.<br>A3 - Step 3: Invalid date/filter values; show validation feedback without losing valid filters.<br>A4 - Step 4: No results match; show a no-results state and reset option.<br>A5 - Step 4: Search ignores missing Vietnamese diacritics as required by NFR-LOC-03.<br>A6 - Step 6: Activity was cancelled, hidden, or removed; show an unavailable/not-found state rather than permitting registration.<br>A7 - Steps 2/4/6: Retrieval fails; show a retry option without changing records. |
| **Postconditions:**<br>User can inspect matching activity details; no registration or activity record is changed. |
| **Special requirements:**<br>NFR-LOC-03, USA-01, USA-06, PER-02, SEC-03. |


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
| **Description:**<br>Attempt to register for an activity; the system checks deadline, eligibility, available capacity and schedule conflicts, and routes the request for Manager approval when required. |
| **Preconditions:**<br>Student is authenticated; activity exists and is visible; enrollment can be attempted. |
| **Basic flow (main success scenario):**<br>1. Student opens an activity and selects **Register**.<br>2. System displays activity details, current capacity, deadline and participation requirements.<br>3. Student confirms the request.<br>4. System validates the registration period, eligibility and duplicate-registration status.<br>5. System checks current capacity and detects overlapping registered activities.<br>6. System records the registration, either **Confirmed** if approval is not required or **Pending Approval** if it is.<br>7. System shows status and, once confirmed, updates the personal calendar and notifications. |
| **Alternative flows:**<br>A1 - Step 3: Student abandons or cancels confirmation; no registration is created.<br>A2 - Step 4: Deadline has passed or activity is unavailable; show registration closed and stop.<br>A3 - Step 4: Student fails one or more activity eligibility requirements; explain the restriction and stop.<br>A4 - Step 4: Student already has a pending, confirmed, or waiting-list entry; do not create a duplicate.<br>A5 - Step 5: Capacity is full; offer UC-13 **Join an Activity Waiting List** when available, otherwise show Full.<br>A6 - Step 5: Scheduling conflict is detected; show a warning; student may continue or cancel.<br>A7 - Step 6: Manager approval is required; show **Pending Approval**; subsequent approval confirms, rejection changes status to **Rejected**.<br>A8 - Step 6: Two students compete for the last slot; system accepts only a transaction that fits capacity and handles the other as full.<br>A9 - Step 6: Save fails; do not leave a partial registration and show retry/error.<br>A10 - Step 7: Notification delivery fails; keep committed registration and report/retry notification separately. |
| **Postconditions:**<br>On success, a single confirmed or pending registration exists and never exceeds capacity; calendar reflects confirmed status. Otherwise no partial registration exists. |
| **Special requirements:**<br> NFR-REL-01, SCA-PHY-02, SCA-PHY-03, SEC-04, USA-01, USA-06. |


#### UC-11 - Cancel a registration

| **Use case: Cancel a registration** |
| :--- |
| **Use-case name and ID:**<br>Cancel a registration - UC-11 |
| **Actor(s):**<br>Student |
| **Description:**<br>Cancel an existing registration within the permitted period; release confirmed capacity and allow FIFO waiting-list promotion when applicable. |
| **Preconditions:**<br>Student is authenticated and owns a cancellable registration. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Registrations** and selects a registration.<br>2. System displays current status and whether cancellation is allowed.<br>3. Student selects **Cancel Registration**.<br>4. System asks for confirmation.<br>5. Student confirms the cancellation.<br>6. System checks cancellation rules and atomically changes registration status to **Cancelled**.<br>7. If a confirmed seat is released, system handles FIFO waiting-list promotion; the student sees the updated status. |
| **Alternative flows:**<br>A1 - Step 4: Student dismisses the confirmation; leave registration unchanged.<br>A2 - Step 6: Cancellation period has ended or status is non-cancellable; explain why and retain existing state.<br>A3 - Step 6: Registration was already cancelled or changed by another action; refresh current status.<br>A4 - Step 6: User attempts to cancel another student’s registration; deny access.<br>A5 - Step 6: Save or concurrent transaction fails; retain the previous committed record and offer retry.<br>A6 - Step 7: No student is waiting; released capacity remains available.<br>A7 - Step 7: Waiting list is non-empty; system selects first eligible waiting entry in FIFO order; if Manager approval is required, show corresponding pending state.<br>A8 - Step 7: Notification delivery for promotion fails; do not reverse a valid cancellation and handle notification failure separately. |
| **Postconditions:**<br>On success, registration is cancelled and any released seat is processed without duplicate promotion. |
| **Special requirements:**<br>NFR-REL-01, REL-02, SCA-PHY-03, SEC-04, USA-04; waiting-list promotion is automatic behavior, not another actor-goal use case. |


#### UC-12 - Track registration status

| **Use case: Track registration status** |
| :--- |
| **Use-case name and ID:**<br>Track registration status - UC-12 |
| **Actor(s):**<br>Student |
| **Description:**<br>Inspect the current status of the student’s activity registrations and waiting-list entries. |
| **Preconditions:**<br>Student is authenticated and is permitted to see only their registrations. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Registrations**.<br>2. System retrieves the student’s registrations and applicable waiting-list records.<br>3. System displays each activity and its latest status.<br>4. Student selects a registration to view details and relevant Manager decisions. |
| **Alternative flows:**<br>A1 - Step 2: No registrations or waiting-list entries exist; show an empty state.<br>A2 - Step 3: Status is **Pending Approval**, **Rejected**, **Cancelled**, or **Waiting List**; display that state and any available reason/next action.<br>A3 - Step 3: A pending request is approved/rejected or a waiting entry is promoted; show its new status on refresh/notification.<br>A4 - Step 2: Retrieval fails; show a retryable error.<br>A5 - Step 4: Record is not owned by the student; deny access. |
| **Postconditions:**<br>Current registration states are visible; no registration is modified. |
| **Special requirements:**<br>Vision 5.4 and 5.8; NFR-SEC-04, USA-09. |


#### UC-13 - Join an activity waiting list

| **Use case: Join an activity waiting list** |
| :--- |
| **Use-case name and ID:**<br>Join an activity waiting list - UC-13 |
| **Actor(s):**<br>Student |
| **Description:**<br>Join the FIFO waiting list when an eligible student wants to register for an activity that has reached capacity; later promotion is automatic. |
| **Preconditions:**<br>Student is authenticated; the activity exists and is full; joining a waiting list is offered under applicable rules. |
| **Basic flow (main success scenario):**<br>1. Student attempts registration for an activity with no available seats.<br>2. System explains that the activity is full and offers **Join Waiting List**.<br>3. Student selects **Join Waiting List**.<br>4. System checks registration availability, student eligibility, and duplicate entries.<br>5. System atomically records the student’s waiting-list position in arrival order.<br>6. System confirms **Waiting List** status and displays available status information. |
| **Alternative flows:**<br>A1 - Step 3: Student declines the waiting list; no entry is created.<br>A2 - Step 4: Registration deadline is closed; explain and stop.<br>A3 - Step 4: Student does not meet participation requirements; explain and do not add an entry.<br>A4 - Step 4: Student is already registered or on the list; display the existing state without a duplicate.<br>A5 - Step 5: Concurrent seat availability changes; re-evaluate capacity and present the updated registration path without breaking FIFO.<br>A6 - Step 5: Waiting-list save fails; show an error and leave no partial/duplicate entry.<br>A7 - After Step 6: Student requests to leave the waiting list; remove their entry.<br>A8 - After Step 6: Promotion notification cannot be delivered; preserve the committed queue/registration state and retry/report messaging failure. |
| **Postconditions:**<br>On success a unique FIFO waiting-list entry exists; future promotion follows queue order without exceeding capacity. |
| **Special requirements:**<br>Vision 5.4/Workflow 1; NFR-REL-02 (strict FIFO), REL-01, SCA-PHY-03; UC-13 `extend` UC-10 when full. |


#### UC-14 - Manage activity registrations

| **Use case: Manage activity registrations** |
| :--- |
| **Use-case name and ID:**<br>Manage activity registrations - UC-14 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Inspect activity participants and waiting lists, and review registration requests for activities under the Manager’s responsibility. |
| **Preconditions:**<br>Manager is authenticated and assigned permission for the selected activity. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Managed Activities** and selects an activity.<br>2. System displays its registration list, participant status, capacity and pending approvals.<br>3. Manager opens a pending registration.<br>4. System presents the applicant details relevant to eligibility and the current status.<br>5. Manager approves the registration when approval is required.<br>6. System validates authority and capacity and records **Confirmed** status.<br>7. System updates the participant list and triggers relevant student status notifications. |
| **Alternative flows:**<br>A1 - Step 2: No registrations or pending approvals; show empty sections without an error.<br>A2 - Step 5: Manager rejects a request; record **Rejected** status and the reason if required, notify student.<br>A3 - Step 5: Manager chooses not to decide yet; leave the request pending.<br>A4 - Step 4: Registration was already processed or withdrawn; refresh and prevent a second decision.<br>A5 - Step 6: Activity was cancelled or capacity is no longer available; block confirmation and explain.<br>A6 - Step 6: Manager is not assigned to the activity; deny read/update access.<br>A7 - Step 6: Concurrent approval or database failure; preserve consistent participant totals and display retry/error.<br>A8 - Step 7: Notification fails; approval result is retained and notification failure handled separately.<br>A9 - Step 2: Waiting-list records are present; Manager may view them but cannot manually bypass FIFO without an explicitly agreed policy.<br>A10 - Step 2: Manager selects an existing registration and chooses **Cancel Registration**. System displays a confirmation dialog and requires a cancellation reason. Upon confirmation, system validates the Manager's authority and current registration status, changes the registration to **Cancelled**, releases the reserved seat, promotes the next eligible student from the waiting list according to FIFO rules, and notifies the affected student.|
| **Postconditions:**<br>An authorized decision is committed and list/status updated, or pending state remains without an inconsistent seat allocation. |
| **Special requirements:**<br>Vision 5.4/Workflow 1; NFR-SEC-03, SCA-PHY-03, REL-01, REL-02, USA-10. |


#### UC-15 - View personal activity calendar

| **Use case: View personal activity calendar** |
| :--- |
| **Use-case name and ID:**<br>View personal activity calendar - UC-15 |
| **Actor(s):**<br>Student |
| **Description:**<br>View registered activity schedules in a personal calendar and identify potential overlapping times. |
| **Preconditions:**<br>Student is authenticated. |
| **Basic flow (main success scenario):**<br>1. Student opens **My Calendar**.<br>2. System loads activities the student has registered for, joined the waiting list for, or followed, excluding cancelled activities and rejected registrations.<br>3. System renders dates, times and activity entries.<br>4. Student selects an entry to inspect schedule details.<br>5. System flags any detected scheduling conflicts. |
| **Alternative flows:**<br>A1 - Step 2: No registered activities exist; show an empty calendar.<br>A2 - Step 2: Waiting or pending registrations are displayed on the calendar with corresponding status flags, without being treated as confirmed.<br>A3 - Step 5: Two activities overlap; show a conflict warning rather than silently cancelling a registration.<br>A4 - Step 4: Activity schedule changes; display current schedule and any updated conflict status.<br>A5 - Steps 2/4: Data cannot load or entry is no longer available; show a clear error/unavailable state.<br>A6 - Step 3: Student changes calendar period or view; update the displayed entries. |
| **Postconditions:**<br>Calendar shows available registration-related events; no registration is changed. |
| **Special requirements:**<br>NFR-SEC-04 and LOC-04; UC-16 may extend calendar view. |



#### UC-16 - Export activity calendar

| **Use case: Export activity calendar** |
| :--- |
| **Use-case name and ID:**<br>Export activity calendar - UC-16 |
| **Actor(s):**<br>Student |
| **Description:**<br>Download registered activity information in iCalendar (.ics) format for import into an external calendar application. |
| **Preconditions:**<br>Student is authenticated and can access personal calendar (UC-15). |
| **Basic flow (main success scenario):**<br>1. Student opens their activity calendar.<br>2. Student selects **Export Calendar**.<br>3. System gathers calendar events permitted for export.<br>4. System prepares a valid `.ics` file using current event schedule data.<br>5. Browser downloads the generated file and displays an export result. |
| **Alternative flows:**<br>A1 - Step 2: Student cancels the action; no file is created.<br>A2 - Step 3: Calendar contains no exportable activities; show an empty-export message or a valid empty calendar according to chosen product behavior.<br>A3 - Step 3: Some entries were cancelled or changed; export current eligible records, not stale dates.<br>A4 - Step 4: Export generation fails; show retry and do not provide a corrupt file.<br>A5 - Step 5: Browser blocks download; provide a new download action or error guidance. |
| **Postconditions:**<br>An `.ics` file with authorized activities is made available; no external calendar is modified directly. |
| **Special requirements:**<br>NFR-COM-03, LOC-04, SEC-04; UC-16 `extend` UC-15. External Google Calendar is not an integrated system actor. |


#### UC-17 - Receive activity notifications

| **Use case: Receive activity notifications** |
| :--- |
| **Use-case name and ID:**<br>Receive activity notifications - UC-17 |
| **Actor(s):**<br>Student; External Email Service (supporting actor for email delivery) |
| **Description:**<br>Receive in-app notifications and, through an external email service, email notifications about activity-related events. |
| **Preconditions:**<br>Student account exists; an activity/registration/follow/waiting-list event meets notification criteria. |
| **Basic flow (main success scenario):**<br>1. A relevant event occurs, such as an upcoming activity, deadline, schedule change, registration decision, or waiting-list promotion.<br>2. System identifies eligible recipients from their follow, registration, and waiting-list relationships.<br>3. System creates corresponding in-app notifications and submits email delivery through External Email Service.<br>4. Student opens the Notifications panel to read the message and its related activity/status.<br>5. System marks the viewed notification as read. |
| **Alternative flows:**<br>A1 - Step 1: No subscribed/affected student matches; no notification is created for unrelated users.<br>A2 - Step 2: Student is waiting-listed; send promotion and other applicable queue notices even though they are not confirmed.<br>A3 - Step 3: Email service is unavailable; preserve the in-app message and retry/report email delivery failure separately.<br>A4 - Step 3: In-app notification creation fails; report/retry event without corrupting the related business transaction.<br>A5 - Step 4: Student has no notifications; show an empty state.<br>A6 - Step 4: Link points to an activity no longer visible; show a safe unavailable state.<br>A7 - Step 5: Student does not open a notification; keep it unread. |
| **Postconditions:**<br>Applicable notification is visible in-app and email delivery is attempted; failed external delivery does not roll back registration/score changes. |
| **Special requirements:**<br>Vision 5.8; NFR-COM-05, REL-04, SCA-PHY-05, SEC-04. Email Service is an external supporting actor, not part of the system. |


### 3.3 Activity, Participation and Training Scores

#### UC-18 - Manage activities

| **Use case: Manage activities** |
| :--- |
| **Use-case name and ID:**<br>Manage activities - UC-18 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Create, edit, publish and manage extracurricular activities, their categories, dates, locations, participation requirements, capacity, training-score criteria and lifecycle statuses. |
| **Preconditions:**<br>Manager is authenticated and authorized to manage activities for the relevant organizational unit. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Manage Activities** and selects **Create Activity**.<br>2. System presents an activity form with description, schedule, location, category, requirements, capacity, registration deadline and training-score criteria.<br>3. Manager enters the activity details and saves a draft.<br>4. System validates the fields and records the draft within the Manager’s organization.<br>5. Manager reviews the draft and chooses **Publish**.<br>6. System checks publish eligibility, changes the status to **Published**, and makes the activity discoverable to eligible students.<br>7. System displays the updated activity management list and status. |
| **Alternative flows:**<br>A1 - Step 3: Manager cancels without saving; discard pending changes.<br>A2 - Step 3: Manager opens an existing activity to edit schedule, requirements, capacity or other allowed fields; validate and save, then notify affected students if needed.<br>A3 - Step 4: Required fields, date order, registration deadline, capacity or selected category/criterion is invalid; show field errors and preserve entries.<br>A4 - Step 4: Manager is not authorized for the organizational unit or activity; deny create/edit access.<br>A5 - Step 5: Manager keeps the item as Draft, rather than publishing; retain unpublished state.<br>A6 - Step 6: Activity cannot be published because required information is missing or dates are invalid; keep Draft and explain.<br>A7 - After Step 7: Manager transitions an activity to Ongoing, Completed or Cancelled when appropriate; system updates status and related UI.<br>A8 - After Step 7: If the new capacity is below the number of confirmed participants, the system displays a warning and requires confirmation from the Activity Manager before applying the capacity change.<br>A9 - After Step 7: Published activity schedule/status changes; system updates information and queues relevant notices to followers/registrants.<br>A10 - Steps 4/6: Database or concurrent update fails; preserve previously committed data and offer retry.<br>A11 - Step 2: Manager imports activities from a CSV/XLSX file; the system validates the data, imports valid records, and reports rejected rows with reasons. |
| **Postconditions:**<br>An activity is saved as Draft/Published or modified to another valid lifecycle state; no invalid partial changes occur. |
| **Special requirements:**<br>Vision 5.5, 5.4 eligibility, NFR-USA-10/11/12, COM-04 (import), SCA-PHY-03, SEC-03. |



#### UC-19 - Publish activity announcements

| **Use case: Publish activity announcements** |
| :--- |
| **Use-case name and ID:**<br>Publish activity announcements - UC-19 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Publish information and changes about an activity to its relevant student audience. |
| **Preconditions:**<br>Manager is authenticated, has permission for the activity, and the activity exists. |
| **Basic flow (main success scenario):**<br>1. Manager opens a managed activity.<br>2. Manager selects **Announcements** and **New Announcement**.<br>3. System displays an announcement form associated with the selected activity.<br>4. Manager enters a title/message and submits.<br>5. System validates the content and Manager’s ownership, then publishes the announcement.<br>6. System displays the published announcement and triggers relevant follower/registrant notifications. |
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
| **Basic flow (main success scenario):**<br>1. Manager opens **Activity Reports / Statistics**.<br>2. System displays available reporting scopes and filters.<br>3. Manager selects an individual activity or their department and specifies a reporting period.<br>4. System calculates relevant statistics, including total activities, registrations, participating students, participation rates, and distribution by training-score criteria.<br>5. System presents the statistics in tables and charts with applicable totals and breakdowns.<br>6. Manager chooses **Export Report** and downloads a report when needed. |
| **Alternative flows:**<br>A1 - Step 2: No activities are available; system displays an empty dashboard.<br>A2 - Step 3: Invalid dates or filters; system requests correction.<br>A3 - Step 4: No data exists for the selected period; system displays zero or empty results rather than estimated metrics.<br>A4 - Step 4: Manager attempts to access another department's private data; system denies access.<br>A5 - Step 4: Data aggregation fails; system displays an error message and allows retry.<br>A6 - Step 6: Manager does not export; use case completes with displayed statistics.<br>A7 - Step 6: PDF export fails or browser blocks download; system displays an error message and allows retry without modifying underlying records. |
| **Postconditions:**<br>Authorized activity-level or department-level statistics are displayed and optionally exported; no source data is modified. |
| **Special requirements:**<br>Vision 5.5; NFR-COM-02, NFR-SEC-03, NFR-PER-01; department-level reports must be restricted to the Manager's authorized department. |


#### UC-21 - Manage participation records


| **Use case: Manage participation records** |
| :--- |
| **Use-case name and ID:**<br>Manage participation records - UC-21 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Record and manage student participation through participation file imports or manual updates, and export participation records. |
| **Preconditions:**<br>Manager is authenticated, authorized for the activity, and participant/registration data is accessible. |
| **Basic flow (main success scenario):**<br>1. Manager opens a completed activity and selects **Participation**.<br>2. System displays registered participants and their participation statuses, initially **No information**.<br>3. Manager uploads a participation file.<br>4. System validates the file and matches student IDs with registered participants.<br>5. System displays matched records, unmatched entries, and proposed participation updates.<br>6. Manager reviews the results, makes corrections if necessary, and confirms the updates.<br>7. System updates participation and corresponding participation records, calculates applicable training scores, and displays confirmation. |
| **Alternative flows:**<br>A1 - Step 2: No registered participants; system displays an empty list.<br>A2 - Step 3: Manager chooses manual updates; system allows marking participants as **Attended** or **Absent** and saving the changes.<br>A3 - Step 3: Uploaded file is invalid or unsupported; system rejects the file and requests a valid one.<br>A4 - Step 4: File contains duplicate or invalid student IDs; system flags affected entries and prevents incorrect updates.<br>A5 - Step 4: Student IDs do not match registered participants; system reports unmatched entries and excludes them from automatic updates.<br>A6 - Step 5: Manager corrects participation statuses before confirming; system applies the reviewed changes.<br>A7 - Step 6: Manager cancels the import; no changes are saved.<br>A8 - Step 7: Manager lacks permission or the activity status does not allow updates; system denies the operation.<br>A9 - Step 7: Save fails or conflicting updates occur; system preserves data consistency and allows retry.<br>A10 - After Step 7: Manager manually modifies existing participation records; system updates corresponding participation records and training scores while maintaining audit history.<br>A11 - After Step 7: Manager exports participation records; system generates a downloadable report. |
| **Postconditions:**<br>Attendance and participation records are updated consistently. Students marked as **Attended** are recognized as participants, and applicable training scores are updated accordingly. |
| **Special requirements:**<br>Vision 5.6; NFR-COM-02, NFR-REL-03, NFR-SEC-03, NFR-SEC-06. Attendance and participation must remain synchronized, with changes reflected in training scores and audit history. |

#### UC-22 - Manage training-score results

| **Use case: Manage training-score results** |
| :--- |
| **Use-case name and ID:**<br>Manage training-score results - UC-22 |
| **Actor(s):**<br>Activity Manager |
| **Description:**<br>Assign, review or update training-score results for activity participation under the applicable criteria and verification rules. |
| **Preconditions:**<br>Manager is authenticated and authorized for activity scoring; criteria and verified records are available. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Training-Score Results** for a managed activity.<br>2. System lists students, verified participation records and applicable criteria.<br>3. Manager selects a student record and enters or reviews a permitted score result/adjustment.<br>4. System checks verification, scoring rules, permission and score consistency.<br>5. Manager confirms the update.<br>6. System saves the score-related change and audit information.<br>7. System displays the revised score result available to authorized viewers. |
| **Alternative flows:**<br>A1 - Step 2: No verified records; show that scoring is not yet available.<br>A2 - Step 3: Manager cancels; preserve current score.<br>A3 - Step 4: Student record is unverified or criterion does not apply; reject the change.<br>A4 - Step 4: Entered score violates allowed range/criteria; show validation error.<br>A5 - Step 4: Manager lacks authority; deny write access.<br>A6 - Step 4: Historical criteria differ from current criteria; use rules applicable to the selected semester, preserving old results as required.<br>A7 - Step 6: Save fails or concurrent adjustment conflicts; do not leave an inconsistent score; allow retry.<br>A8 - Step 7: A related appeal is approved later; approved adjustment is reflected in calculated totals after UC-28. |
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
| **Basic flow (main success scenario):**<br>1. Student opens **My Training Scores**.<br>2. System retrieves the student’s verified records and approved adjustments for the selected semester.<br>3. System calculates or loads totals against the applicable semester criteria.<br>4. System presents the overall score and breakdown by evaluation criterion.<br>5. Student changes semester or opens a criterion to inspect contributing records. |
| **Alternative flows:**<br>A1 - Step 2: No score data yet; show empty/zero state with clear explanation.<br>A2 - Step 3: A record remains unverified; do not include it as verified in the final total.<br>A3 - Step 3: An approved appeal adds/corrects a record; reflect the updated approved adjustment and total.<br>A4 - Step 3: Criteria changed for a later semester; preserve prior-semester rules/results.<br>A5 - Step 2: Data retrieval fails; show retry rather than inaccurate totals.<br>A6 - Step 5: Student attempts to view another student’s scores; deny access. |
| **Postconditions:**<br>Student sees authorized score totals and criterion breakdown; no score values are changed. |
| **Special requirements:**<br>NFR-REL-03, SCA-INT-05, SEC-04, LOC-05; Vision 5.6. |


### 3.4 Recognition, Appeals and System Administration

#### UC-25 - Submit activity recognition request

| **Use case: Submit activity recognition request** |
| :--- |
| **Use-case name and ID:**<br>Submit activity recognition request - UC-25 |
| **Actor(s):**<br>Student |
| **Description:**<br>Submit, edit, or withdraw requests for recognition of participation in activities held inside or outside the university, with supporting evidence. |
| **Preconditions:**<br>Student is authenticated; Requests System is available; applicable submission requirements can be displayed. |
| **Basic flow (main success scenario):**<br>1. Student opens **Requests** and selects **Activity Recognition**.<br>2. System displays the recognition request form and evidence-upload requirements.<br>3. Student enters activity details, specifies whether the activity is internal or external, selects a category (volunteering, academic, or other), optionally selects the applicable training-score criterion, and attaches supporting evidence.<br>4. Student reviews the submission and confirms.<br>5. System checks required information, evidence type/size, permission and any applicable submission window.<br>6. System creates the request and routes it to an authorized Activity Manager in the Student Affairs Office.<br>7. System shows the submitted request and tracking status. |
| **Alternative flows:**<br>A1 - Step 3: Student cancels; no request is created.<br>A2 - Step 5: Required activity details or evidence are missing; system shows errors and preserves entries.<br>A3 - Step 5: Evidence exceeds 10 MB or is not PDF/JPG/PNG; system rejects the file and explains the issue.<br>A4 - Step 5: A potentially duplicate request is submitted; system allows it for review. If confirmed as a duplicate, the Manager rejects the request and notifies the student.<br>A5 - Step 6: No authorized Student Affairs Manager is available; the request remains pending assignment until an authorized Manager becomes available.<br>A6 - Step 6: Upload/database save fails; system prevents incomplete submissions and allows retry.<br>A7 - Step 7: Submission notification fails; system retains the request and retries notification independently.|
| **Postconditions:**<br>A recognition request is submitted, updated, or withdrawn according to the student's actions. All changes are recorded, and no incomplete request is created. |
| **Special requirements:**<br>Vision 5.9/Workflow 2/assignment note; NFR-SEC-07 (PDF/JPG/PNG, <=10 MB), SEC-04, SEC-06, USA-05. Request modifications and withdrawals must maintain audit history. |


#### UC-26 - Appeal participation record or score

| **Use case: Appeal participation record or score** |
| :--- |
| **Use-case name and ID:**<br>Appeal participation record or score - UC-26 |
| **Actor(s):**<br>Student |
| **Description:**<br>Submit, edit, or withdraw evidence-backed appeals concerning missing or incorrect participation records or training scores for specific activities. |
| **Preconditions:**<br>Student is authenticated; related activity can be identified; appeal period permits submission. |
| **Basic flow (main success scenario):**<br>1. Student opens **Requests** and selects **Record or Score Appeal**.<br>2. System shows the student's related activities and participation/score records.<br>3. Student selects the disputed activity and record, describes the issue, and attaches supporting evidence.<br>4. System displays the selected activity and its responsible Activity Manager.<br>5. Student reviews and confirms submission.<br>6. System validates the appeal period, ownership, required details and evidence.<br>7. System creates the appeal and assigns it to the Manager responsible for that activity.<br>8. System shows submitted status and enables subsequent tracking. |
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
| **Preconditions:**<br>Manager is authenticated; a request is assigned; Manager has permission for that request category/activity. |
| **Basic flow (main success scenario):**<br>1. Manager opens **Assigned Requests**.<br>2. System displays requests within the Manager’s authorized assignment scope.<br>3. Manager selects a pending request and reviews its activity details, evidence and reported issue.<br>4. System exposes the relevant existing participation or score information where authorized.<br>5. Manager verifies the evidence, selects the appropriate training-score criterion, assigns a score, adds optional notes, and chooses Approve.<br>6. System checks decision rights, request status and affected record consistency.<br>7. System records approval and updates the related participation/score record or approved adjustment where applicable.<br>8. System records the decision, updates the request status, and notifies the student. |
| **Alternative flows:**<br>A1 - Step 2: No assigned requests; show an empty state.<br>A2 - Step 2: Recognition request belongs to an authorized Student Affairs Manager; appeal belongs to the responsible activity Manager; deny processing outside the applicable scope.<br>A - Step 3: Submitted evidence is insufficient; Manager requests additional information with a note. System notifies the student and allows them to edit and resubmit the existing request for review.<br>A4 - Step 5: Manager selects **Reject**; record rejection/reason without adding participation or score credit, and notify student.<br>A5 - Step 5: Manager exits without decision; request remains pending.<br>A6 - Step 6: Request has already been processed; prevent duplicate decision and show the current result.<br>A7 - Step 6: Invalid referenced activity/student, unverified evidence, or score rule conflict; block approval and explain.<br>A8 - Step 6: Manager lacks required permission or request assignment has changed; deny write action.<br>A9 - Step 7: Database update fails; transaction must not leave the request Approved while related score/record changes are incomplete.<br>A10 - Step 8: Email delivery fails; preserve the decision and in-app status, retry/report the notification separately. |
| **Postconditions:**<br>Request has an authorized recorded decision and, on approval, consistent related data; on rejection, no unintended score change. |
| **Special requirements:**<br>Vision 5.9 and Workflow 2 note; NFR-SEC-03, SEC-06 (audit), SEC-07, REL-03, REL-01 (transactional consistency), COM-05. |



#### UC-29 - Manage users and permissions

| **Use case: Manage users and permissions** |
| :--- |
| **Use-case name and ID:**<br>Manage users and permissions - UC-29 |
| **Actor(s):**<br>University Administrator |
| **Description:**<br>Create, view, update, and delete user accounts, and manage roles and access permissions manually or in bulk through CSV/XLSX file imports. |
| **Preconditions:**<br>Administrator is authenticated and authorized to manage user accounts, roles, and permissions. |
| **Basic flow (main success scenario):**<br>1. Administrator opens **User Management**.<br>2. System displays user accounts and their current roles and permissions.<br>3. Administrator chooses to add, edit, or delete user accounts, or manage roles and permissions manually or through CSV/XLSX file import.<br>4. Administrator enters the required information, selects the affected users, or uploads a CSV/XLSX file.<br>5. System validates the proposed changes and displays them for review.<br>6. Administrator reviews and confirms the changes.<br>7. System applies the confirmed changes and updates the relevant user accounts, roles, or permissions.<br>8. System displays the operation results and updated user information. |
| **Alternative flows:**<br>A1 - Step 2: No matching users; system displays an empty result.<br>A2 - Step 4: Administrator cancels manual editing or file import; no changes are saved.<br>A3 - Step 4: Uploaded file is invalid or unsupported; system rejects the file and requests a valid one.<br>A4 - Step 5: File contains unknown users, duplicate entries, or invalid roles; system flags affected rows and reports validation errors.<br>A5 - Step 5: Some imported records are invalid; system excludes invalid entries and displays valid assignments for confirmation.<br>A6 - Step 5: Proposed role assignments violate permission policies; system rejects the affected changes.<br>A7 - Step 6: Administrator cancels confirmation; existing permissions remain unchanged.<br>A8 - Step 7: Another administrator has modified an affected account; system displays the latest state and requests review.<br>A9 - Step 7: Update fails; system preserves data consistency and allows retry.<br>A10 - Step 8: A user's permissions change during an active session; system enforces updated permissions on subsequent requests. |
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
| **Basic flow (main success scenario):**<br>1. Administrator opens **System Reports**.<br>2. System displays reporting areas: activity organization, registration trends, and training-score distribution.<br>3. Administrator selects a reporting area and applicable semester/date/organization filters.<br>4. System aggregates the permitted activity, registration and training-score records.<br>5. System displays resulting metrics, charts and a table with the selected scope. |
| **Alternative flows:**<br>A1 - Step 3: Administrator changes filters; refresh results for the new scope.<br>A2 - Step 3: Invalid date range or filter; show validation guidance.<br>A3 - Step 4: No records match; show a meaningful empty/zero-data state.<br>A4 - Step 4: Administrator lacks reporting scope permission; deny access to restricted data.<br>A5 - Step 4: Aggregation or database service fails; show retry/error rather than stale values as current.<br>A6 - Step 5: Administrator opens a chart/table detail; show the available breakdown.<br>A7 - Step 5: User requests exported reports; report export is supported under NFR-COM-02 but whether this admin view exposes export must be confirmed; do not invent mandatory export UI. |
| **Postconditions:**<br>Authorized system-level reporting information is displayed without changing source records. |
| **Special requirements:**<br>Vision 5.10; NFR-COM-02, SEC-03, PER-01; report formulas, granularity and export permission TBD. |



## 4. Traceability and alignment checks

| Area | Covered use cases | Vision reference |
|---|---|---|
| Authentication and profile | UC-01–UC-03 | Features 1–2 |
| Discovery, follow, AI and services | UC-04–UC-09 | Features 3, 11, 12; NFR-LOC-01, NFR-USA-08 |
| Registration, waiting list, calendar, notifications | UC-10–UC-17 | Features 4, 7, 8; Workflow 1; NFR-REL-02, COM-03, COM-05 |
| Activity / scores and reports | UC-18–UC-24 | Features 5–6 |
| Recognition, appeals and administration | UC-27–UC-31 | Features 9–10; Workflow 2 |

