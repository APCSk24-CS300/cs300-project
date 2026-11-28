#!/bin/sh
# First-start initialisation for the Compose `db` service (runs once, on an empty data volume).
# Applies the documented order from src/db/README.md:
#   schema.sql (creates and connects to "myHCMUS") → ai_schema.sql → seed.sql → hub_schema.sql
# Test scripts (*_test.sql) are never run here. The SQL files are mounted read-only at /myhcmus-db.
set -eu

PSQL="psql -v ON_ERROR_STOP=1 --username $POSTGRES_USER"

$PSQL --dbname postgres -f /myhcmus-db/schema.sql
$PSQL --dbname myHCMUS -f /myhcmus-db/ai_schema.sql
$PSQL --dbname myHCMUS -f /myhcmus-db/seed.sql
$PSQL --dbname myHCMUS -f /myhcmus-db/hub_schema.sql

echo "myHCMUS: schema, AI schema, seed and hub schema applied"
