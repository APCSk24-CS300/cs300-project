# Contract: AI Assistant endpoints (students and managers)

**Feature**: `003-ai-assistant-safety` | **Date**: 2026-11-18

All endpoints use the existing `ServiceResponse` format (`success`, `statusCode`, `payload.message`, `payload.data`) and require `Authorization: Bearer <access token>`. Shared checks, in order: method (`405`), access token (`401`), permission `ai.chat` (`403`), content type for POST (`415`), per-IP limit (`429`), body size 16 KB (`413`).

## POST /api/ai/chat

`POST /api/ai/prompt` stays as an alias with the same contract until the client has moved; then it is removed.

### Request

```json
{
  "message": "Which volunteer activities can I still join this semester?",
  "history": [
    { "role": "user", "text": "Hi" },
    { "role": "assistant", "text": "Hello! I can help with...", "signature": "b64url..." }
  ]
}
```

Validation (`400`, `data.details` lists problems), extending `002`:

- `message`: required string, 1–2,000 characters after trimming.
- `history`: optional array, at most 20 turns; `role` is `user` or `assistant`; `text` 1–2,000 characters.
- Every `assistant` turn must have a `signature` that matches (R6), otherwise `history[i].signature is invalid`.

### Processing order

The first step that fails sends the response (design 3.2).

| # | Check | Response | Outcome logged |
|---|---|---|---|
| 1 | 10 per minute per user | `429`, `Retry-After` | not logged (phase 1 limiter) |
| 2 | One request in flight | `429`, `data.reason = "in_flight"` | not logged |
| 3 | Body validation incl. signatures | `400` | not logged |
| 4 | Notice accepted | `428`, `data.notice_version` | `notice_required` |
| 5 | `ai.enabled` | `200`, `blocked: true`, unavailable reply | `disabled` |
| 6 | User paused (`ai_disabled` or `cooldown_until`) | `429`, `data.reason = "paused"`, `data.resumes_at` | `cooldown` |
| 7 | Monthly budget | `200`, unavailable reply | `budget_exceeded` |
| 8 | Usage bars (both) | `429`, `data.limit = "5h" \| "week"`, `data.resets_at` | `quota_exceeded` |
| 9 | Project limits and concurrency | `503`, `Retry-After`, busy message | `busy` |
| 10 | Repeat within 2 min | `200`, cached reply | `answered` (0 units) |
| 11 | Rule filter + classifier | `200`, `blocked: true`, refusal | `refused_off_topic` or `blocked_input` |
| 12 | Retrieval + generation + tools | `200` or `503` | `answered` or `error` |
| 13 | Output guard | `200`, `blocked: true`, refusal | `blocked_output` |

### 200 response

```json
{
  "success": true,
  "statusCode": 200,
  "payload": {
    "message": "Prompt answered (OK)",
    "data": {
      "reply": "You can still register for two activities: ...",
      "blocked": false,
      "flagged": false,
      "sources": [
        { "type": "activity", "id": "ACT-2026-014", "title": "Green Summer 2026" },
        { "type": "scoring_policy", "id": "5.2", "title": "Volunteer activities" }
      ],
      "request_id": "6f1c…",
      "signature": "b64url…",
      "usage": {
        "5h":   { "used": 14200, "limit": 40000, "resets_at": "2026-11-18T07:30:00Z" },
        "week": { "used": 120500, "limit": 200000, "resets_at": "2026-11-22T17:00:00Z" }
      }
    }
  }
}
```

When `blocked` is `true`, `reply` is one of the fixed texts:

- Off-topic: "Sorry, I can only help with student activities, training points and university procedures. You could ask me, for example, …" (two suggested topics).
- Flagged: the off-topic text plus "This request was blocked and saved for review." and `flagged: true`.
- Unavailable: "The assistant is temporarily unavailable. Please try again later."

`sources` is empty for refusals. `signature` is present on every `200` so the client can send the turn back.

### 429 response (bar full)

```json
{
  "success": false,
  "statusCode": 429,
  "payload": {
    "message": "AI usage limit reached (TOO_MANY_REQUESTS)",
    "data": { "limit": "5h", "resets_at": "2026-11-18T07:30:00Z" }
  }
}
```

The `Retry-After` header holds the seconds until `resets_at`.

### 428 response (notice not accepted)

```json
{
  "success": false,
  "statusCode": 428,
  "payload": {
    "message": "AI notice must be accepted (PRECONDITION_REQUIRED)",
    "data": { "notice_version": "1" }
  }
}
```

## GET /api/ai/me/quota

Returns both bars and any pause. Does not use units.

```json
{
  "success": true,
  "statusCode": 200,
  "payload": {
    "message": "AI usage (OK)",
    "data": {
      "5h":   { "used": 0, "limit": 40000, "resets_at": null },
      "week": { "used": 120500, "limit": 200000, "resets_at": "2026-11-22T17:00:00Z" },
      "paused_until": null,
      "enabled": true
    }
  }
}
```

`5h.resets_at` is `null` when no 5-hour window is active (the next question starts one).

## GET /api/ai/notice

```json
{ "...": "...", "data": { "version": "1", "accepted": false, "text_md": "**Before you use the AI Student Assistant** ..." } }
```

## POST /api/ai/notice/accept

Request `{ "version": "1" }`. `204` on success; `409` if `version` is not the current one.
