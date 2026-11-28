# Quickstart: Validate the Core Schema Constraint Test

Run only on an isolated, disposable PostgreSQL 18 instance. `db/schema.sql` creates a database named `myHCMUS`; do not run these commands against a shared or populated server.

## Prerequisites

- Docker with the PostgreSQL 18 image available, or an equivalent disposable PostgreSQL 18 instance.
- `psql` client.
- Run commands from the repository root.

## Run the verification

Start a temporary database server bound to localhost on an unused port:

```sh
docker run --rm --detach --name core-schema-constraints \
  -p 127.0.0.1:55433:5432 \
  -e POSTGRES_PASSWORD=temporary-test-only \
  postgres:18
```

Wait for PostgreSQL to accept connections:

```sh
until docker exec core-schema-constraints pg_isready -U postgres; do sleep 1; done
```

Load the bootstrap schema, which creates `myHCMUS`, then run the constraint suite:

```sh
PGPASSWORD=temporary-test-only psql -X -h 127.0.0.1 -p 55433 -U postgres \
  -v ON_ERROR_STOP=1 -d postgres -f db/schema.sql
PGPASSWORD=temporary-test-only psql -X -h 127.0.0.1 -p 55433 -U postgres \
  -v ON_ERROR_STOP=1 -d myHCMUS -f db/schema_constraints_test.sql
```

## Expected result and cleanup

- The schema load completes without SQL errors.
- The constraint suite reaches its completion assertion, confirms the expected schema entity inventory and valid fixtures, and reports no unexpected invalid-case result.
- The suite transaction rolls back, leaving no fixture rows.
- The container is disposable and can be removed after the run:

```sh
docker rm --force core-schema-constraints
```

If the verification fails, preserve the first error and its SQLSTATE; do not suppress it by omitting `ON_ERROR_STOP` or by weakening the expected rejection check.

## Recorded verification (2026-11-28)

- Loaded `db/schema.sql` on PostgreSQL 18.6 in a fresh disposable local cluster.
- `db/schema_constraints_test.sql` passed twice against the same database, including after identity sequences advanced; the inventory matched all 45 tables.
- After each successful run, the transaction rolled back and the `User`, `Activity`, and `Appeal` fixture counts were all zero.
