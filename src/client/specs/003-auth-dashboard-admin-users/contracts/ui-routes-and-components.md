# Contract: Routes, Guards and Shared UI Components

## 1. Routes

| Path | Group | Who | Screen | UC / FR |
|---|---|---|---|---|
| `/login` | `(public)` | signed-out (signed-in → own dashboard, A7) | Sign-in | UC-01, FR-001–012 |
| `/change-password` | `(protected)` | any role with `mustChangePassword` (others → own dashboard) | Set a new password | US7, FR-043–048 |
| `/forbidden` | `(protected)` | any signed-in role | No permission (inside shell) | FR-020 |
| `/student/dashboard` | `(protected)/student` | student | Student dashboard (draft) | UC-32, FR-025 |
| `/manager/dashboard` | `(protected)/manager` | manager | Manager dashboard (draft) | UC-32 |
| `/admin/dashboard` | `(protected)/admin` | administrator | Administrator dashboard (draft) | UC-32 |
| `/admin/users` | `(protected)/admin` | administrator | User Management list | UC-29 1–2, A1 |
| `/admin/users/new` | `(protected)/admin` | administrator | Create account wizard (form → review → result) | UC-29 3–8, A2/A6/A9/A11 |

`/login?reason=expired|signed-out|logout-unconfirmed|disabled|role-missing&redirectTo=<safe path>` shows the matching notice (FR-007, FR-016, FR-018, FR-018a). The screen at `/change-password` is titled "Set a new password" everywhere in the UI.

## 2. Guard rules: `resolveRouteAccess(pathname, hint, now)`

Rules are evaluated top to bottom; the first match wins.

1. The path is public (`/`, `/login`, assets):
   - `/login` with a valid hint → `redirect(dashboard(hint.role))` (A7).
   - Anything else → `allow`.
2. No hint, or `hint.exp <= now` → `redirect('/login?redirectTo=<path>')` (FR-019).
3. `hint.mustChangePassword` and the path is not `/change-password` → `redirect('/change-password')` (FR-044).
4. The path is `/change-password` and `!hint.mustChangePassword` → `redirect(dashboard(hint.role))`.
5. The path is under a role prefix that doesn't match `hint.role` → `redirect('/forbidden')` (FR-020).
6. Otherwise → `allow`, and protected responses get `Cache-Control: no-store` (UC-02 A4).

Two places run these rules:
- `src/proxy.ts` (server, cookies).
- `RequireSession` in `(protected)/layout.tsx` (client: `AuthProvider` state, plus `pageshow` for the bfcache).

Both are cosmetic; the API enforces access (FR-021).

The hint is advisory. Whenever the client finds no valid token (bootstrap, `pageshow`, `storage` event, 401), it clears the hint before redirecting to `/login`. Without that, rule 1 would send a stale-hint user back to a protected page and loop (FR-018c).

**Redirect ownership (analysis M12).** Exactly one component redirects on sign-out:
- **With a reason** (`expired`, `disabled`, `role-missing`, `signed-out`, `logout-unconfirmed`): `AuthProvider.signOutLocally(reason)` clears the token and the hint, stores `signOutReason`, and navigates to `/login?reason=<reason>`. For `expired` it also adds `&redirectTo=<current path>`.
- **Without a reason** (for example, no token at bootstrap): `RequireSession` redirects to `/login?redirectTo=<path>`, and only when `signOutReason === null`.

This ensures the `?reason=` notice on `/login` is never overwritten by a second redirect.

`redirectTo` is accepted only if `isSafeRedirectPath()` passes and the path is allowed for the signed-in role. Otherwise the user goes to their dashboard.

## 3. Shared layout components (`src/components/layout`)

| Component | Responsibility | Key props | a11y |
|---|---|---|---|
| `AppShell` | header, side nav, page area; collapses to a drawer at width < `lg` | `role`, `navItems`, `user`, `children` | skip link; `<header>`, `<nav aria-label="Main">`, `<main id="main">` |
| `AppHeader` | logo (reuses `Logo`), "Demo data" badge in mock mode, `AccountMenu`, mobile menu toggle | `user`, `onOpenNav` | toggle has `aria-expanded` and `aria-controls` |
| `AccountMenu` | name, role label, Log out; Escape or outside-click closes without action (UC-02 A1) | `user`, `onLogout`, `pending` | menu-button pattern; focus returns to trigger |
| `SideNav` | renders `NavItem[]`; current page `aria-current="page"`; `coming-soon` items are non-links with `aria-disabled` and a "Coming soon" badge | `items`, `currentPath` | coming-soon items are skipped by Tab and announced as unavailable |
| `PageHeader` | page title, optional description and actions; the one title pattern for every screen | `title`, `description?`, `actions?` | `<h1>` |
| `ForbiddenView` | the shared no-permission presentation: message plus a link to the user's own dashboard | `dashboardHref` | uses `EmptyState`; heading level follows the page |

