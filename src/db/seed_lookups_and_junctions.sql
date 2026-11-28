-- Lookup values and junction-table data for the development dataset.
-- Included by seed.sql inside its transaction; do not run independently.
-- Lookups are inserted immediately. Junction inserts run after entity creation
-- through the session-local helper called by seed.sql.

INSERT INTO "Role" (role_id, code, name) VALUES
 (1, 'student', 'Student'), (2, 'manager', 'Manager'), (3, 'administrator', 'Administrator');
INSERT INTO "Permission" (permission_id, code, description) VALUES
 (1, 'registration.create', 'Register for activities'),
 (2, 'registration.review', 'Review registrations'),
 (3, 'activity.manage', 'Manage assigned activities'),
 (4, 'attendance.record', 'Record attendance'),
 (5, 'score.submit', 'Award training scores'),
 (6, 'score.adjust', 'Adjust training scores'),
 (7, 'appeal.submit', 'Submit requests and appeals'),
 (8, 'appeal.review', 'Review assigned appeals'),
 (9, 'criteria.manage', 'Manage scoring criteria'),
 (10, 'reports.view', 'View administrative reports'),
 (900, 'ai.chat', 'Use the AI assistant'),
 (901, 'ai.chat.manager_tools', 'Use event-planning tools'),
 (902, 'ai.usage.read', 'View AI usage'),
 (903, 'ai.flags.review', 'Review AI flags'),
 (904, 'ai.settings.manage', 'Manage AI settings'),
 (905, 'ai.knowledge.manage', 'Manage AI knowledge')
ON CONFLICT (permission_id) DO NOTHING;
INSERT INTO "Faculty" (faculty_id, code, name) VALUES
 ('SEED-FAC-MCS', 'MCS', 'Faculty of Mathematics and Computer Science'),
 ('SEED-FAC-IT', 'IT', 'Faculty of Information Technology');
INSERT INTO "Major" (major_id, faculty_id, name) VALUES
 ('SEED-MAJ-CS', 'SEED-FAC-MCS', 'Computer Science'),
 ('SEED-MAJ-SE', 'SEED-FAC-IT', 'Software Engineering');
INSERT INTO "Department" (department_id, code, name) VALUES
 ('SEED-DEP-CAREER', 'CAREER', 'Career Services Center'),
 ('SEED-DEP-AFFAIRS', 'AFFAIRS', 'Student Affairs Office');

-- Explicit organization/category lookup values, shared with the embedded activities.
CREATE TEMP TABLE seed_organizations (name TEXT, type TEXT) ON COMMIT DROP;
INSERT INTO seed_organizations (name, type) VALUES
 ('Academic Skills Club', 'club'),
 ('Arts and Culture Club', 'club'),
 ('Business and Economics Club', 'club'),
 ('Career Services Center', 'department'),
 ('Computer Science Club', 'club'),
 ('English Speaking Club', 'club'),
 ('Environmental Research Group', 'club'),
 ('Faculty of Mathematics and Computer Science', 'faculty'),
 ('Green Campus Club', 'club'),
 ('International Student Club', 'club'),
 ('Photography Club', 'club'),
 ('Robotics and AI Club', 'club'),
 ('Student Affairs Office', 'student_affairs_office'),
 ('Student Union', 'club'),
 ('Student Volunteer Network', 'club'),
 ('University Sports Club', 'club');
INSERT INTO "Organization" (name, type) SELECT name, type FROM seed_organizations ORDER BY name;
INSERT INTO "Club" (club_id, code, name)
SELECT 'SEED-CLUB-' || row_number() OVER (ORDER BY name),
       'CLUB-' || row_number() OVER (ORDER BY name), name
FROM seed_organizations WHERE type = 'club';
INSERT INTO "ActivityCategory" (category_id, name, description) VALUES
 (1, 'Academic Workshop', 'Activities in the academic workshop category.'),
 (2, 'Arts and Creativity', 'Activities in the arts and creativity category.'),
 (3, 'Career Development', 'Activities in the career development category.'),
 (4, 'Community Service', 'Activities in the community service category.'),
 (5, 'Cultural Event', 'Activities in the cultural event category.'),
 (6, 'Environmental Sustainability', 'Activities in the environmental sustainability category.'),
 (7, 'Health and Wellbeing', 'Activities in the health and wellbeing category.'),
 (8, 'Leadership and Personal Development', 'Activities in the leadership and personal development category.'),
 (9, 'Sports and Recreation', 'Activities in the sports and recreation category.'),
 (10, 'Technology and Innovation', 'Activities in the technology and innovation category.');
