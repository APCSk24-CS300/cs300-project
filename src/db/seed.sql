-- Import 100 English-language university activities into PostgreSQL.
-- Run this file from the directory containing activities.csv.
--
-- Required command:
-- psql -d myHCMUS -v semester_id=YOUR_SEMESTER_ID \
--      -v creator_user_id='YOUR_EXISTING_USER_ID' \
--      -f insert_activities.sql
--
-- Prerequisites:
-- 1. Every organization_name in activities.csv must exist in "Organization"."name".
-- 2. Every category_name in activities.csv must exist in "ActivityCategory"."name".
-- 3. semester_id must exist in "Semester".
-- 4. creator_user_id must exist in "User".
--
-- The CSV intentionally uses organization/category names instead of guessed IDs.
-- organization_id and category_id are resolved against your existing reference rows.

\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE activity_import_stage (
    activity_id TEXT,
    organization_name TEXT,
    title TEXT,
    description TEXT,
    eligibility_notes TEXT,
    category_name TEXT,
    capacity INTEGER,
    registration_opens_at TIMESTAMPTZ,
    registration_closes_at TIMESTAMPTZ,
    status TEXT,
    approval_required BOOLEAN,
    attendance_rule TEXT,
    created_at TIMESTAMPTZ
) ON COMMIT DROP;

\copy activity_import_stage (activity_id, organization_name, title, description, eligibility_notes, category_name, capacity, registration_opens_at, registration_closes_at, status, approval_required, attendance_rule, created_at) FROM 'activities.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- Validate that all referenced organizations and categories can be resolved.
DO $$
DECLARE
    missing_orgs TEXT;
    missing_categories TEXT;
    missing_activities TEXT;
BEGIN
    SELECT string_agg(DISTINCT s.organization_name, ', ')
      INTO missing_orgs
      FROM activity_import_stage s
      LEFT JOIN "Organization" o ON o.name = s.organization_name AND o.is_active = TRUE
     WHERE o.organization_id IS NULL;

    SELECT string_agg(DISTINCT s.category_name, ', ')
      INTO missing_categories
      FROM activity_import_stage s
      LEFT JOIN "ActivityCategory" c ON c.name = s.category_name
     WHERE c.category_id IS NULL;

    SELECT string_agg(s.activity_id, ', ')
      INTO missing_activities
      FROM activity_import_stage s
      JOIN "Activity" a ON a.activity_id = s.activity_id;

    IF missing_orgs IS NOT NULL THEN
        RAISE EXCEPTION 'Missing active organizations in "Organization": %', missing_orgs;
    END IF;

    IF missing_categories IS NOT NULL THEN
        RAISE EXCEPTION 'Missing categories in "ActivityCategory": %', missing_categories;
    END IF;

    IF missing_activities IS NOT NULL THEN
        RAISE EXCEPTION 'These activity_id values already exist: %', missing_activities;
    END IF;
END $$;

-- semester_id and creator_user_id are supplied by psql command-line variables.
INSERT INTO "Activity" (
    activity_id,
    organization_id,
    title,
    description,
    eligibility_notes,
    category_id,
    semester_id,
    capacity,
    registration_opens_at,
    registration_closes_at,
    status,
    approval_required,
    attendance_rule,
    created_by_user_id,
    created_at
)
SELECT
    s.activity_id,
    o.organization_id,
    s.title,
    s.description,
    s.eligibility_notes,
    c.category_id,
    :'semester_id'::INTEGER,
    s.capacity,
    s.registration_opens_at,
    s.registration_closes_at,
    s.status,
    s.approval_required,
    s.attendance_rule,
    :'creator_user_id'::TEXT,
    s.created_at
FROM activity_import_stage s
JOIN "Organization" o
  ON o.name = s.organization_name
 AND o.is_active = TRUE
JOIN "ActivityCategory" c
  ON c.name = s.category_name
ORDER BY s.activity_id;

-- Confirm the number of inserted records.
SELECT COUNT(*) AS imported_activity_count
FROM "Activity"
WHERE activity_id LIKE 'ACT%';

COMMIT;
