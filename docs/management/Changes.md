# Changes

## B. Detailed Vision Document – 2nd Submission
**Worker:** Phạm Vân Trang 
**Reviewer:** Trần Tôn Minh Kỳ
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