-- schema.sql already supplies these statuses; also tolerate a database without them.
INSERT INTO "AppealStatus" (code, name) VALUES
 ('pending_assignment', 'Pending Assignment'), ('pending_review', 'Pending Review'),
 ('under_review', 'Under Review'), ('additional_information_required', 'Additional Information Required'),
 ('approved', 'Approved'), ('rejected', 'Rejected'), ('withdrawn', 'Withdrawn')
ON CONFLICT (code) DO NOTHING;
INSERT INTO "Semester" (semester_id, quarter_academic_year, starts_at, ends_at)
VALUES (20261, '12026', '2026-09-01', '2027-01-31');
INSERT INTO "ScoreCriterion" (code, name, description) VALUES
 ('SEED-COMMUNITY', 'Community engagement', 'Demo community-service scoring criterion.'),
 ('SEED-ACADEMIC', 'Academic development', 'Demo academic-development scoring criterion.');
INSERT INTO "ScoringPolicyVersion"
 (criterion_id, semester_id, activation_at, weight, min_points, max_points, semester_cap)
SELECT criterion_id, 20261, '2026-09-01 00:00+07', 1, 0, 10, 30
FROM "ScoreCriterion" WHERE code LIKE 'SEED-%';


INSERT INTO "ServiceLink" (name, url, description, display_order) VALUES
 ('HCMUS', 'https://hcmus.edu.vn', 'University website', 1),
 ('Student Portal', 'https://portal.hcmus.edu.vn', 'Student academic services', 2);
INSERT INTO "SystemSetting" (setting_key, setting_value, updated_at) VALUES
 ('app.name', 'myHCMUS', '2026-09-01 08:00+07'),
 ('semester.current_id', '20261', '2026-09-01 08:00+07'),
 ('seed.dataset_version', '2026-11-v1', CURRENT_TIMESTAMP);

