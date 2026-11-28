# AI Student Assistant setup
**Worker:** Phan Minh Khôi  
**Reviewer(s):**  
**Editor(s):** Phan Minh Khôi

**Version:** 1.0.0  
**Amendment:** 28/11/2026
## Introduction
This guide sets up the AI Student Assistant (`POST /api/ai/chat`) on your own machine with Docker and checks that it answers. Each team member uses their **own** Gemini API key. The design is in [ai-chatbot-design.md](../analysis-and-design/ai-chatbot/ai-chatbot-design.md) and the spec in `src/specs/003-ai-assistant-safety`.

All commands are PowerShell (5.1 or 7), run from the `src` folder of the repository. SQL is piped into `psql` so the table-name quotes survive PowerShell. It takes about 15 minutes.

## 1. Get a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in with a personal Google account.
2. Select **Create API key**, accept the terms, and copy the key (it starts with `AIza`).
3. Keep it private. Never paste it into a committed file, a chat or a PR. If it leaks, delete it in AI Studio and create a new one.

The free tier is enough for development. It has per-minute and per-day limits; when you hit them the assistant answers `503` and you wait.

## 2. Fill in the env files

Both files are ignored by git. Copy the examples if you do not have them yet:

```powershell
Copy-Item db\.env.example db\.env
Copy-Item server\.env.example server\.env
```

**`db\.env`** (the database container):

```env
POSTGRES_DB=postgres
POSTGRES_USER=myhcmus
POSTGRES_PASSWORD=<choose a password>
```

**`server\.env`** (the API Server). The `POSTGRES_*` user and password must match `db\.env`; the database name is always `myHCMUS`.

```env
BACKEND_PORT=8080
JWT_SECRET=<any long random text>

POSTGRES_USER=myhcmus
POSTGRES_PASSWORD=<same as db\.env>
POSTGRES_DB=myHCMUS

GEMINI_API_KEY=<your key from step 1>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BACKUP_MODEL=gemini-2.5-flash

AI_HISTORY_SECRET=<32 or more random characters>
AI_DB_USER=ai_gateway
AI_DB_PASSWORD=<choose a password for the AI database role>
GEMINI_CLASSIFIER_MODEL=gemini-2.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

To generate random text for `JWT_SECRET` and `AI_HISTORY_SECRET`:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
```

## 3. Start the containers

```powershell
docker compose up -d --build
docker compose run --rm server npm install
docker compose restart server
```

The `npm install` step refreshes the `node_modules` volume, which Docker does not update on rebuild. Skip it if the server starts without `Cannot find package` errors.

Check: `docker compose ps` shows `myHCMUS-db` as healthy, and http://localhost:8080/health returns `"status":"healthy"`.

## 4. Build the database

Copy the SQL files into the database container, then run them in this order. Replace `myhcmus` with your `POSTGRES_USER` and `<AI_DB_PASSWORD>` with the value from `server\.env`.

```powershell
docker cp .\db myHCMUS-db:/tmp/db
docker compose exec db psql -U myhcmus -d postgres -v ON_ERROR_STOP=1 -f /tmp/db/schema.sql
docker compose exec db psql -U myhcmus -d myHCMUS  -v ON_ERROR_STOP=1 -v ai_password="'<AI_DB_PASSWORD>'" -f /tmp/db/ai_schema.sql
docker compose exec db psql -U myhcmus -d myHCMUS  -v ON_ERROR_STOP=1 -f /tmp/db/seed.sql
docker compose exec db psql -U myhcmus -d myHCMUS  -v ON_ERROR_STOP=1 -f /tmp/db/hub_schema.sql
```

- `ai_schema.sql` runs before `seed.sql` so the seed also loads the AI demo rows. The other order works too; if you run `ai_schema.sql` after the seed, nothing is lost. Running `ai_schema.sql` again is safe.
- The `ai_password` value keeps both quote pairs: double quotes outside, single quotes inside.
- If `schema.sql` fails with `database "myHCMUS" already exists`, you have an old database. To start over, run `'DROP DATABASE "myHCMUS";' | docker compose exec -T db psql -U myhcmus -d postgres` and repeat this step. This deletes all local data in it.

Check that the AI part is installed:

```powershell
'SELECT setting_key, setting_value FROM "SystemSetting" WHERE setting_key LIKE ''ai.%'' ORDER BY 1;' |
  docker compose exec -T db psql -U myhcmus -d myHCMUS
```

You should see 16 rows, including `ai.enabled = true`.

## 5. Get a test token

Backend login does not issue tokens for seeded users yet, so use the dev token script with a seeded user id:

```powershell
$token = (docker compose exec -T server node scripts/mint-dev-token.ts SEED-STUDENT-1).Trim()
```

Seeded users: `SEED-STUDENT-1` to `SEED-STUDENT-3` (students), `SEED-MANAGER` (manager), `SEED-ADMIN` (administrator, cannot chat).

## 6. Ask the assistant

```powershell
$body = @{ message = "Which volunteer activities can I join this semester?" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/ai/chat `
  -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body |
  ConvertTo-Json -Depth 5
```

A working setup returns `"success": true`, `"blocked": false`, a `reply` from Gemini and a `request_id`. Each question adds one row to the usage log:

```powershell
'SELECT created_at, user_id, outcome, input_tokens, output_tokens FROM "AiRequestLog" ORDER BY created_at DESC LIMIT 5;' |
  docker compose exec -T db psql -U myhcmus -d myHCMUS
```

To try the kill switch, set `ai.enabled` to `false`, wait 10 seconds and ask again: the reply is "The assistant is temporarily unavailable" and Gemini is not called. Set it back to `true` afterwards.

```powershell
'UPDATE "SystemSetting" SET setting_value = ''false'' WHERE setting_key = ''ai.enabled'';' |
  docker compose exec -T db psql -U myhcmus -d myHCMUS
```

## 7. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `401` | Missing or expired token, or `JWT_SECRET` changed after the token was made. Run step 5 again. |
| `403` | The user has no `ai.chat` permission. Use a student or manager id, and check that `ai_schema.sql` ran (step 4). |
| `503` and the server log says `settings_unavailable` | The server cannot connect as `ai_gateway`. `AI_DB_PASSWORD` in `server\.env` must equal the `ai_password` used in step 4; rerun `ai_schema.sql` with the right value, then `docker compose restart server`. |
| `503` on every question, settings are fine | Gemini rejected the call: wrong or missing `GEMINI_API_KEY`, or the free-tier quota is used up. Check the key in AI Studio, or wait. |
| Changes to `server\.env` have no effect | Containers read env files only when created: `docker compose up -d --force-recreate server`. |
| `Cannot find package 'pg'` | Run `docker compose run --rm server npm install`, then restart the server. |
| `429` | More than 10 questions in a minute from one user. Wait a minute. |

Never run `docker compose down -v`: it deletes the database volume.
