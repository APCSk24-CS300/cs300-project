# Tasks: AI Student Assistant Prompt Endpoint

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ai-prompt-api.md](contracts/ai-prompt-api.md)

**Tests**: Required by the constitution (IV). Each story's tests are written alongside its code.

**Format**: `[ID] [P?] [Story] Description`. `[P]` means it touches different files from the other `[P]` tasks. All paths are inside `src/server/`.

## Phase 1: Setup

- [x] T001 Add `gemini` block (`apiKey`, `model`, `timeoutMs`) to `src/config/config.ts`
- [x] T002 [P] Add `GEMINI_API_KEY=` and `GEMINI_MODEL=gemini-2.5-flash` placeholders to `.env.example`
- [x] T003 [P] Set the `test` script in `package.json` to `node --test "tests/**/*.test.ts"`
- [x] T004 Split `src/index.ts`: move app building into `src/app.ts` (`createApp(options)`), keep `listen` and shutdown in `index.ts`

## Phase 2: Foundational

- [x] T005 [P] Define `PromptRequest`, `ConversationTurn`, `PromptResult`, and limits in `src/types/PromptRequest.ts`
- [x] T006 [P] Define the `LLMClient` interface and `LLMError` in `src/clients/LLMClient.ts`
- [x] T007 [P] Write the fixed assistant instruction in `src/services/aiSystemPrompt.ts` (FR-007, FR-008)

## Phase 3: User Story 1 - Ask a question (P1) MVP

- [x] T008 [P] [US1] Unit tests for `validatePromptRequest` (message rules) in `tests/unit/validatePromptRequest.test.ts`
- [x] T009 [P] [US1] Unit tests for `GeminiClient` with a stubbed `fetch` (request shape, header key, text extraction) in `tests/unit/GeminiClient.test.ts`
- [x] T010 [P] [US1] Unit tests for `AIService` with a fake `LLMClient` in `tests/unit/AIService.test.ts`
- [x] T011 [US1] Implement `src/helper/validatePromptRequest.ts`
- [x] T012 [US1] Implement `src/clients/GeminiClient.ts`
- [x] T013 [US1] Implement `src/services/AIService.ts`
- [x] T014 [US1] Implement `src/controllers/AIController.ts` and `src/routes/AIRoute.ts`; mount at `/api/ai` in `src/app.ts`
- [x] T015 [US1] Integration test for a single question through Express in `tests/integration/aiPrompt.test.ts`

## Phase 4: User Story 2 - Continue a conversation (P2)

- [x] T016 [US2] Add history rules (max 20 turns, roles, text limits) to the validator tests and `validatePromptRequest`
- [x] T017 [US2] Verify `GeminiClient` maps `assistant` to `model` and puts the new message last; add test
- [x] T018 [US2] Integration test: follow-up with earlier turns reaches the AI client in order

## Phase 5: User Story 3 - Clear feedback on failure (P2)

- [x] T019 [P] [US3] Unit tests for every error row in research R6 (`GeminiClient` status/timeout/bad-body mapping, `AIService` to 503/blocked)
- [x] T020 [P] [US3] Unit tests for the rate limiter in `tests/unit/RateLimitMiddleware.test.ts`
- [x] T021 [US3] Implement error mapping in `GeminiClient` and `AIService` (no provider text in responses, `Retry-After` on quota)
- [x] T022 [US3] Implement `src/middleware/RateLimitMiddleware.ts`; save the decoded token on `res.locals.user` in `ValidatorMiddleware.validateAccessToken`
- [x] T023 [US3] Log failures with time, user, and kind only (no message text, no key) (FR-014)
- [x] T024 [US3] Integration tests: 400, 401, 405, 415, 429, 503, safety block; server still serves `/` when the AI fails

## Phase 6: Polish

- [x] T025 [P] TSDoc on `LLMClient`, `AIService.prompt`, `createRateLimiter`
- [x] T026 [P] Write `docs-api/ai-prompt.md` in the same style as the register API doc
- [x] T027 Run `npm test` and `tsc --noEmit`; `git grep` for keys; fix findings
- [ ] T028 Manual checks from `quickstart.md` with a real key (needs the user's key)

## Dependencies

Setup → Foundational → US1 → US2 and US3 (independent of each other, both extend US1). Polish last.
