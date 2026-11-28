# Run the full system with Docker
**Worker:** Phan Minh Khôi  
**Reviewer(s):**  
**Editor(s):** Phan Minh Khôi

**Version:** 1.0.0  
**Amendment:** 28/11/2026
## Introduction
This guide runs the whole system on your machine with one command: the PostgreSQL database, the API Server (`:8080`) and the Next.js frontend (`:3000`). The first time you start it, the database builds itself from the SQL files in `src/db`.

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

**`server\.env`** (the API Server). In Compose the server also reads `db\.env` for the database user and password, and the compose file sets `POSTGRES_DB=myHCMUS`, so you only need:

```env
BACKEND_PORT=8080
JWT_SECRET=<any long random string>
```

Fill `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB=myHCMUS` only if you run the server outside Docker. Add `GEMINI_API_KEY` and the `AI_*` values only if you also want the AI assistant; see [ai-assistant-setup.md](ai-assistant-setup.md).

**`client\.env.local`** (the frontend). Choose mock or real data:

- **Mock** (MSW in the browser; the backend is not called):
  ```env
  NEXT_PUBLIC_API_MODE=mock
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
  ```
- **Real** (frontend → `/api/backend` forwarder → API Server → database):
  ```env
  NEXT_PUBLIC_API_MODE=real
  NEXT_PUBLIC_API_BASE_URL=/api/backend
  BACKEND_API_URL=http://localhost:8080/api/v1
  ```

Inside Docker, `docker-compose.yml` overrides `BACKEND_API_URL` to `http://server:8080/api/v1`, because containers reach each other by service name, not `localhost`. Keep the `localhost` value in the file so `npm run dev` outside Docker still works. After changing `.env.local`, run `docker compose restart client`.

## 2. Start everything

```powershell
docker compose up
```

Or in VS Code: the `docker compose up` task in `.vscode/tasks.json` runs when you open the folder (allow automatic tasks once), or run it with Ctrl+Shift+B. It offers to start Docker Desktop if the engine is not running. Wait until:

- `myHCMUS-db` is `Healthy`,
- `myHCMUS-server` prints `Server is running at http://localhost:8080`,
- `myHCMUS-client` prints `Ready` (first time: after `npm install` finishes).

**First start only:** when the database volume is empty, Postgres runs `db/docker-init/00-myhcmus.sh`, which applies `schema.sql`, `ai_schema.sql`, `seed.sql` and `hub_schema.sql` in that order (never the `*_test.sql` files). If the volume already has data, the log says `Skipping initialization` and nothing is changed.

Check the seed in a second terminal:

```powershell
docker exec myHCMUS-db psql -U <user from db\.env> -d myHCMUS -c 'SELECT name, is_active FROM "ServiceLink" ORDER BY display_order'
```

Expect 7 rows, the first 6 active.

## 3. Log in and look around

Open http://localhost:3000.

- **Real mode:** the seeded accounts from [src/db/README.md](../../src/db/README.md): `admin@example.com`, `manager@example.com`, `student1@example.com`, all with password `DemoPassword123!`.
- **Mock mode:** `admin@example.invalid`, `manager1@example.invalid`, `student1@example.invalid`, all with password `demo2026`.

Pages to try: `/services` (University Services, every role) and, as an administrator, `/admin/services` (add, edit, deactivate service links). Admin changes are written to `AuditLog`:

```powershell
docker exec myHCMUS-db psql -U <user> -d myHCMUS -c 'SELECT action, entity_id FROM "AuditLog" WHERE entity_type=''ServiceLink'''
```

## 4. Stop, restart, reset

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
- **Login fails or pages show `503`** in real mode: check `db\.env` and `JWT_SECRET` in `server\.env`, then `docker compose restart server`. If the database was created before the auto-setup existed, reset it with `docker compose down -v; docker compose up`.
- **`git status` shows `package-lock.json` or `public/mockServiceWorker.js` changed after a start**: the container's `npm install` rewrote them. Undo with `git checkout -- client/package-lock.json client/public/mockServiceWorker.js` before switching branches.
- **Edits in `client/` are not picked up**: the container watches by polling; wait a few seconds or run `docker compose restart client`.
