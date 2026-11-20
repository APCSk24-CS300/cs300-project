---

description: "Task list for AI Assistant Safety, Usage Limits and Admin Monitoring"
---

# Tasks: AI Assistant Safety, Usage Limits and Admin Monitoring

**Input**: Design documents from `/specs/003-ai-assistant-safety/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. The constitution (IV) requires automated tests for new business logic and integration tests for critical flows, and FR-008 requires the red-team set. Write each test first and see it fail.

**Organization**: Tasks are grouped by user story so each story can be built, tested and demonstrated on its own. US1 + US2 together are the first safe release.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 to US6)
- Paths are relative to `src/` (server in `server/`, client in `client/`, SQL in `db/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bring in dependencies, the database extension and configuration

- [x] T001 Merge `dev` into `feat/backend/implement-ai-endpoint` so `pg` and `@types/pg` are in `server/package.json`; settle the CRLF/LF changes (add `.gitattributes`) before the first commit of this feature
- [x] T002 Change the database image to `pgvector/pgvector:pg18` in `docker-compose.yml` and recreate the container
- [x] T003 Create `db/ai_schema.sql`: `CREATE EXTENSION IF NOT EXISTS vector`, the 7 `Ai*` tables and indexes from data-model.md
- [x] T004 Add the 6 `ai_*_v` views and the `ai_gateway` role with its grants to `db/ai_schema.sql`
- [x] T005 Add the new `Permission`, `RolePermission` and `SystemSetting` rows to `db/ai_schema.sql` (`ON CONFLICT DO NOTHING`)
- [ ] T006 [P] Create `db/ai_schema_constraints_test.sql` covering every CHECK and FK of the new tables, in the style of `schema_constraints_test.sql`
- [x] T007 [P] Add `AI_HISTORY_SECRET`, `AI_DB_USER`, `AI_DB_PASSWORD`, `GEMINI_CLASSIFIER_MODEL`, `GEMINI_EMBEDDING_MODEL` to `server/.env.example` (empty values) and `server/src/config/config.ts`
- [x] T008 Create `server/src/connections/aiDb.ts`: a `pg` Pool logging in as `ai_gateway`, setting `hnsw.iterative_scan = relaxed_order` on connect
- [ ] T009 [P] Add a test database helper `server/tests/helpers/testDb.ts` that applies `schema.sql` + `ai_schema.sql` and seeds the users and activities listed in quickstart.md (for now tests use in-memory fakes in `server/tests/helpers/fakes.ts`; a real test database is still needed for repository tests)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identity, permissions, settings, logging and the gateway skeleton that every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 [P] Unit test for identity loading in `server/tests/unit/ai/identity.test.ts` (roles and faculty from the token, otherwise from `UserRole` and `Student`)
- [x] T011 Extend `validateAccessToken` in `server/src/middleware/ValidatorMiddleware.ts` to put `roles` and `faculty_id` on `res.locals.user` (done as a separate `middleware/LoadIdentity.ts` on AI routes instead of changing the shared token check)
- [x] T012 [P] Create `server/src/middleware/RequirePermission.ts` with a unit test in `server/tests/unit/RequirePermission.test.ts`
- [x] T013 [P] Create `server/src/repositories/AiSettingsRepository.ts` and `server/src/ai/settings/AISettings.ts` (typed `ai.*` values, 10 s cache) with `server/tests/unit/ai/AISettings.test.ts`
- [x] T014 Extend `server/src/clients/LLMClient.ts` with token counts in results, `classify(prompt, schema)` and `embed(texts, taskType)`; update the fake client in `server/tests/helpers/fakeLLMClient.ts` (token counts done; `classify` and `embed` moved to T026 and T066, where they are first used)
- [x] T015 Implement the new `LLMClient` methods and `usageMetadata` parsing in `server/src/clients/GeminiClient.ts`; extend `server/tests/unit/GeminiClient.test.ts` with stubbed `fetch`
- [x] T016 [P] Create `server/src/repositories/AiRequestLogRepository.ts` and `server/src/ai/logging/UsageLogger.ts` (cost from `ai.price.<model>`; a logging failure never changes the reply) with `server/tests/unit/ai/UsageLogger.test.ts`
- [x] T017 Create `server/src/ai/AIGateway.ts` with `chat(identity, request)` reproducing phase 1 behaviour plus a log row; move `services/aiSystemPrompt.ts` to `server/src/ai/prompt/systemPrompt.ts` with a version constant
- [x] T018 Make `server/src/services/AIService.ts` delegate to `AIGateway`; add `/chat` and keep `/prompt` as an alias in `server/src/routes/AIRoute.ts`; wire in `server/src/app.ts`
- [x] T019 Integration test `server/tests/integration/aiChat.test.ts`: `/chat` and `/prompt` answer as in `002`, and each request writes one `AiRequestLog` row

