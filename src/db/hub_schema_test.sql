-- Constraint checks for hub_schema.sql. Run after schema.sql and hub_schema.sql with ON_ERROR_STOP=1.
-- The transaction leaves no test rows behind.
BEGIN;

CREATE FUNCTION pg_temp.expect_sqlstate(statement TEXT, expected TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE actual TEXT;
BEGIN
    BEGIN
        EXECUTE statement;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS actual = RETURNED_SQLSTATE;
        IF actual <> expected THEN
            RAISE EXCEPTION 'Expected SQLSTATE %, got % for %', expected, actual, statement;
        END IF;
        RETURN;
    END;
    RAISE EXCEPTION 'Expected SQLSTATE % but statement succeeded: %', expected, statement;
END $$;

INSERT INTO "ServiceLink" (name, url) VALUES ('Hub Test Link', 'https://test.example.edu');
SELECT pg_temp.expect_sqlstate('INSERT INTO "ServiceLink" (name, url) VALUES (''x1'', ''javascript:alert(1)'')', '23514');
SELECT pg_temp.expect_sqlstate('INSERT INTO "ServiceLink" (name, url) VALUES (''x2'', ''ftp://files.example.edu'')', '23514');
SELECT pg_temp.expect_sqlstate('INSERT INTO "ServiceLink" (name, url) VALUES ('' hub test LINK '', ''https://other.example.edu'')', '23505');
SELECT pg_temp.expect_sqlstate('INSERT INTO "ServiceLink" (name, url, display_order) VALUES (''x3'', ''https://a.example.edu'', -1)', '23514');
SELECT pg_temp.expect_sqlstate('INSERT INTO "ServiceLink" (name, url, display_order) VALUES (''x4'', ''https://a.example.edu'', 10000)', '23514');
SELECT pg_temp.expect_sqlstate('INSERT INTO "ServiceLink" (name, url, description) VALUES (''x5'', ''https://a.example.edu'', repeat(''d'', 501))', '23514');
SELECT pg_temp.expect_sqlstate('UPDATE "ServiceLink" SET version = 0 WHERE name = ''Hub Test Link''', '23514');

DO $$
BEGIN
    IF (SELECT version FROM "ServiceLink" WHERE name = 'Hub Test Link') <> 1 THEN
        RAISE EXCEPTION 'New links must start at version 1';
    END IF;
    IF (SELECT count(*) FROM "Permission" WHERE code IN ('hub.services.read', 'hub.services.manage')) <> 2 THEN
        RAISE EXCEPTION 'Hub permissions missing';
    END IF;
END $$;

ROLLBACK;
