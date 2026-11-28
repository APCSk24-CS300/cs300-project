# Run the full system with Docker
**Worker:** Phan Minh Khôi  
**Reviewer(s):**  
**Editor(s):** Phan Minh Khôi

**Version:** 1.0.0  
**Amendment:** 28/11/2026
## Introduction
This guide runs the whole system on your machine with one command: the PostgreSQL database, the API Server (`:8080`) and the Next.js frontend (`:3000`). The first time you start it, the database builds itself from `schema.sql`, `seed.sql` and `hub_schema.sql`.

All commands are PowerShell, run from the `src` folder of the repository (that is where `docker-compose.yml` is). You need Docker Desktop. The first start takes about 5–10 minutes: it builds the server image and runs `npm install` for the frontend. Later starts take seconds.

| Service | Container | URL |
| --- | --- | --- |
| `db` | `myHCMUS-db` | `localhost:5432` |
| `server` | `myHCMUS-server` | http://localhost:8080 |
| `client` | `myHCMUS-client` | http://localhost:3000 |

## 1. Fill in the env files

The env files hold secrets, so never paste them into a chat or a PR. Copy the examples if you do not have them yet:

```powershell
Copy-Item db\.env.example db\.env
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env.local
```

**`db\.env`** (the database container). These values only create the container's own first database; the app's database `myHCMUS` is created by `schema.sql`.

```env
POSTGRES_DB=postgres
POSTGRES_USER=<a user name>
POSTGRES_PASSWORD=<choose a password>
```

**`server\.env`** (the API Server). The `POSTGRES_*` user and password must match `db\.env`, and the database name is always `myHCMUS`. Without these three lines the server cannot reach the database and answers `503`.

```env
BACKEND_PORT=8080
JWT_SECRET=<any long random string>
POSTGRES_USER=<same as db\.env>
POSTGRES_PASSWORD=<same as db\.env>
POSTGRES_DB=myHCMUS
```

Add `GEMINI_API_KEY` and the `AI_*` values only if you also want the AI assistant; see [ai-assistant-setup.md](ai-assistant-setup.md).

**`client\.env.local`** (the frontend). Choose mock or real data:

- **Mock** (no backend needed, data lives in the browser):
  ```env
  SESSION_SECRET=<any long random string>
  NEXT_PUBLIC_DATA_SOURCE=mock
  ```
- **Real** (frontend → API Server → database):
  ```env
  SESSION_SECRET=<any long random string>
  NEXT_PUBLIC_DATA_SOURCE=api
  NEXT_PUBLIC_API_BASE_URL=/api/backend
  API_BACKEND_URL=http://localhost:8080
  BACKEND_API_URL=http://localhost:8080/api/v1
  DEV_BACKEND_TOKEN=<see step 3>
  ```

Inside Docker, `docker-compose.yml` overrides `API_BACKEND_URL` and `BACKEND_API_URL` to `http://server:8080...`, because containers reach each other by service name, not `localhost`. Keep the `localhost` values in the file so `npm run dev` outside Docker still works.

Some feature branches use `NEXT_PUBLIC_API_MODE=mock|real` instead of `NEXT_PUBLIC_DATA_SOURCE`; check that branch's `client\.env.example`.

## 2. Start everything

```powershell
docker compose up
```

Or in VS Code, run the build task (Ctrl+Shift+B) if your `.vscode/tasks.json` has one that runs this command. Wait until:

- `myHCMUS-db` is `Healthy`,
- `myHCMUS-server` prints `Server is running at http://localhost:8080`,
- `myHCMUS-client` prints `Ready` (first time: after `npm install` finishes).

**First start only:** when the database volume is empty, Postgres runs `db/docker-init/00-myhcmus.sql`, which applies `schema.sql`, `seed.sql` and `hub_schema.sql` in that order. If the volume already has data, the log says `Skipping initialization` and nothing is changed. `ai_schema.sql` is not applied automatically because it needs a password variable; apply it by hand as described in [ai-assistant-setup.md](ai-assistant-setup.md).

Check the seed in a second terminal:

```powershell
docker exec myHCMUS-db psql -U <user from db\.env> -d myHCMUS -c 'SELECT name, is_active FROM "ServiceLink" ORDER BY display_order'
```

Expect 7 rows, the first 6 active.

## 3. Get a backend token (real mode only)

Until the Authentication group passes the signed-in user's token to every backend call, the `/api/backend` forwarder sends one dev-only token. Mint it for a seeded user; the last number is how many hours it lasts (default 8):

```powershell
docker exec myHCMUS-server node scripts/mint-dev-token.ts SEED-ADMIN 720
```

Paste the printed string into `DEV_BACKEND_TOKEN=` in `client\.env.local`, then restart the frontend:

```powershell
docker compose restart client
```

The role the backend sees comes from this token, not from who you log in as. Seeded user ids: `SEED-ADMIN`, `SEED-MANAGER`, `SEED-STUDENT-1`. To see the app as another role, mint a token for that user and restart the client again.

## 4. Log in and look around

Open http://localhost:3000.

- **Real mode:** the seeded accounts from [src/db/README.md](../../src/db/README.md), for example `admin@example.com`, `manager@example.com`, `student1@example.com`, all with password `DemoPassword123!`.
- **Mock mode:** the accounts in the mock data of your branch (`client/src/mocks` or `client/src/features/auth`).

Pages to try: `/services` (University Services, every role) and, as an administrator, `/admin/services` (add, edit, deactivate service links). Admin changes are written to `AuditLog`:

```powershell
docker exec myHCMUS-db psql -U <user> -d myHCMUS -c 'SELECT action, entity_id FROM "AuditLog" WHERE entity_type=''ServiceLink'''
```

## 5. Stop, restart, reset

| Goal | Command |
| --- | --- |
| Stop everything (data kept) | `docker compose down` |
| Restart one service | `docker compose restart client` (or `server`, `db`) |
| Rebuild the server image after `package.json` changes | `docker compose up --build` |
| Reinstall frontend packages | `docker compose down; docker volume rm myhcmus_client_node_modules; docker compose up` |
| **Wipe the database** and rebuild it from the SQL files | `docker compose down -v; docker compose up` |

`down -v` deletes all Docker volumes of this project, including the database data. Only use it on your own machine.

## Troubleshooting

- **`no configuration file provided: not found`**: you are not in `src`. Run `cd src` first.
- **Login fails or pages show `503`**: check `server\.env` has the three `POSTGRES_*` lines, then `docker compose restart server`.
- **`401 No backend token configured`**: set `DEV_BACKEND_TOKEN` (step 3) and restart the client. If it worked before, the token has expired; mint a new one.
- **`git status` shows `package-lock.json` or `public/mockServiceWorker.js` changed after a start**: the container's `npm install` rewrote them. Undo with `git checkout -- client/package-lock.json client/public/mockServiceWorker.js` before switching branches.
- **Edits in `client/` are not picked up**: the container watches by polling; wait a few seconds or run `docker compose restart client`.
