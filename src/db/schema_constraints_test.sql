-- Run after schema.sql in a disposable myHCMUS database with ON_ERROR_STOP=1.
-- The transaction leaves no test fixtures behind.
BEGIN;

CREATE FUNCTION expect_sqlstate(statement TEXT, expected TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    actual TEXT;
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

-- Confirm the test inventory names every table in the current executable schema.
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'Activity', 'ActivityAnnouncement', 'ActivityCategory', 'ActivityEligibility',
        'ActivityFollow', 'ActivityManage', 'ActivitySchedule', 'ActivityScore',
        'Administrator', 'Appeal', 'AppealEvidence', 'AppealStatus', 'AuditLog',
        'Attendance', 'Club', 'Department', 'Faculty', 'Major', 'Manager',
        'Notification', 'NotificationDelivery', 'Organization', 'OrganizationMember',
        'Participation', 'Permission', 'Recognition', 'RecognitionRequestDetail',
        'RefreshToken', 'Registration', 'RequestAssignment', 'RequestRevision',
        'Role', 'RolePermission', 'ScoreAdjustment', 'ScoreChange', 'ScoreCriterion',
        'ScoringPolicyVersion', 'Semester', 'ServiceLink', 'Student',
        'SystemSetting', 'TrainingScore', 'User', 'UserInterest', 'UserRole'
    ];
    actual_tables TEXT[];
    missing_tables TEXT;
    unexpected_tables TEXT;
BEGIN
    SELECT array_agg(tablename::TEXT ORDER BY tablename)
      INTO actual_tables
      FROM pg_tables
     WHERE schemaname = 'public';

    SELECT string_agg(name, ', ' ORDER BY name)
      INTO missing_tables
      FROM unnest(expected_tables) AS expected(name)
     WHERE NOT (name = ANY(COALESCE(actual_tables, ARRAY[]::TEXT[])));

    SELECT string_agg(name, ', ' ORDER BY name)
      INTO unexpected_tables
      FROM unnest(COALESCE(actual_tables, ARRAY[]::TEXT[])) AS actual(name)
     WHERE NOT (name = ANY(expected_tables));

    IF missing_tables IS NOT NULL OR unexpected_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Schema table inventory mismatch. Missing: %. Unexpected: %.',
            COALESCE(missing_tables, '(none)'), COALESCE(unexpected_tables, '(none)');
    END IF;
END $$;

-- GROUP 1: current reference, access, and account/profile fixtures.
INSERT INTO "Role" (role_id, code, name) VALUES
    (1, 'student', 'Student'),
    (2, 'manager', 'Manager'),
    (3, 'administrator', 'Administrator');

INSERT INTO "Permission" (permission_id, code) VALUES
    (1, 'activity.manage'),
    (2, 'appeal.review'),
    (3, 'registration.create');

INSERT INTO "RolePermission" (role_id, permission_id) VALUES
    (1, 3), (2, 1), (2, 2);

INSERT INTO "Faculty" (faculty_id, code, name) VALUES
    ('F1', 'F1', 'Faculty One'),
    ('F2', 'F2', 'Faculty Two');

INSERT INTO "Major" (major_id, faculty_id, name)
VALUES ('M1', 'F1', 'Major One');

INSERT INTO "Department" (department_id, code, name)
VALUES ('D1', 'D1', 'Department One');

INSERT INTO "Club" (club_id, code, name)
VALUES ('C1', 'C1', 'Club One');

INSERT INTO "Organization" (name, type)
VALUES ('Test Organization', 'club');

INSERT INTO "ActivityCategory" (category_id, name)
VALUES (1, 'Volunteer');

-- AppealStatus is seeded by schema.sql. Assert fixture coverage without duplicating seed rows.
DO $$
BEGIN
    IF (SELECT count(*) FROM "AppealStatus") <> 7 THEN
        RAISE EXCEPTION 'Expected seven current AppealStatus rows, found %',
            (SELECT count(*) FROM "AppealStatus");
    END IF;
