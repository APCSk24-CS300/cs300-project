# Quickstart: University Services Hub in the 003 frontend (plan 005)

How to check the integrated hub in both modes.

**Backend and database setup**: [`src/specs/004-university-service-hub/quickstart.md`](../../../specs/004-university-service-hub/quickstart.md) §1–2. That file was written for dev's forwarder; the differences are listed in §3 below.

**References**:
- [coverage.md](./coverage.md): which test covers which spec 004 scenario;
- [plan.md](./plan.md): approved decisions;
- `../003-auth-dashboard-admin-users/docs-changes.md`: DOC-16, DOC-17 and DOC-18.

## 1. Automated gates (from `src/client`)

```bash
npx tsc --noEmit -p .
npx vitest run          # includes the MSW hub handler tests (src/mocks/handlers/hub.test.ts)
npm run lint
npm run build
cd ../.. && git diff --quiet origin/dev -- src/server src/db && echo "server/db identical to origin/dev"
```

## 2. Mock mode (default)

`.env.local`:

```
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

Run `npm run dev` and open **http://localhost:3000**. Use localhost, not a LAN IP: the MSW worker needs a secure context. The mock store migrates in place: an older browser store gains the hub links and keeps its users and sessions. `__myhcmusMock.reset()` restores the seed.

**Seed accounts**: password `demo2026` for all of them.

| Account | Role | Expected |
|---|---|---|
| `student1@example.invalid` | student | "University Services" in the side nav and on the dashboard; `/services` shows 6 links; `/admin/services` → `/forbidden` |
| `manager1@example.invalid` | manager | same as student |
| `admin@example.invalid` | administrator | also "Service Links" → `/admin/services` |

**Walkthrough** (check at 360 px and at desktop width):

1. **`/services` (UC-07):**
   - a loading skeleton, then 6 cards in this order: Moodle, Student Portal, Course Registration Portal, Special Programs Portal, Tuition Payment, Student Handbook 2025;
   - each card opens in a new tab;
   - the inactive "HCMUS" row is not shown.
2. **Signed out:**
   - `/services` → `/login?redirectTo=%2Fservices`; after sign-in you return to `/services`;
   - the landing `/#services` shows the locked preview.
3. **Signed in, landing `/#services`:** up to 6 live cards and "See all services".
4. **`/admin/services`** as the administrator:
   - **Add:** the dialog opens with focus on Name. Enter `javascript:alert(1)` as the URL → field error. Then add `E-learning` with `https://elearning.hcmus.edu.vn` → "Saved". It is listed and appears on `/services` for the student.
   - **Duplicate:** add ` MOODLE ` → "A service with this name already exists" on the Name field.
   - **Edit** Moodle's description → saved.
   - **Deactivate** → confirmation dialog → Inactive. It disappears from `/services` and stays in the list. **Reactivate** brings it back.
   - **412:** open the edit dialog on a link. In the console, bump its version: `__myhcmusMock` has no helper for this, so edit `localStorage["myhcmus:mock-db:v1"]`, or open a second tab and save the same link there first. Then save → "This link was changed by someone else…" with Reload.
5. **Failure switch:**
   - `__myhcmusMock.fail("listServices")` → `/services` shows the retryable error;
   - `__myhcmusMock.clearFailures()`, then Try again → the list loads;
   - `"manageServiceLinks"` does the same for the admin page.
6. **Forbidden:** run `__myhcmusMock.setRole(...)` or remove the permission in the store → the shared forbidden view.

## 3. Real mode (backend `src/server`)

**Blocked for the UI until the Authentication BE exists** (003 GAP-E, DOC-03/DOC-04):
- the backend has no DB-backed login and no `/api/v1/auth/me`;
- so the app cannot create a session in real mode, and the protected pages (`/services`, `/admin/services`) cannot be reached through the UI.

What *can* be checked now is the full transport path, from the forwarder to the hub BE, with a minted token (approved Q2).

**Database and backend:** follow the 004 quickstart §1–2 (`schema.sql`, `seed.sql`, then `hub_schema.sql`). Start the server: `cd src/server && npm start`, which listens on :8080.

**Mint tokens:**

```bash
cd src/server
A=$(node scripts/mint-dev-token.ts SEED-ADMIN)
S=$(node scripts/mint-dev-token.ts SEED-STUDENT-1)
```

**`src/client/.env.local`** (restart `npm run dev` after changing it):

```
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_BASE_URL=/api/backend
BACKEND_API_URL=http://localhost:8080/api/v1
ALLOW_DEV_BACKEND_TOKEN=false
DEV_BACKEND_TOKEN=
```

**Through the forwarder**, the same path the browser uses:

```bash
curl -s localhost:3000/api/backend/hub/services -H "Authorization: Bearer $S"                          # 200, 6 active links (ServiceResponse envelope)
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/backend/admin/services -H "Authorization: Bearer $S"   # 403 (student)
curl -s -i localhost:3000/api/backend/admin/services -H "Authorization: Bearer $A" | head -1             # 200 (administrator)
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/backend/hub/services                       # 401 (no token, forwarded as is)
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/api/backend/ai/chat                            # 404 (not on the allowlist)
```

**Dev fallback (opt-in, Q1):**
1. Set `ALLOW_DEV_BACKEND_TOKEN=true` and `DEV_BACKEND_TOKEN=$S`, then restart.
2. `curl localhost:3000/api/backend/hub/services` without a header now answers 200, and the dev-server console logs `[api/backend] DEV_BACKEND_TOKEN used for GET /hub/services …`.
3. The fallback is never used for `auth/*`, never when an `Authorization` header is present, and never with `NODE_ENV=production`.
4. Turn it off again when done.

**Config-only switch:** build in real mode, then run `git status`. There must be no changes under `src/app`, `src/components` or `src/features`.

### Differences from the 004 quickstart's forwarder section

- **No server-wide token.** The forwarder passes on the user's bearer. `DEV_BACKEND_TOKEN` is used only with `ALLOW_DEV_BACKEND_TOKEN=true` and only for requests without `Authorization`. In the 004 version it was sent on every request.
- **No early 401.** Without any token the forwarder no longer answers 401 itself; it forwards, and the backend answers 401.
- **Wider allowlist.** It covers the 003 auth and admin-users paths too, not only `hub/*` and `admin/services*`.
- **Mode switch.** It is `NEXT_PUBLIC_API_MODE=real` (`NEXT_PUBLIC_DATA_SOURCE=api` is still read as a fallback). `SESSION_SECRET` is unused.
