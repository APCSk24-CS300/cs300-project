-- AI Assistant schema (specs/003-ai-assistant-safety/data-model.md).
-- Run after schema.sql, connected to the myHCMUS database:
--   psql -h localhost -U <user> -d myHCMUS -v ai_password="'<password>'" -f db/ai_schema.sql
-- Safe to run more than once. Changes no existing table.
-- Needs the pgvector extension (Docker image pgvector/pgvector:pg18).

CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge the assistant may use as a source. Personal records are never stored here.
CREATE TABLE IF NOT EXISTS "AiKnowledgeChunk" (
    chunk_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_type    TEXT NOT NULL CHECK (source_type IN ('activity', 'scoring_policy', 'procedure', 'faq',
                       'service_link', 'hosting_rule', 'venue_list')),
    source_id      TEXT NOT NULL CHECK (btrim(source_id) <> ''),
    chunk_index    INT  NOT NULL CHECK (chunk_index >= 0),
    content        TEXT NOT NULL CHECK (btrim(content) <> ''),
    content_hash   TEXT NOT NULL CHECK (btrim(content_hash) <> ''),
    embedding      vector(768) NOT NULL,
    audience       TEXT NOT NULL CHECK (audience IN ('public', 'student', 'manager', 'admin')),
    faculty_ids    TEXT[],                                -- NULL = all faculties
    trust          TEXT NOT NULL CHECK (trust IN ('official', 'staff_written')),
    author_user_id TEXT REFERENCES "User"(user_id),
    valid_until    TIMESTAMPTZ,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    flagged        BOOLEAN NOT NULL DEFAULT FALSE,        -- injection phrases found at indexing
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_type, source_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS ai_chunk_embedding_hnsw ON "AiKnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS ai_chunk_filter ON "AiKnowledgeChunk" (audience, is_active);

-- One row per question, whatever the outcome. Never holds message content.
CREATE TABLE IF NOT EXISTS "AiRequestLog" (
    request_id        UUID PRIMARY KEY,
    user_id           TEXT NOT NULL CHECK (btrim(user_id) <> ''),   -- no FK: the log must never fail
    role              TEXT NOT NULL,
    faculty_id        TEXT,
    activity_id       TEXT,
    semester_id       INT,
    topic             TEXT NOT NULL,
    outcome           TEXT NOT NULL CHECK (outcome IN ('answered', 'refused_off_topic', 'blocked_input',
                          'blocked_output', 'quota_exceeded', 'budget_exceeded', 'disabled', 'busy',
                          'cooldown', 'notice_required', 'error')),
    block_reason      TEXT,
    rule_hits         TEXT[],
    model             TEXT,
    prompt_version    TEXT NOT NULL,
    input_tokens      INT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens     INT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    classifier_tokens INT NOT NULL DEFAULT 0 CHECK (classifier_tokens >= 0),
    embedding_tokens  INT NOT NULL DEFAULT 0 CHECK (embedding_tokens >= 0),
    units             INT NOT NULL DEFAULT 0 CHECK (units >= 0),
    cost_usd          NUMERIC(10, 6) NOT NULL DEFAULT 0 CHECK (cost_usd >= 0),
    latency_ms        INT NOT NULL CHECK (latency_ms >= 0),
    llm_latency_ms    INT CHECK (llm_latency_ms >= 0),
    retrieval_ms      INT CHECK (retrieval_ms >= 0),
    tool_rounds       INT NOT NULL DEFAULT 0 CHECK (tool_rounds >= 0),
    source_count      INT NOT NULL DEFAULT 0 CHECK (source_count >= 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ai_log_time ON "AiRequestLog" (created_at);
CREATE INDEX IF NOT EXISTS ai_log_user_time ON "AiRequestLog" (user_id, created_at);
CREATE INDEX IF NOT EXISTS ai_log_outcome ON "AiRequestLog" (outcome, created_at);

CREATE TABLE IF NOT EXISTS "AiToolCall" (
    tool_call_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id   UUID NOT NULL REFERENCES "AiRequestLog"(request_id),
    tool_name    TEXT NOT NULL CHECK (btrim(tool_name) <> ''),
    arguments    JSONB NOT NULL,
    allowed      BOOLEAN NOT NULL,
    row_count    INT CHECK (row_count >= 0),
    duration_ms  INT CHECK (duration_ms >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AiFlag" (
    flag_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id          UUID NOT NULL REFERENCES "AiRequestLog"(request_id),
    category            TEXT NOT NULL CHECK (category IN ('injection_attempt', 'other_person_data', 'sql_probe',
                            'prompt_leak', 'pii_leak', 'output_code', 'off_topic_repeat', 'poisoned_source')),
    severity            TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    redacted_prompt     TEXT,
    model_reply         TEXT,
    status              TEXT NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'false_positive', 'confirmed_abuse', 'bypass_found')),
    reviewed_by_user_id TEXT REFERENCES "Administrator"(user_id),
    reviewed_at         TIMESTAMPTZ,
    review_note         TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((status = 'open') = (reviewed_at IS NULL)),
    CHECK ((reviewed_at IS NULL) = (reviewed_by_user_id IS NULL)),
    CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS ai_flag_queue ON "AiFlag" (status, severity, created_at);
CREATE INDEX IF NOT EXISTS ai_flag_expiry ON "AiFlag" (expires_at);

CREATE TABLE IF NOT EXISTS "AiUserQuota" (
    user_id            TEXT PRIMARY KEY REFERENCES "User"(user_id),
    limit_5h           INT CHECK (limit_5h >= 0),          -- NULL = role default
    limit_week         INT CHECK (limit_week >= 0),
    ai_disabled        BOOLEAN NOT NULL DEFAULT FALSE,
    cooldown_until     TIMESTAMPTZ,
    reason             TEXT,
    updated_by_user_id TEXT NOT NULL REFERENCES "User"(user_id),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One row per user per usage bar. Locked with SELECT ... FOR UPDATE while checking.
CREATE TABLE IF NOT EXISTS "AiUsageWindow" (
    user_id      TEXT NOT NULL REFERENCES "User"(user_id),
    window_type  TEXT NOT NULL CHECK (window_type IN ('5h', 'week')),
    window_start TIMESTAMPTZ NOT NULL,
    window_end   TIMESTAMPTZ NOT NULL,
    units_used   INT NOT NULL DEFAULT 0 CHECK (units_used >= 0),
    requests     INT NOT NULL DEFAULT 0 CHECK (requests >= 0),
    PRIMARY KEY (user_id, window_type),
    CHECK (window_start < window_end)
);

CREATE TABLE IF NOT EXISTS "AiConsent" (
    user_id        TEXT NOT NULL REFERENCES "User"(user_id),
    notice_version TEXT NOT NULL CHECK (btrim(notice_version) <> ''),
    accepted_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notice_version)
);

-- Views: the only business data the AI module can read (data-model.md "Views").
CREATE OR REPLACE VIEW ai_activity_public_v AS
SELECT a.activity_id, a.title, a.description, a.eligibility_notes,
       c.name AS category, a.semester_id, o.name AS organization,
       a.capacity, a.registration_opens_at, a.registration_closes_at, a.status,
       a.capacity - (SELECT count(*) FROM "Registration" r
                     WHERE r.activity_id = a.activity_id AND r.status IN ('pending_approval', 'confirmed')) AS seats_left,
       (SELECT array_agg(e.faculty_id) FROM "ActivityEligibility" e WHERE e.activity_id = a.activity_id) AS faculty_ids,
       (SELECT json_agg(json_build_object('starts_at', s.starts_at, 'ends_at', s.ends_at, 'location', s.location)
                        ORDER BY s.starts_at)
        FROM "ActivitySchedule" s WHERE s.activity_id = a.activity_id) AS schedule
FROM "Activity" a
JOIN "ActivityCategory" c ON c.category_id = a.category_id
JOIN "Organization" o ON o.organization_id = a.organization_id
WHERE a.status IN ('published', 'ongoing');

CREATE OR REPLACE VIEW ai_my_registration_v AS
SELECT r.user_id, a.title AS activity_title, r.status, r.registered_at, r.confirmed_at,
       (SELECT count(*) FROM "Attendance" t WHERE t.registration_id = r.registration_id AND t.status = 'attended') AS sessions_attended,
       (SELECT count(*) FROM "ActivitySchedule" s WHERE s.activity_id = r.activity_id) AS sessions_total
FROM "Registration" r
JOIN "Activity" a ON a.activity_id = r.activity_id;

CREATE OR REPLACE VIEW ai_my_score_v AS
SELECT r.user_id, ts.semester_id, sc.code AS criterion_code, sc.name AS criterion_name, ts.points_awarded
FROM "TrainingScore" ts
JOIN "Participation" p ON p.participation_id = ts.participation_id
JOIN "Registration" r ON r.registration_id = p.registration_id
JOIN "ScoreCriterion" sc ON sc.criterion_id = ts.criterion_id;

CREATE OR REPLACE VIEW ai_scoring_rule_v AS
SELECT DISTINCT ON (spv.criterion_id, spv.semester_id)
       spv.semester_id, sc.code AS criterion_code, sc.name AS criterion_name, sc.description,
       spv.weight, spv.min_points, spv.max_points, spv.semester_cap
FROM "ScoringPolicyVersion" spv
JOIN "ScoreCriterion" sc ON sc.criterion_id = spv.criterion_id
WHERE sc.is_active AND spv.activation_at <= now()
ORDER BY spv.criterion_id, spv.semester_id, spv.activation_at DESC;

CREATE OR REPLACE VIEW ai_managed_activity_v AS
SELECT m.user_id AS manager_user_id, a.activity_id, a.title, a.status,
       count(r.*) FILTER (WHERE r.status = 'confirmed')        AS confirmed,
       count(r.*) FILTER (WHERE r.status = 'pending_approval') AS pending,
       count(r.*) FILTER (WHERE r.status = 'waitlisted')       AS waitlisted
FROM "ActivityManage" m
JOIN "Activity" a ON a.activity_id = m.activity_id
LEFT JOIN "Registration" r ON r.activity_id = a.activity_id
GROUP BY m.user_id, a.activity_id, a.title, a.status;

CREATE OR REPLACE VIEW ai_service_link_v AS
SELECT name, url FROM "ServiceLink" WHERE is_active;

-- Least-privilege role for the AI module (research R1, data-model.md "Database role").
-- The password comes from psql -v ai_password=...; it is never stored in this file.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_gateway') THEN
        CREATE ROLE ai_gateway LOGIN;
    END IF;
END $$;
\if :{?ai_password}
ALTER ROLE ai_gateway PASSWORD :ai_password;
\endif

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ai_gateway;
GRANT SELECT ON ai_activity_public_v, ai_my_registration_v, ai_my_score_v, ai_scoring_rule_v,
                ai_managed_activity_v, ai_service_link_v,
                "AiKnowledgeChunk", "SystemSetting", "AiUserQuota" TO ai_gateway;
GRANT INSERT ON "AiRequestLog", "AiToolCall", "AiFlag" TO ai_gateway;
GRANT SELECT ON "AiRequestLog" TO ai_gateway;            -- re-seeding the daily project counter
GRANT SELECT, INSERT, UPDATE ON "AiUsageWindow", "AiConsent" TO ai_gateway;
GRANT UPDATE (cooldown_until) ON "AiUserQuota" TO ai_gateway;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ai_gateway;

-- Permissions. IDs 900-905 are reserved for AI.
INSERT INTO "Permission" (permission_id, code, description) VALUES
    (900, 'ai.chat',               'Use the AI assistant'),
    (901, 'ai.chat.manager_tools', 'Use the AI assistant''s event-planning tools'),
    (902, 'ai.usage.read',         'View AI usage and request metadata'),
    (903, 'ai.flags.review',       'Review flagged AI requests'),
    (904, 'ai.settings.manage',    'Change AI settings and per-user limits'),
    (905, 'ai.knowledge.manage',   'Manage AI knowledge sources')
ON CONFLICT (permission_id) DO NOTHING;

INSERT INTO "RolePermission" (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM "Role" r
JOIN "Permission" p ON
       (r.code IN ('student', 'manager') AND p.code = 'ai.chat')
    OR (r.code = 'manager'       AND p.code = 'ai.chat.manager_tools')
    OR (r.code = 'administrator' AND p.code IN ('ai.usage.read', 'ai.flags.review',
                                                'ai.settings.manage', 'ai.knowledge.manage'))
ON CONFLICT DO NOTHING;

-- Default settings (data-model.md). Before use, set ai.limit.project_* below the current Gemini
-- free-tier quota and ai.price.* from Google's current price page; both change over time.
INSERT INTO "SystemSetting" (setting_key, setting_value) VALUES
    ('ai.enabled',               'true'),
    ('ai.monthly_budget_usd',    '5.00'),
    ('ai.budget_alert_percent',  '80'),
    ('ai.limit.5h.student',      '40000'),
    ('ai.limit.week.student',    '200000'),
    ('ai.limit.5h.manager',      '80000'),
    ('ai.limit.week.manager',    '400000'),
    ('ai.limit.min_units',       '500'),
    ('ai.limit.project_rpm',     '8'),
    ('ai.limit.project_rpd',     '200'),
    ('ai.model.chat',            'gemini-2.5-flash'),
    ('ai.model.classifier',      'gemini-2.5-flash-lite'),
    ('ai.model.embedding',       'gemini-embedding-001'),
    ('ai.price.gemini-2.5-flash',      '{"in_per_1m": 0.30, "out_per_1m": 2.50}'),
    ('ai.price.gemini-2.5-flash-lite', '{"in_per_1m": 0.10, "out_per_1m": 0.40}'),
    ('ai.notice.version',        '1')
ON CONFLICT (setting_key) DO NOTHING;
