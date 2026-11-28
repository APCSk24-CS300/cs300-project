# Verification: known issues reported against origin/dev at `95b150f`

**Date**: 2026-11-28. **Status**: report only; no code changed. Waiting for approval.

**Compared**
- **This branch:** `feat/frontend/integrate-profile` at `ca082db`, the FE after our PR into dev merges.
- **origin/dev:** after `git fetch`, at `b8b3726` (PR #112).

Since `5302b6d` (the dev commit 006 merged), dev changed **only** `docs/`: the system-context diagram, `business-rules.md` and `use-case-specifications.md`. `git diff --quiet HEAD origin/dev -- src/server src/db` → identical, so every backend finding (#1–#4) and #11 is the same on both.

**Out of scope:** issue #10 (`src/db/schema_constraints_test.sql`) is owned by another teammate; that file was not opened or run.

**Limits**
- **No live register/login check (#1).** The Docker CLI is installed (29.8.2), but the daemon is not running (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`). So the database could not be started and there was no curl call. #1 is verified by reading the code at `95b150f` and on dev, and by the BE unit tests that run without a database.
- **Paths:** `src/server/…` paths are identical on both refs. `src/client/…` paths without a ref are this branch.

## Summary

| ID | Area | This branch | origin/dev | Fix belongs on |
|---|---|---|---|---|
| 1 | BE auth repository | partially fixed | partially fixed | BE branch off origin/dev |
| 2 | BE hard-coded token | already fixed | already fixed | — |
| 3 | BE health check | still present | still present | BE branch off origin/dev |
| 4 | BE `.env.example` | still present | still present | BE branch off origin/dev |
| 5 | FE backend token | partially fixed | partially fixed | next phase "E2E authentication" (FE) + BE |
| 6 | FE AI assistant | still present | still present | new feature (FE) + BE path decision |
| 7 | FE activity list | partially fixed | still present | this FE PR (allowlist); contract gap → BE / docs |
| 8 | FE route guard | already fixed | still present (worse than reported) | this FE PR (fixed when it merges) |
| 9 | FE mock env vars | partially fixed | still present | this FE PR |
| 11 | Infra: FE not in Compose | still present | still present | infra branch off origin/dev |

## Details

| ID | Area | Status on this branch | Status on origin/dev | Evidence | Proposed fix | Fix branch |
|---|---|---|---|---|---|---|
| 1 | BE `src/server/src/repositories/AuthRepository.ts` | **Partially fixed** (same file as dev) | **Partially fixed** | **At `95b150f`:** the `checkUserExists*` functions had `return result != null` (lines 232, 242, 252), and `rows[0] ?? null` returned whole rows. <br>**Fixed on dev** (exactly the functions the report names): <br>• `checkUserExistsWithEmail` → `result.rows.length > 0` (:249); <br>• `checkUserExistsWithPhoneNumber` (:258); <br>• `getUserFromEmail` → `rows[0]?.user_id` (:313); <br>• `getUserPasswordHash` → `rows[0]?.password_hash` (:288); <br>• `getName` → `rows[0]?.full_name` (:323); <br>• also `checkUserExists` (:239). <br>The login path (`AuthService.login`: `checkUserExistsWithEmail` → `getUserFromEmail` → `getUserPasswordHash` → `getName`) now passes values, not rows. <br>**Still wrong** (return the whole row, typed as a value): <br>• `getStudentUserID` (:51), `getActivityManagerID` (:61), `getAdminUserID` (:71), returning `{ role_id }` instead of a number; <br>• `getUserEmail` (:268), returning `{ email }`; <br>• `getUserRefreshTokenHash` (:278), returning `{ refresh_token_id }`. <br>`git grep` finds **no callers** of these five, so they are latent today; register uses the hard-coded `ROLE_IDS` 1/2/3, which match `seed_lookups_and_junctions.sql:6–7`. <br>BE unit tests: `node --test tests/unit/AuthService.test.ts tests/unit/PasswordController.test.ts` → 9 / 9 pass (no DB). | Return `rows[0]?.role_id` / `.email` / `.refresh_token_id`, or delete the unused functions and look `ROLE_IDS` up by code. Add repository tests with a stubbed pool for `register` and `login`. Run the curl check (`POST /api/auth/register`, `POST /api/auth/login`) once Docker is up. Login still answers 404 "Email not found" (account enumeration) and `/api/auth/register` is still public (003 GAP-E, GAP-F). | BE branch off origin/dev |
| 2 | BE `validateAccessToken` hard-coded token | **Already fixed** | **Already fixed** | At `95b150f`, `ValidatorMiddleware.ts:57` had `if (credentialsToken === "MIKU_MIKU_OO_EE_OO")`. Now `src/server/src/middleware/ValidatorMiddleware.ts:57–62` only runs `jwt.verify(token, config.jwt.secret)` and requires a non-empty `sub`. No other fixed-token comparison was found in `src/server/src`. | None. Optionally add a test that a non-JWT bearer gets 401. | — |
| 3 | BE health check | **Still present** | **Still present** | `src/server/src/helper/databaseCheckHelper.ts:15–16`: `// await DbConnection.pool.query('SELECT 1');` is commented out, so the function returns `up: true` whenever `config.db.dbHost` is set. `dbHost` is hard-coded to `'db'` (`config/config.ts:22`), so that is always. | Import `DbConnection` and run `SELECT 1` with a timeout; return `up: false` with the error on failure. Add a unit test with a pool that throws. | BE branch off origin/dev |
| 4 | BE `src/server/.env.example` | **Still present** | **Still present** | `.env.example` has `BACKEND_PORT`, `JWT_SECRET`, `DATABASE_URL=…`, Gemini, AI, `AVATAR_STORAGE_DIRECTORY`. **Missing:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (read at `config/config.ts:23–25, 36`). **Unused:** `DATABASE_URL` (`grep -rn DATABASE_URL src/server/src` finds nothing). Compose reads `server/.env` (`src/docker-compose.yml:10–11`), and `src/db/.env.example` has the three `POSTGRES_*` variables for the db container only. Also `dbHost: 'db'` is hard-coded (`config.ts:22`), so the server only reaches the DB inside Compose. | Add `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` (the same values as `src/db/.env`), and remove `DATABASE_URL`. Optionally add `DB_HOST` (default `db`) so the server can also run outside Compose. | BE branch off origin/dev |
| 5 | FE: no real backend token | **Partially fixed**: the transport is done, issuing the token is blocked by the BE | **Partially fixed** | **This branch:** <br>• `mockAuthService` and `SESSION_SECRET` are gone (`src/client/src/features/auth/services/` contains only `auth.service.ts`; `src/client/src/app/api/` contains only `backend/`). <br>• `AuthProvider` uses the real `authService` through the single API client, with the bearer in the token store (`features/auth/provider/AuthProvider.tsx:14, 56, 167`). <br>• The forwarder passes the user's `Authorization` header (`app/api/backend/[...path]/route.ts:87–89`); `DEV_BACKEND_TOKEN` is opt-in only (`:64–70`, `ALLOW_DEV_BACKEND_TOKEN=true`). <br>• But the BE login is unversioned (`/api/auth/login`, a different shape), so real-mode sign-in cannot get a token yet (006 DOC-19; HANDOFF "Next phase: E2E authentication"). <br>**origin/dev:** <br>• `AuthProvider` uses `authService` (`AuthProvider.tsx:4, 17`), not the mock. <br>• The cookie BFF `app/api/auth/login/route.ts:9–22` calls the DB-backed `POST /api/auth/login` and sets the `backend_access` cookie. <br>• **But** the `/api/backend` forwarder still uses only `DEV_BACKEND_TOKEN` (`route.ts:19–21, 43`); only the separate profile bridge reads the cookie. | The next phase (E2E authentication): adapt `auth.service.ts` + its mappers to the BE auth, or have the BE serve `/api/v1/auth/*` with the contract shapes (DOC-19, DOC-03, DOC-04). Until then nothing more for the FE PR. | Next phase (FE `auth.service` / mappers / config) + BE `/api/v1/auth` |
| 6 | FE: no AI assistant screen; forwarder cannot reach `/api/ai` | **Still present** | **Still present** | No route, feature or API call: `git grep -n -i "ai/chat\|/api/ai" HEAD -- src/client/src` and the same on `origin/dev` → nothing (the nav item "AI Student Assistant" is `coming-soon`, `libs/navigation.ts`). <br>BE mount: `src/server/src/app.ts:95` `app.use('/api/ai', …)`, which is unversioned. <br>Forwarder: this branch's allowlist (`libs/backend-path.ts:13–25`) has no `ai/*`, and it forwards to `BACKEND_API_URL` = `…/api/v1`. dev's allowlist is only `hub/*` / `admin/services*` (`backend-path.ts:10–11`). | A separate feature (UC-06) with its own spec. **Decide the path first:** the BE moves AI under `/api/v1/ai`, as the contract does for the other groups (preferred, no forwarder change), or the forwarder gets a second, explicit base for `/api/ai`. Then allow only `ai/chat` (and whatever else UC-06 needs). Record it as an API gap (contract vs `/api/ai`). | New FE feature branch + BE (path) |
| 7 | FE: the activity list cannot reach the backend | **Partially fixed** | **Still present** | Both refs: `features/activities/services/activity.service.ts:14–15` calls `GET /activities/landing`. **The contract has no `/activities` operation at all**: `grep -n "^  /" docs/api/openapi.yaml` lists only `/activity-categories`, `/admin/activity-categories*` and `/admin/reports/activities`. The BE has no activities route (`src/server/src/app.ts`). <br>**This branch:** the forwarder allowlist **does** contain `activities/landing` (`libs/backend-path.ts:21`, added by us in 005). That is an allowlisted path that is neither in the contract nor on the BE, so it should come out. In mock mode the feature still uses the pre-003 `MockActivityService` + `getDataSource()` factory (`activity.service.factory.ts:1–7`), not MSW (client constitution C-IV). <br>**origin/dev:** the allowlist rejects it, as reported. | **This FE PR:** remove `activities/landing` from the allowlist, and record an API gap: there is no landing/activity-list operation in `openapi.yaml`, so the FE must not invent one (CLAUDE.md). Optionally move the activity mock to an MSW handler. **BE / docs:** define the activity list operation (UC-04) in the contract, then implement it. | This FE PR (allowlist + gap entry); contract/BE later |
| 8 | FE route guard `proxy.ts` | **Already fixed** | **Still present, and worse than reported** | **This branch:** `src/client/src/proxy.ts`, beside `src/app`, using `libs/route-access.ts`. The wrong role goes to `"/forbidden"` (`route-access.ts:71`). `/login` with a valid hint redirects to the dashboard (`route-access.ts`, rule 1). Tests: `npx vitest run src/proxy.test.ts src/libs/route-access.test.ts` → **28 / 28 pass**, incl. "sends the wrong role to /forbidden" and "redirects /login with a valid hint to the dashboard (A7)". <br>**origin/dev:** the file is `src/client/proxy.ts`, with `/forbiden` (:22) and `return` inside `forEach` (:27–30), both as reported. **Also**, it sits outside `src/` while the app is `src/client/src/app`. Next 16: "Create a `proxy.ts` … in the project root, or inside `src` if applicable, so that it is located at the same level as `pages` or `app`" (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:25`). So dev's proxy is **not loaded at all**, and dev has no server-side route guard. | Nothing more on this branch; it is fixed on dev when our PR merges. Our branch has no `src/client/proxy.ts`. | This FE PR (already in it) |
| 9 | FE mock env vars missing from `.env.example` | **Partially fixed**: `NEXT_PUBLIC_MOCK_AUTH_STATE` is gone (the mock auth was removed; auth mocks are MSW now) | **Still present** | **This branch:** `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO` is still read (`features/activities/services/mock.activity.service.ts:13`), and `src/client/.env.example` has no `MOCK` entry. `NEXT_PUBLIC_MOCK_AUTH_STATE`: no reader (`git grep` on HEAD). <br>**origin/dev:** both are read (`mock.activity.service.ts:13`, `mock.auth.service.ts:59`) and neither is in `.env.example`. | **This FE PR:** add a commented `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO=` with its allowed values to `.env.example`. If the activity mock moves to MSW (#7), use the MSW failure switch instead and drop the variable. | This FE PR |
| 11 | Infra: the FE is not in Docker Compose | **Still present** | **Still present** | `src/docker-compose.yml` defines only `server` (:3–15) and `db` (:17–31). There is no client service, and the FE runs with `npm run dev`. | Add a `client` service (Node image, `src/client`, port 3000) with the env `NEXT_PUBLIC_API_MODE=real`, `NEXT_PUBLIC_API_BASE_URL=/api/backend` and `BACKEND_API_URL=http://server:8080/api/v1` (the forwarder reaches the BE on the Compose network), `depends_on: server`. A production build would use `next build && next start`. | Infra branch off origin/dev (it touches `src/docker-compose.yml`, outside `src/client`) |

## Notes for the docs (to tell Khoi)

- **#2** is resolved. **#8** will be resolved when our PR merges, and dev currently has no working route guard at all.
- **#7:** the activity list has **no contract operation**, so this is a contract/docs gap, not only a forwarder rule.
- **#1:** login and register look correct in code now. Five repository getters are still wrong but unused today.

## Proposed next actions (after approval)

1. **This FE PR (small):**
   - #7: remove `activities/landing` from the forwarder allowlist and add the API-gap entry in `docs-changes.md`;
   - #9: add `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO` to `.env.example`.
   
   Then the gates, one commit, push.
2. **BE branch off origin/dev:** #1 (the five getters and repository tests), #3, #4. Owner to be decided: this is outside `src/client`, so CLAUDE.md scope needs your OK or another teammate.
3. **Infra:** #11 (Compose client service), after #4.
4. **Later features:** #5 is the next phase (E2E authentication); #6 is UC-06, which needs the AI path decision first.

## E2E slice (2026-11-28, branch `feat/e2e-auth`)

Real browser → Next FE → `/api/backend` → server → PostgreSQL. Gaps and shortcuts are recorded here.

### M1: backend up
- **DB init.** `src/db/docker-init/00-myhcmus.sh` runs on the first start of an empty `db` volume and applies the README order: `schema.sql` → `ai_schema.sql` → `seed.sql` → `hub_schema.sql`. Test scripts are never run. `src/db` is mounted read-only. The script is forced to LF by `.gitattributes`. To re-initialise, recreate the volume.
- **#4, partially fixed.**
  - Compose: the server also reads `db/.env` (`POSTGRES_USER` / `POSTGRES_PASSWORD`), and gets `POSTGRES_DB=myHCMUS` (the database `schema.sql` creates; `db/.env`'s `POSTGRES_DB` only names the bootstrap DB) and `AVATAR_STORAGE_DIRECTORY=/app/data/avatars` on an `avatars` volume.
  - The server waits for a healthy `db`.
  - `server/.env.example`: `POSTGRES_*` added, the unused `DATABASE_URL` removed, and `JWT_SECRET` marked as required.
  - The DB host is still hard-coded to `db` (`config.ts:22`), so it works in Compose only. Gap.
- **Local blockers found (not code):**
  - `JWT_SECRET` was empty in the local `server/.env`, which made login 500 ("secretOrPrivateKey must have a value"). It was set to a random value locally (the file is git-ignored).
  - The `node_modules` volume predated `sharp`. `npm install` in the container failed because **Avast Web/Mail Shield intercepts HTTPS**; it was installed with `NODE_EXTRA_CA_CERTS` pointing at Avast's exported public root, for that one run only, and nothing was committed.
- **#1 confirmed live.** `POST /api/auth/login` returns 200 + token for `admin@example.com`, `manager@example.com` and `student1@example.com` (`DemoPassword123!`); a wrong password gets 401. The token `sub` = the DB `user_id` (`SEED-ADMIN`), and `GET /api/v1/hub/services` with it returns 200.
- **#3 still present:** `/health` reports the database as up without querying it.

### M2: versioned auth (`/api/v1/auth`)
- **New layering:** `routes/SessionV1Route.ts` → `controllers/SessionController.ts` → `services/SessionService.ts` → `repositories/SessionRepository.ts`, plus the existing `ProfileRepository` for the profile body. It is mounted at `/api/v1/auth` before the legacy routes, and legacy `/api/auth/*` is unchanged (still 200).
- **Contract envelope:**
  - `POST /login` → `{ success, data: { token, expiresAt } }`. `401 INVALID_CREDENTIALS` for an unknown email **and** a wrong password (no enumeration, DOC-04), `403 ACCOUNT_DISABLED`, `400 VALIDATION_FAILED`.
  - `GET /me` → `{ success, data: { user: Profile + role (exactly one, else null), status, mustChangePassword, permissions, … } }`.
  - `POST /logout` → `{ success, message }`.
- **The same JWT as legacy:** `sub` = DB `user_id`, `name`, 1 h, `JWT_SECRET`, validated by the shared `validateAccessToken`.
- **Verified with curl** for admin, manager and student: login → `/me` (role, status, permission count) → logout. A wrong password and an unknown email both get `INVALID_CREDENTIALS`, and `/me` without a token gets 401. Unit tests: `tests/unit/SessionService.test.ts`, 5 / 5.
- **Gaps / shortcuts:**
  - **Logout has no server-side revocation** (there is no token store); the token stays valid until it expires (1 h). The FE clears it locally.
  - `mustChangePassword` is always `false` (no DB column; see M6).
  - An inactive account gets `403 ACCOUNT_DISABLED` from `/me` rather than DOC-01's `200 { status: 'inactive' }`.
  - There is no login lock (DOC-14).
  - Node's strip-only TypeScript in the container rejects constructor parameter properties, so classes use explicit fields as the rest of the server does.
  - nodemon does not see file changes through the Windows bind mount: restart the `server` container after a BE edit.