`src/hooks/useForbidden.ts` is shared and doesn't belong to any feature (constitution C-II). It exports two things with distinct roles:
- **`isForbiddenError(err): boolean`** is a pure helper, true for an `ApiError` with `code === 'FORBIDDEN'`. **Data hooks** (reads) use it in their catch and return `status: 'forbidden'` alongside `'loading' | 'error' | 'success'`. The component that renders the hook's data shows `ForbiddenView` when `status === 'forbidden'`.
- **`useForbidden(): { isForbidden, handleError(err): boolean }`** is component-owned state for **mutations** (e.g. the wizard's Confirm). The component calls `handleError` in its own catch and renders `ForbiddenView` when `isForbidden`.

Hooks never call `useForbidden()` internally, because its state would be invisible to the rendering component (analysis M7).

Existing `SiteHeader` and `SiteFooter` remain for public pages. `AppHeader` reuses `Logo` and the `Button` and `Badge` primitives; it does not fork `SiteHeader`.

## 4. Shared UI primitives (`src/components/ui`)

Existing primitives are reused: `Button` (variants `primary`, `secondary`, `white`, `ghost`; `loading`), `Badge`, `Tag`, `SurfaceCard`, `Skeleton`, `EmptyState`, `ErrorState`, `Section`, `SectionHeader`, `Container`.

New primitives, all token-styled with no hard-coded colors:

| Component | Purpose |
|---|---|
| `FormField` | label, required/optional marker, hint, error text with `aria-describedby`; wraps an input, select or radio group |
| `TextInput`, `PasswordInput` (show/hide toggle), `Select`, `RadioGroup` | form controls with token styles extracted from the current `LoginForm` inputs |
| `Alert` | inline notice (`info`, `success`, `warning`, `error`) with `role="alert"` for errors and `role="status"` otherwise |
| `ConfirmDialog` | modal confirmation (discard input, A2); focus trap; Escape cancels |
| `DataTable` | semantic `<table>` with column definitions, a loading-skeleton row set, and `EmptyState` / `ErrorState` slots |
| `Pagination` | previous/next plus page status; `nav` with `aria-label` |
| `LoadingState` | page or section skeleton composition used by every screen (Skeleton-based, keeps the layout stable) |
| `CopyField` | read-only value plus a copy button with a status announcement (temporary password on the result view) |
| `ComingSoonBadge` | `Badge` variant used by `SideNav` and shortcut cards |

New tokens are added to `src/app/globals.css` (`@theme`): `--color-danger`, `--color-danger-surface`, `--color-info`, `--color-info-surface`, `--color-border`, `--color-border-strong`, `--color-page`. This removes the raw values used today (`#1b4da5`, `#b5b5b5`, `red-500`, `#f8f8f8`, and so on) from the sign-in page, and the `red-50`/`red-600`/`slate-*` utilities from the existing `ErrorState` and `EmptyState` (constitution VI).

## 5. Feature components

| Feature | Components |
|---|---|
| `features/auth` | `LoginForm` (moved from `components/forms`, role selector removed, social and forgot-password links hidden per FR-012), `ChangePasswordForm` ("Set a new password"), `RequireSession`, `LogoutNotice` |
| `features/dashboard` | `RoleDashboard` (greeting, `AccountDetailsCard`, `ShortcutGrid`, `UnavailableSection`); shortcuts are derived from `NAVIGATION[role]` (FR-024a) |
| `features/admin-users` | `UserListView` (`UserFilters` + `DataTable` + `Pagination`), `CreateAccountWizard` (`AccountForm`, `AccountReview` + `RolePermissionsPanel`, `AccountResult`) |

## 6. Screen state matrix (FR-026)

Every screen uses only `LoadingState`, `EmptyState`, `ErrorState` and `Alert`.

| Screen | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Sign-in | submit button `loading` | — | `Alert` (mapped code) | redirect |
| Set new password | submit `loading` | — | field errors + `Alert` | redirect |
| Shell bootstrap | full-page `LoadingState` while `/auth/me` resolves | — | `ErrorState` + retry; on 401 → sign-in | shell |
| Dashboards | section skeletons | `UnavailableSection` for sections without an endpoint | `ErrorState` per section | cards |
| User list | `DataTable` skeleton | `EmptyState` + "Clear filters" | `ErrorState` + retry | table |
| Create wizard | faculty `Select` skeleton; permissions-panel skeleton; Confirm `loading` | permissions panel: "No permissions" | field errors / `Alert` / retry | result view |
| No permission | — | — | (it is the state) | link to own dashboard |