END $$;

INSERT INTO "Semester" (semester_id, quarter_academic_year, starts_at, ends_at)
VALUES (1, 'Q12026', '2026-09-01', '2027-01-31');

INSERT INTO "ScoreCriterion" (code, name)
VALUES ('C1', 'Criterion One');

INSERT INTO "User" (user_id, is_active, email, phone_number, password_hash, full_name)
VALUES ('U1', TRUE, 'u1@example.edu', '0900000001', 'hashed-1', 'Student Manager One'),
       ('U2', TRUE, 'u2@example.edu', '0900000002', 'hashed-2', 'Administrator Two'),
       ('U3', TRUE, 'u3@example.edu', '0900000003', 'hashed-3', 'Student Three'),
       ('U4', TRUE, 'u4@example.edu', '0900000004', 'hashed-4', 'Student Four');

INSERT INTO "UserRole" (user_id, role_id, granted_by_user_id) VALUES
    ('U1', 1, 'U2'), ('U1', 2, 'U2'),
    ('U2', 3, 'U2'),
    ('U3', 1, 'U2');

INSERT INTO "Student" (user_id, major_id, faculty_id, enrollment_year)
VALUES ('U1', 'M1', 'F1', 2024),
       ('U3', NULL, 'F2', 2025);

INSERT INTO "Manager" (user_id, position_title)
VALUES ('U1', 'Activity Manager');

INSERT INTO "Administrator" (user_id, office_name, position_title)
VALUES ('U2', 'Student Affairs', 'Administrator');

INSERT INTO "ScoringPolicyVersion"
    (criterion_id, semester_id, activation_at, weight, min_points, max_points, semester_cap)
SELECT criterion_id, 1, '2026-09-01 00:00:00+07', 1.0, 0, 10, 30
  FROM "ScoreCriterion" WHERE code = 'C1';

INSERT INTO "SystemSetting" (setting_key, setting_value, updated_by_user_id)
VALUES ('test.setting', 'enabled', 'U2');

-- GROUP 2: organization, activity, registration, and participation fixtures.
INSERT INTO "OrganizationMember" (organization_id, user_id, responsibility, starts_at)
SELECT organization_id, 'U1', 'Coordinator', '2026-09-01 00:00:00+07'
  FROM "Organization" WHERE name = 'Test Organization';

INSERT INTO "UserInterest" (user_id, category_id) VALUES ('U3', 1);

INSERT INTO "Activity" (
    activity_id, organization_id, title, category_id, semester_id, capacity,
    registration_opens_at, registration_closes_at, status, created_by_user_id
)
SELECT 'A1', organization_id, 'Activity One', 1, 1, 10,
       '2026-09-01 00:00:00+07', '2026-10-01 00:00:00+07', 'published', 'U2'
  FROM "Organization" WHERE name = 'Test Organization';

INSERT INTO "Activity" (
    activity_id, organization_id, title, category_id, semester_id, capacity,
    registration_opens_at, registration_closes_at, status, created_by_user_id
)
SELECT 'A2', organization_id, 'Activity Two', 1, 1, 5,
       '2026-09-01 00:00:00+07', '2026-10-01 00:00:00+07', 'draft', 'U2'
  FROM "Organization" WHERE name = 'Test Organization';

INSERT INTO "ActivityManage" (activity_id, user_id) VALUES ('A1', 'U1');
INSERT INTO "ActivityFollow" (user_id, activity_id) VALUES ('U3', 'A1');

INSERT INTO "ActivitySchedule" (activity_id, starts_at, ends_at, location)
VALUES ('A1', '2026-10-03 09:00:00+07', '2026-10-03 12:00:00+07', 'Room One'),
       ('A2', '2026-10-04 09:00:00+07', '2026-10-04 12:00:00+07', 'Room Two');

INSERT INTO "ActivityEligibility" (activity_id, faculty_id) VALUES ('A1', 'F1');

