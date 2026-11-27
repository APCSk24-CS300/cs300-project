# Handoff: 003-auth-dashboard-admin-users

**Paused**: 2026-11-27, during `/speckit-implement`, Phase 10 (Polish).
**Branch**: `003-auth-dashboard-admin-users`. The spec commit is `0c4c391`. All implementation work is **uncommitted** in the working tree.

## 1. Current step

- **Phases 1–9 are complete** (Setup, Foundational, US1, US2, US3, US6, US7, US4, US5).
- **Phase 10 (Polish)**:
  - T100–T103 are done.
  - **T104 is in progress**: lint and build were verified after the last code change, but the final full test run was stopped (details below).
  - **T105 is not done**: only a server smoke test was run.
- **tasks.md**: 103 of 105 tasks are checked `[X]`. T104 and T105 are unchecked with "(in progress: …)" notes.

## 2. Verification state

| Gate | Last result | Covers the latest code? |
|---|---|---|
| `npx eslint .` | **0 errors, 0 warnings** | ✅ yes |
| `npm run build` | **pass** (exit 0). All 11 routes plus `ƒ Proxy (Middleware)` are built. | ✅ yes, and it type-checks |
| `npm run test` | **48 files, 296/296 passed** | ⚠️ no: it ran **before** the three edits below |
| Production-server smoke test (`next start -p 3123` + curl) | no session → 307 `/login?redirectTo=%2Fadmin%2Fusers`; student hint on `/admin/users` → 307 `/forbidden`; own area → 200 with `cache-control: no-store, max-age=0`; hint on `/login` → 307 dashboard; `/mockServiceWorker.js` → 200 | ✅ yes (the server was stopped afterwards) |

Edits made after the last full test run:
1. `src/features/admin-users/components/CreateAccountWizard.tsx`: per-role random digits moved from a `useRef` to `useState` (`newDigits()`), to satisfy the `react-hooks/refs` lint rule. The behavior should be the same.
2. `src/components/icons/UserIcon.tsx` and `UsersIcon.tsx` were deleted (`git rm`). Nothing references them; the build passed afterwards.
3. `src/libs/navigation.ts`: a comment was reworded to drop the word "Organizer".

## 3. Known broken things, failing tests, open issues

- **No failing tests are known.** The re-run of the suite is the open item.
- **Next.js security advisory (not handled)**: `next build` stopped once with a `SecurityFatalError` saying Next.js 16.4.3 is affected by a known vulnerability. It recommends `next upgrade --agent=security --internal-nudge-id=9517a202-b931-4321-ae1d-4df23f81dbe2`. A retry built fine. I did **not** upgrade, because it's a dependency change outside this feature: **this needs a decision from the user**, including whether to run it in a separate worktree.
- **Analysis M13 is still open in `spec.md`**: the "Proposed handling" of GAP-N says `ACCOUNT_DISABLED` applies to "any authenticated request". DOC-01, `contracts/mock-api.md` and the code exempt `GET /auth/me` (it returns `status: 'inactive'`) and `POST /auth/logout`. This is a one-line spec wording fix; nothing in the code changes.
- **Analysis M11 and M12 are implemented in code but not written back into the artifacts** (see §4).
- **`.next/` cache**: I deleted it once, because a stale `.next/dev/types/validator.ts` still referenced the removed `/forbidden` page and `api/auth/login` route and broke type-checking. If `npx tsc --noEmit` shows `.next/...` errors again, delete `.next/` and rebuild.
- **Pre-existing, not from this feature**: the `metadataBase` warning during the build (landing metadata), the modified repo-root `.gitignore`, and the untracked `.claude/` and root `.specify/` tooling.

## 4. Decisions made this session that are not yet in spec/plan/tasks

These are FE-internal. None of them changes `docs/`, so `docs-changes.md` needs no new entry; its change log already says so.

