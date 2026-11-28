# Handoff: 005 integrate hub

**Branch**: `feat/frontend/integrate-hub`, pushed to origin. The working tree is clean.
**Rollback tag**: `pre-hub-merge` = `bdc9ae9` (before the merge of origin/dev).
**Paused**: 2026-11-28, during step 6, at the user's request.
**Plan**: [plan.md](./plan.md) (§7 steps; "Approved decisions" at the top).
**Coverage**: [coverage.md](./coverage.md).

## Steps

| Step | Status | Commit | What |
|---|---|---|---|
| 1 Merge origin/dev | done | `f361f68` (plus `a5cad98`: plan) | 8 conflicts resolved as in plan §2; RoleNav deleted; hub callers ported to our `api` / `ApiError` |
| 2 API client: hub envelope | done | `a517f0b` | `toApiError` reads `payload.message` and `payload.data.details[]`; `unwrapServiceResponse` (the single adapter); `versionFromEtag` |
| 3 Route access + navigation | done | `6419ab1` | `/services` shared protected path; nav items; proxy and route-access tests (signed-out redirect, non-admin `/forbidden`) |
| 4 MSW hub handlers | done | `ba05049` | `coverage.md` first; `mocks/handlers/hub.ts` plus the validator mirror; mock DB `serviceLinks` with in-place migration; mock classes and factories deleted |
| 5 Hooks + forbidden + copy | done | `708021e` | `useAsyncResource` moved to `src/hooks`; `useHubServices` / `useAdminServiceLinks` on it; `ForbiddenView`; `"hub"` / `"manageServiceLink"` copy |
| 6 UI adaptation | **in progress** | `c161173` (wip) | see below |
| 7 Forwarder | not started | — | — |
| 8 docs-changes / HANDOFF / quickstart | not started | — | — |
| 9 Final gates + manual walkthrough | not started | — | — |

**Test count after each step:** 335 → 346 → 353 → 368 → 374 → 374 (wip 6).

### Step 6: done

- New `components/ui/Dialog.tsx`, a native `<dialog>` that works like `ConfirmDialog`.
- `AdminServiceLinks` is rebuilt on `PageHeader` (with the "Add service" action), `DataTable`, `Badge` (Active / Inactive), and `Alert` (success and error banner, with Reload for 412 / 404). Add and edit open a `Dialog`; deactivate asks through `ConfirmDialog`.
- `ServiceLinkForm` is on `FormField` / `TextInput`. The form remounts on each open (keyed), so the `useEffect` reset is gone.
- Landing `ServicesSection`: `text-white*` → `text-on-primary*`.
- A scan finds no raw colors left in any hub UI file.
- `AdminServiceLinks.test` is updated to the dialogs and to regex labels (`/^name/i`, `/^address/i`). FormField adds "Required" / "Optional" to each label.
- Gates green: tsc, 56 files / 374 tests, lint, build.

### Step 6: left

1. Add a `ServiceHub` test: "shows the forbidden view when the account may not read the hub". Remove `hub.services.read` from a role in the mock DB, render through MSW, and expect `ForbiddenView`.
2. Sync `coverage.md` with step 6:
   - US3 #6 is now confirmed through `ConfirmDialog` (dialog "Deactivate Moodle?").
   - US3 #7 adds "shows the forbidden view when a change is refused with 403".
   - US1 gets the new `ServiceHub` forbidden test.
   - The component kept the name `AdminServiceLinks`, so the file paths in the table stay valid.
3. Browser check in mock mode, at 360 px and at desktop width:
   - `/services` as each role;
   - `/admin/services`: add, edit, deactivate, reactivate, and a duplicate name;
   - landing `/#services` signed in and signed out.
4. Run the gates, then commit as `feat(client): ... (plan 005 step 6)` and push.

## Decisions made this session that are not yet in plan.md

- **Step 1.** No tests had to be skipped. `SideNav.test` was already failing before the merge (the UI-refine commits `0894ccc`…`56f2a62` wrapped labels in `<span>`); its selector was fixed in the merge commit.
- **Account errors in the hub mock.** Token and account checks in the hub handlers reuse `withAuth`, which answers in the contract shape (`code` = `UNAUTHENTICATED` / `ACCOUNT_DISABLED` / `PASSWORD_CHANGE_REQUIRED`, per 003 DOC-01/06). Only hub-specific answers use `ServiceResponse`: permission 403, 400, 404, 409, 412, 415. This goes into DOC-16 in step 8.
- **No abort signal.** The hub services do not pass an `AbortSignal` to fetch (jsdom vs Node fetch, same as 003). The hook test "aborts the request on unmount" became "ignores the answer after unmount".
- **Names.**
  - The hook is renamed `useUniversityServices` → `useHubServices`, as `coverage.md` expects.
  - The component keeps the name `AdminServiceLinks`; it was not renamed to `ServiceLinkList`.
  - `ADMIN_CONTENT.title` is now "Service Links", the same as the nav label.
- **Mutations use the plain verbs.** The admin service uses `api.post` / `api.patch` / `api.delete` with an `If-Match` header. `versionFromEtag` exists, but the version comes from the DTO's `version` field.
- **Fix to step 4, made in step 5.** `migrateHub` runs once, only when `serviceLinks` is missing. Before the fix it re-granted removed permissions on every read.
- **Landing on 403.** A `forbidden` hub state on the landing page shows the same compact error as `error`.
- **`ServiceCard` stays as dev wrote it.** It already uses only tokens, so it was not moved onto `SurfaceCard`.
- **`.env.example`.** It has `ALLOW_DEV_BACKEND_TOKEN=false` (the Q1 opt-in) and drops `SESSION_SECRET`, which nothing reads.
- **Git remote.** Pushing prints "This repository moved … https://github.com/APCSk24-CS300/cs300-project.git". The push still works. Optionally run `git remote set-url origin https://github.com/APCSk24-CS300/cs300-project.git`.

## Failing tests / known broken things

- **No failing tests.** The last gate run on `c161173` was all green.
- **Not checked in a browser yet:** the new admin dialogs and the forbidden views.
- **Expected until step 7:** real mode still calls `NEXT_PUBLIC_API_BASE_URL` directly, and the backend has no CORS. The `/api/backend` forwarder is still dev's version: it injects `DEV_BACKEND_TOKEN`, ignores the user's bearer, and allows only hub paths.
- **Still to do in step 8:** `docs-changes.md` DOC-16 (hub envelope, written as a request to BE), DOC-17 (forwarder) and the stale-docs entry (R7). DOC-11 is not updated yet.

## src/server and src/db

`git diff origin/dev -- src/server src/db` is **empty**, checked on `c161173`.

## Gate commands

These are the gates each step must pass. They come from a scratchpad script that is not in the repo. Run from `src/client`:

```bash
npx tsc --noEmit -p .
npx vitest run
npm run lint
npm run build
cd ../.. && git diff --quiet origin/dev -- src/server src/db && echo "server/db identical"
```

## Exact next action

In `src/client/src/features/services/components/ServiceHub.test.tsx`, add the test "shows the forbidden view when the account may not read the hub", using `signInAs` + `updateDb` and no injected service. Then do items 2–4 of "Step 6: left" above. After that, start step 7 (the forwarder), as in plan §6 and approved Q1.
