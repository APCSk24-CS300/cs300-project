# Frontend Development Notes

> Development log for the myHCMUS frontend.
>
> Tracks completed checkpoints, resolved issues, technical decisions, and upcoming tasks.

## 1. Completed Checkpoints

### 1.1. Project Setup & Architecture
- [x] Set up the Next.js frontend project.
- [x] Define the initial route structure for authentication and role-based dashboards.

### 1.2. Authentication Foundation
- [x] Define role codes in `roles.ts`.
- [x] Define the initial session structure in `session.ts`.
- [x] Implement the initial Proxy logic in `proxy.ts`.
- [x] Establish the initial authentication flow:
  - Login
  - Session verification
  - Role-based redirection
  - Protected route access

### 1.3. Login Page Development
- [x] Create the Login page.
- [x] Create a `LoginForm` component + integrate React Hook Form for form state management.
- [x] Implement email and password validation by Zod
- [x] Add role selection to the login form.
- [x] Add role-based redirection after login.


### 1.4. UI/UX Design & Implementation

#### Authentication Pages
- [x] Finalize Login page UI.
- [ ] Design loading, validation, and error states.

#### Shared Application Layout
- [ ] Establish the global design system.
- [ ] Define typography, colors, spacing, and design tokens.
- [ ] Build reusable UI components.

#### Student Interface
- [ ] Design Student Dashboard.

#### Organizer Interface
- [ ] Design Organizer Dashboard.

#### Administrator Interface
- [ ] Design Admin Dashboard.

---

## 2. Resolved Issues 

### 2.1. Authentication & Session
- Understood the fundamentals of web authentication, session management, cookie handling, and role-based access control (RBAC), including the responsibilities of fe and be.

### 2.2. Next.js Proxy
- Understood how Next.js Proxy works, including request interception, route matching, navigation, and authentication checks.


---

## 3. Current Technical Decisions & Assumptions

| Area | Current Direction |
|---|---|
| Frontend framework | Next.js |
| Routing | App Router |
| Pkg management | npm |
| Form management | React Hook Form |
| Form validation | Zod |
| Authentication | Session-based authentication design |
| Route protection | Next.js Proxy |
| Authorization | RBAC |
| API communication | TBD |
| Navigation | Role-based navigation configuration |

### 3.1. Authentication API Contract
**Current working assumption:**  

The login request includes:
```json
{
  "role": "student",
  "email": "student@hcmus.edu.vn",
  "password": "password123"
}
```

**Pending confirmation from BE:**  
- Login endpoint and HTTP method.  
- Request and response schemas.  
- Session or JWT authentication mechanism.  
- Cookie configuration.  
- Logout and session expiration behavior.
- Current user endpoint.  

> The authentication contract has not been finalized. The current FE implementation should be treated as provisional until both teams agree on the contract.

---


---

## 4. Development Log

| Date | Activity |
|---|---|
| 2026-10-30 | Initial PA2 planning and frontend setup discussion. |
| 2026-10-31 | Reviewed project requirements and development workflow. |
| 2026-11-01 | Worked on authentication foundation, roles, session, Proxy, and navigation. |
| 2026-11-02 | Continued Login form development, role selection, Zod validation, and API integration design. |

---
