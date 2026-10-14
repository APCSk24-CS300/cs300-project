
# myHCMUS - Overview 
- **Purpose**:  To document the navigation flows and user interactions in myHCMUS system.
- **Scope**: Cover the navigation flows of public pages and authenticated pages, including the role-based navigations for different roles.
- **Target Users**: University students and staff at VNU-HCMUS.
- **User Roles**:
    - Student
    - Organizer
    - Administrator

# 2. Global Navigation Flow

```mermaid
flowchart TD
    A[Open myHCMUS] --> B{Authenticated?}

    B -->|No| C[Landing Page]
    C --> D[Login Page]
    C --> E[Help / Guide]
    C --> F[Forgot Password]
    F --> G[Reset Password]
    G --> D

    D --> H{Credentials Valid?}
    H -->|No| I[Display Error]
    I --> D
    H -->|Yes| J{User Role}

    B -->|Yes| J
    J -->|Student| K[Student Dashboard]
    J -->|Organizer| L[Organizer Dashboard]
    J -->|Administrator| M[Admin Dashboard]

    K --> N[Role-specific Navigation]
    L --> N
    M --> N

    N --> O[Logout]
    O --> C
```

# 3. Public User Flow

## 3.1 Landing Page
## 3.2 Login Page

# 4. Authenticated User Flow 

## A. Student Flow
### Student Dashboard

## B. Organizer/Staff Flow
### Organizer Dashboard

## C. Administrator Flow
### AD Dashboard
## D. Cross-role Flow