**Checkpoint**: Foundation ready. Phase 1 behaviour unchanged, every question logged.

---

## Phase 3: User Story 1 - On topic and rule protection (Priority: P1) 🎯 MVP

**Goal**: Off-topic requests and rule-override attempts are refused; nothing leaks in replies.

**Independent Test**: Red-team set with the fake client passes; manual US1 checks in quickstart.md.

### Tests for User Story 1

- [ ] T020 [P] [US1] Create `server/tests/ai-redteam/cases.jsonl` with the categories and counts of design 5.5 (at least 155 cases, a third in Vietnamese, 30 legitimate questions)
- [ ] T021 [P] [US1] Create `server/tests/ai-redteam/redteam.test.ts` using a "compromised" fake model that obeys injections, so only code layers can stop them; add `npm run redteam` for the live run
- [ ] T022 [P] [US1] Unit tests `server/tests/unit/ai/RuleFilter.test.ts`, `TopicClassifier.test.ts`, `HistorySigner.test.ts`, `OutputGuard.test.ts`, `PromptBuilder.test.ts`

### Implementation for User Story 1

- [ ] T023 [P] [US1] Write system prompt v2 with scope, refusal template, data rule and a per-deployment canary in `server/src/ai/prompt/systemPrompt.ts`
- [ ] T024 [P] [US1] Create `server/src/ai/prompt/PromptBuilder.ts`: tags for user message, context and tool results; escape tag names inside content
- [ ] T025 [P] [US1] Create `server/src/ai/guards/RuleFilter.ts` (code, override, SQL and schema, encoded blob patterns; English and Vietnamese)
- [ ] T026 [P] [US1] Create `server/src/ai/guards/TopicClassifier.ts` (flash-lite JSON, 2 s timeout, decision table of design 4.2, `unclassified` on failure)
- [ ] T027 [P] [US1] Create `server/src/ai/history/HistorySigner.ts` (HMAC-SHA256, base64url, constant-time compare) and add signature validation to `server/src/helper/validatePromptRequest.ts`
- [ ] T028 [US1] Create `server/src/ai/guards/OutputGuard.ts`: canary and prompt fragments, code, personal data, link allowlist, length (grounding checks come in US5)
- [ ] T029 [P] [US1] Create `server/src/repositories/AiFlagRepository.ts` and `server/src/ai/flags/FlagService.ts` (category, severity, metadata only until US4 adds content)
- [ ] T030 [US1] Wire input guard, signer and output guard into `AIGateway.chat`; return `blocked`, `flagged`, `request_id`, `signature`
- [ ] T031 [US1] Update `docs-api` style doc for `/api/ai/chat` responses (blocked, flagged, signature)

**Checkpoint**: US1 works on its own. Red-team CI run passes.

---

## Phase 4: User Story 2 - Usage bars and spam protection (Priority: P1)

**Goal**: 5-hour and weekly bars per user, in-flight, repeat, cooldown, per-IP and project-wide limits.

**Independent Test**: `server/tests/integration/aiLimits.test.ts`; manual US2 checks.

### Tests for User Story 2

- [ ] T032 [P] [US2] Unit tests `server/tests/unit/ai/UsageBars.test.ts` (window start, reset, Monday 00:00 Asia/Saigon, reserve and settle, minimum units), using an injectable clock
- [ ] T033 [P] [US2] Unit tests for `InFlightGuard`, `RepeatCache`, `CooldownPolicy`, `ProjectLimiter`, `IpRateLimit` in `server/tests/unit/ai/`
- [ ] T034 [P] [US2] Integration test `server/tests/integration/aiLimits.test.ts`: fill each bar, parallel requests on an almost-full bar (only allowed ones pass), `429` bodies and `Retry-After`

