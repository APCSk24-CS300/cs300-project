-- Initial schema for myHCMUS. Run with psql against a PostgreSQL server.
-- See docs/analysis-and-design/db/business-requirements.md for business rules.
-- This creates a new database; existing installations require a data migration.
CREATE DATABASE "myHCMUS" WITH ENCODING 'UTF8';
\connect "myHCMUS"



CREATE TABLE "Role" (
    role_id INT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (code IN ('student', 'organizer', 'reviewer', 'administrator')),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    description TEXT
);

CREATE TABLE "Permission" (
    permission_id INT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    description TEXT
);

CREATE TABLE "RolePermission" (
    role_id INT NOT NULL REFERENCES "Role"(role_id),
    permission_id INT NOT NULL REFERENCES "Permission"(permission_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE "Faculty" (
    faculty_id TEXT PRIMARY KEY CHECK (btrim(faculty_id) <> ''),
    code TEXT NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> '')
);

CREATE TABLE "ActivityCategory" (
    category_id INT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (btrim(name) <> ''),
    description TEXT
);

CREATE TABLE "Semester" (
    semester_id INT PRIMARY KEY,
    academic_year TEXT NOT NULL CHECK (btrim(academic_year) <> ''),
    term TEXT NOT NULL CHECK (btrim(term) <> ''),
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    UNIQUE (academic_year, term),
    CHECK (starts_at < ends_at)
);

CREATE TABLE "ScoreCriterion" (
    criterion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    description TEXT,
    max_points NUMERIC(8, 2) NOT NULL CHECK (max_points >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "User" (
    user_id TEXT PRIMARY KEY CHECK (btrim(user_id) <> ''),
    role_id INT NOT NULL REFERENCES "Role"(role_id),
    email TEXT NOT NULL UNIQUE CHECK (btrim(email) <> ''),
    password_hash TEXT NOT NULL CHECK (btrim(password_hash) <> ''),
    full_name TEXT NOT NULL CHECK (btrim(full_name) <> ''),
    student_number TEXT UNIQUE CHECK (student_number IS NULL OR btrim(student_number) <> ''),
    faculty_id TEXT REFERENCES "Faculty"(faculty_id),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserInterest" (
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    category_id INT NOT NULL REFERENCES "ActivityCategory"(category_id),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE "Activity" (
    activity_id TEXT PRIMARY KEY CHECK (btrim(activity_id) <> ''),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    description TEXT,
    eligibility_notes TEXT,
    category_id INT NOT NULL REFERENCES "ActivityCategory"(category_id),
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    capacity INT NOT NULL CHECK (capacity > 0),
    registration_opens_at TIMESTAMPTZ NOT NULL,
    registration_closes_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (registration_opens_at < registration_closes_at)
);

CREATE TABLE "ActivityOrganizer" (
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE "ActivitySchedule" (
    schedule_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL CHECK (btrim(location) <> ''),
    UNIQUE (schedule_id, activity_id),
    CHECK (starts_at < ends_at)
);

CREATE TABLE "ActivityEligibility" (
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    faculty_id TEXT NOT NULL REFERENCES "Faculty"(faculty_id),
    PRIMARY KEY (activity_id, faculty_id)
);

CREATE TABLE "ActivityScore" (
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    points NUMERIC(8, 2) NOT NULL,
    PRIMARY KEY (activity_id, criterion_id)
);

CREATE TABLE "Registration" (
    registration_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'waitlisted', 'rejected', 'cancelled')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMPTZ,
    decided_by_user_id TEXT REFERENCES "User"(user_id),
    UNIQUE (activity_id, user_id),
    UNIQUE (registration_id, activity_id),
    UNIQUE (registration_id, user_id),
    CHECK ((decided_at IS NULL) = (decided_by_user_id IS NULL)),
    CHECK (decided_at IS NULL OR decided_at >= registered_at)
);

CREATE TABLE "Attendance" (
    schedule_id BIGINT NOT NULL,
    registration_id BIGINT NOT NULL,
    activity_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
    recorded_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (schedule_id, registration_id),
    FOREIGN KEY (schedule_id, activity_id)
        REFERENCES "ActivitySchedule"(schedule_id, activity_id),
    FOREIGN KEY (registration_id, activity_id)
        REFERENCES "Registration"(registration_id, activity_id)
);

CREATE TABLE "Participation" (
    participation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    registration_id BIGINT NOT NULL UNIQUE REFERENCES "Registration"(registration_id),
    verified_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Appeal" (
    appeal_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submitted_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    activity_id TEXT REFERENCES "Activity"(activity_id),
    registration_id BIGINT,
    score_id BIGINT,
    type TEXT NOT NULL
        CHECK (type IN ('recognition', 'participation_correction', 'score_correction')),
    description TEXT NOT NULL CHECK (btrim(description) <> ''),
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected')),
    reviewed_by_user_id TEXT REFERENCES "User"(user_id),
    response TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    UNIQUE (appeal_id, submitted_by_user_id),
    FOREIGN KEY (registration_id, submitted_by_user_id)
        REFERENCES "Registration"(registration_id, user_id),
    CHECK (
        (type = 'recognition' AND registration_id IS NULL AND score_id IS NULL)
        OR (type = 'participation_correction' AND registration_id IS NOT NULL AND score_id IS NULL)
        OR (type = 'score_correction' AND score_id IS NOT NULL AND registration_id IS NULL)
    ),
    CHECK (
        status NOT IN ('approved', 'rejected')
        OR (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL
            AND response IS NOT NULL AND btrim(response) <> '')
    ),
    CHECK ((reviewed_by_user_id IS NULL) = (reviewed_at IS NULL)),
    CHECK (reviewed_at IS NULL OR reviewed_at >= submitted_at)
);

CREATE TABLE "Recognition" (
    recognition_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appeal_id BIGINT NOT NULL UNIQUE,
    student_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    occurred_at TIMESTAMPTZ NOT NULL,
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    verified_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appeal_id, student_user_id)
        REFERENCES "Appeal"(appeal_id, submitted_by_user_id)
);

CREATE TABLE "TrainingScore" (
    score_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participation_id BIGINT REFERENCES "Participation"(participation_id),
    recognition_id BIGINT REFERENCES "Recognition"(recognition_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    points_awarded NUMERIC(8, 2) NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    awarded_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    UNIQUE (participation_id, criterion_id),
    UNIQUE (recognition_id, criterion_id),
    CHECK ((participation_id IS NOT NULL) <> (recognition_id IS NOT NULL))
);

ALTER TABLE "Appeal"
    ADD CONSTRAINT appeal_score_fk FOREIGN KEY (score_id) REFERENCES "TrainingScore"(score_id);

CREATE TABLE "ScoreChange" (
    change_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    score_id BIGINT NOT NULL REFERENCES "TrainingScore"(score_id),
    appeal_id BIGINT REFERENCES "Appeal"(appeal_id),
    old_points NUMERIC(8, 2) NOT NULL,
    new_points NUMERIC(8, 2) NOT NULL,
    changed_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL CHECK (btrim(reason) <> '')
);

CREATE TABLE "AppealEvidence" (
    evidence_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appeal_id BIGINT NOT NULL REFERENCES "Appeal"(appeal_id),
    file_url TEXT NOT NULL CHECK (btrim(file_url) <> ''),
    description TEXT,
    content_type TEXT NOT NULL
        CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 10485760),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ActivityAnnouncement" (
    announcement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    author_id TEXT NOT NULL REFERENCES "User"(user_id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    activity_id TEXT REFERENCES "Activity"(activity_id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

CREATE TABLE "UniversityService" (
    service_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "SystemSetting" (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_by TEXT REFERENCES "User"(user_id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
    audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id TEXT REFERENCES "User"(user_id),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    before_value JSONB,
    after_value JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
