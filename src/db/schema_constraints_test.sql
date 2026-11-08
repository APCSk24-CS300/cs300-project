-- Run after schema.sql in a disposable myHCMUS database with ON_ERROR_STOP=1.
-- The transaction leaves no test rows behind.
BEGIN;

CREATE FUNCTION expect_sqlstate(statement TEXT, expected TEXT) RETURNS VOID
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

-- GROUP 1: reference and access fixtures and invalid cases.
INSERT INTO "Role" (role_id, code, name) VALUES
    (1, 'student', 'Student'), (2, 'organizer', 'Organizer'),
    (3, 'reviewer', 'Reviewer'), (4, 'administrator', 'Administrator');
INSERT INTO "Permission" (permission_id, code) VALUES (1, 'registration.create');
INSERT INTO "RolePermission" (role_id, permission_id) VALUES (1, 1);
INSERT INTO "Faculty" (faculty_id, code, name) VALUES ('F1', 'F1', 'Faculty One');
INSERT INTO "ActivityCategory" (category_id, name) VALUES (1, 'Volunteer');
INSERT INTO "Semester" (semester_id, academic_year, term, starts_at, ends_at)
VALUES (1, '2026-2027', '1', '2026-09-01', '2027-01-31');
INSERT INTO "ScoreCriterion" (code, name, max_points) VALUES ('C1', 'Criterion One', 10);
INSERT INTO "User" (user_id, role_id, email, password_hash, full_name, student_number, faculty_id)
VALUES ('U1', 1, 'u1@example.edu', 'hashed-1', 'Student One', 'S1', 'F1'),
       ('U2', 2, 'u2@example.edu', 'hashed-2', 'Organizer Two', 'S2', 'F1'),
       ('U3', 3, 'u3@example.edu', 'hashed-3', 'Reviewer Three', NULL, NULL);
