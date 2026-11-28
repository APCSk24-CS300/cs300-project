# Changes document
**Worker:** Phạm Vân Trang 
**Reviewer:** Trần Tôn Minh Kỳ
## A. Detailed Project Plan Changes – 2nd Submission
Nothing changed.
## B. Detailed Vision Document Changes – 2nd Submission
### Changes Made

#### 1. Role and terminology alignment (Section 3 and throughout the document)
- Replaced the **Activity Organizer / Organizer** role with **Activity Manager / Manager** throughout the Vision Document to align the terminology used across the system.
- Expanded the **Activity Manager** responsibilities to include handling student activity-recognition requests and training-score/participation appeals.
- Refined the **University Administrator** responsibilities to focus on user roles and permissions, system-wide configuration, training-score criteria, reporting, and system oversight.

#### 2. Product feature updates (Section 5)
- Expanded **Activity Discovery** to allow students to follow activities without registering so that they can receive updates and revisit them later.
- Expanded **Activity Registration Management** to include waiting-list participation when an activity is full.
- Updated **Notification Management** to include notifications for waiting-list promotions.
- Refined **System Administration** to include role assignment, access-permission management, activity-category configuration, training-score criteria configuration, and reporting on activity organization and registration trends.

#### 3. Key user workflow revisions (Section 5)
- Updated the Markdown heading hierarchy for the **Key User Workflows** section and its workflows to make the expanded workflow structure clearer and easier to navigate.
- Reorganized **Workflow 1: Activity Discovery and Registration** into four detailed sub-workflows:
  - **1.1 Activity Discovery and Following**
  - **1.2 Activity Registration**
  - **1.3 Waiting List Enrollment**
  - **1.4 Registration Cancellation and Waiting List Resolution**
- Added the ability for students to browse activities without first searching or filtering and to follow an activity before registration.
- Added explicit checks for registration conditions, schedule conflicts, and activity capacity.
- Added the option for students to continue registration after a schedule-conflict warning.
- Added pending-approval handling with temporary seat reservation when manager approval is required.
- Added FIFO waiting-list enrollment and waiting-list status notifications.
- Added waiting-list resolution when a registered student cancels, including eligibility rechecking, manager approval when required, seat release, promotion, and notification.
- Added handling for closing a waiting list and notifying students whose waiting-list entries remain unresolved.
- Expanded **Workflow 2: Activity Recognition and Score Appeal** to distinguish:
  - activity-recognition requests handled by authorized Managers in the Student Affairs Office; and
  - record/score appeals handled by the Manager responsible for the related activity.
- Added review outcomes for **Approve**, **Reject**, and **Request Additional Information**.
- Added flows for students to provide additional evidence, resubmit the same request, or withdraw it.
- Added clarification on how recognition requests and activity-specific appeals are assigned to managers.

#### 4. Non-functional requirement updates (Section 6)
- Updated role references in scalability, security, and usability requirements from **Organizer** to **Manager**.
- Added **NFR-COM-06**, requiring support for JPG and PNG image uploads with a maximum size of 5 MB per image unless a stricter feature-specific limit applies, and requiring invalid formats or oversized files to be rejected with an appropriate error message.
## C. Detailed Vision Document Changes – 3rd Submission
### Changes Made
#### 1. Business rule alignment and feature updates (Section 5)
- Updated **Activity Registration Management** to support automatic registration confirmation, configurable cancellation deadlines, and revised waiting-list handling.
- Expanded **Activity Management** to support multiple sessions, session-specific schedules and capacities, participation requirements, and semester assignments.
- Refined **Participation and Training-Score Management** to include session-based attendance, participation verification before awarding scores, and non-activity score awards and deductions.
- Updated **Requests System** to clarify request assignment, evidence requirements, and review responsibilities.
- Expanded **System Administration** to support academic information, organizations, scoring policies, and other system-wide configurations.
- Added **Homepage and Overview** to provide role-based summaries, pending tasks, and quick access to relevant features.
- Revised the key user workflows to align with the updated registration, waiting-list, and participation rules.
  
## D. Use-Case Document Changes – 2nd Submission
### Changes Made
#### 1. Use-case model and specification updates
- Updated existing use cases to align with the revised business rules, particularly registration, waiting lists, activity management, participation verification, and training-score management.
- Removed Manager approval and rejection flows from activity registration.
- Refined use-case flows and alternative scenarios to reflect updated validation, authorization, and status-transition rules.
- Added **UC-32 – View Personalized Homepage** to support role-based dashboards for Students, Activity Managers, and University Administrators.
- Added **UC-33 – Manage Non-Activity Training Scores** to support authorized non-activity score awards and deductions.
- Updated use-case diagrams, catalogs, and traceability mappings to reflect the new functionality.
