# Quickstart: University Services Hub

How to check the feature once it is implemented.

## 1. Database

```bash
cd src
docker compose up -d db
# schema.sql and ai_schema.sql already applied; then:
docker exec -i myHCMUS-db psql -U "$POSTGRES_USER" -d myHCMUS < db/hub_schema.sql
docker exec -i myHCMUS-db psql -U "$POSTGRES_USER" -d myHCMUS -c 'SELECT name, is_active, version FROM "ServiceLink" ORDER BY display_order;'
```

Run it after `seed.sql`. Expect 7 rows, 6 active (the HCMUS website row from `seed.sql` is kept but inactive); see data-model.md. If `hub_schema.sql` ran before `seed.sql`, run it once more so the seeded roles get the hub permissions and the seeded rows are updated. Running `hub_schema.sql` a second time changes nothing. Constraint checks:

```bash
docker exec -i myHCMUS-db psql -U "$POSTGRES_USER" -d myHCMUS -v ON_ERROR_STOP=1 < db/hub_schema_test.sql
```

## 2. Backend

```bash
docker compose up -d server
cd server && npm test        # unit + integration, no DB needed (fakes)
```

Mint dev tokens for users that exist in the `User` table (one per role):

```bash
node scripts/mint-dev-token.ts <studentUserId>
node scripts/mint-dev-token.ts <adminUserId>
```

Try the API:

```bash
T=<student token>; A=<admin token>
curl -s localhost:8080/api/v1/hub/services -H "Authorization: Bearer $T"            # 200, 4 items
curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/api/v1/admin/services -H "Authorization: Bearer $T"   # 403
curl -s -i -X POST localhost:8080/api/v1/admin/services -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d '{"name":"E-learning","url":"https://elearning.hcmus.edu.vn"}'      # 201, ETag "1"
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:8080/api/v1/admin/services -H "Authorization: Bearer $A" \
  -H 'Content-Type: application/json' -d '{"name":"x","url":"javascript:alert(1)"}'                         # 400
```

## 3. Frontend, mock mode (no backend)

```bash
cd src/client && npm run dev     # NEXT_PUBLIC_DATA_SOURCE unset → mock; SESSION_SECRET must be set in .env.local
```

- `/` signed out: services section locked, "Log in for more".
- Log in as `nguyenvana@gmail.com` / `123456` (role Student): landing cards are clickable; sidebar has University Services; `/services` lists the mock services.
- Log in as `admin.work@gmail.com` / `123456` (role Admin): `/admin/services` lists all, add/edit/deactivate work against the in-memory mock.

## 4. Frontend, api mode (end to end)

`src/client/.env.local`:

```
SESSION_SECRET=<any long random string>
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=/api/backend
BACKEND_API_URL=http://localhost:8080/api/v1
DEV_BACKEND_TOKEN=<token from: cd src/server && node scripts/mint-dev-token.ts SEED-ADMIN>
```

Login/logout belong to the Authentication group and are not changed here. The forwarding route sends `DEV_BACKEND_TOKEN` on every request, so the backend role is the role of the user the token was minted for. To switch role, mint a token for another seeded user (e.g. `SEED-STUDENT-1`), put it in `.env.local` and restart `npm run dev`.

1. With an admin token, open `/admin/services` and add "HCMUS Library" active.
2. Switch to a student token: it shows on `/services` and the landing page.
3. Switch back to admin and deactivate it: gone for the student after reload.
4. Open the same link in two admin tabs, save in both: the second shows the "changed by someone else" message.
5. `SELECT action, entity_id, reason FROM "AuditLog" WHERE entity_type='ServiceLink' ORDER BY audit_id;` shows one row per change.
6. Stop the server container and reload `/services`: retryable error; start it and press Retry.

## 5. Checks

```bash
cd src/client && npm test && npm run lint && npx tsc --noEmit
cd src/server && npm test && npx tsc --noEmit
```
