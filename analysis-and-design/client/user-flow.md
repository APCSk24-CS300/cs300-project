---
purpose: To document the navigation flows and user interactions in myHCMUS system.
scope: Cover the navigation flows of public pages and authenticated pages, including the role-based navigations for different roles.
target users: University students and staff at VNU-HCMUS.
user's role: Student, Organizer and Administrator
---

# 1. Global Navigation Flow

## 1.1 Entry Point

Users can access myHCMUS via website url

- Unauthenticated users are directed at the [Landing Page](./pages/common.md#landing-page)
- Authenticated users are directed to role-based Dashboard ([Student Dashboard](./pages/student.md#dashboard), [Organizer Dashboard](./pages/organizer.md#dashboard), [Admin Dashboard](./pages/admin.md#dashboard))
- Users logging out their account are linked back to [Landing Page](./pages/common.md#landing-page)

## 1.2 Public Navigation

Unauthenticated users can access the following pages:

- **[Landing Page](./pages/common.md#landing-page)**: The first sight of myHCMUS, including the introduction, key highlights.
- **[Login Page](./pages/common.md#login-page)**: Allow users to authenticate.
- **[Forgot Password](./pages/common.md#forgot-password)** (OPTIONAL): Users request password recovery.
- **[Help/Guide Page](./pages/common.md#help--guide)**: Instructions and most frequent questions.

## 1.3 Authentication Navigation

1. Users open [Login Page](./pages/common.md#login-page).
2. Users enter account credentials
3. (OPTIONAL) If they forgot their password then re-direct to [Forgot Password](./pages/common.md#forgot-password).
4. System validates the creadentials
5. If authentication succeeds, system identifies the user's role.
6. If authentication fails, reset the credentials and display the error message.

## 1.4 Role-Based Direction

After the authentication succeeds and identifies the user's role, redirect to the specific Dashboard for their assigned role.

- **Student**: [Student Dashboard](./pages/student.md#dashboard).
- **Organizer**: [Organizer Dashboard](./pages/organizer.md#dashboard).
- **Administrator**: [Admin Dashboard](./pages/admin.md#dashboard).

## 1.5 Authentication Navigation

Authenticated users can access with role-based pages on the sidebar navigation:

- **Student**: [Dashboard](./pages/student.md#dashboard), [Activities](./pages/student.md#activities), [DRS Management](./pages/student.md#drs-management), [My Registrations](./pages/student.md#my-registrations), [Calendar](./pages/student.md#calendar), [AI Student Assistant](./pages/student.md#ai-student-assistant), [University Services](./pages/student.md#university-services), [Profile](./pages/common.md#profile).
- **Organizer**: [Activity Management](./pages/organizer.md#activity-management), [Registration Management](./pages/organizer.md#registration-management), [Attendance and Results](./pages/organizer.md#attendance-and-results), [Appeals](./pages/organizer.md#appeals), [Reports](./pages/organizer.md#reports), [Profile](./pages/common.md#profile).
- **Administrator**: [User Management](./pages/admin.md#user-management), [Activity Categories](./pages/admin.md#activity-categories), [System Configuration](./pages/admin.md#system-configuration), [Reports and Analytics](./pages/admin.md#reports-and-analytics), and [Audit Logs](./pages/admin.md#audit-logs).

## 1.6 Global Flow Overview

```mermaid
flowchart TD
    openWebsite[Open myHCMUS Website] --> authenticated{Authenticated?}

    subgraph publicPages["Public Pages"]
        landingPage[Landing Page]
        loginPage[Login Page]
        helpGuide[Help / Guide]
        forgotPassword[Forgot Password]
        resetPassword[Reset Password]
    end

    subgraph authenticatedPages["Authenticated Pages"]
        studentDashboard[Student Dashboard]
        organizerDashboard[Organizer Dashboard]
        adminDashboard[Admin Dashboard]
        roleNavigation[Role-specific Navigations]
    end

    authenticated -->|No| landingPage

    landingPage --> loginPage
    landingPage --> helpGuide
    landingPage --> forgotPassword

    forgotPassword --> resetPassword
    resetPassword --> loginPage

    loginPage --> credentialsValid{Credentials Valid?}
    credentialsValid -->|No| displayError[Display Error]
    displayError --> loginPage
    credentialsValid -->|Yes| userRole{User Role}

    authenticated -->|Yes| userRole

    userRole -->|Student| studentDashboard
    userRole -->|Organizer| organizerDashboard
    userRole -->|Administrator| adminDashboard

    studentDashboard --> roleNavigation
    organizerDashboard --> roleNavigation
    adminDashboard --> roleNavigation

    roleNavigation --> logout[Logout]
    logout --> landingPage
```


# 2. Public User Flow

## 2.1 Landing Page Flow

**Page Description:** [Landing Page](./pages/common.md#landing-page)

**Actor:** Guest (Unauthenticated users)

### Main Flow

```mermaid
flowchart TD
    openWebsite[Open myHCMUS Website] --> landingPage[Landing Page]

    landingPage --> featuredActivity[Featured Activity]
    landingPage --> helpGuide[Help / Guide Page]
    landingPage --> loginPage[Login Page]
    landingPage --> universityServices[University Services]

    featuredActivity --> activityDetails[Activity Details]
    universityServices --> externalUniversityServices[External University Services]
```

1. User opens the myHCMUS website.
2. System displays the [Landing Page](./pages/common.md#landing-page).
3. User can:
   - Navigate to the featured activity details.
   - Navigate to the [Help /Guide Page](./pages/common.md#help--guide).
   - Navigate to the  [Login Page](./pages/common.md#login-page).
   - Access available university services.

### Exit Points
- [Login Page](./pages/common.md#login-page)
- [Help / Guide Page](./pages/common.md#help--guide)
- Activity Details
- External University Services

## 2.2 Login Page Flow

**Page Description**: [Login Page](./pages/common.md#login-page)

**Actor:** Guest (Unauthenticated users)

### Main Flow
```mermaid
flowchart TD
    loginPage[Login Page] --> enterCredentials[Enter Credentials]
    
    enterCredentials --> submitLogin[Submit Login]
    submitLogin --> credentialsValid{Credentials Valid?}

    credentialsValid -->|Yes| userRole{User Role}
    credentialsValid -->|No| displayError[Display Error]
    displayError --> enterCredentials

    userRole -->|Student| studentDashboard[Student Dashboard]
    userRole -->|Organizer| organizerDashboard[Organizer Dashboard]
    userRole -->|Administrator| adminDashboard[Admin Dashboard]

    loginPage --> forgotPassword[Forgot Password]
    forgotPassword --> forgotPasswordPage[Forgot Password Page]
    loginPage --> landingPage[Landing Page]
```

1. User opens the [Login Page](./pages/common.md#login-page).
2. User enters account credentials.
3. User submits the login form.
4. System validates the credentials.
5. If authentication succeeds, system identifies the user's role.
6. System redirects the user to the corresponding Dashboard.
7. If authentication fails, system displays an error message and allows the user to retry.
8. User can navigate to the [Forgot Password Page](./pages/common.md#forgot-password).
9. User can back to the [Landing Page](./pages/common.md#landing-page).

### Exit Points
- [Student Dashboard](./pages/student.md#dashboard)
- [Organizer Dashboard](./pages/organizer.md#dashboard)
- [Admin Dashboard](./pages/admin.md#dashboard)
- [Forgot Password](./pages/common.md#forgot-password)
- [Landing Page](./pages/common.md#landing-page)


## 2.3 Forgot Password Flow

## 2.4 Reset Password Flow

## 2.5 Help / Guide Flow

**Page Description:** [Help / Guide](./pages/common.md#help--guide)

**Actor:** Guest (Unauthenticated users)

### Main Flow
```mermaid
flowchart TD
    helpGuidePage[Help / Guide Page] --> browseGuide[Browse Guide]
    browseGuide --> selectTopic[Select Topic]
    selectTopic --> viewGuideFAQ[View Guide / FAQ]

    helpGuidePage --> loginPage[Login Page]
    helpGuidePage --> landingPage[Landing Page]
```
1. User opens the [Help / Guide Page](./pages/common.md#help--guide).
2. System displays available guides and frequently asked questions.
3. User selects a topic.
4. System displays the corresponding guide or FAQ.
5. User can navigate to the [Login Page](./pages/common.md#login-page).
6. User can return to the [Landing Page](./pages/common.md#landing-page).

### Exit Point
- [Landing Page](./pages/common.md#landing-page)
- [Login Page](./pages/common.md#login-page)

## 2.6 Public User Flow Overview

```mermaid
flowchart TD
    landingPage[Landing Page]

    landingPage --> loginPage[Login Page]
    landingPage --> helpGuidePage[Help / Guide Page]
    landingPage --> featuredActivity[Featured Activity]
    landingPage --> externalUniversityServices[External University Services]

    featuredActivity --> activityDetails[Activity Details]

    loginPage --> credentialsValid{Credentials Valid?}
    credentialsValid -->|No| loginPage
    credentialsValid -->|Yes| userRole{User Role}

    loginPage --> forgotPassword[Forgot Password]
    forgotPassword --> resetPassword[Reset Password]
    resetPassword --> loginPage

    userRole -->|Student| studentDashboard[Student Dashboard]
    userRole -->|Organizer| organizerDashboard[Organizer Dashboard]
    userRole -->|Administrator| adminDashboard[Admin Dashboard]

    helpGuidePage --> landingPage
    helpGuidePage --> loginPage
```

# 3. Authenticated User Flow

## 3.1 Student Flow

### 3.1.1 Student Dashboard

**Page Description:** [Student Dashboard](./pages/student.md#student-dashboard)

**Actor:** Student

#### Main Flow
```mermaid
flowchart TD
    dashboard[Student Dashboard] --> viewOverview[View Dashboard Overview]
    viewOverview --> upcomingActivities[View Upcoming Activities]
    viewOverview --> registrationSummary[View Registration Summary]
    viewOverview --> drsSummary[View DRS Summary]
    viewOverview --> notifications[View Recent Notifications]

    upcomingActivities --> activityDetails[Activity Details]
    registrationSummary --> myRegistrations[My Registrations]
    drsSummary --> drsManagement[DRS Management]
    notifications --> notificationDetails[Notification Details]

    dashboard --> activities[Activities]
    dashboard --> calendar[Calendar]
    dashboard --> assistant[AI Student Assistant]
```

1. User opens the [Student Dashboard](./pages/student.md#student-dashboard).
2. System displays an overview of the student's current activities and information.
3. User can view upcoming activities, registration summary, DRS summary, and recent notifications.
4. User can navigate from an upcoming activity to its [Activity Details](./pages/student.md#activity-details).
5. User can navigate from the registration summary to [My Registrations](./pages/student.md#my-registrations).
6. User can navigate from the DRS summary to [DRS Management](./pages/student.md#drs-management).
7. User can select a notification to view its details.
8. User can navigate directly to [Activities](./pages/student.md#activities), [Calendar](./pages/student.md#calendar), or [AI Student Assistant](./pages/student.md#ai-student-assistant).

#### Exit Points
- [Activity Details](./pages/student.md#activity-details)
- [Activities](./pages/student.md#activities)
- [My Registrations](./pages/student.md#my-registrations)
- [DRS Management](./pages/student.md#drs-management)
- [Calendar](./pages/student.md#calendar)
- [AI Student Assistant](./pages/student.md#ai-student-assistant)
- [Notification Details](./pages/student.md#notification-details)


### 3.1.2 Activities

**Page Description:** [Activities](./pages/student.md#activities)

**Actor:** Student

#### Main Flow

```mermaid
flowchart TD
    activities[Activities Page] --> browseActivities[Browse Activities]
    browseActivities --> filterActivities[Search and Filter Activities]
    filterActivities --> selectActivity[Select Activity]
    selectActivity --> activityDetails[Activity Details]

    activityDetails --> checkEligibility{Eligible to Register?}
    checkEligibility -->|Yes| checkAvailability{Registration Available?}
    checkAvailability -->|Yes| registerActivity[Submit Registration]
    registerActivity --> registrationSuccess[Registration Successful]
    registrationSuccess --> myRegistrations[My Registrations]

    checkEligibility -->|No| eligibilityError[Display Eligibility Message]
    checkAvailability -->|No| availabilityError[Display Registration Unavailable Message]

    eligibilityError --> activityDetails
    availabilityError --> activityDetails

    activities --> myRegistrations
```

1. User opens the [Activities](./pages/student.md#activities) page.
2. System displays available activities.
3. User browses activities or searches and filters activities based on available criteria.
4. User selects an activity to view its [Activity Details](./pages/student.md#activity-details).
5. System checks whether the student is eligible to register for the activity.
6. If the student is not eligible, the system displays the eligibility requirements or an appropriate message.
7. If the student is eligible, the system checks whether registration is currently available.
8. If registration is unavailable, the system displays an appropriate message.
9. If registration is available, the student can submit a registration request.
10. System processes the registration and displays the registration result.
11. After a successful registration, the student can navigate to [My Registrations](./pages/student.md#my-registrations).

#### Exit Points
- [Activity Details](./pages/student.md#activity-details)
- [My Registrations](./pages/student.md#my-registrations)
- [Student Dashboard](./pages/student.md#student-dashboard)

### 3.1.3 My Registrations
```mermaid
flowchart TD
    myRegistrations[My Registrations] --> viewRegistrations[View Registered Activities]
    viewRegistrations --> selectRegistration[Select a Registration]
    selectRegistration --> registrationDetails[Registration Details]

    registrationDetails --> viewActivity[View Activity Details]
    registrationDetails --> checkCancellation{Cancellation Allowed?}

    checkCancellation -->|Yes| requestCancellation[Request Cancellation]
    requestCancellation --> confirmCancellation{Confirm Cancellation?}
    confirmCancellation -->|Yes| cancelRegistration[Cancel Registration]
    cancelRegistration --> updateStatus[Update Registration Status]
    updateStatus --> myRegistrations

    confirmCancellation -->|No| registrationDetails
    checkCancellation -->|No| cancellationUnavailable[Display Cancellation Unavailable Message]
    cancellationUnavailable --> registrationDetails
```

### 3.1.4 DRS Management
```mermaid
flowchart TD
    drsManagement[DRS Management] --> viewDRSSummary[View DRS Summary]
    viewDRSSummary --> viewDRSRecords[View DRS Records]
    viewDRSRecords --> selectRecord[Select a DRS Record]
    selectRecord --> recordDetails[View Record Details]

    recordDetails --> checkDiscrepancy{Discrepancy Found?}
    checkDiscrepancy -->|No| drsManagement
    checkDiscrepancy -->|Yes| submitAppeal[Submit DRS Appeal]
    submitAppeal --> appealConfirmation[Display Submission Confirmation]
    appealConfirmation --> drsManagement
```

### 3.1.5 Calendar
```mermaid
flowchart TD
    calendar[Calendar] --> viewCalendar[View Calendar]
    viewCalendar --> selectPeriod[Select Date or Period]
    selectPeriod --> displayEvents[Display Scheduled Activities]
    displayEvents --> selectEvent[Select an Activity]
    selectEvent --> eventDetails[View Activity Details]

    calendar --> myRegistrations[My Registrations]
    eventDetails --> myRegistrations
```

### 3.1.6 AI Student Assistant
```mermaid
flowchart TD
    assistant[AI Student Assistant] --> enterQuestion[Enter a Question]
    enterQuestion --> processQuestion[Process Question]
    processQuestion --> responseAvailable{Response Available?}

    responseAvailable -->|Yes| displayResponse[Display Response]
    displayResponse --> followUp{Ask Follow-up Question?}
    followUp -->|Yes| enterQuestion
    followUp -->|No| endConversation[End Conversation]

    responseAvailable -->|No| displayError[Display Error or Limitation]
    displayError --> enterQuestion
```

### 3.1.7 University Services
```mermaid
flowchart TD
    universityServices[University Services] --> browseServices[Browse Available Services]
    browseServices --> selectService[Select a Service]
    selectService --> serviceType{Service Type}

    serviceType -->|Internal| internalService[Open Internal Service Information]
    serviceType -->|External| externalService[Open External University Service]

    internalService --> universityServices
    externalService --> returnToPlatform[Return to myHCMUS]
    returnToPlatform --> universityServices
```

### 3.1.8 Profile
```mermaid
flowchart TD
    profile[Profile] --> viewProfile[View Profile Information]
    viewProfile --> editProfile[Edit Profile]
    editProfile --> updateInformation[Update Editable Fields]
    updateInformation --> validateInformation{Information Valid?}

    validateInformation -->|Yes| saveChanges[Save Changes]
    saveChanges --> updateSuccess[Display Success Message]
    updateSuccess --> profile

    validateInformation -->|No| displayValidationError[Display Validation Errors]
    displayValidationError --> editProfile

    viewProfile --> changePassword[Change Password]
    changePassword --> verifyPassword[Verify Required Credentials]
    verifyPassword --> passwordResult{Password Change Successful?}
    passwordResult -->|Yes| passwordSuccess[Display Success Message]
    passwordResult -->|No| passwordError[Display Error Message]
    passwordError --> changePassword
    passwordSuccess --> profile
```

### 3.1.9 Notifications
```mermaid
flowchart TD
    notifications[Notifications] --> viewNotifications[View Notifications]
    viewNotifications --> selectNotification[Select a Notification]
    selectNotification --> notificationDetails[View Notification Details]
    notificationDetails --> relatedContent{Related Content Available?}

    relatedContent -->|Yes| openRelatedPage[Open Related Page]
    relatedContent -->|No| returnToNotifications[Return to Notifications]

    openRelatedPage --> endFlow[Continue Using Platform]
    returnToNotifications --> notifications

    viewNotifications --> markAsRead[Mark Notification as Read]
    markAsRead --> updateReadStatus[Update Read Status]
    updateReadStatus --> notifications
```

## 3.2 Organizer Flow

### 3.2.1 Organizer Dashboard

### 3.2.2 Activity Management

### 3.2.3 Registration Management

### 3.2.4 Attendance and Results

### 3.2.5 Appeals

### 3.2.6 Reports

### 3.2.7 Profile

### 3.2.8 Organizer Flow Overview
```mermaid
flowchart TD
    organizerDashboard[Organizer Dashboard]

    organizerDashboard --> activityManagement[Activity Management]
    organizerDashboard --> registrationManagement[Registration Management]
    organizerDashboard --> attendanceResults[Attendance and Results]
    organizerDashboard --> appeals[Appeals]
    organizerDashboard --> reports[Reports]
    organizerDashboard --> profile[Profile]

    activityManagement --> activityAction{Activity Action}
    activityAction -->|Create / Edit| activityManagement
    activityAction -->|Publish| registrationManagement
    activityAction -->|Cancel| organizerDashboard

    registrationManagement --> registrationStatus{Registration Status}
    registrationStatus -->|Review / Approve / Reject| registrationManagement
    registrationStatus -->|Registration Closed| attendanceResults

    attendanceResults --> attendanceAction{Attendance / Result Action}
    attendanceAction -->|Record Attendance| attendanceResults
    attendanceAction -->|Submit Results| appeals
    attendanceAction -->|Completed| reports

    appeals --> appealStatus{Appeal Status}
    appealStatus -->|Review Appeal| appeals
    appealStatus -->|Resolved| attendanceResults

    reports --> reportAction{Report Action}
    reportAction -->|View Report| reports
    reportAction -->|Export Report| reports

    profile --> organizerDashboard

```

## 3.3 Administrator Flow

### 3.3.1 Administrator Dashboard

### 3.3.2 User Management

### 3.3.3 Activity Categories

### 3.3.4 System Configuration

### 3.3.5 Reports and Analytics

### 3.3.6 Audit Logs

### 3.3.7 Profile

# 4. Cross-role User Flows

## 4.1 Activity Registration and Participation

## 4.2 Attendance and DRS Result Submission

## 4.3 DRS Appeal and Resolution

## 4.4 Activity Cancellation and Notifications

# 5. Alternative and Error Flows

## 5.1 Authentication Failure

## 5.2 Unauthorized Access

## 5.3 Registration Deadline Passed

## 5.4 Activity Capacity Reached

## 5.5 Schedule Conflict

## 5.6 Activity Cancelled

## 5.7 Session Expiration