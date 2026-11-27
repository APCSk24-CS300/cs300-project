# Quickstart & Validation: Role-Based Dashboard Shell, Authentication, and Administrator Account Registration

Run these checks to show the feature works end to end on the mock. The references are [contracts/mock-api.md](./contracts/mock-api.md) (triggers and failure switch), [data-model.md §4](./data-model.md#4-mock-store-srcmocksdb) (seed accounts) and [contracts/ui-routes-and-components.md](./contracts/ui-routes-and-components.md) (routes and guards).

## Prerequisites

- Node 20+, run from `src/client/`.
- `npm install`, then `npx msw init public --save`, which writes `public/mockServiceWorker.js` once.
- `.env.local`:
  ```env
  NEXT_PUBLIC_API_MODE=mock
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
  ```
- To regenerate wire types after a contract change, run `npm run gen:api`.

## Automated gates

```bash
npm run lint
npm run test        # unit + integration (MSW node), includes axe checks
npm run build       # type gate
```

All three must pass. Tests are expected for every row in "Alternative flows" below (SC-003).

## Manual scenarios (`npm run dev`, http://localhost:3000)

Before each session, run `__myhcmusMock.reset()` in the browser console (mock mode only).

### Happy paths

| # | Steps | Expected |
|---|---|---|
| H1 | Sign in as `student1@example.invalid` / `demo2026` | `/student/dashboard`; the header shows "Student"; the nav shows the student items, with all but Dashboard marked "Coming soon" |
| H2 | Same with `manager1@…` and with `admin@…` | the manager and administrator dashboards respectively; the admin nav has User Management active |
| H3 | Reload any dashboard | still signed in on the same page |
| H4 | **End to end (SC-002)**: as admin → User Management → Create account → Student "Nguyễn Văn An", `an.nguyen@example.invalid`, student number `23127555` (any number not already seeded), any faculty → Review | the review shows the values, the role "Student" with its permissions, and the temp password `KHTN@NVA7555` |
| H5 | Confirm | the result view shows the account and the password with a Copy button; the list shows the new row |
| H6 | Log out → sign in with the new email and temp password | "Set a new password" appears; opening `/student/dashboard` sends you back to it |
| H7 | Enter the temp password, new `NewPass123`, confirm → submit | lands on `/student/dashboard` |
| H8 | Log out → sign in with the temp password, then with `NewPass123` | the temp password is rejected with the generic message; the new password opens the dashboard directly |
| H9 | Repeat H4–H8 with Manager and Administrator roles (staff get 4 random digits) | the matching dashboards |

### Alternative flows

| Flow | How to trigger | Expected |
|---|---|---|
| UC-01 A1 | submit an empty or invalid email, or an empty password | field hints, no request sent (Network tab), email kept |
| UC-01 A2 | wrong password for `student1@…`; then `nobody@example.invalid` | an identical generic message both times |
| UC-01 A3 | `disabled@example.invalid` / `demo2026` | "account disabled, contact administrator"; no `myhcmus:token` in local storage and no `myhcmus_session` cookie |
| UC-01 A4 | 5 wrong passwords for `manager1@…`, then a 6th try | locked message with the retry time; after `__myhcmusMock.reset()` it works |
| UC-01 A5 | `outage@example.invalid`, or `__myhcmusMock.fail('login:network')` | retryable "service unavailable"; email kept |
| UC-01 A6 | `norole@example.invalid` / `demo2026` | "account cannot be signed in"; ends on `/login`, no protected page shown |
| UC-01 A7 | while signed in, open `/login` | redirected to your own dashboard |
| UC-02 A1 | open the account menu, press Escape | still signed in |
| UC-02 A2 | `__myhcmusMock.expireSessions()`, then Log out | lands on sign-in, no error |
| UC-02 A3 | `__myhcmusMock.fail('logout:network')`, then Log out | sign-in with the notice "sign-out could not be confirmed"; protected URLs require sign-in |
| UC-02 A4 | log out, press Back; type `/admin/dashboard` | sign-in both times; no protected content flashes |
| Expiry (FR-018) | `__myhcmusMock.expireSessions()`, then click Next page in the user list | sign-in with the "session expired" notice; after signing in you return to `/admin/users` |
| Role separation | as student, open `/admin/users` and `/manager/dashboard` | the no-permission page inside the shell, with a link to the student dashboard |
| Disabled mid-session (FR-018a) | sign in as `student1@…`, run `__myhcmusMock.disable('student1@example.invalid')`, then reload the dashboard | `/login` with "This account is disabled. Contact the administrator."; the `myhcmus:token` key is gone from local storage |
| Role missing on reload (FR-007) | sign in as `student1@…`, run `__myhcmusMock.setRole('student1@example.invalid', null)`, then reload | `/login?reason=role-missing` with "This account cannot be signed in. Contact the administrator."; token and hint cleared |
| Stale hint, no token (FR-018c) | sign in, delete `myhcmus:token` in DevTools → Local Storage (keep the cookie), then open `/student/dashboard` | ends on `/login` with no redirect loop; the `myhcmus_session` cookie is gone |
| Two tabs (FR-018b) | sign in, open a second tab on the dashboard, log out in tab 1 | tab 2 shows sign-in at the latest on its next navigation or click |
| Token storage (FR-010) | after signing in, check DevTools → Application | the token is only in local storage (`myhcmus:token`); the only cookie is `myhcmus_session` (role/expiry hint, no token) |
| UC-29 A1 | search `zzz` | the empty state with "Clear filters" |
| UC-29 A2 | fill the form → Cancel | a discard confirmation; on confirm, the list is unchanged |
| UC-29 A6 | (test only: post student fields with role manager) | `ROLE_POLICY_VIOLATION` message; no account created |
| UC-29 A9 | `__myhcmusMock.fail('createUser')` → Confirm | error with Retry; input kept; no new row; after clearing the failure, Retry succeeds |
| UC-29 A11 | (test only: post `role: ['student','manager']`) | the "one role per account" message |
| Duplicate | create with `student1@example.invalid` | "email already in use" on the email field |
| US7 A7 | on "Set a new password", enter a wrong current password | "current password is incorrect"; password unchanged |

### Manual timing (SC-007)

SC-007 can't be measured meaningfully on the mock, because its latency is simulated at 150–300 ms. Record these anyway, so there's a baseline to re-check against the real backend:

| Measurement | How | Result (fill in) |
|---|---|---|
| Sign-in → dashboard visible | DevTools Performance, or a stopwatch from clicking "Log in" to the dashboard heading | ___ s (target < 3 s) |
| Confirm → result view visible | from clicking "Confirm" to the result heading | ___ s (target < 3 s) |

### Consistency review (SC-011)

Sign in as each role and compare the shell side by side:
- the header, account menu, nav, page title pattern and state components must be the same components;
- check spacing, colors and typography;
- search `src/client/src` for one-off variants, i.e. inline styles or raw colors.

Record any finding as a task.

### Switch to real backend (SC-009)

Set `NEXT_PUBLIC_API_MODE=real` and point `NEXT_PUBLIC_API_BASE_URL` at the backend, then run `npm run build`. `git status` must show no changes under `src/app`, `src/components` or `src/features`. Real-mode success also depends on the BE accepting GAP-A/B/C/M and fixing GAP-E (see spec).