INSERT INTO "UserInterest" (user_id, category_id) VALUES ('U1', 1);
SELECT expect_sqlstate('INSERT INTO "Role" VALUES (5, ''other'', ''Other'', NULL)', '23514');
SELECT expect_sqlstate('INSERT INTO "Role" VALUES (5, ''student'', ''Duplicate'', NULL)', '23505');
SELECT expect_sqlstate('INSERT INTO "Permission" VALUES (2, ''registration.create'', NULL)', '23505');
SELECT expect_sqlstate('INSERT INTO "Faculty" VALUES (''F2'', ''F1'', ''Faculty Two'')', '23505');
SELECT expect_sqlstate('INSERT INTO "ActivityCategory" VALUES (2, ''Volunteer'', NULL)', '23505');
SELECT expect_sqlstate('INSERT INTO "Semester" VALUES (2, ''2026-2027'', ''1'', ''2026-09-01'', ''2027-01-31'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Semester" VALUES (2, ''2027-2028'', ''1'', ''2027-12-31'', ''2027-01-01'')', '23514');
SELECT expect_sqlstate('INSERT INTO "ScoreCriterion" (code, name, max_points) VALUES (''C2'', ''Bad'', -1)', '23514');
SELECT expect_sqlstate('INSERT INTO "User" (user_id, role_id, email, password_hash, full_name) VALUES (''U4'', 99, ''u4@example.edu'', ''hash'', ''Four'')', '23503');
SELECT expect_sqlstate('INSERT INTO "User" (user_id, role_id, email, password_hash, full_name) VALUES (''U4'', 1, ''u1@example.edu'', ''hash'', ''Four'')', '23505');
SELECT expect_sqlstate('INSERT INTO "RolePermission" VALUES (1, 1)', '23505');
SELECT expect_sqlstate('INSERT INTO "UserInterest" VALUES (''U1'', 1)', '23505');
-- End group 1.

-- GROUP 2: activities and enrollment fixtures and invalid cases.
INSERT INTO "Activity" (activity_id, title, category_id, semester_id, capacity,
    registration_opens_at, registration_closes_at, status, created_by_user_id)
VALUES ('A1', 'Activity One', 1, 1, 1, '2026-10-01', '2026-10-02', 'published', 'U2'),
       ('A2', 'Activity Two', 1, 1, 2, '2026-10-01', '2026-10-02', 'published', 'U2');
INSERT INTO "ActivityOrganizer" VALUES ('A1', 'U2');
INSERT INTO "ActivitySchedule" (activity_id, starts_at, ends_at, location)
VALUES ('A1', '2026-10-03', '2026-10-04', 'Room One'),
       ('A2', '2026-10-03', '2026-10-04', 'Room Two');
INSERT INTO "ActivityEligibility" VALUES ('A1', 'F1');
INSERT INTO "ActivityScore" VALUES ('A1', 1, 5);
INSERT INTO "Registration" (activity_id, user_id, status)
VALUES ('A1', 'U1', 'approved'), ('A2', 'U2', 'approved');
INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id)
VALUES (1, 1, 'A1', 'present', 'U2');
SELECT expect_sqlstate('INSERT INTO "Activity" (activity_id, title, category_id, semester_id, capacity, registration_opens_at, registration_closes_at, created_by_user_id) VALUES (''BAD'', ''Bad'', 1, 1, 0, ''2026-10-01'', ''2026-10-02'', ''U2'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Activity" (activity_id, title, category_id, semester_id, capacity, registration_opens_at, registration_closes_at, created_by_user_id) VALUES (''BAD'', ''Bad'', 1, 1, 1, ''2026-10-02'', ''2026-10-01'', ''U2'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Activity" (activity_id, title, category_id, semester_id, capacity, registration_opens_at, registration_closes_at, created_by_user_id) VALUES (''BAD'', ''Bad'', 99, 1, 1, ''2026-10-01'', ''2026-10-02'', ''U2'')', '23503');
SELECT expect_sqlstate('INSERT INTO "ActivitySchedule" (activity_id, starts_at, ends_at, location) VALUES (''A1'', ''2026-10-04'', ''2026-10-03'', ''Room'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Registration" (activity_id, user_id) VALUES (''A1'', ''U1'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id) VALUES (1, 2, ''A1'', ''present'', ''U2'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Attendance" (schedule_id, registration_id, activity_id, status, recorded_by_user_id) VALUES (2, 2, ''A2'', ''unknown'', ''U2'')', '23514');
-- End group 2.

-- GROUP 3: participation, appeals, recognition, and scoring fixtures.
INSERT INTO "Participation" (registration_id, verified_by_user_id) VALUES (1, 'U2');
INSERT INTO "Appeal" (submitted_by_user_id, type, description, status, reviewed_by_user_id, response, reviewed_at)
VALUES ('U1', 'recognition', 'External activity', 'approved', 'U3', 'Approved', CURRENT_TIMESTAMP);
INSERT INTO "Recognition" (appeal_id, student_user_id, title, occurred_at, semester_id,
    criterion_id, verified_by_user_id)
VALUES (1, 'U1', 'External activity', '2026-10-10', 1, 1, 'U3');
INSERT INTO "TrainingScore" (participation_id, criterion_id, semester_id, points_awarded, awarded_by_user_id)
VALUES (1, 1, 1, 5, 'U2');
INSERT INTO "TrainingScore" (recognition_id, criterion_id, semester_id, points_awarded, awarded_by_user_id)
VALUES (1, 1, 1, 3, 'U3');
INSERT INTO "ScoreChange" (score_id, old_points, new_points, changed_by_user_id, reason)
VALUES (1, 5, 4, 'U2', 'Corrected award');
INSERT INTO "AppealEvidence" (appeal_id, file_url, content_type, file_size_bytes)
VALUES (1, 'evidence.pdf', 'application/pdf', 10485760);
INSERT INTO "Appeal" (submitted_by_user_id, registration_id, type, description)
VALUES ('U1', 1, 'participation_correction', 'Attendance missing');
INSERT INTO "Appeal" (submitted_by_user_id, score_id, type, description)
VALUES ('U1', 1, 'score_correction', 'Score incorrect');
SELECT expect_sqlstate('INSERT INTO "Participation" (registration_id, verified_by_user_id) VALUES (1, ''U2'')', '23505');
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, type, description) VALUES (''U1'', ''participation_correction'', ''Missing'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, registration_id, type, description) VALUES (''U2'', 1, ''participation_correction'', ''Wrong owner'')', '23503');
SELECT expect_sqlstate('INSERT INTO "Appeal" (submitted_by_user_id, type, description, status) VALUES (''U1'', ''recognition'', ''Missing review'', ''approved'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Recognition" (appeal_id, student_user_id, title, occurred_at, semester_id, criterion_id, verified_by_user_id) VALUES (2, ''U2'', ''Wrong owner'', ''2026-10-10'', 1, 1, ''U3'')', '23503');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (criterion_id, semester_id, points_awarded, awarded_by_user_id) VALUES (1, 1, 1, ''U2'')', '23514');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (participation_id, recognition_id, criterion_id, semester_id, points_awarded, awarded_by_user_id) VALUES (1, 1, 1, 1, 1, ''U2'')', '23514');
SELECT expect_sqlstate('INSERT INTO "TrainingScore" (participation_id, criterion_id, semester_id, points_awarded, awarded_by_user_id) VALUES (1, 1, 1, 1, ''U2'')', '23505');
SELECT expect_sqlstate('INSERT INTO "ScoreChange" (score_id, old_points, new_points, changed_by_user_id, reason) VALUES (1, 5, 4, ''U2'', '' '')', '23514');
SELECT expect_sqlstate('INSERT INTO "AppealEvidence" (appeal_id, file_url, content_type, file_size_bytes) VALUES (1, ''file.txt'', ''text/plain'', 1)', '23514');
SELECT expect_sqlstate('INSERT INTO "AppealEvidence" (appeal_id, file_url, content_type, file_size_bytes) VALUES (1, ''file.pdf'', ''application/pdf'', 0)', '23514');
SELECT expect_sqlstate('INSERT INTO "AppealEvidence" (appeal_id, file_url, content_type, file_size_bytes) VALUES (1, ''file.pdf'', ''application/pdf'', 10485761)', '23514');
-- End group 3.

-- GROUP 4: communication and administration fixtures and invalid cases.
INSERT INTO "ActivityAnnouncement" (activity_id, author_user_id, title, body)
VALUES ('A1', 'U2', 'Update', 'Schedule confirmed');
INSERT INTO "Notification" (recipient_user_id, activity_id, type, message, channel,
    delivery_status, sent_at)
VALUES ('U1', 'A1', 'registration', 'Approved', 'email', 'sent', CURRENT_TIMESTAMP);
INSERT INTO "ServiceLink" (name, url) VALUES ('Library', 'https://library.example.edu');
INSERT INTO "SystemSetting" (setting_key, setting_value, updated_by_user_id)
VALUES ('appeal_window', 'open', 'U3');
INSERT INTO "AuditLog" (actor_user_id, entity_type, entity_id, action, before_value, after_value)
VALUES ('U3', 'SystemSetting', 'appeal_window', 'update', '"closed"', '"open"');
SELECT expect_sqlstate('INSERT INTO "ActivityAnnouncement" (activity_id, author_user_id, title, body) VALUES (''A1'', ''U2'', '' '', ''Body'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Notification" (recipient_user_id, type, message, channel) VALUES (''U1'', ''registration'', ''Message'', ''push'')', '23514');
SELECT expect_sqlstate('INSERT INTO "Notification" (recipient_user_id, type, message, delivery_status) VALUES (''U1'', ''registration'', ''Message'', ''sent'')', '23514');
SELECT expect_sqlstate('INSERT INTO "ServiceLink" (name, url) VALUES ('' '', ''https://example.edu'')', '23514');
SELECT expect_sqlstate('INSERT INTO "SystemSetting" (setting_key, setting_value) VALUES (''empty'', '' '')', '23514');
SELECT expect_sqlstate('INSERT INTO "AuditLog" (entity_type, entity_id, action) VALUES ('' '', ''1'', ''update'')', '23514');
-- End group 4.
ROLLBACK;