CREATE FUNCTION pg_temp.seed_junctions() RETURNS VOID
LANGUAGE plpgsql AS $junctions$
DECLARE table_name TEXT; row_count BIGINT;
BEGIN
 INSERT INTO "RolePermission" (role_id, permission_id)
 SELECT r.role_id, p.permission_id FROM "Role" r CROSS JOIN "Permission" p
 WHERE (r.code = 'student' AND p.code IN ('registration.create', 'appeal.submit', 'ai.chat'))
  OR (r.code = 'manager' AND p.code IN ('registration.review', 'activity.manage', 'attendance.record',
      'score.submit', 'score.adjust', 'appeal.review', 'ai.chat', 'ai.chat.manager_tools'))
  OR (r.code = 'administrator' AND p.code IN ('criteria.manage', 'reports.view',
      'ai.usage.read', 'ai.flags.review', 'ai.settings.manage', 'ai.knowledge.manage'))
 ON CONFLICT DO NOTHING;
 INSERT INTO "UserRole" (user_id, role_id, granted_by_user_id, granted_at)
 SELECT u.user_id, r.role_id, 'SEED-ADMIN', '2026-09-01 08:00+07'
 FROM "User" u JOIN "Role" r ON r.code = CASE
  WHEN u.user_id = 'SEED-ADMIN' THEN 'administrator'
  WHEN u.user_id = 'SEED-MANAGER' THEN 'manager' ELSE 'student' END
 WHERE u.user_id LIKE 'SEED-%';
 INSERT INTO "OrganizationMember" (organization_id, user_id, responsibility, starts_at)
 SELECT organization_id, 'SEED-MANAGER', 'Activity coordinator', '2026-09-01 08:00+07'
 FROM "Organization" WHERE name IN (SELECT name FROM seed_organizations);
 INSERT INTO "UserInterest" (user_id, category_id)
 SELECT s.user_id, c.category_id FROM "Student" s CROSS JOIN "ActivityCategory" c
 WHERE s.user_id LIKE 'SEED-%' AND c.name IN ('Academic Workshop', 'Community Service');
 INSERT INTO "ActivityManage" (activity_id, user_id)
 SELECT activity_id, 'SEED-MANAGER' FROM "Activity"
 WHERE created_by_user_id = 'SEED-MANAGER';
 INSERT INTO "ActivityEligibility" (activity_id, faculty_id)
 SELECT a.activity_id, f.faculty_id FROM "Activity" a CROSS JOIN "Faculty" f
 WHERE a.created_by_user_id = 'SEED-MANAGER' AND f.faculty_id LIKE 'SEED-%';
 INSERT INTO "ActivityScore" (activity_id, policy_version_id, base_points)
 SELECT a.activity_id, p.policy_version_id, 5
 FROM "Activity" a JOIN "ScoringPolicyVersion" p ON p.semester_id = a.semester_id
 JOIN "ScoreCriterion" c ON c.criterion_id = p.criterion_id
 WHERE a.created_by_user_id = 'SEED-MANAGER' AND c.code = 'SEED-COMMUNITY';
 INSERT INTO "ActivityFollow" (user_id, activity_id, followed_at)
 SELECT s.user_id, a.activity_id, '2026-11-20 09:00+07'
 FROM "Student" s CROSS JOIN "Activity" a
 WHERE s.user_id LIKE 'SEED-%' AND a.activity_id IN ('ACT001', 'ACT008');
 INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id, recorded_at)
 SELECT s.schedule_id, r.registration_id, r.activity_id,
  CASE WHEN r.user_id = 'SEED-STUDENT-1' THEN 'attended' ELSE 'absent' END,
  'SEED-MANAGER', s.ends_at
 FROM "Registration" r JOIN "ActivitySchedule" s ON s.activity_id = r.activity_id
 WHERE r.activity_id = 'SEED-ACT-COMPLETED';
 INSERT INTO "RequestAssignment" (appeal_id, manager_user_id, assigned_by_user_id, assigned_at, ended_at)
 SELECT appeal_id, 'SEED-MANAGER', 'SEED-ADMIN',
  CASE type
   WHEN 'recognition' THEN '2026-11-14 10:00+07'::timestamptz
   WHEN 'participation_correction' THEN '2026-11-14 11:30+07'::timestamptz
   ELSE '2026-11-17 10:00+07'::timestamptz END,
  reviewed_at
 FROM "Appeal" WHERE submitted_by_user_id IN ('SEED-STUDENT-1', 'SEED-STUDENT-2');
 UPDATE "SystemSetting" SET updated_by_user_id = 'SEED-ADMIN'
 WHERE setting_key IN ('app.name', 'semester.current_id', 'seed.dataset_version');
 -- Report coverage and fail atomically if any base-schema table has no rows.
  FOREACH table_name IN ARRAY ARRAY[
    'Role', 'Permission', 'RolePermission', 'Faculty',
    'Major', 'Department', 'Club', 'Organization',
    'ActivityCategory', 'AppealStatus', 'Semester', 'ScoreCriterion',
    'ScoringPolicyVersion', 'User', 'UserRole', 'Student',
    'Manager', 'Administrator', 'OrganizationMember', 'UserInterest',
    'Activity', 'ActivityManage', 'ActivityFollow', 'ActivitySchedule',
    'ActivityEligibility', 'ActivityScore', 'Registration', 'Attendance',
    'Participation', 'Appeal', 'RequestAssignment', 'RequestRevision',
    'RecognitionRequestDetail', 'Recognition', 'TrainingScore', 'ScoreChange',
    'ScoreAdjustment', 'AppealEvidence', 'ActivityAnnouncement', 'Notification',
    'NotificationDelivery', 'ServiceLink', 'SystemSetting', 'AuditLog',
    'RefreshToken'
  ] LOOP
    EXECUTE format('SELECT count(*) FROM %I', table_name) INTO row_count;
    IF row_count = 0 THEN RAISE EXCEPTION 'Seed left table % empty', table_name; END IF;
    RAISE NOTICE '%: % rows', table_name, row_count;
  END LOOP;
 SELECT count(*) INTO row_count FROM "Activity" a
 JOIN activity_import_stage s USING (activity_id);
 IF row_count <> 100 THEN RAISE EXCEPTION 'Expected 100 embedded activities, got %', row_count; END IF;
 RAISE NOTICE 'Imported original activities: %', row_count;
END;
$junctions$;
