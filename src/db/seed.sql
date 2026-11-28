-- Activate the complete development/demo dataset on a fresh schema.
-- Run from any directory: psql -d myHCMUS -f /path/to/seed.sql
-- Apply schema.sql first; optionally apply ai_schema.sql before this file.
-- All data is embedded in the three subscripts; no CSV files are required.
-- Conflicts fail and roll back the entire seed.
\set ON_ERROR_STOP on

BEGIN;

\ir seed_lookups_and_junctions.sql
\ir seed_entities.sql

-- Junction foreign keys require the entity rows to exist first.
SELECT pg_temp.seed_junctions();
DROP FUNCTION pg_temp.seed_junctions();
\ir seed_ai.sql

COMMIT;