INSERT INTO "ActivityScore" (activity_id, policy_version_id, base_points)
SELECT 'A1', policy_version_id, 5 FROM "ScoringPolicyVersion"
 WHERE criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = 'C1')
   AND semester_id = 1 AND activation_at = '2026-09-01 00:00:00+07';

INSERT INTO "Registration" (
    activity_id, user_id, attempt_number, status, registered_at, confirmed_at
)
VALUES ('A1', 'U3', 1, 'confirmed', '2026-09-10 09:00:00+07', '2026-09-10 09:01:00+07');

INSERT INTO "Registration" (activity_id, user_id, attempt_number, status, registered_at)
VALUES ('A2', 'U1', 1, 'pending_approval', '2026-09-11 09:00:00+07');

INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id)
SELECT s.schedule_id, r.registration_id, 'A1', 'attended', 'U2'
  FROM "ActivitySchedule" s
  JOIN "Registration" r ON r.activity_id = s.activity_id AND r.user_id = 'U3'
 WHERE s.activity_id = 'A1';

INSERT INTO "Participation" (registration_id, verified_by_user_id, verification_reason)
SELECT registration_id, 'U1', 'Verified after attendance'
  FROM "Registration" WHERE activity_id = 'A1' AND user_id = 'U3';

-- GROUP 3: request, recognition, evidence, and scoring fixtures.
INSERT INTO "Appeal" (
    submitted_by_user_id, type, description, status,
    reviewed_by_user_id, response, reviewed_at, submitted_at
)
VALUES ('U3', 'recognition', 'External activity recognition', 'approved',
        'U1', 'Approved', '2026-10-10 10:00:00+07', '2026-10-09 10:00:00+07');

INSERT INTO "Appeal" (
    submitted_by_user_id, registration_id, type, description, status
)
SELECT 'U3', registration_id, 'participation_correction', 'Attendance correction', 'pending_assignment'
  FROM "Registration" WHERE activity_id = 'A1' AND user_id = 'U3';

INSERT INTO "RequestAssignment" (appeal_id, manager_user_id, assigned_by_user_id)
SELECT appeal_id, 'U1', 'U2' FROM "Appeal" WHERE description = 'Attendance correction';

INSERT INTO "RequestRevision" (appeal_id, edited_by_user_id, previous_values, new_values)
SELECT appeal_id, 'U3', '{"description":"Old"}'::JSONB, '{"description":"Attendance correction"}'::JSONB
  FROM "Appeal" WHERE description = 'Attendance correction';

INSERT INTO "RecognitionRequestDetail" (
    appeal_id, title, occurred_at, is_internal, category, target_semester_id, proposed_criterion_id
)
SELECT appeal_id, 'External activity', '2026-10-01 12:00:00+07', FALSE,
       'volunteering', 1, (SELECT criterion_id FROM "ScoreCriterion" WHERE code = 'C1')
  FROM "Appeal" WHERE description = 'External activity recognition';

INSERT INTO "AppealEvidence" (appeal_id, storage_key, mime_type, size_bytes)
SELECT appeal_id, 'evidence/attendance.pdf', 'application/pdf', 10485760
  FROM "Appeal" WHERE description = 'Attendance correction';

INSERT INTO "Recognition" (
    appeal_id, student_user_id, title, occurred_at, semester_id, criterion_id,
    policy_version_id, verified_by_user_id
)
SELECT a.appeal_id, 'U3', 'External activity', '2026-10-01 12:00:00+07',
       p.semester_id, p.criterion_id, p.policy_version_id, 'U1'
  FROM "Appeal" a
 CROSS JOIN "ScoringPolicyVersion" p
 WHERE a.description = 'External activity recognition'
   AND p.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = 'C1')
   AND p.semester_id = 1 AND p.activation_at = '2026-09-01 00:00:00+07';

