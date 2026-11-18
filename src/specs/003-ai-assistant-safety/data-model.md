# Data Model: AI Assistant Safety, Usage Limits and Admin Monitoring

**Feature**: `003-ai-assistant-safety` | **Date**: 2026-11-18

All objects are created by `src/db/ai_schema.sql`, run after `schema.sql`. Existing tables are not changed. Full column definitions are in design section 8; this file lists fields, rules and relationships.

## Tables

### AiKnowledgeChunk

A piece of information the assistant may use as a source.

| Field | Type | Rules |
|---|---|---|
| `chunk_id` | bigint identity | PK |
| `source_type` | text | `activity`, `scoring_policy`, `procedure`, `faq`, `service_link`, `hosting_rule`, `venue_list` |
| `source_id`, `chunk_index` | text, int | Unique together with `source_type` |
| `content` | text | Not blank; at most about 800 tokens |
| `content_hash` | text | SHA-256 of `content`; unchanged chunks are not re-embedded |
| `embedding` | vector(768) | L2-normalised (R3) |
| `audience` | text | `public`, `student`, `manager`, `admin` |
| `faculty_ids` | text[] | NULL = all faculties |
| `trust` | text | `official` (uploaded by admin) or `staff_written` (activity descriptions) |
| `author_user_id` | text | FK `User` |
| `valid_until` | timestamptz | NULL = no end |
| `is_active`, `flagged` | boolean | `flagged` = injection phrases found at indexing (FR-038) |

Indexes: HNSW on `embedding` (cosine), btree on `(audience, is_active)`.
Personal records are **never** stored here.

### AiRequestLog

One row per question, every outcome. No content (FR-024, FR-031).

| Field | Rules |
|---|---|
| `request_id` uuid | PK |
| `user_id`, `role`, `faculty_id` | From the verified identity |
| `activity_id`, `semester_id` | Optional, set when a lookup targeted one activity or semester |
| `topic` | Closed list (design 4.2, plus manager topics) |
| `outcome` | `answered`, `refused_off_topic`, `blocked_input`, `blocked_output`, `quota_exceeded`, `budget_exceeded`, `disabled`, `busy`, `cooldown`, `notice_required`, `error` |
| `block_reason`, `rule_hits` | Optional |
| `model`, `prompt_version` | Model id used; system prompt version |
| `input_tokens`, `output_tokens`, `classifier_tokens`, `embedding_tokens`, `units` | ≥ 0; `units` is what was charged to the bars |
| `cost_usd` | numeric(10,6), estimate from `ai.price.<model>` |
| `latency_ms`, `llm_latency_ms`, `retrieval_ms`, `tool_rounds`, `source_count` | ≥ 0 |
| `created_at` | default now |

Indexes: `(created_at)`, `(user_id, created_at)`, `(outcome, created_at)`.

### AiToolCall

| Field | Rules |
|---|---|
| `tool_call_id` | PK |
| `request_id` | FK `AiRequestLog` |
| `tool_name` | One of the registered tools |
| `arguments` jsonb | Arguments as the model sent them (no identity is ever in them) |
| `allowed` | false when validation rejected the call |
| `row_count`, `duration_ms` | Optional |

### AiFlag

| Field | Rules |
|---|---|
| `flag_id` | PK |
| `request_id` | FK `AiRequestLog` |
| `category` | `injection_attempt`, `other_person_data`, `sql_probe`, `prompt_leak`, `pii_leak`, `output_code`, `off_topic_repeat`, `poisoned_source` |
| `severity` | `low`, `medium`, `high` |
| `redacted_prompt`, `model_reply` | Redacted (R12); NULL after expiry clean-up for `poisoned_source` flags that point to a chunk |
| `status` | `open` → `false_positive` / `confirmed_abuse` / `bypass_found` |
| `reviewed_by_user_id`, `reviewed_at`, `review_note` | Set together when status leaves `open` |
| `expires_at` | `created_at + 30 days`; rows are deleted after it (SC-009) |

State transitions: `open` → any reviewed status (once). A reviewed status cannot go back to `open`. Every transition writes `AuditLog` (`entity_type = 'AiFlag'`).

### AiUsageWindow

