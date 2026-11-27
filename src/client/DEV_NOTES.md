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

#### Manager Interface
- [ ] Design Manager Dashboard.

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
| API communication | Single client `src/libs/api-client.ts`, types generated from `docs/api/openapi.yaml` (`npm run gen:api`) |
| Mock | MSW handlers in `src/mocks/` (browser in mock mode, `msw/node` in tests); constitution C-IV v1.1.0 |
| Navigation | Role-based navigation configuration (`src/libs/navigation.ts`, "Coming soon" items) |

### 3.1. Authentication & session (feature 003)

- **Sign-in**: `POST /auth/login { email, password }` (no role; the role comes from `GET /auth/me`). Response `{ success, data: { token, expiresAt } }`, which mirrors `src/server` (bearer token in the body, 1 h).
- **Token**: kept in `localStorage` (`myhcmus:token`) and sent only as `Authorization: Bearer` to `NEXT_PUBLIC_API_BASE_URL`. It is never put in a cookie.
- **Route guard**: `src/proxy.ts` reads only the non-sensitive hint cookie `myhcmus_session` (role, password-change mark, expiry), and `RequireSession` re-checks on the client. Both guards are cosmetic: the API enforces access.
- **`proxy.ts` location**: it lives in `src/` because Next 16 loads Proxy only beside `app/`. The old `client/proxy.ts` was never executed.
- **Session end**: there is no refresh. A 401 sends the user to `/login?reason=expired`, 403 `ACCOUNT_DISABLED` to `/login?reason=disabled`, and a missing role to `/login?reason=role-missing`. Logout always clears local state; `reason=logout-unconfirmed` means the server call failed.
- **First sign-in**: accounts created by an admin must use "Set a new password" (`/change-password`) first.
- **Open contract proposals**: everything not yet in `openapi.yaml` (login/logout, error codes, `initialPassword`, `mustChangePassword`, nullable role, `ACCOUNT_DISABLED`) is tracked in `specs/003-auth-dashboard-admin-users/docs-changes.md` (DOC-01…DOC-15), and typed in `src/types/openapi-gaps.ts`.

### 3.2. Mock mode

- **Switch**: `NEXT_PUBLIC_API_MODE=mock|real` and `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`). Switching needs no code change.
- **Store**: the mock store lives in `localStorage` (`myhcmus:mock-db:v1`), so admin-created accounts survive reloads.
- **Seed accounts** (password `demo2026`):
  - `student1@`, `manager1@` and `admin@example.invalid`;
  - `disabled@` (inactive);
  - `norole@` (no role);
  - `newuser@` (must set a new password).

  `outage@example.invalid` always answers 503.
- **Browser console helpers**: `__myhcmusMock.reset()`, `.fail('createUser' | 'login:network' | …)`, `.clearFailures()`, `.expireSessions()`, `.disable(email)`, `.setRole(email, role|null)`.

---


---

## 4. Development Log

| Date | Activity |
|---|---|
| 2026-10-30 | Initial PA2 planning and frontend setup discussion. |
| 2026-10-31 | Reviewed project requirements and development workflow. |
| 2026-11-01 | Worked on authentication foundation, roles, session, Proxy, and navigation. |
| 2026-11-02 | Continued Login form development, role selection, Zod validation, and API integration design. |
| 2026-11-27 | Feature 003: UC-01/02 end to end, role shell + draft dashboards, admin account list/creation (UC-29 subset), "Set a new password", MSW mock, `proxy.ts` moved to `src/`. |

---
