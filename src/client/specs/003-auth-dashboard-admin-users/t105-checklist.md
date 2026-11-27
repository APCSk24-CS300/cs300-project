# T105 browser checklist: 003-auth-dashboard-admin-users

Full details: [quickstart.md](./quickstart.md). Tick each box in the browser.

## Setup

- [ ] In `src/client/`: `.env.local` has `NEXT_PUBLIC_API_MODE=mock` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`.
- [ ] Run `npm run dev` and open http://localhost:3000. The header shows **Demo data** once signed in.
- [ ] Before each block below, run `__myhcmusMock.reset()` in DevTools → Console, then reload.

### Seed accounts (password `demo2026` for all)

| Email | Role | State |
|---|---|---|
| `student1@example.invalid` | Student (23127001) | active |
| `manager1@example.invalid` | Manager | active |
| `admin@example.invalid` | Administrator | active |
| `disabled@example.invalid` | Student | inactive |
| `norole@example.invalid` | none | active |
| `newuser@example.invalid` | Student | must set a new password |
| `outage@example.invalid` | not stored | login always fails with "service unavailable" |

### Console helpers

- `__myhcmusMock.reset()`
- `.fail('<op>')`, where `<op>` is `login`, `logout`, `me`, `changePassword`, `listUsers`, `createUser`, `listFaculties` or `listRoles`; add `:network` for a network error
- `.clearFailures()`
- `.expireSessions()`
- `.disable(email)`
- `.setRole(email, role | null)`

## A. Sign in (UC-01)

- [ ] **H1** student1 → `/student/dashboard`. The header shows the name and "Student". The nav has the student items, all except Dashboard marked "Coming soon".
- [ ] **H2** manager1 → `/manager/dashboard`; admin → `/admin/dashboard`. The admin nav has **User Management** active.
- [ ] **H3** Reload any dashboard → still signed in on the same page.
- [ ] **A1** Submit an empty or invalid email, or an empty password → field hints appear, no request is sent (Network tab), and the email is kept.
- [ ] **A2** Wrong password for student1, then `nobody@example.invalid` → the **same** message both times: "Email or password is incorrect."
- [ ] **A3** disabled@ → "This account is disabled. Contact the administrator." There's no `myhcmus:token` in Local Storage and no `myhcmus_session` cookie.
- [ ] **A4** 5 wrong passwords for manager1, then a 6th try → "Too many failed attempts. Try again after HH:mm."
- [ ] **A5** outage@, or `.fail('login:network')` → "The service is unavailable. Please try again." The email is kept.
- [ ] **A6** norole@ → "This account cannot be signed in…"; you stay on `/login`.
- [ ] **A7** While signed in, open `/login` → redirected to your own dashboard.
- [ ] **Token storage** (DevTools → Application): the token is only in Local Storage (`myhcmus:token`), and the only cookie is `myhcmus_session`.

## B. Log out and session (UC-02)

- [ ] **Basic** Account menu → Log out → `/login` with "You have been signed out."
- [ ] **A1** Open the account menu, press Escape or click outside → still signed in.
- [ ] **A2** `.expireSessions()`, then Log out → sign-in page, no error.
- [ ] **A3** `.fail('logout:network')`, then Log out → "…could not confirm it with the server."; protected URLs then require sign-in.
- [ ] **A4** After logout, press Back, or type `/admin/dashboard` → sign-in both times, with no protected content flashing.
- [ ] **Expiry** As admin on `/admin/users`, run `.expireSessions()`, then use the search box → "Your session has expired"; signing in again returns you to `/admin/users`.
- [ ] **Disabled mid-session** As student1, run `.disable('student1@example.invalid')`, then reload → `/login` with the disabled message; the token is gone.
- [ ] **Role missing on reload** As student1, run `.setRole('student1@example.invalid', null)`, then reload → `/login` with "This account cannot be signed in…".
- [ ] **Stale hint** Sign in, delete `myhcmus:token` from Local Storage (keep the cookie), then open `/student/dashboard` → you end on `/login` with no redirect loop, and the cookie is gone.
- [ ] **Two tabs** Sign in, open a second tab on the dashboard, then log out in tab 1 → tab 2 goes to sign-in.

## C. Shell and role separation (US4)

- [ ] As student, open `/admin/users` and `/manager/dashboard` → the no-permission page inside the shell, with a link to the student dashboard.
- [ ] "Coming soon" nav items aren't clickable and are skipped by Tab.
- [ ] At phone width (DevTools device mode): the menu button opens and closes the nav drawer, and Escape closes it.
- [ ] Each dashboard shows "Not yet available" summaries with **no numbers**, plus shortcut cards; unbuilt shortcuts are marked "Coming soon".

## D. User Management (UC-29 subset, US5, US6)

- [ ] **List** As admin, open `/admin/users` → 6 accounts, newest first, showing role and status.
- [ ] **A1** Search `zzz` → "No accounts match" → **Clear filters** brings all accounts back.
- [ ] **Filter** Role = Manager → only the manager.
- [ ] **H4** Create account: Student "Nguyễn Văn An", `an.nguyen@example.invalid`, student number `23127555`, any faculty → Review shows the values, "Student" with its permissions, and the password **`KHTN@NVA7555`**.
- [ ] **H5** Confirm → the result shows the account and the password with **Copy**. "Back to User Management" shows the new row.
- [ ] **Override** On Review, use Change and type a password shorter than 8 characters → Confirm is disabled. "Use generated password" restores it.
- [ ] **A2** Fill the form, then Cancel → "Discard this account?" → Discard; nothing is saved.
- [ ] **A9** `.fail('createUser')`, then Confirm → an error with **Retry**, and your input is kept. `.clearFailures()`, then Retry → created.
- [ ] **Duplicate** Create with `student1@example.invalid` → "This email is already in use" on the email field.
- [ ] **Role switch** Fill the student fields, then pick Manager → the student fields disappear and aren't sent.
- [ ] **H9** Repeat H4–H5 for Manager and Administrator. Staff passwords are `KHTN@` + initials + 4 random digits.

## E. First sign-in: "Set a new password" (US7)

- [ ] **H6** Log out, then sign in with the new account and its temporary password → the "Set a new password" page; opening the dashboard sends you back to it.
- [ ] **US7 A7** Enter a wrong current password → "Current password is incorrect"; nothing changes.
- [ ] **H7** Temporary password + `NewPass123` twice → your dashboard.
- [ ] **H8** Log out → the temporary password is rejected with the generic message, and `NewPass123` opens the dashboard directly.

## F. SC-007 timing (mock latency is simulated, so this is not a real measure; re-check on the real backend)

| Measurement | How | Result | < 3 s? |
|---|---|---|---|
| Sign-in → dashboard heading visible | stopwatch, or DevTools Performance, from clicking "Log In" | ___ s | ☐ |
| Confirm → "Account created" visible | from clicking "Confirm" | ___ s | ☐ |

## G. SC-011 consistency review (as student, manager and administrator)

- [ ] Same header: logo, Demo data badge, account menu with name and role.
- [ ] Same nav pattern: active item highlighted, the same "Coming soon" badge.
- [ ] Same page title pattern (h1 plus a description line) on every screen.
- [ ] Same loading, empty and error components: skeletons, dashed empty box, error box with Try again.
- [ ] Same buttons, inputs, radius and shadows on login, wizard, Set a new password and list; no one-off colors.
- [ ] Keyboard only: Tab reaches every control, focus is visible, and the skip link works.
- [ ] **Contrast (C-VIII, WCAG 2.1 AA)**: run Lighthouse (Accessibility) or the axe DevTools extension on **login**, the **shell** (any page with the header and nav), a **dashboard** and the **create-account wizard** (both form and review steps). It should report no "color contrast" failures. The automated tests skip this rule because jsdom can't compute contrast.

## H. Real mode (SC-009)

- [ ] **Config-only switch (can be done now)**:
  1. Set `NEXT_PUBLIC_API_MODE=real` in `.env.local`, then run `npm run build`.
  2. `git status` shows **no** changes under `src/client/src/{app,components,features}`.
  3. Set the value back to `mock`.
- [ ] **Flows against the backend: blocked, waiting for BE.** `src/server` can start, but it serves only `/api/auth/register`, `/api/auth/login` and `/api/ai`:
  - no `/api/v1` base path;
  - no `/auth/me`, `/auth/logout`, `/profile/password` or `/admin/*`;
  - a different response format;
  - no CORS.

  See spec GAP-E and docs-changes DOC-03/DOC-04.

## Result

- [ ] All of A–G pass, and the H config-only check passes. Record any failure as a new task in `tasks.md`, then mark T105 `[X]`. The real-mode flows stay blocked.
