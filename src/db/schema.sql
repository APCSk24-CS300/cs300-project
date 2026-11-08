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

CREATE TABLE "Category" (
    category_id INT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE "Activity" (
    activity_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    eligibility_notes TEXT,
    category_id INT REFERENCES "Category"(category_id),
    semester_id INT REFERENCES "Semester"(semester_id),
    faculty_id TEXT REFERENCES "Faculty"(faculty_id),
    location TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    capacity INT CHECK (capacity >= 0),
    registration_opens_at TIMESTAMPTZ,
    registration_closes_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
    creator_id TEXT REFERENCES "User"(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at),
    CHECK (registration_closes_at IS NULL OR registration_opens_at IS NULL OR registration_closes_at >= registration_opens_at)
);

CREATE TABLE "Registration" (
    registration_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'rejected', 'cancelled')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by TEXT REFERENCES "User"(user_id),
    reviewed_at TIMESTAMPTZ,
    UNIQUE (activity_id, user_id)
);

CREATE TABLE "ActivityScore" (
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    points NUMERIC(8, 2) NOT NULL CHECK (points >= 0),
    PRIMARY KEY (activity_id, criterion_id)
);

CREATE TABLE "Participation" (
    registration_id BIGINT PRIMARY KEY REFERENCES "Registration"(registration_id),
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by TEXT REFERENCES "User"(user_id),
    verified_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE "ScoreAward" (
    registration_id BIGINT NOT NULL REFERENCES "Participation"(registration_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    points NUMERIC(8, 2) NOT NULL CHECK (points >= 0),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (registration_id, criterion_id)
);

CREATE TABLE "ScoreAdjustment" (
    adjustment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    points NUMERIC(8, 2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by TEXT NOT NULL REFERENCES "User"(user_id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "StudentRequest" (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    request_type TEXT NOT NULL CHECK (request_type IN ('recognition', 'appeal')),
    activity_id TEXT REFERENCES "Activity"(activity_id),
    registration_id BIGINT REFERENCES "Registration"(registration_id),
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_id TEXT REFERENCES "User"(user_id),
    response TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE "RequestEvidence" (
    evidence_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES "StudentRequest"(request_id),
    file_url TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
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
