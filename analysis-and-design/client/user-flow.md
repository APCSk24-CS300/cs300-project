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
2. System displays the Landing Page.
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

## 2.3 Forgot Password Flow

## 2.4 Reset Password Flow

## 2.5 Help / Guide Flow

## 2.6 Public User Flow Diagram

# 3. Authenticated User Flow

## 3.1 Student Flow

### 3.1.1 Student Dashboard

### 3.1.2 Activities

### 3.1.3 My Registrations

### 3.1.4 DRS Management

### 3.1.5 Calendar

### 3.1.6 AI Student Assistant

### 3.1.7 University Services

### 3.1.8 Profile

### 3.1.9 Notifications

## 3.2 Organizer Flow

### 3.2.1 Organizer Dashboard

### 3.2.2 Activity Management

### 3.2.3 Registration Management

### 3.2.4 Attendance and Results

### 3.2.5 Appeals

### 3.2.6 Reports

### 3.2.7 Profile

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