INSERT INTO "TrainingScore" (
    participation_id, policy_version_id, criterion_id, semester_id,
    base_points, weighted_points, points_awarded, awarded_by_user_id
)
SELECT p.participation_id, policy.policy_version_id, policy.criterion_id,
       policy.semester_id, 5, 5, 5, 'U1'
  FROM "Participation" p
  JOIN "Registration" r USING (registration_id)
 CROSS JOIN "ScoringPolicyVersion" policy
 WHERE r.activity_id = 'A1' AND r.user_id = 'U3'
   AND policy.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = 'C1')
   AND policy.semester_id = 1 AND policy.activation_at = '2026-09-01 00:00:00+07';

INSERT INTO "TrainingScore" (
    recognition_id, policy_version_id, criterion_id, semester_id,
    base_points, weighted_points, points_awarded, awarded_by_user_id
)
SELECT r.recognition_id, policy.policy_version_id, policy.criterion_id,
       policy.semester_id, 3, 3, 3, 'U1'
  FROM "Recognition" r
 CROSS JOIN "ScoringPolicyVersion" policy
 WHERE r.title = 'External activity'
   AND policy.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = 'C1')
   AND policy.semester_id = 1 AND policy.activation_at = '2026-09-01 00:00:00+07';

INSERT INTO "ScoreChange" (score_id, old_points, new_points, changed_by_user_id, reason)
SELECT score_id, 5, 4, 'U1', 'Corrected award'
  FROM "TrainingScore" WHERE participation_id IS NOT NULL;

INSERT INTO "ScoreAdjustment" (score_id, change_id, delta, approved_by_user_id, reason)
SELECT sc.score_id, sc.change_id, -1, 'U1', 'Approved correction'
  FROM "ScoreChange" sc
  JOIN "TrainingScore" ts USING (score_id)
 WHERE ts.participation_id IS NOT NULL;

-- GROUP 4: communication, administration, and existing backend token fixtures.
INSERT INTO "ActivityAnnouncement" (activity_id, author_user_id, title, body)
VALUES ('A1', 'U1', 'Schedule update', 'The activity schedule is confirmed.');

INSERT INTO "Notification" (recipient_user_id, activity_id, appeal_id, type, message)
SELECT 'U3', 'A1', appeal_id, 'appeal', 'Your request was received.'
  FROM "Appeal" WHERE description = 'Attendance correction';

INSERT INTO "NotificationDelivery" (notification_id, channel, status, attempt_count, sent_at)
SELECT notification_id, 'email', 'sent', 1, '2026-10-11 10:00:00+07'
  FROM "Notification" WHERE type = 'appeal';

INSERT INTO "ServiceLink" (name, url)
VALUES ('University Library', 'https://library.example.edu');

INSERT INTO "AuditLog" (actor_user_id, entity_type, entity_id, action, reason, before_values, after_values)
VALUES ('U2', 'SystemSetting', 'test.setting', 'update', 'Constraint fixture',
        '{"value":"disabled"}'::JSONB, '{"value":"enabled"}'::JSONB);

INSERT INTO "RefreshToken" (refresh_token_id, user_id)
VALUES (repeat('t', 60), 'U1');