1. **Token provider registered at module load** (`AuthProvider.tsx`: `setTokenProvider(getToken)` at the top level). Bug found during implementation: when the provider registered it inside an effect, the bootstrap `/auth/me` request (the first effect) ran without a bearer token and got a 401. It also affected real reloads.
2. **Redirect ownership (analysis M12)**: `signOutLocally(reason)` in the provider is the only place that navigates to `/login?reason=…`. `RequireSession` redirects only when `signOutReason === null` (for example, no token at bootstrap), so the reason notice can't be overwritten. It's tested in `logout.integration.test.tsx` ("one redirect, reason kept"). It's not yet described in `tasks.md` T042/T055 or the UI contract §2.
3. **`applyContext()` exists from US1 (analysis M11)**: it was written in full inside `AuthProvider` during US1 instead of being split across T038/T048.
4. **Bootstrap runs asynchronously** (`await Promise.resolve()` first) to satisfy `react-hooks/set-state-in-effect`. "No token" now goes through `signOutLocally(null)`, which also clears a stale hint.
5. **`useAsyncResource`** (`src/features/admin-users/hooks/useAsyncResource.ts`) is a shared read-hook core for this feature. It derives `loading` from a request key instead of setting state inside the effect, and returns `status: 'forbidden'` via `isForbiddenError`. It's not listed in tasks.md.
6. **`AbortSignal` is not passed to `fetch`** in `useAccountList`. A jsdom `AbortSignal` is rejected by Node's `fetch` (different realm), which broke every list request in tests. Stale responses are dropped by `useAsyncResource`'s own flag instead.
7. **Double-submit guards** in `LoginForm` and `ChangePasswordForm` live in the `<form onSubmit>` handler, not inside the `handleSubmit` callback (`react-hooks/refs` rule).
8. **Wizard**: the account schema is split into `AccountFieldsSchema` (form step) and `NewAccountSchema` (full draft), because Zod 4 refined schemas can't use `.omit()`. `isDirty` is read during render (react-hook-form subscription). Student-field errors are cleared in the role radio's `onChange` instead of a `form.watch` subscription.
9. **Extra design tokens**: `--color-heading` and `--color-placeholder`, beyond the T005 list, replace `#10132f` and `#aaa` from the old sign-in page.
10. **Auth context compatibility**: `isLoading`, `isAuthenticated` and `refreshUser` are kept on `AuthContextValue` so the existing `SiteHeader` and `HeroActions` work unchanged.
11. **Test infrastructure**:
    - `tests/navigation-mock.ts` is a global `next/navigation` mock wired in `tests/setup.ts`, together with the MSW server lifecycle and `resetMockDb()`.
    - `tests/test-utils.tsx` now has `renderWithProviders` (real `AuthProvider`) and `signInAs(email)`.
    - `expectNoA11yViolations` now fails on **serious and critical** violations (it was critical only), as SC-010 requires.
12. **Login page**: the heading is now `<h1>Sign In</h1>` (it was `h2`). `LogoutNotice` renders above the form.
13. **Already recorded in artifacts this session**: unsigned mock tokens (research R3, mock-api.md), the `setRole` dev helper (mock-api.md, quickstart), T076's location in `src/app/`, and T043 superseded by `RoleDashboard`.

## 5. Files changed but not finished

| File | What remains |
|---|---|
| `specs/003-…/tasks.md` | Check T104 and T105 once they're done. Optionally describe M12 (redirect ownership) in T042/T055. |
| `specs/003-…/spec.md` | Apply M13: add the `/auth/me` and `/auth/logout` exceptions to GAP-N's "Proposed handling", matching DOC-01. |
| `specs/003-…/quickstart.md` | Fill in the "Manual timing (SC-007)" table during T105. |
| `specs/003-…/contracts/ui-routes-and-components.md` | Optionally add the M12 redirect-ownership rule to §2. |
| All implementation files under `src/client/` | Code is done; just **uncommitted** (see §6). |

**Local-only files to be aware of**:
- `src/client/.env.local` was rewritten with the new keys. The original is backed up as `src/client/.env.local.bak-003`, which git ignores; delete it once it's no longer needed.
- `src/client/.specify/feature.json` points at this feature and is git-ignored.

## 6. Exact next action when resuming

1. In `src/client/`, run `npm run test`. Expect 48 files and 296 tests, all passing. If the wizard tests fail, look at the `digitsByRole` state change in `CreateAccountWizard.tsx`.
2. Re-run `npx eslint .` and `npm run build`. Both should still pass. If `.next/` type errors appear, delete `.next/` first.
3. If all three are green, mark **T104** `[X]`.
4. Do **T105**:
   - run `npm run dev` with `NEXT_PUBLIC_API_MODE=mock`;
   - walk through every row of `quickstart.md` in the browser, running `__myhcmusMock.reset()` first;
   - fill in the SC-007 timing table;
   - do the SC-011 consistency review;
   - then set `NEXT_PUBLIC_API_MODE=real`, rebuild, and confirm `git status` shows no changes under `src/client/src/{app,components,features}`;
   - record any failure as a new task.
5. Apply the M13 one-line spec fix and, optionally, document M12 in the tasks and the UI contract.
6. Ask the user about the Next.js security upgrade (§3).
7. Ask the user how to commit the implementation. A suggested split is one commit per phase or user story on `003-auth-dashboard-admin-users`. Nothing is pushed.
