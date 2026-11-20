# myHCMUS — Business Rules Catalog 

### 2.1 Accounts, profiles, roles, and permissions

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-ACC-01 | A user must have an authenticated, active account to access protected operations. Disabled accounts must not be allowed to perform them. | E | BR Semantic constraints; UC-01 A3; V NFR-SEC-02/03 |
| BR-ACC-02 | An authenticated user may perform an operation only when the user's assigned permissions authorize that operation. Authorization must be enforced on the server. | R | BR Semantic constraints; V NFR-SEC-03; UC-01/29 |
| BR-ACC-03 | Permission to perform a staff operation must also be restricted by its resource scope (for example, an assigned activity, organizational unit, or request). A role alone does not grant access to every record. | R | BR `ActivityOrganizer`; UC-14/18/20/28; V NFR-SEC-03/04 |
| BR-ACC-04 | Students may view only their own profiles, registrations, participation histories, scores, and requests, except where an explicitly authorized staff workflow permits access. | E | BR Semantic constraints; V NFR-SEC-04; UC-03/12/23/24/27 |
| BR-ACC-05 | University Administrators may manage user accounts, roles, and permissions; invalid or unauthorized changes must be rejected. | R | BR Semantic constraints; UC-29; V Feature 10 |
| BR-ACC-06 | A change to a user's permissions must be enforced on subsequent protected requests, including when that user has an existing session. | N | UC-29 A10 |
| BR-ACC-07 | Users may change their own phone number, password, and avatar within the supported validation rules. | N | UC-03; V Feature 2 |
| BR-ACC-08 | Full name, student ID, and faculty are read-only in the user's self-service profile; users must not update another person's profile. | N | UC-03 A6 |
| BR-ACC-09 | Passwords must be stored as salted hashes; password changes require valid current-password verification and a new password of at least eight characters. | R | BR `User.password_hash`; V NFR-SEC-02; UC-03 A2/A7 |
| BR-ACC-10 | Profile avatar uploads must be JPG or PNG images not exceeding 5 MB; invalid uploads must not replace the current avatar. | N | UC-03 A3/A8/A9 |

