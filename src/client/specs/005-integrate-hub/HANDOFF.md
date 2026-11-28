# Handoff: 005 integrate hub

**Branch**: `feat/frontend/integrate-hub`, pushed to origin.
**Rollback tag**: `pre-hub-merge` = `bdc9ae9` (before the merge of origin/dev).
**Updated**: 2026-11-28, at the end of step 8.

**Related files**:
- [plan.md](./plan.md): §7 steps; "Approved decisions" at the top;
- [coverage.md](./coverage.md);
- [quickstart.md](./quickstart.md);
- `../003-auth-dashboard-admin-users/docs-changes.md`: DOC-16 to DOC-18, and DOC-11 updated.

## Steps

| Step | Status | Commit | What | Tests |
|---|---|---|---|---|
| 1 Merge origin/dev | done | `f361f68` (plus `a5cad98`: plan) | 8 conflicts resolved as in plan §2; RoleNav deleted; hub callers ported to our `api` / `ApiError` | 335 |
| 2 API client: hub envelope | done | `a517f0b` | `toApiError` reads `payload.message` and `payload.data.details[]`; `unwrapServiceResponse` (the single adapter); `versionFromEtag` | 346 |
| 3 Route access + navigation | done | `6419ab1` | `/services` shared protected path; nav items; proxy and route-access tests | 353 |
| 4 MSW hub handlers | done | `ba05049` | `coverage.md` first; `mocks/handlers/hub.ts` plus the validator mirror; in-place mock DB migration; mock classes and factories deleted | 368 |
| 5 Hooks + forbidden + copy | done | `708021e` | `useAsyncResource` in `src/hooks`; `useHubServices` / `useAdminServiceLinks`; `ForbiddenView`; `"hub"` / `"manageServiceLink"` copy | 374 |
| 6 UI adaptation | done | `c161173` (wip) + `60288b6` | `Dialog` primitive; admin page on `PageHeader` / `DataTable` / `Badge` / `Alert` / `Dialog` / `ConfirmDialog`; form on `FormField`; tokens only; `ServiceHub` forbidden and MSW tests; `coverage.md` synced | 376 |
| 7 Forwarder | done | `30ca5f1` | passes the user's bearer; opt-in dev token (`ALLOW_DEV_BACKEND_TOKEN`), with a warning, never for `auth/*`; no early 401; allowlist covers exactly the client's operations | 385 |
| 8 Docs | done | (this commit) | DOC-16 (envelope request), DOC-17 (forwarder and token), DOC-18 (stale docs), DOC-11 updated; `quickstart.md`; this file | 385 |
| 9 Final gates + manual walkthrough | **next** | — | — | — |

## Decisions made this session that are not yet in plan.md

- **Step 1.** No tests had to be skipped. `SideNav.test` was already failing before the merge (the UI-refine commits `0894ccc`…`56f2a62`); its selector was fixed in the merge commit.
- **Account errors in the hub mock.** Token and account checks in the hub handlers reuse `withAuth`, which answers in the contract shape. Only hub-specific answers use `ServiceResponse`. This is recorded in DOC-16.
- **No abort signal.** The hub services do not pass an `AbortSignal` to fetch (jsdom vs Node fetch, same as 003); late answers are ignored instead.
- **Names.**
  - The hook is renamed `useUniversityServices` → `useHubServices`.
  - The component keeps the name `AdminServiceLinks`.
  - The admin page title is now "Service Links".
- **Mutations use the plain verbs.** The admin service uses `api.post` / `api.patch` / `api.delete` with an `If-Match` header. The version comes from the DTO.
- **Fix to step 4, made in step 5.** `migrateHub` runs once, only when `serviceLinks` is missing.
- **Landing on 403.** A `forbidden` hub state on the landing page shows the same compact error as `error`.
- **`ServiceCard` stays as dev wrote it.** It already uses only tokens.
- **New `components/ui/Dialog.tsx`.** It is the general-purpose modal; `ConfirmDialog` is unchanged.
- **Forwarder: no early 401.** Without a token the request is forwarded and the backend answers 401. Sign-in through the forwarder needs this.
- **Forwarder allowlist.** It is widened to every operation the client calls. The dev token is never attached to `auth/*`.
- **Git remote.** Pushing prints "This repository moved … https://github.com/APCSk24-CS300/cs300-project.git". The push still works. Optionally run `git remote set-url origin https://github.com/APCSk24-CS300/cs300-project.git`.

## Failing tests / known broken things

- **No failing tests.** The last gates are green: tsc, 56 files / 385 tests, lint, build.
- **Real-mode UI is blocked.** The hub pages cannot be reached in real mode because the backend has no DB-backed login and no `/api/v1/auth/me` (003 GAP-E). The forwarder-to-hub-BE path is checkable with curl and a minted token: `quickstart.md` §3.
- **Not yet checked in a browser:** the admin dialogs, the forbidden views, and the 360 px layout. There is no browser tool in this session. On the running dev server (:3000), the route guards were checked with curl for every role:
  - `/services` → 200 for every role, and the login redirect when signed out;
  - `/admin/services` → 200 for the administrator and `/forbidden` for the student and the manager.

## src/server and src/db

`git diff origin/dev -- src/server src/db` is **empty**, checked at step 7 and again here.

## Exact next action

Step 9:
1. Run the gates (`quickstart.md` §1).
2. Do the mock-mode walkthrough in `quickstart.md` §2 in a browser at 360 px and at desktop width. This needs a person, or a session with a browser tool.
3. Optionally run the real-mode curl checks in §3 against a running `src/server`.
4. Record the results here and close plan 005.
