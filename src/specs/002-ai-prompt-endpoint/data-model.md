# Data Model: AI Student Assistant Prompt Endpoint

**Feature**: [spec.md](spec.md) | **Date**: 2026-11-13

Nothing is stored in the database in this feature. These are the in-memory shapes passed between layers (TypeScript types in `src/server/src/types/`).

## PromptRequest (request body)

| Field | Type | Required | Rules |
|---|---|---|---|
| `message` | string | Yes | Trimmed length 1–2,000 characters |
| `history` | ConversationTurn[] | No | 0–20 items; missing means `[]` (new conversation) |

## ConversationTurn

| Field | Type | Rules |
|---|---|---|
| `role` | `"user"` \| `"assistant"` | `user` = the student, `assistant` = an earlier answer |
| `text` | string | Trimmed length 1–2,000 characters |

Order is oldest first. The server maps `assistant` to Gemini's `model` role, then adds `message` as the final `user` turn. The client keeps the list and appends each new question and answer itself.

## PromptResult (response `data`)

| Field | Type | Notes |
|---|---|---|
| `reply` | string | The assistant's answer (plain text, may contain simple Markdown) |
| `blocked` | boolean | `true` when the fixed safety refusal was returned instead of a model answer |

## LLMError (internal, not sent to clients)

| Field | Type | Notes |
|---|---|---|
| `kind` | `not_configured` \| `unavailable` \| `timeout` \| `quota` \| `config` \| `bad_response` | Decides the log entry and the `Retry-After` value; every kind becomes a `503` (see research R6) |
| `message` | string | Technical detail for the log only |

## RateLimitEntry (internal, in memory)

| Field | Type | Notes |
|---|---|---|
| key | string | User ID from the access token (`sub`), or the IP address as a fallback |
| `windowStart` | number | Start of the current 60-second window (ms) |
| `count` | number | Requests in this window; over 10 → `429` |