### 2.2 Activity ownership, management, discovery, and following

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-ACT-01 | Activities are managed within an authorized organizational unit; a manager cannot create or modify activities belonging to another unit without authorization. | R | BR `ActivityOrganizer`; UC-18; V NFR-SCA-INT-01 |
| BR-ACT-02 | Each activity must provide valid description, schedule,  associated semester, location (campus and room), category, capacity, registration period, cancellation deadline, waiting list availability, participation requirements (student's year and faculty), specialized topic (A, B, or Neither), and applicable score criteria before publication. | R | BR `Activity`/publish constraint; UC-18; V Feature 5 |
| BR-ACT-03 | An activity's schedule must contain valid time intervals, with each session's start time preceding its end time. | E | BR Explicit constraints; UC-18 |
| BR-ACT-04 | An activity's registration opening time must precede its closing time. | E | BR Explicit constraints; UC-10/18 |
| BR-ACT-05 | An activity must have positive capacity. | E | BR Explicit constraints; UC-10/18 |
| BR-ACT-06 | Activities must follow these valid status transitions: Draft → Published → Ongoing → Completed, with cancellation allowed from Draft, Published, or Ongoing. Completed and Cancelled are terminal states. All other transitions, such as Draft → Ongoing, Published → Completed, or Ongoing → Published, are prohibited.| R | BR `Activity.status`; V NFR-USA-12; UC-18 A7 |
| BR-ACT-07 | Only activities currently visible to the student may appear as available discovery results; hidden, cancelled, or unavailable activities must not be presented as registrable. | N | UC-04 A6; UC-10 A2 |
| BR-ACT-08 | Discovery must support filtering by faculty, date, location (campus), specialized topic (A, B), training-score criteria, and registration status, with current activity details shown to the student. | N | V Feature 3; UC-04 |
| BR-ACT-09 | A student may follow an accessible activity without registering for it; following an activity must not reserve capacity or create a registration. | N | V Feature 3/Workflow 1; UC-05 A6 |
| BR-ACT-10 | A student may unfollow a previously followed activity; the system must not create duplicate active follow relationships. | N | UC-05 A1/A2 |
| BR-ACT-11 | An assigned Activity Manager may publish announcements only for activities within their management scope. | R | BR `ActivityAnnouncement`; UC-19 |
| BR-ACT-12 | Relevant updates and announcements to published activities must trigger notification handling for affected followers and registrants. | N | UC-18 A9; UC-19; UC-17 |
| BR-ACT-13 | When an activity's capacity is reduced below its confirmed participant count, the excess most-recently registered confirmed participants must be moved to the front of the waiting list and notified. | N | UC-18 A8 |
| BR-ACT-14 | Activity Managers must define the schedule of each session and the minimum number of sessions students must attend to qualify for training scores. The total number of sessions is determined by the scheduled sessions, and the minimum required sessions must be between 1 and the total. If the number of sessions changes, the minimum attendance requirement must be revalidated and adjusted if necessary. |  |  |
| BR-ACT-15 | All published activity announcements must be displayed on the corresponding activity's detail page. | N | V Feature 5; UC-19 |
| BR-ACT-16 | An activity may span a maximum of two consecutive semesters, but its training scores must be awarded in only one designated semester. | N | Proposed |

### 2.3 Registration, cancellation, and waiting lists

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-REG-01 | Only an authorized student may submit a registration for an activity that currently allows registration. | E | BR Semantic constraints; UC-10 |
| BR-REG-02 | Registration must be disabled before the permitted registration window opens, after its closing deadline, when required eligibility is not met, the activity has reached full capacity, or when the activity's status is Cancelled. | R | BR Semantic constraints; UC-10 A2/A3 |
| BR-REG-03 | A student must not have more than one active registration or waiting-list entry for the same activity; the storage model may preserve earlier closed attempts. | R | BR registration uniqueness; UC-10 A4; UC-13 A4 |
| BR-REG-05 | A confirmed registration must not be recorded if doing so would exceed the activity's available capacity, including under concurrent requests. | E | BR capacity/serialization constraints; V NFR-SCA-PHY-03; UC-10 A8 |
| BR-REG-07 | Waiting-list entries must be unique for each student and activity and processed in strict first-in, first-out (FIFO) order, without skipping or double promotion. | R | BR waiting-list assumption; V NFR-REL-02; UC-13/14 |
| BR-REG-08 | When a reserved place is released, the system must process applicable waiting-list promotion automatically, revalidating eligibility and preserving strict FIFO among eligible waiting entries. | R | BR serialized promotion; V Workflow 1; UC-11 A7; UC-13 |
| BR-REG-09 | Students register for an activity as a whole rather than individual sessions.|  |  |
| BR-REG-10 | A manager may inspect waiting-list entries but must not bypass FIFO order unless the team approves an explicit override policy. | N | UC-14 A9; V NFR-REL-02 |
| BR-REG-11 | Students may cancel a registration only while cancellation is permitted and only for their own registration. | E | BR cancellation constraints; UC-11 |
| BR-REG-12 | Cancelling a confirmed registration must release its capacity and initiate waiting-list handling without leaving an inconsistent registration or seat count. | R | BR transaction constraints; UC-11; V NFR-REL-01/02 |
| BR-REG-13 | A student may leave a waiting list without affecting confirmed participants or unrelated queue entries. | N | UC-13 A7 |
| BR-REG-14 | Schedule conflicts must produce a warning before registration is finalized; the student may proceed or cancel rather than being automatically rejected. | R | BR schedule-conflict constraint; V Workflow 1; UC-10 A6 |
| BR-REG-15 | Cancellation, capacity changes, and waiting-list promotion must preserve seat counts and queue consistency under concurrent operations. | R | BR serialized updates; V NFR-REL-01/02; UC-10/11/14/18 |
| BR-REG-16 | Students must be able to view their current registration state. | N | UC-12 |
| BR-REG-17 | Confirmed activities appear in the student's personal calendar; waiting-list activities may be shown but must be clearly labelled as unconfirmed. Followed activities may also be displayed. | N | UC-10/15 |
| BR-REG-18 | The waiting list feature is enabled only when the Activity Manager explicitly allows it for an activity. |  |  |
| BR-REG-19 | The default registration cancellation deadline is 72 hours before the activity starts. Activity Managers may configure this deadline, but it must not be later than the activity's start time. If the activity's start time changes, the cancellation deadline must be recalculated accordingly. |  |  |
| BR-REG-20 | A registration can have three statuses: Confirmed, Waitlisted, or Cancelled. Waitlisted registrations become Confirmed when a spot becomes available, while Confirmed registrations may return to Waitlisted when capacity is reduced or become Cancelled when the student cancels. Leaving the waiting list simply removes the entry without creating a Cancelled status. |  |  |

### 2.4 Attendance and verified participation

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-PAR-01 | Only an Activity Manager authorized for an activity may record, import, correct, or confirm attendance and participation for that activity. | R | BR authorization constraints; UC-21 |
| BR-PAR-02 | Attendance records must match a registration and an activity session belonging to the same activity. | E | BR `Attendance` semantic constraint; UC-21 |
| BR-PAR-03 | Before attendance is recorded, the system must display **No information** rather than assuming the student was absent. | N | UC-21 Basic Flow step 2 |
| BR-PAR-04 | Attendance imports must identify matched and unmatched student records, flag invalid/duplicate identifiers, and require manager review before committing changes. | N | UC-21 A3–A7 |
| BR-PAR-05 | Managers may mark a participant as **Attended** or **Absent** manually, subject to authorization and valid activity state. | N | UC-21 A2/A8 |
| BR-PAR-06 | Only verified participation may contribute to training scores; attendance alone must not automatically grant score credit before the applicable verification conditions are satisfied. | E | BR `Participation`/`TrainingScore`; UC-21/22; V Feature 6 |
| BR-PAR-07 | An internal verified-participation record must be associated with a valid confirmed registration for the same student and activity. | R | BR participation constraint; UC-21/22 |
| BR-PAR-08 | A participation correction must update the corresponding attendance/participation state and any affected training-score result consistently, with an audit trail. | N | UC-21 A10; UC-28; V NFR-REL-03/SEC-06 |
| BR-PAR-09 | Students may view their participation history by semester and activity, including the verification status of each record; unverified records must not be described as verified. | N | UC-23 |
| BR-PAR-10 | Attendance is recorded separately for each session, and students must meet the minimum attendance requirement to qualify for training scores.  |  |  |
| BR-PAR-11 | Upon activity completion, the system must automatically generate a list of students who meet the minimum attendance requirement based on their attendance records. Activity Managers must review and verify the list before Participation records are created and training scores are awarded.  |  |  |
| BR-PAR-12 | Activity Managers must complete participation verification and ensure verified Participation records are generated within five days after the activity completed.  |  |  |

### 2.5 Training scores, historical rules, and adjustments

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-SCO-01 | Internal training-score credit may be awarded only for verified participation under a criterion applicable to the relevant activity. | E | BR `TrainingScore` constraints; UC-22 |
| BR-SCO-02 | Recognition-based score credit may be awarded only following approval of the corresponding recognition request. | E | BR `Recognition`/`TrainingScore`; UC-25/28 |
| BR-SCO-03 | Each awarded score must identify its underlying source, relevant semester, and applicable evaluation criterion. | E | BR `TrainingScore`; UC-22/24 |
| BR-SCO-04 | Internal scores must use the activity's relevant semester and applicable activity criterion; recognition scores must use the approved recognition's target semester and criterion. | E | BR `TrainingScore` semantic constraints; UC-24/28 |
| BR-SCO-05 | The same verified participation or approved recognition must not generate duplicate score credit for the same criterion. | E | BR training-score uniqueness constraints; V NFR-REL-03 |
| BR-SCO-06 | A score change must be performed by an authorized Activity Manager or by an authorized manager resolving an applicable appeal. | R | BR score-adjustment authorization; UC-22/28 |
| BR-SCO-07 | Score values and adjustments must comply with the applicable semester's defined criteria, permitted score ranges and limits. | R | BR criterion/max-point constraints; UC-22 A4/A6; UC-30 |
| BR-SCO-08 | A student's displayed training-score total for a semester must reflect verified participation and approved adjustments only; pending or unverified results must not be counted as verified credit. | N | V NFR-REL-03; UC-24 |
| BR-SCO-09 | Approved appeals must be reflected in the appropriate participation/score records and the recalculated totals without granting the same credit twice. | R | BR score/recognition model; UC-22 A8; UC-24 A3; UC-28 |
| BR-SCO-10 | Every score adjustment must preserve its actor, reason, change time, and before/after values in an audit record. | E | BR `ScoreChange`; V NFR-SEC-06; UC-22 |
| BR-SCO-11 | A previously missing score may be created upon an authorized request decision; the system must not require an existing `TrainingScore` record to resolve a missing-score case. | N | UC-26 A1; UC-28 A9; UC-24 A3 |
| BR-SCO-12 | Earlier semesters' scoring policies and historical results must remain valid when scoring criteria are changed for a later semester. | R | BR criterion immutability; V NFR-SCA-INT-05; UC-22 A6; UC-24 A4; UC-30 |
| BR-SCO-13 | Configuration changes must identify their affected/effective semesters and preserve historical scoring rules; weights and score ranges must be supported where the policy defines them. | N | V NFR-MAI-07; UC-30 Basic Flow/A5/A10 |
| BR-SCO-14 | Changes to criteria, weights, or score ranges must be applicable to the selected semesters within one day, while preserving rules for unaffected historical semesters. | N | V NFR-MAI-07; UC-30 |
| BR-SCO-15 | Credit for a prior activity granted through recognition must not duplicate credit already issued to the same student for that same activity and criterion. | E | BR recognition anti-duplication constraint; V NFR-REL-03 |
| BR-SCO-16 | Training-score deductions may only be issued by authorized Student Affairs Office Managers. Each deduction must be associated with a predefined scoring criterion and include the deducted points, reason, and issuing Manager. |  |  |
| BR-SCO-17 | Non-activity training-score awards may only be issued by authorized Student Affairs Office Managers. Each award must be associated with a predefined scoring criterion and include the awarded points, reason, and issuing Manager. |  |  |
| BR-SCO-18 | A student's total training score for each semester must range from 0 to 100 points. Each scoring criterion must have its own maximum score greater than zero, and the total score awarded under that criterion must not exceed its maximum. |  |  |

### 2.6 Recognition requests and appeals

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-REQ-01 | Students may request recognition of qualifying participation in activities held inside or outside the university, supported by evidence. | R | BR `Appeal`/`Recognition`; V Feature 9; UC-25 |
| BR-REQ-02 | A recognition submission must include the activity's description, its internal/external classification, category, and supporting evidence; a proposed scoring criterion may be optional at submission. | N | UC-25 Basic Flow step 3 |
| BR-REQ-03 | Recognition requests must be assigned to an authorized Activity Manager in the Student Affairs Office; if none is available, the request must remain pending assignment. | R | BR reviewer model; V Workflow 2 note; UC-25 A5; UC-28 |
| BR-REQ-04 | Appeals about a specific activity's participation or training score must be assigned to the Activity Manager responsible for that activity; an appeal without an available responsible manager must remain pending assignment. | R | BR reviewer model; V Workflow 2 note; UC-26 A7; UC-28 |
| BR-REQ-05 | A student may appeal an incorrect or missing participation record or training score for an identifiable activity. A missing record must not require a nonexistent record ID. | R | BR `Appeal` FK constraints; UC-26 A1 |
| BR-REQ-06 | Students may submit appeals only within the applicable appeal submission period and only for their own relevant activity/records. | R | BR ownership; UC-26 A3/A5; V NFR-USA-06 |
| BR-REQ-07 | Recognition requests and appeals must have valid supporting evidence. Uploaded evidence must be PDF, JPG, or PNG and respect the specified 10 MB limit. | R | BR `AppealEvidence`; V NFR-SEC-07; UC-25/26 |
| BR-REQ-08 | Evidence must be accessible only to the submitting student and staff specifically authorized to handle the request. | N | V NFR-SEC-07; UC-27/28 |
| BR-REQ-09 | The request lifecycle must support **Pending Assignment**, **Pending Review**, **Under Review**, **Additional Information Required**, **Approved**, **Rejected**, and **Withdrawn**. | R | BR `Appeal.status`; UC-27 A2; UC-28 |
| BR-REQ-10 | Students may view the status, evidence, and staff responses for their own requests; they may edit or withdraw an unresolved request, with recorded change history. | N | UC-27 A7/A9; UC-25/26 postconditions |
| BR-REQ-11 | Students must not edit or withdraw requests that are Approved, Rejected, or Withdrawn. | N | UC-27 A10 |
| BR-REQ-12 | When a manager requests additional information, the student must be able to update and resubmit the existing request rather than needing a new request. | N | UC-27 A8; UC-28 alternative information flow |
| BR-REQ-13 | Only the manager assigned to and authorized for a request may review evidence and approve or reject it. | R | BR appeal-review permission; V Workflow 2 note; UC-28 A2/A8 |
| BR-REQ-14 | A manager must not approve a request when evidence, references, scoring rules, assignment, or permission validation fails. | N | UC-28 A6–A8 |
| BR-REQ-15 | Approved recognition requests must create the appropriate verified recognition and score result; approved corrections must create or update the appropriate participation/score records. Rejected requests must not add score credit. | R | BR `Recognition`/`ScoreChange`; UC-28 Basic Flow/A4 |
| BR-REQ-16 | A final request decision must record the reviewer, decision, time, and response/reason where required, with an audit history of changes. | R | BR resolved-appeal constraints; V NFR-SEC-06; UC-27/28 |
| BR-REQ-17 | Finalizing a request and applying all associated participation, recognition, score, and required audit changes must succeed or fail together. A request must never be Approved while its mandatory score/record updates are incomplete. | N | UC-28 A9; V NFR-REL-01/03 |
| BR-REQ-18 | A potentially duplicate recognition request may be accepted for review, but an identified duplicate must be rejected rather than granting duplicate credit. | N | UC-25 A4; V NFR-REL-03 |
| BR-REQ-19 | An approved recognition must be credited to the student who submitted the underlying recognition request, not to another student. | E | BR `Recognition` identity constraint; UC-25/28; V NFR-SEC-04 |
| BR-REQ-19 | An appeal submission must identify the related activity and the disputed participation record or training score (if available), issue's description, and include supporting evidence. |  |  |

### 2.7 Notifications and external services

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-NOT-01 | Students with Confirmed registrations must receive notifications about upcoming activities (3 days before the start time), activity changes, cancellation deadlines, and activity announcements. | R | BR `Notification`; V Feature 8; V Feature 8; UC-17/19 |
| BR-NOT-02 | Notification recipients must be selected using the relevant follow, registration, waiting-list, or request relationship; unrelated students must not receive private updates. | N | UC-17 A1/A2; V NFR-SEC-04 |
| BR-NOT-03 | Students and managers must be able to read in-app notifications and have their read/unread state maintained. | R | BR `Notification`; UC-17 Basic Flow |
| BR-NOT-04 | When an applicable notification is sent by email, delivery must be handled through an external email service in addition to the in-app notification. | N | V NFR-COM-05; UC-17 |
| BR-NOT-05 | Email delivery failure must not roll back a completed registration, request decision, or other successful business transaction; failed deliveries must be retried or reported separately. | N | V NFR-REL-04; UC-10 A10; UC-17 A3; UC-28 A10 |
| BR-NOT-06 | The University Services Hub must expose configured external university links, not synchronize student records or transactions with those platforms. | E | BR `ServiceLink`/working assumptions; V §4.1/Feature 11; UC-07 |
| BR-NOT-07 | The AI Student Assistant may use only information that the requesting student is authorized to access; its responses and recommendations must not change registrations, participation records, or scores. | R | BR AI working assumption; V NFR-SEC-10; UC-06 |
| BR-NOT-08 | Students on the Waiting List must receive notifications about waiting-list promotions. | R | V Feature 8; UC-13/17/19 |
| BR-NOT-09 | Activity Managers must receive notifications when recognition requests or appeals are assigned to them. | N | UC-25/26/28 |
| BR-NOT-10 | Activity Managers must receive notifications when assigned requests are updated, resubmitted, or withdrawn by students. | N | UC-27/28 |
| BR-NOT-11 | Activity Managers must receive reminders about pending participation verification before the five-day deadline following activity completion. | N | Proposed Participation Record Deadline |
| BR-NOT-12 | Students must receive notifications when their recognition requests or appeals are submitted, approved, rejected, or require additional information. | N | UC-25/26/27/28 |
| BR-NOT-13 | If an Activity Manager fails to complete participation verification within five days after an activity ends, the system must mark the verification as overdue and notify the responsible manager. |  |  |
### 2.8 Administration, data exchange, reports, and record integrity

| ID | Business rule | Origin | Source |
| --- | --- | --- | --- |
| BR-ADM-01 | Only authorized administrators may configure system-wide settings, including training-score criteria, scoring policies, activity categories, academic information, organizations, roles and permissions, and university service links. (see appendix for more information) | E | BR administrative constraints; UC-30; V Feature 10 |
| BR-ADM-02 | Criteria/category changes must be validated against active records and historical results; changes that would overwrite historical scoring rules or delete categories used by activities must be rejected. | N | UC-30 A5/A6 |
| BR-ADM-03 | Administrative role/permission and configuration changes must be recorded with who changed what, when, and before/after values. | N | V NFR-SEC-06; UC-29/30 |
| BR-ADM-04 | CSV/XLSX imports for supported student/account, activity, attendance, and configuration workflows must validate input and report rejected or unmatched rows with reasons; invalid rows must not silently corrupt stored records. | N | V NFR-COM-04; UC-18/21/29/30 |
| BR-ADM-05 | Activity Managers may view activity/department reports only within their authorized scope; University Administrators may view authorized system-wide activity, registration, and score statistics. | R | BR actor permissions; UC-20/31 |
| BR-ADM-06 | Students must be able to export eligible personal calendar entries as an `.ics` file; this does not modify external calendar systems. | N | V NFR-COM-03; UC-16 |
| BR-ADM-07 | Supported activity/participation reports must be exportable as PDF documents. | N | V NFR-COM-02; UC-20/21 |
| BR-ADM-08 | Historical registration, attendance, participation, training-score, request, and score-change records must not be lost through unintended deletion of related records. | E | BR Explicit constraints; V NFR-SCA-PHY-04 |
| BR-ADM-09 | Every score adjustment, request decision, and system-setting modification must have an audit record protected from modification by ordinary users. | R | BR `ScoreChange`; V NFR-SEC-06 |
| BR-ADM-10 | All registration, cancellation, and request-resolution operations must preserve consistency: an operation either commits all required related records or none of them. | R | BR transactional constraints; V NFR-REL-01; UC-11/28 |
| BR-ADM-11 | Administrators must assign Student Affairs Office Managers to specific faculties. Each Manager may be responsible for one or more faculties. Activity recognition requests must be assigned to an authorized Manager responsible for the submitting student's faculty. If no eligible Manager is available, the request remains Pending Assignment. |  |  |
| BR-ADM-12 | A user may have multiple roles, including Student, Activity Manager, and University Administrator. Each role must be assigned independently by an authorized Administrator and grant only its associated permissions. |  |  |

## Appendix 
### System Administration Configuration
| Configuration | Description | Reference |
|---|---|---|
| **Training-Score Criteria** | Manage evaluation criteria, maximum scores, weights, and score ranges where applicable. | UC-30; Vision Feature 10 |
| **Scoring Policies** | Manage scoring rule versions and their applicable semesters while preserving historical scoring rules. | UC-30; NFR-SCA-INT-05 |
| **Activity Categories** | Manage the categories used to classify extracurricular activities. | UC-30 |
| **Academic Information** | Manage faculties, semesters, and academic years. | Business Requirements v1.2.0 |
| **Organizations** | Manage clubs, faculties, departments, and other activity-organizing units. | Business Requirements v1.2.0 |
| **Roles & Permissions** | Manage user roles, access permissions, and role assignments. | UC-29 |
| **University Service Links** | Manage external links to university services such as Moodle, Student Portal, and the university library. | Vision Feature 11 |
| **Specialized Topics** | Manage specialized topic classifications, such as Topic A and Topic B. | Proposed |
| **System-wide Policies** | Configure default policies, such as registration cancellation deadlines, participation verification deadlines, and notification schedules. | Proposed |
