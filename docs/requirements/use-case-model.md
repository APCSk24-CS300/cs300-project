# myHCMUS — Use-Case Model 

Workers: Phạm Vân Trang
Reviewers: Nguyễn Khang Thịnh

## 1. Modeling Principles

This model captures **externally observable goals** of the actors rather than individual interface commands, processing steps, or the chronological workflow of the application. The system boundary contains only myHCMUS use cases; all human and external-service actors are outside it. The revised diagrams preserve all 12 feature groups in the Vision Document, with several behavior-oriented details grouped into higher-level use cases.

- **Association:** A solid line means that an external actor participates in a use case.
- **Actor generalization:** A specialized actor inherits the shared interactions of the general User actor.
- **`extend`:** An optional, conditional goal inserted at an explicit extension point. The arrow points **from the extending use case to the base use case**.
- **`include`:** Used only for reusable mandatory goal-level behavior. None is required in the current model; we deliberately do not invent `include` links for form entry, verification, login preconditions, or sequential processing steps.

## 2. Actors

| Actor | Role and scope |
|---|---|
| **User** (abstract/general) | Common account, help, language, and services-hub interactions; specialized by the three account roles below. |
| **Student** | Discovers/registers for activities, manages calendar and notifications, monitors scores, and submits requests. |
| **Activity Manager** | Manages activities, registration lists, attendance, participation results, student recognition and appeal requests, and related reports. |
| **University Administrator** | Manages permissions, configuration, and system reports. |
| **External Email Service** | Secondary, non-human actor participating in the email-delivery channel; email is required in NFR-COM-05. |

**Boundary:** myHCMUS is independent of official HCMUS databases. Moodle, Student Portal, and other linked university services are *navigation destinations*, not integrated supporting actors; they are therefore not shown as actors.

## 3. Use-Case Diagrams


### 3.1. Account, Activity Discovery, and Student Services

Shared account functions and student-facing activity discovery, university-service access, and AI assistance. Profile edits, search filters, and opening a linked service are steps or options within broader actor goals, not separate use cases.

```mermaid
usecase-beta
direction LR
actor User("User") <<abstract>>
actor Student("Student")
actor Manager("Activity Manager")
actor Admin("University Administrator")
systemBoundary "myHCMUS — Account, Activity Discovery, and Student Services"
  UC01("UC-01: Log in")
  UC02("UC-02: Log out")
  UC03("UC-03: Manage own profile")
  UC04("UC-04: Discover activities")
  UC05("UC-05: Follow an activity")
  UC06("UC-06: Chat with AI Student Assistant")
  UC07("UC-07: Access university services")
  UC08("UC-08: Change interface language")
  UC09("UC-09: View help and FAQ")
end
User -- UC01
User -- UC02
User -- UC03
User -- UC07
User -- UC08
User -- UC09
Student -- UC04
Student -- UC05
Student -- UC06
Student --|> User
Manager --|> User
Admin --|> User
```

The general actor **User** captures shared capabilities. Student, Activity Manager, and University Administrator specialize it. The student ID and faculty in Manage Own Profile are read-only, as specified in the Vision Document.

### 3.2. Activity Registration, Calendar, and Notifications

Student registration and scheduling goals, organizer management of registration requests, and the notification service. Validation, duplicate/capacity checks, conflict warnings, and waiting-list promotion are behavior within the corresponding use cases rather than independent goals.

```mermaid
usecase-beta
direction LR
actor Student("Student")
actor Manager("Activity Manager")
actor Email("External Email Service")
systemBoundary "myHCMUS — Activity Registration, Calendar, and Notifications"
  UC10("UC-10: Register for an activity")
  UC11("UC-11: Cancel a registration")
  UC12("UC-12: Track registration status")
  UC13("UC-13: Join an activity waiting list")
  UC14("UC-14: Manage activity registrations")
  UC15("UC-15: View personal activity calendar")
  UC16("UC-16: Export activity calendar")
  UC17("UC-17: Receive activity notifications")
end
Student -- UC10
Student -- UC11
Student -- UC12
Student -- UC13
Student -- UC15
Student -- UC16
Student -- UC17
Manager -- UC14
Email -- UC17
UC13 ..> : extend UC10
UC16 ..> : extend UC15
```

**UC-13** extends registration only when an eligible student faces a full activity and the team supports waiting lists. **UC-16** extends viewing the calendar when a student chooses to export it. 
Email Service is a *secondary, external actor* providing an email delivery channel for UC-17, not a component inside myHCMUS.

### 3.3. Activity, Attendance, and Training-Score Management

Activity Manager and Student goals relating to extracurricular activities, participation verification, and training-score records. Create/edit/publish/change status are combined under Manage Activities; verify, submit, update, and import/export participation results fall under Manage Participation Records.

```mermaid
usecase-beta
direction LR
actor Student("Student")
actor Manager("Activity Manager")
systemBoundary "myHCMUS — Activity, Attendance, and Training-Score Management"
  UC18("UC-18: Manage activities")
  UC19("UC-19: Publish activity announcements")
  UC20("UC-20: View activity statistics and reports")
  UC21("UC-21: Record activity attendance")
  UC22("UC-22: Manage participation records")
  UC23("UC-23: Manage training-score results")
  UC24("UC-24: View participation history")
  UC25("UC-25: View training scores")
end
Student -- UC24
Student -- UC25
Manager -- UC18
Manager -- UC19
Manager -- UC20
Manager -- UC21
Manager -- UC22
Manager -- UC23
```

