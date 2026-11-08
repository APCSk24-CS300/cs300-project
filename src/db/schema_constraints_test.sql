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
ROLLBACK;
