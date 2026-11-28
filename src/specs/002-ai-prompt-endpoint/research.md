# Research: AI Student Assistant Prompt Endpoint

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-13

Each decision lists what was chosen, why, and what else was considered.

## R1. How to call Gemini: plain `fetch` vs the official SDK

- **Decision**: Call the Gemini REST endpoint `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with Node's built-in `fetch`. Send the key in the `x-goog-api-key` header.
- **Rationale**: We only need one call (send a conversation, get text back). Node 22 already has `fetch` and `AbortController`, so no new dependency is needed (constitution: "New dependencies MUST have a documented justification"; "Prefer the simplest solution"). Putting the key in a header, not the URL query string, keeps it out of URL logs.
- **Alternatives considered**: `@google/genai` SDK. Nicer types and auto-retries, but adds a dependency for one call and hides the HTTP status codes we need to map errors. Can be swapped in later behind the same interface (R3).

## R2. Which model

- **Decision**: Read the model name from `GEMINI_MODEL` in `.env`, defaulting to `gemini-2.5-flash`.
- **Rationale**: Flash models are the ones offered on the free tier and are fast enough for chat. Google renames and retires models often, so the name must be changeable without a code change. Check the current free models at Google AI Studio before release.
- **Alternatives considered**: Hard-coding a model (breaks when it is retired); a "pro" model (lower free quota, slower).

## R3. Where the Gemini code lives (layering)

- **Decision**: Follow the auth module's pattern of "interface + one implementation":
  - `clients/LLMClient.ts`: an `LLMClient` interface with one method, `generate(turns, systemInstruction)`, plus a small `LLMError` type with a `kind` (`unavailable`, `timeout`, `quota`, `blocked`, `bad_response`, `not_configured`).
  - `clients/GeminiClient.ts`: the only class that knows about Gemini URLs, JSON shapes, and HTTP codes.
  - `AIService` depends on `LLMClient`, not on Gemini, and turns `LLMError`s into `ServiceResponse`s.
- **Rationale**: Keeps business logic out of HTTP handling (constitution I). Tests can pass a fake `LLMClient`, so they never call Google or need a key. A new `clients/` folder is used instead of `repositories/` because this is an outside service, not stored data.
- **Alternatives considered**: Calling `fetch` directly inside `AIService` (harder to test, mixes concerns); putting it in `repositories/` (misleading name).

## R4. Conversation history

- **Decision**: Stateless server. The client sends the earlier turns (`history`) with each request, at most 20 turns. The server forwards them to Gemini as `contents` with roles `user` and `model`.
- **Rationale**: Gemini itself is stateless, so the whole conversation must be sent every call anyway. The business requirements say chatbot context needs no dedicated table, and the database is not connected yet (`DbConnection` is still commented out in `index.ts`). This is the simplest way to support follow-ups (UC-06 A10).
- **Alternatives considered**: Store conversations in PostgreSQL (needs the DB layer first, and a schema the team has not designed); keep them in server memory (lost on restart, grows without bound).

## R5. Keeping the assistant in scope

- **Decision**: Send a fixed system instruction (Gemini `systemInstruction`) stored as a constant in `services/aiSystemPrompt.ts`. It tells the model it is the myHCMUS Student Assistant for the University of Science, VNU-HCM; to help with student activities, training points, and university procedures; to politely decline other topics and suggest what it can help with; to say when it is unsure and suggest contacting the university instead of stating policy; that it has no access to any student's personal data; and to ignore requests to change these rules.
- **Rationale**: Covers FR-007, UC-06 A2, A4, A8. A system instruction is separate from user text, which makes "ignore previous instructions" attempts less effective. This is a best effort, not a guarantee, so SC-006 is checked by hand with real calls.
- **Alternatives considered**: Pre-filtering messages with keywords (fragile, blocks valid questions).

## R6. Error mapping

| Situation | Detected by | Response to client |
|---|---|---|
| Key missing in `.env` | `GeminiClient` before calling | `503`, "AI assistant is temporarily unavailable, please try again later" |
| Network error, Gemini 5xx | `fetch` throws / status ≥ 500 | `503`, same message |
| No answer in 20 s | `AbortController` timeout | `503`, same message |
| Gemini 429 (free quota used up) | status 429 | `503`, same message, `Retry-After: 30` |
| Gemini 400/401/403 (bad key, bad model name) | status 4xx | `503`, same message (this is our config problem, not the student's), logged as `config` |
| Answer empty or unreadable | missing `candidates[0].content.parts[].text` | `503`, same message |
| Safety block | `promptFeedback.blockReason` or `finishReason: "SAFETY"` | `200` with a fixed polite refusal as the reply |

- **Rationale**: The student can't fix any of these, so they all look the same: "try again" (NFR-REL-05). The exact cause goes to the server log (NFR-REL-06). `503` is used instead of `502`/`504` because the existing `generate503Response` helper already supports a message and fits "the AI part is down, the rest works" (NFR-REL-04).
- **Alternatives considered**: Passing Gemini's own error text through (leaks technical details, breaks NFR-REL-05).

## R7. Authentication and the user ID for rate limiting

- **Decision**: Use the existing `ValidatorMiddleware.validateAccessToken`. Make one small change: after `jwt.verify` succeeds, save the decoded token on `res.locals.user`, and for the development token set `res.locals.user = { sub: 'dev' }`. The rate limiter keys on `res.locals.user.sub`, falling back to `req.ip`.
- **Rationale**: Reuses the team's auth check (FR-003). Rate limiting must be per user (FR-011), so the middleware has to pass the user on. The change does not affect `/api/auth/register`, which does not use this middleware.
- **Open point**: The token does not carry a role yet, so "students only" (NFR-SEC-03) cannot be enforced in this feature. Noted in the spec's Assumptions.

## R8. Rate limiting

- **Decision**: A small `RateLimitMiddleware` written in the project (no library): a `Map` from user ID to `{ windowStart, count }`, fixed 60-second window, 10 requests. Over the limit → existing `generate429Response(retryAfter)` plus a `Retry-After` header.
- **Rationale**: About 30 lines, no dependency, enough for one server. Protects the small free-tier quota from one user using it all.
- **Alternatives considered**: `express-rate-limit` (a dependency for something this small); Redis-based limits (overkill for Phase 1). Known limit: counts reset on restart and are not shared between servers.

## R9. Testing

- **Decision**: Use Node's built-in test runner (`node:test` and `node:assert`), with `.ts` test files run directly by Node 22's built-in TypeScript type stripping. Set `"test": "node --test \"tests/**/*.test.ts\""` in `package.json`. Unit tests cover validation, the service with a fake `LLMClient`, `GeminiClient` with a stubbed `fetch`, and the rate limiter. Integration tests start the Express app on a random port with a fake client and call `/api/ai/prompt` with `fetch`.
- **Rationale**: The constitution requires automated tests, but the server has no test setup yet. The built-in runner needs no new dependency and works with the `.ts` import style the server already uses.
- **Alternatives considered**: Jest or Vitest plus supertest (three or more new dependencies and config). Worth revisiting if the team wants one test tool for the whole server; that is a team decision.
- **Needed refactor**: To start the app in tests without listening on the real port, `index.ts` is split into `app.ts` (builds and exports the Express app) and `index.ts` (calls `listen` and handles shutdown). `app.ts` lets tests pass in a fake `LLMClient`.

## R10. Limits and timeouts

- **Decision**: message ≤ 2,000 characters; history ≤ 20 turns, each ≤ 2,000 characters; Gemini timeout 20 s; `maxOutputTokens` 1,024; JSON body limit stays at body-parser's default 100 KB (20 × 2,000 characters fits).
- **Rationale**: Keeps each request well inside free-tier token limits and gives short, chat-sized answers.
