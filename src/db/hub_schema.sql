-- University Services Hub (specs/004-university-service-hub/data-model.md).
-- Run after schema.sql, connected to myHCMUS. Works before or after seed.sql; if run before, run it again
-- after seed.sql so the hub permissions reach the seeded roles:
--   psql -h localhost -U <user> -d myHCMUS -v ON_ERROR_STOP=1 -f db/hub_schema.sql
-- Safe to run more than once. Only adds to "ServiceLink"; existing rows keep their values and get version 1.

BEGIN;

-- Stop with a clear message, before changing anything, if existing rows would break the new checks.
DO $$
DECLARE bad TEXT;
BEGIN
    SELECT string_agg(service_id::text || ' (' || name || ')', ', ') INTO bad
    FROM "ServiceLink"
    WHERE url !~* '^https?://' OR length(url) > 2048
       OR length(btrim(name)) > 100
       OR (description IS NOT NULL AND length(description) > 500)
       OR display_order NOT BETWEEN 0 AND 9999;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'ServiceLink rows break the hub rules, fix them first: %', bad;
    END IF;

    SELECT string_agg(k, ', ') INTO bad
    FROM (SELECT lower(btrim(name)) AS k FROM "ServiceLink" GROUP BY 1 HAVING count(*) > 1) d;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'ServiceLink names differ only by case or spaces, rename them first: %', bad;
    END IF;
END $$;

-- Optimistic concurrency for admin edits (ETag / If-Match).
ALTER TABLE "ServiceLink" ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_link_url_http') THEN
        ALTER TABLE "ServiceLink" ADD CONSTRAINT service_link_url_http
            CHECK (url ~* '^https?://' AND length(url) <= 2048);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_link_name_length') THEN
        ALTER TABLE "ServiceLink" ADD CONSTRAINT service_link_name_length
            CHECK (length(btrim(name)) <= 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_link_description_length') THEN
        ALTER TABLE "ServiceLink" ADD CONSTRAINT service_link_description_length
            CHECK (description IS NULL OR length(description) <= 500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_link_display_order_range') THEN
        ALTER TABLE "ServiceLink" ADD CONSTRAINT service_link_display_order_range
            CHECK (display_order BETWEEN 0 AND 9999);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_link_version_positive') THEN
        ALTER TABLE "ServiceLink" ADD CONSTRAINT service_link_version_positive CHECK (version >= 1);
    END IF;
END $$;

-- "Moodle" and "moodle " are the same service.
CREATE UNIQUE INDEX IF NOT EXISTS service_link_name_ci ON "ServiceLink" (lower(btrim(name)));
-- The hub list: active links in display order.
CREATE INDEX IF NOT EXISTS service_link_active_order ON "ServiceLink" (is_active, display_order, lower(name));

-- Permissions. IDs 910-919 are reserved for the hub.
INSERT INTO "Permission" (permission_id, code, description) VALUES
    (910, 'hub.services.read',   'View the University Services Hub'),
    (911, 'hub.services.manage', 'Add, edit, deactivate and reactivate university service links')
ON CONFLICT (permission_id) DO NOTHING;

INSERT INTO "RolePermission" (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM "Role" r
JOIN "Permission" p ON
       (r.code IN ('student', 'manager', 'administrator') AND p.code = 'hub.services.read')
    OR (r.code = 'administrator' AND p.code = 'hub.services.manage')
ON CONFLICT DO NOTHING;

-- The six HCMUS service links. seed.sql (PR #103) already inserts "HCMUS" and "Student Portal"
-- without ON CONFLICT, so this file must not insert those names (seed.sql would fail if run after it).
-- Instead it fixes those two rows in place, only while they still hold seed.sql's original values,
-- so an admin's later edits are never overwritten when this file is re-run.
UPDATE "ServiceLink"
   SET url = 'https://student.hcmus.edu.vn/login',
       description = 'Student information, timetable and grades',
       display_order = 2
 WHERE name = 'Student Portal' AND url = 'https://portal.hcmus.edu.vn';

-- The university website is not one of the six hub links: kept (links are never deleted) but inactive.
UPDATE "ServiceLink"
   SET is_active = FALSE,
       display_order = 7
 WHERE name = 'HCMUS' AND url = 'https://hcmus.edu.vn' AND is_active;

INSERT INTO "ServiceLink" (name, url, description, display_order, is_active) VALUES
    ('Moodle',                     'https://courses.ctda.hcmus.edu.vn/',          'Courses, assignments and lecture materials',  1, TRUE),
    ('Course Registration Portal', 'https://new-portal4.hcmus.edu.vn/Login.aspx', 'Course registration, timetable and results',  3, TRUE),
    ('Special Programs Portal',    'https://portal.ctdb.hcmus.edu.vn/Login',      'Portal for special training programs',        4, TRUE),
    ('Tuition Payment',            'https://hocphi.hcmus.edu.vn/',                'Pay tuition and check payment status',        5, TRUE),
    ('Student Handbook 2025',      'https://hcmus.edu.vn/wp-content/uploads/2025/08/STSV2025_ONLINE.pdf', 'Rules, procedures and student support (PDF)', 6, TRUE)
ON CONFLICT DO NOTHING;

-- Permissions can only be granted to roles that exist. On a fresh schema the roles come from seed.sql,
-- so if this file ran first, run it once more after seed.sql (it is safe to re-run).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Role") THEN
        RAISE NOTICE 'No roles yet: hub permissions were not granted. Run hub_schema.sql again after seed.sql.';
    END IF;
END $$;

COMMIT;