### Implementation for User Story 2

- [ ] T035 [US2] Create `server/src/repositories/AiUsageWindowRepository.ts` (row lock, reset, reserve, settle) and `server/src/ai/limits/UsageBars.ts`
- [ ] T036 [P] [US2] Create `server/src/ai/limits/InFlightGuard.ts` and `server/src/ai/limits/RepeatCache.ts`
- [ ] T037 [P] [US2] Create `server/src/repositories/AiUserQuotaRepository.ts` and `server/src/ai/limits/CooldownPolicy.ts` (3 flags in 1 hour → 24 h)
- [ ] T038 [P] [US2] Create `server/src/ai/limits/ProjectLimiter.ts` (RPM, RPD re-seeded from today's log, 5 concurrent calls, 5 s wait)
- [ ] T039 [P] [US2] Create `server/src/middleware/IpRateLimit.ts` and set a 16 KB body limit on AI routes in `server/src/app.ts`
- [ ] T040 [US2] Wire all limits into `AIGateway.chat` in the order of contracts/ai-chat-api.md; include `usage` in replies
- [ ] T041 [US2] Add `GET /api/ai/me/quota` in `server/src/routes/AIRoute.ts` and `server/src/controllers/AIController.ts`
- [ ] T042 [P] [US2] Create `client/src/features/ai-assistant/services/ai.service.ts` and `types/ai.types.ts`
- [ ] T043 [P] [US2] Create `client/src/features/ai-assistant/components/ChatPanel.tsx` (sends and keeps signed history in memory only) and `UsageBars.tsx` (two bars, amber at 80 %, reset time in local time) with tests in `client/tests/features/ai-assistant/`
- [ ] T044 [US2] Add the chat page `client/src/app/(protected)/student/assistant/page.tsx` with limit and paused messages

**Checkpoint**: US1 + US2 = first safe release.

---

## Phase 5: User Story 3 - Admin monitoring and off switch (Priority: P2)

**Goal**: Dashboard, request list, settings, per-user limits, budget and alert, audit.

**Independent Test**: `server/tests/integration/aiAdmin.test.ts`; manual US3 checks.

### Tests for User Story 3

- [ ] T045 [P] [US3] Integration test `server/tests/integration/aiAdmin.test.ts`: summary totals match seeded log rows; kill switch within 10 s; budget stop; permission `403`; audit rows on every write
- [ ] T046 [P] [US3] Unit test `server/tests/unit/AdminAIService.test.ts` (setting validation, alert sent once per month)

### Implementation for User Story 3

- [ ] T047 [US3] Create `server/src/services/AdminAIService.ts`: summary, series, requests, top users, settings and user-quota changes with `AuditLog`
- [ ] T048 [US3] Create `server/src/controllers/AdminAIController.ts` and `server/src/routes/AdminAIRoute.ts` (usage, settings, users endpoints of contracts/ai-admin-api.md); mount at `/api/admin/ai`
- [ ] T049 [US3] Add budget check and the once-a-month alert `Notification` to administrators in `AIGateway` (`ai.budget_alert_sent_month`)
- [ ] T050 [P] [US3] Create `client/src/features/admin-ai/services/admin-ai.service.ts` and components `UsageSummary.tsx`, `TrendChart.tsx`, `TopicBreakdown.tsx`, `AISettingsForm.tsx` with tests
- [ ] T051 [US3] Create `client/src/app/(protected)/admin/ai/page.tsx` and link it from the admin dashboard

**Checkpoint**: US3 works with data from US1 and US2.

---

## Phase 6: User Story 4 - Notice and flag review (Priority: P2)

**Goal**: Disclaimer before use; redacted flagged content kept 30 days; review queue.

**Independent Test**: Integration tests for `428`, redaction and clean-up; manual US4 checks.

### Tests for User Story 4

- [ ] T052 [P] [US4] Unit tests `server/tests/unit/ai/Redactor.test.ts` (emails, Vietnamese and international phone numbers, own student id)
- [ ] T053 [P] [US4] Integration test `server/tests/integration/aiNotice.test.ts`: `428` until accepted, again after a version change; no content stored for unflagged questions
- [ ] T054 [P] [US4] Integration test for flag review and the 30-day clean-up in `server/tests/integration/aiFlags.test.ts`

### Implementation for User Story 4

- [ ] T055 [US4] Write the notice text (design 7.1) in `server/src/ai/prompt/notice.ts`; create `server/src/repositories/AiConsentRepository.ts`; add the notice check to `AIGateway.chat`
- [ ] T056 [US4] Add `GET /api/ai/notice` and `POST /api/ai/notice/accept` to `server/src/routes/AIRoute.ts` and `AIController.ts`
- [ ] T057 [US4] Create `server/src/ai/guards/Redactor.ts`; make `FlagService` store redacted content with `expires_at`; add "saved for review" to flagged replies
- [ ] T058 [US4] Add flag endpoints to `AdminAIController` and `AdminAIRoute` with `AuditLog`
- [ ] T059 [US4] Create `server/src/jobs/aiMaintenance.ts` (on start and every 24 h delete expired flags); start it in `server/src/index.ts`
- [ ] T060 [P] [US4] Create `client/src/features/ai-assistant/components/AINoticeModal.tsx` and `ChatDisclaimer.tsx` with accessibility tests (axe)
- [ ] T061 [P] [US4] Create `client/src/features/admin-ai/components/FlagQueue.tsx` and `client/src/app/(protected)/admin/ai/flags/page.tsx`
- [ ] T062 [US4] Add a note to `specs/002-ai-prompt-endpoint/spec.md` FR-014 pointing to this feature's FR-031 and FR-032

**Checkpoint**: US4 works; the notice matches what is actually stored.

---

## Phase 7: User Story 5 - Grounded answers and own records (Priority: P3)

**Goal**: Retrieval filtered by role and faculty in the query; student lookups that see only the user's own records.

**Independent Test**: `server/tests/integration/aiGrounding.test.ts`; manual US5 checks.

### Tests for User Story 5

- [ ] T063 [P] [US5] Repository tests for every `ai_*_v` view and the `ai_gateway` grants in `server/tests/integration/aiViews.test.ts` (role cannot read `User.password_hash` or other students' rows)
- [ ] T064 [P] [US5] Unit tests `server/tests/unit/ai/Chunker.test.ts`, `Retriever.test.ts` (filter parameters come only from identity), `ToolRegistry.test.ts` (tools by role, argument validation, row limits)
- [ ] T065 [P] [US5] Integration test `server/tests/integration/aiGrounding.test.ts`: faculty-restricted and draft activities never appear; own points match; other student's id returns nothing; poisoned description flagged

### Implementation for User Story 5

- [ ] T066 [P] [US5] Create `server/src/ai/retrieval/Chunker.ts` (about 800 tokens, split on headings and paragraphs) and the embedding call with normalisation
- [ ] T067 [US5] Create `server/src/repositories/AiKnowledgeRepository.ts` and `server/src/ai/retrieval/Indexer.ts` (content hash, rule filter on chunks → `flagged`)
- [ ] T068 [US5] Create `server/src/ai/retrieval/Retriever.ts` with the filtered query of design 6.3 and the distance threshold
- [ ] T069 [US5] Create `server/src/repositories/AiToolViewsRepository.ts` and the five student tools in `server/src/ai/tools/student/`; create `server/src/ai/tools/ToolRegistry.ts`
- [ ] T070 [US5] Add the function-calling loop (max 3 rounds, `AiToolCall` rows) to `GeminiClient` and `AIGateway`; strip identifying fields from tool results (FR-013)
- [ ] T071 [US5] Add grounding checks (activities and points must come from sources) to `OutputGuard`; return `sources`
- [ ] T072 [US5] Add the 5-minute re-index of changed activities to `aiMaintenance` and the `POST /knowledge/reindex` endpoint
- [ ] T073 [P] [US5] Create `client/src/features/ai-assistant/components/SourceList.tsx` under each answer

**Checkpoint**: US5 works; SC-010 measured on the grounding test set.

---

## Phase 8: User Story 6 - Manager event planning (Priority: P3)

**Goal**: Hosting rules, venues and suggested points sections for managers only.

**Independent Test**: Manager cases in `aiGrounding.test.ts`; manual US6 checks.

### Tests for User Story 6

- [ ] T074 [P] [US6] Unit tests for the four manager tools in `server/tests/unit/ai/tools/manager/` (own activities only, active rules only, suggestion wording)
- [ ] T075 [P] [US6] Add manager and "student asks for manager content" cases to `aiGrounding.test.ts` and to `cases.jsonl`

### Implementation for User Story 6

- [ ] T076 [US6] Add `POST/GET/DELETE /api/admin/ai/knowledge` (upload of procedures, FAQ, hosting rules, venue list) to `AdminAIService`, controller and route
- [ ] T077 [US6] Create `get_hosting_rules`, `get_allowed_venues`, `suggest_score_criterion`, `get_my_managed_activities` in `server/src/ai/tools/manager/`; register them for the manager role with `ai.chat.manager_tools`
- [ ] T078 [US6] Add the manager topics to `TopicClassifier` and the points-number check to `OutputGuard`
- [ ] T079 [US6] Create `client/src/app/(protected)/organizer/assistant/page.tsx` reusing `ChatPanel`

**Checkpoint**: All user stories work independently.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T080 [P] TSDoc on `AIGateway.chat`, every tool, `UsageBars`, `OutputGuard`, `HistorySigner`; regenerate TypeDoc
- [ ] T081 [P] Add `docs/analysis-and-design/ai-chatbot/ai-chatbot-design.md` changes to the C4 container diagram, tech stack and ERD (design section 10)
- [ ] T082 [P] API docs for `/api/ai/*` and `/api/admin/ai/*` in the style of the register endpoint doc
- [ ] T083 Run `npm run redteam` against Gemini and record the results per category in this feature's folder
- [ ] T084 Run every check in quickstart.md
- [ ] T085 `git grep` for API keys, secrets and the canary value; confirm `.env` is ignored

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none; T001 first.
- **Foundational (Phase 2)**: after Setup; blocks all stories.
- **US1 (Phase 3)** and **US2 (Phase 4)**: after Foundational; can run in parallel (different files), both wire into `AIGateway.chat` (T030, T040), so merge those two tasks one after the other.
- **US3 (Phase 5)**: after Foundational; most useful after US1 and US2 produce data.
- **US4 (Phase 6)**: after US1 (needs `FlagService`).
- **US5 (Phase 7)**: after US1 (needs `OutputGuard`, `PromptBuilder`).
- **US6 (Phase 8)**: after US5 (needs retrieval, `ToolRegistry`).
- **Polish (Phase 9)**: after the stories being released.

### Within Each User Story

- Tests first, failing, then implementation.
- Repositories before services, services before routes, server before client.

### Parallel Opportunities

- T006, T007, T009 in Setup; T010, T012, T013, T016 in Foundational.
- Within US1: T020 to T027 are all separate files.
- US1 and US2 by two people; US3 and US4 by two people after that.

## Parallel Example: User Story 1

```text
Task: "Create server/tests/ai-redteam/cases.jsonl"
Task: "Create server/src/ai/guards/RuleFilter.ts"
Task: "Create server/src/ai/guards/TopicClassifier.ts"
Task: "Create server/src/ai/history/HistorySigner.ts"
Task: "Create server/src/ai/prompt/PromptBuilder.ts"
```

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 and Phase 2.
2. US1, then US2 (or in parallel).
3. Stop and validate: red-team set, limits test, quickstart US1 and US2.
4. This is safe to open to all students: on topic, protected, rate-limited, logged.

### Incremental Delivery

1. + US3: administrators can see usage and switch it off.
2. + US4: notice and review queue (required before flagged content is stored in production).
3. + US5: grounded answers and own records.
4. + US6: manager planning help.

## Notes

- [P] tasks = different files, no dependencies.
- Commit after each task or logical group.
- Stop at any checkpoint to validate the story on its own.
- Until US4 is merged, `FlagService` stores metadata only, so FR-014 of `002` still holds in every intermediate release.