| Field | Rules |
|---|---|
| `user_id`, `window_type` | PK; `window_type` in `5h`, `week` |
| `window_start`, `window_end` | `window_start < window_end` |
| `units_used`, `requests` | ≥ 0 |

Lifecycle (R7): the row is created on the first question; when `now() >= window_end` the next question resets it (5h: start = now; week: start = this Monday 00:00 Asia/Saigon). Units are reserved before the AI call and corrected after it.

### AiUserQuota

| Field | Rules |
|---|---|
| `user_id` | PK, FK `User` |
| `limit_5h`, `limit_week` | NULL = role default from `SystemSetting` |
| `ai_disabled` | Admin pause with no end |
| `cooldown_until` | Automatic 24 h pause after 3 flags in 1 hour (FR-020) |
| `reason`, `updated_by_user_id`, `updated_at` | Required on admin changes; automatic pauses use the system administrator account and reason `auto_cooldown` |

### AiConsent

| Field | Rules |
|---|---|
| `user_id`, `notice_version` | PK |
| `accepted_at` | default now |

The current version is `SystemSetting` `ai.notice.version`; the text lives in `src/server/src/ai/prompt/notice.ts` (versioned with the code).

## Views (read by the AI module only)

| View | Columns | Filter |
|---|---|---|
| `ai_activity_public_v` | id, title, description, category, semester, organization name, schedule (start, end, location), base points, capacity, seats left, eligible `faculty_ids` | `status IN ('published','ongoing')` |
| `ai_my_registration_v` | `user_id` (for filtering only, never returned to the model), activity title, status, registered and confirmed dates, attendance summary | none; the query adds `WHERE user_id = $verified` |
| `ai_my_score_v` | `user_id` (filter only), semester, criterion code and name, points awarded | none; query adds `WHERE user_id = $verified` |
| `ai_scoring_rule_v` | semester, criterion code, name, description, weight, min, max, semester cap | active `ScoringPolicyVersion` (`activation_at <= now()`, latest per criterion and semester) |
| `ai_managed_activity_v` | `manager_user_id` (filter only), activity id, title, status, registration counts by status | none; query adds `WHERE manager_user_id = $verified` |
| `ai_service_link_v` | name, url | `is_active` |

Optional hardening: row-level security on the two `ai_my_*` views' base access using `current_setting('app.user_id')`, set by the module with `SET LOCAL` per transaction.

## Database role

`ai_gateway`: `SELECT` on the six views, `AiKnowledgeChunk`, `SystemSetting`, `AiUserQuota`; `INSERT` on `AiRequestLog`, `AiToolCall`, `AiFlag`; `SELECT, INSERT, UPDATE` on `AiUsageWindow`, `AiConsent`; `UPDATE (cooldown_until)` on `AiUserQuota`. Nothing else. Indexing and admin actions run through the API Server's normal role.

## Rows added to existing tables

**`Permission`** (granted through `RolePermission`): `ai.chat` (student, manager), `ai.chat.manager_tools` (manager), `ai.usage.read`, `ai.flags.review`, `ai.settings.manage`, `ai.knowledge.manage` (administrator).

**`SystemSetting`**: `ai.enabled` = `true`; `ai.monthly_budget_usd` = `5.00`; `ai.budget_alert_percent` = `80`; `ai.limit.5h.student` = `40000`; `ai.limit.week.student` = `200000`; `ai.limit.5h.manager` = `80000`; `ai.limit.week.manager` = `400000`; `ai.limit.min_units` = `500`; `ai.limit.project_rpm`, `ai.limit.project_rpd` (set below the current free-tier quota); `ai.model.chat` = `gemini-2.5-flash`; `ai.model.classifier` = `gemini-2.5-flash-lite`; `ai.model.embedding` = `gemini-embedding-001`; `ai.price.<model>` = JSON `{in_per_1m, out_per_1m}`; `ai.notice.version` = `1`; `ai.budget_alert_sent_month` = empty.

## Relationships

```text
User 1─* AiRequestLog 1─* AiToolCall
                     1─0..1 AiFlag *─0..1 Administrator (reviewer)
User 1─0..2 AiUsageWindow
User 1─0..1 AiUserQuota
User 1─* AiConsent
User 0..1─* AiKnowledgeChunk (author)
AiRequestLog *─0..1 Faculty, Activity, Semester
```
