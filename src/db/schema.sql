-- Initial schema for myHCMUS. Run with psql against a PostgreSQL server.
-- See docs/analysis-and-design/db/business-requirements.md for business rules.
-- This creates a new database; existing installations require a data migration.
CREATE DATABASE "myHCMUS" WITH ENCODING 'UTF8';
\connect "myHCMUS"

CREATE TABLE "Role" (
    role_id INT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (code IN ('student', 'manager', 'administrator')),
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

CREATE TABLE "Major" (
    major_id TEXT PRIMARY KEY CHECK (btrim(major_id) <> ''),
    faculty_id TEXT NOT NULL REFERENCES "Faculty"(faculty_id),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    UNIQUE (major_id, faculty_id)
);

CREATE TABLE "Department" (
    department_id TEXT PRIMARY KEY CHECK (btrim(department_id) <> ''),
    code TEXT NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> '')
);

CREATE TABLE "Club" (
    club_id TEXT PRIMARY KEY CHECK (btrim(club_id) <> ''),
    code TEXT NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> '')
);

CREATE TABLE "Organization" (
    organization_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    type TEXT NOT NULL CHECK (type IN ('club', 'faculty', 'department', 'student_affairs_office')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "ActivityCategory" (
    category_id INT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (btrim(name) <> ''),
    description TEXT
);

CREATE TABLE "AppealStatus" (
    appeal_status_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (code IN (
        'pending_assignment', 'pending_review', 'under_review',
        'additional_information_required', 'approved', 'rejected', 'withdrawn'
    )),
    name TEXT NOT NULL CHECK (btrim(name) <> '')
);

INSERT INTO "AppealStatus" (code, name) VALUES
    ('pending_assignment', 'Pending Assignment'),
    ('pending_review', 'Pending Review'),
    ('under_review', 'Under Review'),
    ('additional_information_required', 'Additional Information Required'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('withdrawn', 'Withdrawn');

CREATE TABLE "Semester" (
    semester_id INT PRIMARY KEY,
    quarter_academic_year CHAR(6) NOT NULL CHECK (btrim(quarter_academic_year) <> ''),
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    CHECK (starts_at < ends_at)
);

CREATE TABLE "ScoreCriterion" (
    criterion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (btrim(code) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "ScoringPolicyVersion" (
    policy_version_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    activation_at TIMESTAMPTZ NOT NULL,
    weight NUMERIC(8, 4) NOT NULL CHECK (weight >= 0),
    min_points NUMERIC(8, 2) NOT NULL CHECK (min_points >= 0),
    max_points NUMERIC(8, 2) NOT NULL,
    semester_cap NUMERIC(8, 2) NOT NULL CHECK (semester_cap >= 0),
    UNIQUE (policy_version_id, criterion_id, semester_id),
    CHECK (min_points <= max_points)
);

-- Used policy versions and historical awards are immutable; preview and activation
-- require authorized workflow checks before later versions take effect.

CREATE TABLE "User" (
    user_id TEXT PRIMARY KEY CHECK (btrim(user_id) <> ''),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    email TEXT NOT NULL UNIQUE CHECK (btrim(email) <> ''),
    phone_number TEXT,
    password_hash TEXT NOT NULL CHECK (btrim(password_hash) <> ''),
    full_name TEXT NOT NULL CHECK (btrim(full_name) <> ''),
    student_number TEXT UNIQUE CHECK (student_number IS NULL OR btrim(student_number) <> ''),
    faculty_id TEXT REFERENCES "Faculty"(faculty_id),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, faculty_id)
);

CREATE TABLE "UserRole" (
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    role_id INT NOT NULL REFERENCES "Role"(role_id),
    granted_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE "Student" (
    user_id TEXT PRIMARY KEY,
    major_id TEXT REFERENCES "Major"(major_id),
    faculty_id TEXT NOT NULL REFERENCES "Faculty"(faculty_id),
    enrollment_year INT NOT NULL CHECK (enrollment_year > 0),
    FOREIGN KEY (user_id, faculty_id) REFERENCES "User"(user_id, faculty_id),
    FOREIGN KEY (major_id, faculty_id) REFERENCES "Major"(major_id, faculty_id)
);

CREATE TABLE "Manager" (
    user_id TEXT PRIMARY KEY REFERENCES "User"(user_id),
    position_title TEXT
);

CREATE TABLE "Administrator" (
    user_id TEXT PRIMARY KEY REFERENCES "User"(user_id),
    office_name TEXT,
    position_title TEXT
);

CREATE TABLE "OrganizationMember" (
    membership_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES "Organization"(organization_id),
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    responsibility TEXT NOT NULL CHECK (btrim(responsibility) <> ''),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    CHECK (ends_at IS NULL OR starts_at < ends_at)
);

CREATE UNIQUE INDEX organization_member_one_active
    ON "OrganizationMember" (organization_id, user_id) WHERE ends_at IS NULL;

-- Role/profile matching, staff-only academic identity edits, membership authority,
-- and account deactivation checks require authorized workflow transactions.

CREATE TABLE "UserInterest" (
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    category_id INT NOT NULL REFERENCES "ActivityCategory"(category_id),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE "Activity" (
    activity_id TEXT PRIMARY KEY CHECK (btrim(activity_id) <> ''),
    organization_id BIGINT NOT NULL REFERENCES "Organization"(organization_id),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    description TEXT,
    eligibility_notes TEXT,
    category_id INT NOT NULL REFERENCES "ActivityCategory"(category_id),
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    capacity INT NOT NULL CHECK (capacity > 0),
    registration_opens_at TIMESTAMPTZ NOT NULL,
    registration_closes_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    attendance_rule TEXT,
    created_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (registration_opens_at < registration_closes_at)
);

CREATE TABLE "ActivityManage" (
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    user_id TEXT NOT NULL REFERENCES "Manager"(user_id),
    PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE "ActivityFollow" (
    user_id TEXT NOT NULL REFERENCES "Student"(user_id),
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    followed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, activity_id)
);

-- Publication readiness, allowed status transitions, schedule containment,
-- and activity-manager eligibility require workflow checks.

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
    policy_version_id BIGINT NOT NULL REFERENCES "ScoringPolicyVersion"(policy_version_id),
    base_points NUMERIC(8, 2) NOT NULL CHECK (base_points >= 0),
    PRIMARY KEY (activity_id, policy_version_id)
);

-- ActivityScore base-point range and effective semester depend on the applied
-- policy and activity records and require cross-record validation.

CREATE TABLE "Registration" (
    registration_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    user_id TEXT NOT NULL REFERENCES "Student"(user_id),
    attempt_number INT NOT NULL CHECK (attempt_number > 0),
    status TEXT NOT NULL
        CHECK (status IN ('pending_approval', 'confirmed', 'waitlisted', 'rejected', 'cancelled')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waitlisted_at TIMESTAMPTZ,
    queue_sequence BIGINT,
    confirmed_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ,
    decided_by_user_id TEXT REFERENCES "User"(user_id),
    UNIQUE (activity_id, user_id, attempt_number),
    UNIQUE (queue_sequence),
    UNIQUE (registration_id, activity_id),
    UNIQUE (registration_id, user_id),
    CHECK ((decided_at IS NULL) = (decided_by_user_id IS NULL)),
    CHECK (decided_at IS NULL OR decided_at >= registered_at),
    CHECK (waitlisted_at IS NULL OR waitlisted_at >= registered_at),
    CHECK (confirmed_at IS NULL OR confirmed_at >= registered_at),
    CHECK (status <> 'waitlisted' OR (waitlisted_at IS NOT NULL AND queue_sequence IS NOT NULL)),
    CHECK (status <> 'confirmed' OR confirmed_at IS NOT NULL)
);

CREATE UNIQUE INDEX registration_one_active_attempt
    ON "Registration" (activity_id, user_id)
    WHERE status IN ('pending_approval', 'confirmed', 'waitlisted');

-- Seat reservation, FIFO promotion, displacement, capacity limits, and
-- registration-window/eligibility checks require serialized workflow transactions.

CREATE TABLE "Attendance" (
    schedule_id BIGINT NOT NULL,
    registration_id BIGINT NOT NULL,
    activity_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('attended', 'absent')),
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
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_reason TEXT
);

-- Participation verification requires a Confirmed registration and the
-- published threshold or a reasoned manager decision.

CREATE TABLE "Appeal" (
    appeal_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submitted_by_user_id TEXT NOT NULL REFERENCES "Student"(user_id),
    activity_id TEXT REFERENCES "Activity"(activity_id),
    registration_id BIGINT,
    score_id BIGINT,
    type TEXT NOT NULL
        CHECK (type IN ('recognition', 'participation_correction', 'score_correction')),
    issue_type TEXT,
    description TEXT NOT NULL CHECK (btrim(description) <> ''),
    status TEXT NOT NULL REFERENCES "AppealStatus"(code),
    assigned_to_user_id TEXT REFERENCES "Manager"(user_id),
    reviewed_by_user_id TEXT REFERENCES "Manager"(user_id),
    response TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    withdrawn_by_user_id TEXT REFERENCES "User"(user_id),
    withdrawn_at TIMESTAMPTZ,
    UNIQUE (appeal_id, submitted_by_user_id),
    FOREIGN KEY (registration_id, submitted_by_user_id)
        REFERENCES "Registration"(registration_id, user_id),
    CHECK (
        (type = 'recognition' AND registration_id IS NULL AND score_id IS NULL)
        OR (type = 'participation_correction' AND registration_id IS NOT NULL AND score_id IS NULL)
        OR (type = 'score_correction' AND issue_type IS NOT NULL
            AND registration_id IS NULL AND (
            (issue_type = 'missing_score' AND activity_id IS NOT NULL AND score_id IS NULL)
            OR (issue_type = 'incorrect_score' AND score_id IS NOT NULL)
        ))
    ),
    CHECK (
        (status IN ('approved', 'rejected')
            AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL
            AND response IS NOT NULL AND btrim(response) <> ''
            AND withdrawn_by_user_id IS NULL AND withdrawn_at IS NULL)
        OR (status = 'withdrawn' AND withdrawn_by_user_id IS NOT NULL
            AND withdrawn_by_user_id = submitted_by_user_id
            AND withdrawn_at IS NOT NULL AND reviewed_by_user_id IS NULL
            AND reviewed_at IS NULL AND response IS NULL)
        OR (status NOT IN ('approved', 'rejected', 'withdrawn')
            AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL
            AND response IS NULL AND withdrawn_by_user_id IS NULL AND withdrawn_at IS NULL)
    ),
    CHECK (reviewed_at IS NULL OR reviewed_at >= submitted_at),
    CHECK (withdrawn_at IS NULL OR withdrawn_at >= submitted_at)
);

CREATE TABLE "RequestAssignment" (
    assignment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appeal_id BIGINT NOT NULL REFERENCES "Appeal"(appeal_id),
    manager_user_id TEXT NOT NULL REFERENCES "Manager"(user_id),
    assigned_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    CHECK (ended_at IS NULL OR assigned_at < ended_at)
);

CREATE UNIQUE INDEX request_assignment_one_current
    ON "RequestAssignment" (appeal_id) WHERE ended_at IS NULL;

CREATE TABLE "RequestRevision" (
    revision_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appeal_id BIGINT NOT NULL REFERENCES "Appeal"(appeal_id),
    edited_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    previous_values JSONB NOT NULL,
    new_values JSONB NOT NULL
);

CREATE TABLE "RecognitionRequestDetail" (
    appeal_id BIGINT PRIMARY KEY REFERENCES "Appeal"(appeal_id),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    occurred_at TIMESTAMPTZ NOT NULL,
    is_internal BOOLEAN NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('volunteering', 'academic', 'other')),
    target_semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    proposed_criterion_id BIGINT REFERENCES "ScoreCriterion"(criterion_id)
);

-- Assignment eligibility, request revision/transition rules, terminal-state
-- protection, evidence count, and reviewer authorization require transactions.

CREATE TABLE "Recognition" (
    recognition_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appeal_id BIGINT NOT NULL UNIQUE,
    student_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    occurred_at TIMESTAMPTZ NOT NULL,
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    policy_version_id BIGINT NOT NULL,
    verified_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appeal_id, student_user_id)
        REFERENCES "Appeal"(appeal_id, submitted_by_user_id),
    FOREIGN KEY (policy_version_id, criterion_id, semester_id)
        REFERENCES "ScoringPolicyVersion"(policy_version_id, criterion_id, semester_id),
    UNIQUE (recognition_id, criterion_id, semester_id, policy_version_id)
);

CREATE TABLE "TrainingScore" (
    score_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participation_id BIGINT REFERENCES "Participation"(participation_id),
    recognition_id BIGINT REFERENCES "Recognition"(recognition_id),
    policy_version_id BIGINT NOT NULL,
    criterion_id BIGINT NOT NULL REFERENCES "ScoreCriterion"(criterion_id),
    semester_id INT NOT NULL REFERENCES "Semester"(semester_id),
    base_points NUMERIC(8, 2) NOT NULL CHECK (base_points >= 0),
    weighted_points NUMERIC(8, 2) NOT NULL CHECK (weighted_points >= 0),
    points_awarded NUMERIC(8, 2) NOT NULL CHECK (points_awarded >= 0),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    awarded_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    UNIQUE (participation_id, criterion_id),
    UNIQUE (recognition_id, criterion_id),
    FOREIGN KEY (policy_version_id, criterion_id, semester_id)
        REFERENCES "ScoringPolicyVersion"(policy_version_id, criterion_id, semester_id),
    FOREIGN KEY (recognition_id, criterion_id, semester_id, policy_version_id)
        REFERENCES "Recognition"(recognition_id, criterion_id, semester_id, policy_version_id),
    CHECK ((participation_id IS NOT NULL) <> (recognition_id IS NOT NULL))
);

ALTER TABLE "Appeal"
    ADD CONSTRAINT appeal_score_fk FOREIGN KEY (score_id) REFERENCES "TrainingScore"(score_id);

CREATE TABLE "ScoreChange" (
    change_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    score_id BIGINT NOT NULL REFERENCES "TrainingScore"(score_id),
    appeal_id BIGINT REFERENCES "Appeal"(appeal_id),
    old_points NUMERIC(8, 2) NOT NULL CHECK (old_points >= 0),
    new_points NUMERIC(8, 2) NOT NULL CHECK (new_points >= 0),
    changed_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL CHECK (btrim(reason) <> ''),
    UNIQUE (change_id, score_id)
);

CREATE TABLE "ScoreAdjustment" (
    adjustment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    score_id BIGINT NOT NULL REFERENCES "TrainingScore"(score_id),
    change_id BIGINT NOT NULL UNIQUE,
    appeal_id BIGINT REFERENCES "Appeal"(appeal_id),
    delta NUMERIC(8, 2) NOT NULL,
    approved_by_user_id TEXT NOT NULL REFERENCES "Manager"(user_id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL CHECK (btrim(reason) <> ''),
    FOREIGN KEY (change_id, score_id) REFERENCES "ScoreChange"(change_id, score_id)
);

-- Initial missing-score awards have no prior ScoreChange. Existing-score
-- adjustments, current score, semester cap, decision, and audit must be atomic.
-- Offered activity policy, weighted-point calculation, recognition approval,
-- and score-source ownership require cross-record validation.

CREATE TABLE "AppealEvidence" (
    evidence_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appeal_id BIGINT NOT NULL REFERENCES "Appeal"(appeal_id),
    storage_key TEXT NOT NULL CHECK (btrim(storage_key) <> ''),
    description TEXT,
    mime_type TEXT NOT NULL
        CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Evidence access is limited to the submitting student and authorized staff;
-- a submitted appeal must have at least one valid file before commit.

CREATE TABLE "ActivityAnnouncement" (
    announcement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES "Activity"(activity_id),
    author_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    body TEXT NOT NULL CHECK (btrim(body) <> ''),
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    activity_id TEXT REFERENCES "Activity"(activity_id),
    announcement_id BIGINT REFERENCES "ActivityAnnouncement"(announcement_id),
    appeal_id BIGINT REFERENCES "Appeal"(appeal_id),
    type TEXT NOT NULL CHECK (btrim(type) <> ''),
    message TEXT NOT NULL CHECK (btrim(message) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ,
    CHECK (read_at IS NULL OR read_at >= created_at)
);

CREATE TABLE "NotificationDelivery" (
    delivery_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    notification_id BIGINT NOT NULL REFERENCES "Notification"(notification_id),
    channel TEXT NOT NULL CHECK (channel = 'email'),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'retrying', 'sent', 'exhausted')),
    attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    UNIQUE (notification_id, channel),
    CHECK ((status = 'sent') = (sent_at IS NOT NULL)),
    CHECK (status <> 'exhausted' OR (attempt_count > 0 AND last_error IS NOT NULL
        AND btrim(last_error) <> ''))
);

-- Notification and Pending email intent creation must commit with the business
-- event. Retry dispatch, exhaustion recovery, and external deduplication are
-- workflow responsibilities; retries update one delivery row.

CREATE TABLE "ServiceLink" (
    service_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (btrim(name) <> ''),
    url TEXT NOT NULL CHECK (btrim(url) <> ''),
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Product-wide administration and audit records required by the vision document.
CREATE TABLE "SystemSetting" (
    setting_key TEXT PRIMARY KEY CHECK (btrim(setting_key) <> ''),
    setting_value TEXT NOT NULL CHECK (btrim(setting_value) <> ''),
    updated_by_user_id TEXT REFERENCES "User"(user_id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
    audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    entity_type TEXT NOT NULL CHECK (btrim(entity_type) <> ''),
    entity_id TEXT NOT NULL CHECK (btrim(entity_id) <> ''),
    action TEXT NOT NULL CHECK (btrim(action) <> ''),
    reason TEXT NOT NULL CHECK (btrim(reason) <> ''),
    before_values JSONB,
    after_values JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit event creation, protected reading, and append-only behavior require
-- authorized workflow and database privileges; the row shape alone cannot enforce them.

CREATE TABLE "RefreshToken" (
    refresh_token_id CHAR(60) PRIMARY KEY CHECK (btrim(refresh_token_id) <> ''),
    user_id TEXT NOT NULL REFERENCES "User"(user_id)
)