-- GROUP 5: current reference, identity, and basic row-rule rejection cases.
SELECT expect_sqlstate('INSERT INTO "Role" (role_id, code, name) VALUES (4, ''reviewer'', ''Reviewer'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Role" (role_id, code, name) VALUES (4, ''student'', ''Duplicate Student'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Permission" (permission_id, code) VALUES (4, ''activity.manage'')', '23505');
SELECT expect_sqlstate('INSERT INTO "RolePermission" VALUES (1, 3)', '23505');
SELECT expect_sqlstate('INSERT INTO "RolePermission" VALUES (1, 99)', '23503');
SELECT expect_sqlstate('INSERT INTO "Faculty" (faculty_id, code, name) VALUES (''F3'', ''F1'', ''Faculty Three'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Major" (major_id, faculty_id, name) VALUES (''M2'', ''M99'', ''Bad Major'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Department" (department_id, code, name) VALUES (''D2'', ''D1'', ''Duplicate Code'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Club" (club_id, code, name) VALUES (''C2'', ''C2'', '' '')', '23514');
SELECT expect_sqlstate('INSERT INTO "Organization" (name, type) VALUES (''Bad Type'', ''university'')', '23514');
SELECT expect_sqlstate('INSERT INTO "ActivityCategory" (category_id, name) VALUES (2, ''Volunteer'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Semester" VALUES (2, ''Q22026'', ''2027-01-31'', ''2027-01-01'')', '23514');
SELECT expect_sqlstate('INSERT INTO "ScoreCriterion" (code, name) VALUES (''C1'', ''Duplicate Code'')', '23505');
SELECT expect_sqlstate('INSERT INTO "ScoringPolicyVersion" (criterion_id, semester_id, activation_at, weight, min_points, max_points, semester_cap) SELECT criterion_id, 1, now(), 1, 11, 10, 20 FROM "ScoreCriterion" WHERE code = ''C1''', '23514');
SELECT expect_sqlstate('INSERT INTO "User" (user_id, email, password_hash, full_name) VALUES (''U4'', ''u1@example.edu'', ''hash'', ''Duplicate Email'')', '23505');
SELECT expect_sqlstate('INSERT INTO "User" (user_id, email, password_hash, full_name) VALUES (''U4'', NULL, ''hash'', ''Missing Email'')', '23502');
SELECT expect_sqlstate('INSERT INTO "User" (user_id, email, password_hash, full_name) VALUES (''U4'', ''u4@example.edu'', '' '', ''User Four'')', '23514');
SELECT expect_sqlstate('INSERT INTO "UserRole" (user_id, role_id, granted_by_user_id) VALUES (''U3'', 1, ''U2'')', '23505');
SELECT expect_sqlstate('INSERT INTO "UserRole" (user_id, role_id, granted_by_user_id) VALUES (''U3'', 2, ''U99'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Student" (user_id, faculty_id, enrollment_year) VALUES (''U4'', ''F99'', 2025)', '23503');
SELECT expect_sqlstate('INSERT INTO "Student" (user_id, faculty_id, enrollment_year) VALUES (''U4'', ''F1'', 0)', '23514');
SELECT expect_sqlstate('INSERT INTO "Manager" (user_id) VALUES (''U99'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Administrator" (user_id) VALUES (''U99'')', '23503');
SELECT expect_sqlstate('INSERT INTO "OrganizationMember" (organization_id, user_id, responsibility, starts_at) SELECT organization_id, ''U1'', ''Duplicate active'', now() FROM "Organization" WHERE name = ''Test Organization''', '23505');
SELECT expect_sqlstate('INSERT INTO "UserInterest" VALUES (''U3'', 1)', '23505');

-- GROUP 6: current activity, enrollment, partial-unique, and composite-FK checks.
SELECT expect_sqlstate('INSERT INTO "Activity" (activity_id, organization_id, title, category_id, semester_id, capacity, registration_opens_at, registration_closes_at, created_by_user_id) SELECT ''BAD-CAP'', organization_id, ''Bad capacity'', 1, 1, 0, now(), now() + interval ''1 day'', ''U2'' FROM "Organization" WHERE name = ''Test Organization''', '23514');
SELECT expect_sqlstate('INSERT INTO "Activity" (activity_id, organization_id, title, category_id, semester_id, capacity, registration_opens_at, registration_closes_at, created_by_user_id) SELECT ''BAD-DATES'', organization_id, ''Bad dates'', 1, 1, 1, now() + interval ''1 day'', now(), ''U2'' FROM "Organization" WHERE name = ''Test Organization''', '23514');
SELECT expect_sqlstate('INSERT INTO "Activity" (activity_id, organization_id, title, category_id, semester_id, capacity, registration_opens_at, registration_closes_at, status, created_by_user_id) SELECT ''BAD-STATUS'', organization_id, ''Bad status'', 1, 1, 1, now(), now() + interval ''1 day'', ''ongoing-nowhere'', ''U2'' FROM "Organization" WHERE name = ''Test Organization''', '23514');
SELECT expect_sqlstate('INSERT INTO "ActivityManage" VALUES (''A1'', ''U3'')', '23503');
SELECT expect_sqlstate('INSERT INTO "ActivityFollow" VALUES (''U99'', ''A1'', now())', '23503');
SELECT expect_sqlstate('INSERT INTO "ActivityFollow" (user_id, activity_id) VALUES (''U3'', ''A1'')', '23505');
SELECT expect_sqlstate('INSERT INTO "ActivitySchedule" (activity_id, starts_at, ends_at, location) VALUES (''A1'', ''2026-10-04'', ''2026-10-03'', ''Room'')', '23514');
SELECT expect_sqlstate('INSERT INTO "ActivityEligibility" VALUES (''A1'', ''F1'')', '23505');
SELECT expect_sqlstate('INSERT INTO "ActivityScore" (activity_id, policy_version_id, base_points) SELECT ''A1'', policy_version_id, -1 FROM "ScoringPolicyVersion" WHERE criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND semester_id = 1 AND activation_at = ''2026-09-01 00:00:00+07''', '23514');
SELECT expect_sqlstate('INSERT INTO "ActivityScore" (activity_id, policy_version_id, base_points) SELECT ''A1'', policy_version_id, 5 FROM "ScoringPolicyVersion" WHERE criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND semester_id = 1 AND activation_at = ''2026-09-01 00:00:00+07''', '23505');
SELECT expect_sqlstate('INSERT INTO "Registration" (activity_id, user_id, attempt_number, status, registered_at, confirmed_at) VALUES (''A1'', ''U3'', 2, ''confirmed'', now(), now())', '23505');
SELECT expect_sqlstate('INSERT INTO "Registration" (activity_id, user_id, attempt_number, status) VALUES (''A2'', ''U3'', 0, ''pending_approval'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Registration" (activity_id, user_id, attempt_number, status, registered_at, waitlisted_at) VALUES (''A2'', ''U3'', 1, ''waitlisted'', now(), now())', '23514');
SELECT expect_sqlstate('INSERT INTO "Registration" (activity_id, user_id, attempt_number, status, registered_at, confirmed_at) VALUES (''A2'', ''U3'', 1, ''confirmed'', now(), NULL)', '23514');
SELECT expect_sqlstate('INSERT INTO "Registration" (activity_id, user_id, attempt_number, status) VALUES (''A99'', ''U3'', 1, ''pending_approval'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id) SELECT s.schedule_id, r.registration_id, ''A1'', ''attended'', ''U2'' FROM "ActivitySchedule" s CROSS JOIN "Registration" r WHERE s.activity_id = ''A1'' AND r.activity_id = ''A2''', '23503');
SELECT expect_sqlstate('INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id) SELECT s.schedule_id, r.registration_id, ''A1'', ''unknown'', ''U2'' FROM "ActivitySchedule" s JOIN "Registration" r ON r.activity_id = s.activity_id WHERE s.activity_id = ''A1''', '23514');
SELECT expect_sqlstate('INSERT INTO "Participation" (registration_id, verified_by_user_id) SELECT registration_id, ''U1'' FROM "Registration" WHERE activity_id = ''A1'' AND user_id = ''U3''', '23505');

-- GROUP 7: request, scoring, evidence, communication, and administration checks.
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, type, description, status) VALUES (''U3'', ''other'', ''Bad type'', ''pending_assignment'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, registration_id, type, description, status) VALUES (''U1'', (SELECT registration_id FROM "Registration" WHERE activity_id = ''A1'' AND user_id = ''U3''), ''participation_correction'', ''Wrong owner'', ''pending_assignment'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, type, description, status, reviewed_by_user_id, response, reviewed_at, submitted_at) VALUES (''U3'', ''recognition'', ''Missing review data'', ''approved'', NULL, NULL, NULL, now())', '23514');
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, type, description, status, withdrawn_by_user_id, withdrawn_at) VALUES (''U3'', ''recognition'', ''Wrong withdrawer'', ''withdrawn'', ''U2'', now())', '23514');
SELECT expect_sqlstate('INSERT INTO "RequestAssignment" (appeal_id, manager_user_id, assigned_by_user_id) SELECT appeal_id, ''U1'', ''U2'' FROM "Appeal" WHERE description = ''Attendance correction''', '23505');
SELECT expect_sqlstate('INSERT INTO "RequestRevision" (appeal_id, edited_by_user_id, previous_values, new_values) VALUES (999, ''U3'', ''{}'', ''{}'')', '23503');
SELECT expect_sqlstate('INSERT INTO "RecognitionRequestDetail" (appeal_id, title, occurred_at, is_internal, category, target_semester_id) SELECT appeal_id, '' '', now(), FALSE, ''volunteering'', 1 FROM "Appeal" WHERE description = ''External activity recognition''', '23514');
SELECT expect_sqlstate('INSERT INTO "AppealEvidence" (appeal_id, storage_key, mime_type, size_bytes) SELECT appeal_id, ''file.txt'', ''text/plain'', 1 FROM "Appeal" WHERE description = ''Attendance correction''', '23514');
SELECT expect_sqlstate('INSERT INTO "AppealEvidence" (appeal_id, storage_key, mime_type, size_bytes) SELECT appeal_id, ''file.pdf'', ''application/pdf'', 10485761 FROM "Appeal" WHERE description = ''Attendance correction''', '23514');
SELECT expect_sqlstate('INSERT INTO "AppealEvidence" (appeal_id, storage_key, mime_type, size_bytes) SELECT appeal_id, ''file.pdf'', ''application/pdf'', 0 FROM "Appeal" WHERE description = ''Attendance correction''', '23514');
SELECT expect_sqlstate('INSERT INTO "Recognition" (appeal_id, student_user_id, title, occurred_at, semester_id, criterion_id, policy_version_id, verified_by_user_id) SELECT a.appeal_id, ''U1'', ''Wrong student'', now(), policy.semester_id, policy.criterion_id, policy.policy_version_id, ''U1'' FROM "Appeal" a CROSS JOIN "ScoringPolicyVersion" policy WHERE a.description = ''Attendance correction'' AND policy.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND policy.semester_id = 1 AND policy.activation_at = ''2026-09-01 00:00:00+07''', '23503');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (policy_version_id, criterion_id, semester_id, base_points, weighted_points, points_awarded, awarded_by_user_id) SELECT policy_version_id, criterion_id, semester_id, 1, 1, 1, ''U1'' FROM "ScoringPolicyVersion" WHERE criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND semester_id = 1 AND activation_at = ''2026-09-01 00:00:00+07''', '23514');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (participation_id, recognition_id, policy_version_id, criterion_id, semester_id, base_points, weighted_points, points_awarded, awarded_by_user_id) SELECT p.participation_id, r.recognition_id, policy.policy_version_id, policy.criterion_id, policy.semester_id, 1, 1, 1, ''U1'' FROM "Participation" p CROSS JOIN "Recognition" r CROSS JOIN "ScoringPolicyVersion" policy WHERE policy.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND policy.semester_id = 1 AND policy.activation_at = ''2026-09-01 00:00:00+07''', '23514');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (participation_id, policy_version_id, criterion_id, semester_id, base_points, weighted_points, points_awarded, awarded_by_user_id) SELECT p.participation_id, policy.policy_version_id, policy.criterion_id, policy.semester_id, -1, 1, 1, ''U1'' FROM "Participation" p CROSS JOIN "ScoringPolicyVersion" policy WHERE policy.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND policy.semester_id = 1 AND policy.activation_at = ''2026-09-01 00:00:00+07''', '23514');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (participation_id, policy_version_id, criterion_id, semester_id, base_points, weighted_points, points_awarded, awarded_by_user_id) SELECT p.participation_id, policy.policy_version_id, policy.criterion_id, policy.semester_id, 5, 5, 5, ''U1'' FROM "Participation" p CROSS JOIN "ScoringPolicyVersion" policy WHERE policy.criterion_id = (SELECT criterion_id FROM "ScoreCriterion" WHERE code = ''C1'') AND policy.semester_id = 1 AND policy.activation_at = ''2026-09-01 00:00:00+07''', '23505');
SELECT expect_sqlstate('INSERT INTO "ScoreChange" (score_id, old_points, new_points, changed_by_user_id, reason) VALUES (-1, 1, 2, ''U1'', ''No score'')', '23503');
SELECT expect_sqlstate('INSERT INTO "ScoreChange" (score_id, old_points, new_points, changed_by_user_id, reason) SELECT score_id, 1, 2, ''U1'', '' '' FROM "TrainingScore" WHERE participation_id IS NOT NULL', '23514');
SELECT expect_sqlstate('INSERT INTO "ScoreAdjustment" (score_id, change_id, delta, approved_by_user_id, reason) SELECT score_id, change_id, -1, ''U1'', ''Duplicate change'' FROM "ScoreChange"', '23505');
SELECT expect_sqlstate('INSERT INTO "ActivityAnnouncement" (activity_id, author_user_id, title, body) VALUES (''A1'', ''U1'', '' '', ''Body'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Notification" (recipient_user_id, type, message) VALUES (''U3'', ''general'', '' '')', '23514');
SELECT expect_sqlstate('INSERT INTO "Notification" (recipient_user_id, type, message, created_at, read_at) VALUES (''U3'', ''general'', ''Message'', ''2026-11-01'', ''2026-10-01'')', '23514');
SELECT expect_sqlstate('INSERT INTO "NotificationDelivery" (notification_id, channel, status) SELECT notification_id, ''email'', ''sent'' FROM "Notification" WHERE type = ''appeal''', '23514');
SELECT expect_sqlstate('INSERT INTO "NotificationDelivery" (notification_id, channel, status) SELECT notification_id, ''push'', ''pending'' FROM "Notification" WHERE type = ''appeal''', '23514');
SELECT expect_sqlstate('INSERT INTO "ServiceLink" (name, url) VALUES ('' '', ''https://example.edu'')', '23514');
SELECT expect_sqlstate('INSERT INTO "ServiceLink" (name, url) VALUES (''University Library'', ''https://other.edu'')', '23505');
SELECT expect_sqlstate('INSERT INTO "SystemSetting" (setting_key, setting_value) VALUES (''empty'', '' '')', '23514');
SELECT expect_sqlstate('INSERT INTO "AuditLog" (actor_user_id, entity_type, entity_id, action, reason) VALUES (''U2'', '' '', ''1'', ''update'', ''Reason'')', '23514');
SELECT expect_sqlstate('INSERT INTO "RefreshToken" (refresh_token_id, user_id) VALUES (repeat(''x'', 60), ''U99'')', '23503');
SELECT expect_sqlstate('INSERT INTO "RefreshToken" (refresh_token_id, user_id) VALUES (repeat('' '', 60), ''U1'')', '23514');

DO $$
BEGIN
    IF (SELECT count(*) FROM "User") <> 4 THEN
        RAISE EXCEPTION 'Expected four valid User fixtures, found %',
            (SELECT count(*) FROM "User");
    END IF;
    IF (SELECT count(*) FROM "Activity") <> 2 THEN
        RAISE EXCEPTION 'Expected two valid Activity fixtures, found %',
            (SELECT count(*) FROM "Activity");
    END IF;
END $$;

ROLLBACK;