Managing training scores must honor the authorization and verification rules described in the Vision Document.

### 3.4. Activity Recognition, Appeals, and Administration

Student recognition and appeal goals, authorized review of submitted requests, and administrative goals. Evidence checking and approval/rejection are internal steps and alternative outcomes of reviewing a request.

```mermaid
usecase-beta
direction LR
actor Student("Student")
actor Manager("Activity Manager")
actor Admin("University Administrator")
systemBoundary "myHCMUS — Activity Recognition, Appeals, and Administration"
  UC26("UC-26: Submit activity recognition request")
  UC27("UC-27: Appeal participation record or score")
  UC28("UC-28: Track submitted requests")
  UC29("UC-29: Review and resolve requests")
  UC30("UC-30: Manage users and permissions")
  UC31("UC-31: Configure criteria and categories")
  UC32("UC-32: View system reports")
end
Student -- UC26
Student -- UC27
Student -- UC28
Manager -- UC29
Admin -- UC30
Admin -- UC31
Admin -- UC32
```


## 4. Revised Use-Case Catalog and Traceability

| New ID | Use case | Vision coverage | Primary actor / note |
|---|---|---|---|
| UC-01 | Log in | Authentication | All users |
| UC-02 | Log out | Authentication | All users |
| UC-03 | Manage own profile | Profile Management | All users; student-only read-only academic information |
| UC-04 | Discover activities | Activity Discovery | Student |
| UC-05 | Follow an activity | Notification Management | Student; provisional |
| UC-06 | Chat with AI Student Assistant | AI Student Assistant | Student |
| UC-07 | Access university services | University Services Hub | All users |
| UC-08 | Change interface language | NFR-LOC-01 | All users|
| UC-09 | View help and FAQ | NFR-USA-08 | All users; secondary requirement |
| UC-10 | Register for an activity | Activity Registration Management | Student |
| UC-11 | Cancel a registration | Activity Registration Management | Student |
| UC-12 | Track registration status | Activity Registration Management| Student |
| UC-13 | Join an activity waiting list | NFR-REL-02 | Student |
| UC-14 | Manage activity registrations | Activity Registration Management| Activity Manager |
| UC-15 | View personal activity calendar | Calendar Management | Student |
| UC-16 | Export activity calendar | NFR-COM-03 | Student |
| UC-17 | Receive activity notifications | Notification Management / NFR-COM-05 | Student; external email channel |
| UC-18 | Manage activities | Activity Management / NFR-COM-04 | Activity Manager |
| UC-19 | Publish activity announcements | Activity Management | Activity Manager |
| UC-20 | View activity statistics and reports | Activity Management | Activity Manager |
| UC-21 | Record activity attendance | Participation and Training-Score Management | Activity Manager |
| UC-22 | Manage participation records | Participation and Training-Score Management | Activity Manager |
| UC-23 | Manage training-score results | Participation and Training-Score Management | Activity Manager |
| UC-24 | View participation history | Participation and Training-Score Management | Student |
| UC-25 | View training scores | Participation and Training-Score Management | Student |
| UC-26 | Submit activity recognition request | Requests System | Student |
| UC-27 | Appeal participation record or score | Requests System | Student |
| UC-28 | Track submitted requests | Requests System | Student |
| UC-29 | Review and resolve requests | Requests System | Activity Manager |
| UC-30 | Manage users and permissions | System Administration / NFR-COM-04 | University Administrator |
| UC-31 | Configure criteria and categories | System Administration / NFR-SCA-INT-04 | University Administrator |
| UC-32 | View system reports | System Administration | University Administrator |

### Coverage of the 12 feature groups

| Vision feature | Use cases |
|---|---|
| 1. Authentication | UC-01, UC-02 |
| 2. Profile Management | UC-03 |
| 3. Activity Discovery | UC-04, UC-05 |
| 4. Activity Registration Management | UC-10–UC-14 |
| 5. Activity Management | UC-18–UC-20 |
| 6. Participation and Training-Score Management | UC-21–UC-25 |
| 7. Calendar Management | UC-15, UC-16 |
| 8. Notification Management | UC-17 |
| 9. Requests System | UC-26–UC-29 |
| 10. System Administration | UC-30–UC-32 |
| 11. University Services Hub | UC-08 |
| 12. AI Student Assistant | UC-06 |

## 5. Extension Points and Relation Rationale

| Relation | Extension point / condition | Reason |
|---|---|---|
| UC-14 `extend` UC-10 | During registration, when the selected activity has no remaining capacity and a waiting list is enabled. | Joining a waiting list is optional, not a mandatory step of every registration. |
| UC-17 `extend` UC-16 | While viewing the calendar, when the student requests an `.ics` export. | Export is an optional student goal available in the calendar context. |
| Student, Activity Manager, University Administrator `generalize` User | Shared account functionality. | The three roles can access common functions without repeating every association. |

There is **no** `include` relationship in this version. Checking capacity, verifying evidence, approving/rejecting a request, and updating state are normal basic/alternative-flow behavior; they are not independent reusable actor goals merely because the system executes them. For example, Approve Request and Reject Request are alternative outcomes within UC-29 Review and Resolve Requests and must not both be modeled as mandatory included use cases.

**Rendering:** Mermaid native use-case syntax requires Mermaid 12.0.0 or newer and is still in beta. Use a renderer with `usecase-beta` support.
