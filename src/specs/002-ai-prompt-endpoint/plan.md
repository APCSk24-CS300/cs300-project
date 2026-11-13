# Implementation Plan: AI Student Assistant Prompt Endpoint

**Branch**: `002-ai-prompt-endpoint` (suggested; work is currently on `chore/document-register-endpoint`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-ai-prompt-endpoint/spec.md`

## Summary

Add `POST /api/ai/prompt` to the Express server. A logged-in user sends a message plus optional earlier turns. The request goes through the existing method, token and content-type checks, a new per-user rate limiter, and body validation in `AIController`. `AIService` adds a fixed system instruction and asks an `LLMClient` for an answer. `GeminiClient`, the only Gemini-aware class, calls the Gemini REST API with Node's built-in `fetch`, using the key from `.env`. Every AI failure becomes a friendly `503`; the rest of the server is unaffected. No database, no new runtime dependency. Details and reasons are in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6 on Node.js 22 (ES modules, `.ts` imports run directly)

**Primary Dependencies**: Existing only: Express 5, body-parser, dotenv, jsonwebtoken, morgan. Gemini is called over HTTPS with built-in `fetch` (R1).

**Storage**: None. Conversation history is sent by the client (R4); rate-limit counters live in memory (R8).

**Testing**: Node built-in test runner (`node --test`) with `node:assert`; fake `LLMClient` and stubbed `fetch`, so no network or key is needed (R9).

**Target Platform**: Linux container (`node:22` image via `docker-compose.yml`), also runs on Windows with `npm start`.

**Project Type**: Web service (backend part of a web app; client in `src/client`)

**Performance Goals**: Server adds under 50 ms on top of the Gemini call; answers in under 10 s for 9 of 10 requests when Gemini is healthy (SC-001).

**Constraints**: Gemini free-tier quotas; 20 s upstream timeout; message and turn text ≤ 2,000 characters; ≤ 20 turns; 10 requests per user per minute; key never in code, logs or responses.

**Scale/Scope**: One endpoint, a single server instance, class-project traffic (tens of users).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|---|---|---|
| I. Architecture aligned with `docs/` | Implements UC-06 (backend part) and NFR-REL-04/05/06, NFR-SEC-10/11. Client-held history follows the business requirement that chatbot context needs no dedicated entity. | Pass |
| I. Clear interfaces, logic apart from HTTP | Route → Controller (HTTP, validation) → Service (prompt building, error mapping) → `LLMClient` interface → `GeminiClient`. | Pass |
| II. Clear responsibilities, documented public interfaces | One job per file; TSDoc on `LLMClient`, `AIService.prompt`, and the rate limiter, noting timeouts and limits. | Pass |
| III. Reviewed spec before implementation | Implementation waits for review of this spec and plan. | Pending your review |
| III. Plan names constitutional constraints | This table. | Pass |
| IV. Automated tests for new logic, integration test for the critical flow | Unit tests for validation, service, Gemini client, rate limiter; integration tests through Express (R9). | Pass |
| V. Validate untrusted input at boundaries | `AIController` validates the body; `GeminiClient` validates Gemini's reply shape. | Pass |
| V. Protected operations enforce authorization | `validateAccessToken` on the route. Role check (students only) is not possible until tokens carry roles. | Pass, with noted gap |
| V. Secrets not committed, `.env` never exposed | Key read from `GEMINI_API_KEY`; only an empty placeholder in `.env.example`; sent in a header, never logged. | Pass |
| V(2). Simplicity, justified dependencies, no speculative features | Zero new dependencies. Recommendations, DB history and streaming left to later features. | Pass |
| Core tech stack (BE TypeScript, external services) | TypeScript backend; Gemini is a new external service, which the user chose and the vision document anticipates ("AI assistant"). | Pass |

**Post-design re-check**: Still passes. The two small changes to shared code (splitting `index.ts` into `app.ts` + `index.ts`, and `validateAccessToken` saving the decoded token on `res.locals.user`) do not change existing behaviour.

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-prompt-endpoint/
├── plan.md              # This file
├── research.md          # Decisions R1–R10
├── data-model.md        # Request/response shapes
├── quickstart.md        # How to get a key, configure, test by hand
├── contracts/
│   └── ai-prompt-api.md # Endpoint contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Next step ($speckit-tasks), not created yet
```

### Source Code (repository root)

```text
src/server/
├── .env.example                     # + GEMINI_API_KEY=, GEMINI_MODEL=gemini-2.5-flash
├── package.json                     # "test": "node --test \"tests/**/*.test.ts\""
├── src/
│   ├── app.ts                       # NEW: builds the Express app; createApp({ aiService? }) for tests
│   ├── index.ts                     # CHANGED: only listen + graceful shutdown
│   ├── config/config.ts             # CHANGED: gemini { apiKey, model, timeoutMs }
│   ├── routes/AIRoute.ts            # NEW: router.all('/prompt', method, token, content-type, rate limit, controller)
│   ├── controllers/AIController.ts  # NEW: validate body → AIService.prompt → send response
│   ├── services/AIService.ts        # NEW: build turns + system instruction, call LLMClient, map errors
│   ├── services/aiSystemPrompt.ts   # NEW: the fixed system instruction text (R5)
│   ├── clients/LLMClient.ts         # NEW: LLMClient interface, LLMError
│   ├── clients/GeminiClient.ts      # NEW: Gemini REST call with fetch + timeout
│   ├── middleware/RateLimitMiddleware.ts   # NEW: 10/min per user, in memory
│   ├── middleware/ValidatorMiddleware.ts   # CHANGED: save decoded token on res.locals.user
│   ├── helper/validatePromptRequest.ts     # NEW: pure function returning a list of problems
│   └── types/PromptRequest.ts       # NEW: PromptRequest, ConversationTurn, PromptResult
└── tests/
    ├── unit/validatePromptRequest.test.ts
    ├── unit/AIService.test.ts
    ├── unit/GeminiClient.test.ts
    ├── unit/RateLimitMiddleware.test.ts
    └── integration/aiPrompt.test.ts
```

**Structure Decision**: Keep the server's existing folder-per-layer layout (`routes/`, `controllers/`, `services/`, `helper/`, `types/`) and add one folder, `clients/`, for outside services (R3). Validation is a pure helper function so it can be tested without Express. Tests go in a new `src/server/tests/` folder, outside `src/`, so the TypeScript `include` and TypeDoc output are unchanged.

## Delivery Sequence

1. **Setup**: config fields, `.env.example`, `test` script, split `index.ts` into `app.ts` + `index.ts`.
2. **US1 (P1)**: types, `validatePromptRequest`, `LLMClient`, `GeminiClient`, system prompt, `AIService`, `AIController`, `AIRoute`, mount at `/api/ai`. Tests for each, then the integration test for a single question.
3. **US2 (P2)**: history validation and mapping to Gemini roles, with a follow-up test.
4. **US3 (P2)**: error mapping (R6), rate limiter, `res.locals.user` change, logging without message content. Tests for every row in the R6 table and for `/health` still working when the AI is down.
5. **Polish**: TSDoc comments, an API doc for the endpoint in the same style as the register doc, run the manual checks in [quickstart.md](quickstart.md), and `git grep` for leaked keys.

`$speckit-tasks` will turn these into numbered tasks after the spec and plan are approved.

## Complexity Tracking

No constitution violations to justify.
