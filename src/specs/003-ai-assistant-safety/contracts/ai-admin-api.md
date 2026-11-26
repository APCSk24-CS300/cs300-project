# Contract: AI administration endpoints

**Feature**: `003-ai-assistant-safety` | **Date**: 2026-11-18

All endpoints are under `/api/admin/ai`, use `ServiceResponse`, require `Authorization: Bearer <access token>` and the permission named in each table (`403` otherwise). Dates are ISO 8601; `from` and `to` default to the last 30 days. Every write requires a non-blank `reason` and writes one `AuditLog` row with `before_values` and `after_values`.

## Usage

| Method and path | Permission | Query | Returns |
|---|---|---|---|
| `GET /usage/summary` | `ai.usage.read` | `from`, `to` | `{ requests, unique_users, input_tokens, output_tokens, cost_usd, budget_usd, budget_used_percent, blocked, by_outcome: {…}, latency_ms: { p50, p95 } }` |
| `GET /usage/series` | `ai.usage.read` | `from`, `to`, `groupBy` = `day` \| `topic` \| `outcome` \| `role` | `[ { key, requests, cost_usd, blocked } ]` |
| `GET /requests` | `ai.usage.read` | `userId`, `outcome`, `topic`, `from`, `to`, `page` (default 1), `pageSize` (default 50, max 200) | `{ items: [AiRequestLog rows], total }` (no content) |
| `GET /requests/:requestId` | `ai.usage.read` | | One row plus `tool_calls[]` and `flag` (with content only if the caller also has `ai.flags.review`) |
| `GET /usage/top-users` | `ai.usage.read` | `from`, `to`, `by` = `requests` \| `blocked`, `limit` (default 10) | `[ { user_id, full_name, requests, blocked, units } ]` |

## Flags

| Method and path | Permission | Body / query | Returns |
|---|---|---|---|
| `GET /flags` | `ai.flags.review` | `status` (default `open`), `severity`, `category`, `page` | `{ items: [ { flag_id, request_id, category, severity, redacted_prompt, model_reply, user_id, created_at, expires_at, status } ], total }`, sorted by severity then time |
| `PATCH /flags/:flagId` | `ai.flags.review` | `{ "status": "false_positive" \| "confirmed_abuse" \| "bypass_found", "review_note": "…" }` | Updated flag. `409` if already reviewed. |

## Settings and limits

| Method and path | Permission | Body | Returns |
|---|---|---|---|
| `GET /settings` | `ai.settings.manage` | | All `ai.*` settings as typed values |
| `PUT /settings` | `ai.settings.manage` | `{ "changes": { "ai.enabled": false, "ai.monthly_budget_usd": 5 }, "reason": "…" }` | Updated settings. Unknown keys or wrong types `400`. Takes effect within 10 s (cache). |
| `GET /users/:userId/quota` | `ai.settings.manage` | | `AiUserQuota` row (or defaults) plus current bars |
| `PUT /users/:userId/quota` | `ai.settings.manage` | `{ "limit_5h": 80000 \| null, "limit_week": null, "ai_disabled": false, "clear_cooldown": true, "reason": "…" }` | Updated row |

## Knowledge

| Method and path | Permission | Body | Returns |
|---|---|---|---|
| `POST /knowledge` | `ai.knowledge.manage` | `{ "source_type": "procedure" \| "faq" \| "hosting_rule" \| "venue_list", "source_id": "…", "title": "…", "content_md": "…", "audience": "public" \| "student" \| "manager", "faculty_ids": null, "valid_until": null, "reason": "…" }` (content ≤ 200 KB) | `{ source_id, chunks, flagged_chunks }` |
| `GET /knowledge` | `ai.knowledge.manage` | `source_type`, `flagged` | List of sources with chunk counts and flags |
| `DELETE /knowledge/:sourceType/:sourceId` | `ai.knowledge.manage` | `{ "reason": "…" }` | `204` (chunks set `is_active = false`) |
| `POST /knowledge/reindex` | `ai.knowledge.manage` | `{ "source_type": "activity" \| null, "reason": "…" }` | `{ embedded, skipped_unchanged, deactivated }` |

Activities are also re-indexed automatically by `aiMaintenance` every 5 minutes for activities changed since the last run (FR-036).
