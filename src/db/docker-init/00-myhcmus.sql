-- First-start database setup for docker compose. The Postgres image runs this file once,
-- only when the data volume is empty (fresh install or after `docker compose down -v`).
-- src/db is mounted at /db. ai_schema.sql is not run here: it needs an ai_password variable;
-- apply it by hand as described at the top of that file if you use the AI assistant.
\set ON_ERROR_STOP on
-- schema.sql creates "myHCMUS" and connects to it; the next files run in that database.
\i /db/schema.sql
\i /db/seed.sql
\i /db/hub_schema.sql
