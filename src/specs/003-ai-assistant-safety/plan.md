# Implementation Plan: AI Assistant Safety, Usage Limits and Admin Monitoring

**Branch**: `feat/backend/implement-ai-endpoint` (spec directory `003-ai-assistant-safety`) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-ai-assistant-safety/spec.md`

**Design reference**: `docs/analysis-and-design/ai-chatbot-design.md` v0.2.0 (approved by the team on 2026-11-18). This plan does not repeat the design; it says what is built, where, and in which order. Section numbers below (for example "design 6.3") point into that document.

## Summary

Extend the phase 1 assistant (`POST /api/ai/prompt`, `AIService`, `GeminiClient`, in-memory rate limiter) into a guarded pipeline inside the API Server, under a new module folder `src/server/src/ai/`. Each question passes, in order: kill switch, budget and the two usage bars; notice acceptance; signed-history check; a rule filter and a cheap topic classifier; retrieval from pgvector with role and faculty filters inside the SQL; generation with a fixed set of read-only lookups the module runs itself; an output check; and one usage record (plus a flag with redacted content when needed). Administrators get read and control endpoints and a dashboard page. The AI module talks to PostgreSQL through its own database role with access only to a few views and the new `Ai*` tables. Details and reasons are in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6 on Node.js 22 (server, ES modules); TypeScript 5 with Next.js 16 / React 19 (client)

**Primary Dependencies**: Existing: Express 5, body-parser, jsonwebtoken, dotenv, morgan, `pg` (on `dev`, **not yet on this branch**, see "Before starting"). Gemini REST API through the existing `LLMClient` / `GeminiClient` with built-in `fetch`. No new npm dependency (R11).

**Storage**: PostgreSQL 18 with the **pgvector** extension (Docker image `pgvector/pgvector:pg18`). New script `src/db/ai_schema.sql` with 7 `Ai*` tables, 6 views, 1 role, new permissions and settings rows ([data-model.md](data-model.md)).

**Testing**: Server: Node test runner (`node --test`) with `node:assert`, fake `LLMClient`, fake embedder, and a test database for repository and integration tests. Red-team set `src/server/tests/ai-redteam/cases.jsonl` run in CI with the fake client and on demand against Gemini (R10). Client: Vitest + React Testing Library + axe-core.

**Target Platform**: Docker Compose on a developer machine (Linux containers); no cloud hosting yet.

**Project Type**: Web application (Next.js client in `src/client`, Express API in `src/server`, SQL in `src/db`).

**Performance Goals**: Guards and limits add under 300 ms before the main call (classifier included); off-topic refusals under 2 s end to end (SC-004); normal answers under 10 s for 9 of 10 (SC-011).

**Constraints**: Gemini free-tier limits (configured, never hard-coded); no message content outside `AiFlag`; no identifying data sent to Gemini (FR-013); kill switch effective within 10 s; usage bar checks correct under parallel requests (SC-006).

**Scale/Scope**: Class-project traffic (tens of users, a few hundred questions per day); knowledge base of a few thousand chunks.

### Before starting

1. **Bring `dev` into this branch.** `pg` and `@types/pg` are in `src/server/package.json` on `dev` but not on `feat/backend/implement-ai-endpoint`. Repositories for this feature need them.
2. **Line endings.** The working tree currently shows about 64 files modified with equal insertions and deletions, which looks like CRLF/LF changes, not real edits. Settle it (for example `.gitattributes` with `* text=auto eol=lf`) before committing this feature, so the diff stays reviewable.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|---|---|---|
| I. Architecture aligned with `docs/` | Implements the approved design `docs/analysis-and-design/ai-chatbot-design.md` and UC-06. The design was reviewed with the team before planning, as Principle I requires for a new architecture element (AI Gateway). | Pass |
| I. Clear interfaces; logic apart from HTTP | `AIGateway.chat(identity, request)` is the only entry point of the module. Controllers only validate and map to HTTP. Guards, limits, retrieval and tools are separate classes behind interfaces. | Pass |
| I. UI components without business logic | Chat and admin pages call services in `features/ai-assistant/services`; bar maths and notice rules stay on the server. | Pass |
| II. Clear responsibilities; documented public interfaces | One class per guard, limit, tool. TSDoc on `AIGateway.chat`, each tool (what it may return), `UsageBars` (window rules), `OutputGuard` (what it blocks). The design document covers what comments cannot. | Pass |
| III. Reviewed spec before implementation | `spec.md` and this plan wait for team review. | Pending review |
| III. Plan names constitutional constraints | This table. | Pass |
| IV. Automated tests; integration tests for critical flows | Unit tests for every guard, limit and tool; integration tests through Express for each user story; red-team regression set. | Pass |
| V. Validate untrusted input at boundaries | Request body, history signatures, tool arguments (schema-checked), model output (output guard), uploaded documents (rule filter). | Pass |
| V. Protected operations enforce authorization | Role and permission check on every AI route; tools read identity only from the verified token; admin routes require `ai.*` permissions. | Pass |
| V. Secrets not committed | `GEMINI_API_KEY`, `AI_HISTORY_SECRET`, `AI_DB_PASSWORD` only in `.env`; empty placeholders in `.env.example`. | Pass |
| V. Schema changes consider existing data | Only new tables, views, role and rows. No existing table is changed. `ai_schema.sql` is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`). | Pass |
| V(2). Simplicity; justified dependencies; no speculative features | No new npm package. pgvector is a database extension, justified in R2. Separate container deferred (team decision). | Pass, see Complexity Tracking |
| Core tech stack | TypeScript backend, PostgreSQL, Docker. Gemini is the external AI service already accepted in `002`. Note: the constitution lists "FE: Flutter" but the client is Next.js; this mismatch predates the feature and should be fixed in the constitution. | Pass, with note |

**Post-design re-check**: Still passes. The only change to shared code is that `validateAccessToken` also loads `roles` and `faculty_id` into `res.locals.user` (from the token when present, otherwise from the database), which other routes do not use yet.

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-assistant-safety/
├── plan.md              # This file
├── research.md          # Decisions R1–R12
├── data-model.md        # Tables, views, role, settings, permissions
├── quickstart.md        # How to set up and check each user story by hand
├── contracts/
│   ├── ai-chat-api.md   # Student and manager endpoints
│   └── ai-admin-api.md  # Administrator endpoints
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
src/db/
├── ai_schema.sql                         # NEW: extension, Ai* tables, views, role, permissions, settings
└── ai_schema_constraints_test.sql        # NEW: CHECK and FK tests, like schema_constraints_test.sql

src/docker-compose.yml                    # CHANGED: db image pgvector/pgvector:pg18

src/server/
├── .env.example                          # + AI_HISTORY_SECRET=, AI_DB_USER=ai_gateway, AI_DB_PASSWORD=,
│                                         #   GEMINI_CLASSIFIER_MODEL=gemini-2.5-flash-lite, GEMINI_EMBEDDING_MODEL=gemini-embedding-001
├── src/
│   ├── app.ts                            # CHANGED: build AIGateway, mount /api/ai and /api/admin/ai
│   ├── config/config.ts                  # CHANGED: ai { historySecret, db, models }
│   ├── middleware/ValidatorMiddleware.ts # CHANGED: res.locals.user gets roles, faculty_id
│   ├── middleware/RequirePermission.ts   # NEW: requirePermission('ai.usage.read'), etc.
│   ├── middleware/IpRateLimit.ts         # NEW: per-IP limit for /api/ai/*
│   ├── routes/AIRoute.ts                 # CHANGED: /chat, /prompt (alias), /me/quota, /notice, /notice/accept
│   ├── routes/AdminAIRoute.ts            # NEW: /api/admin/ai/*
│   ├── controllers/AIController.ts       # CHANGED: chat, quota, notice
│   ├── controllers/AdminAIController.ts  # NEW
│   ├── clients/LLMClient.ts              # CHANGED: tool calls, token counts, classify(), embed()
│   ├── clients/GeminiClient.ts           # CHANGED: function calling, JSON output, embeddings, usageMetadata
│   ├── connections/aiDb.ts               # NEW: pg Pool with the ai_gateway role
│   ├── types/AIIdentity.ts, ChatResult.ts # NEW: shared AI types, one concept per file like PromptRequest.ts
│   ├── helper/primaryRole.ts             # NEW
│   ├── ai/                               # NEW: the AI Gateway module (only AIGateway.ts is imported from outside)
│   │   ├── AIGateway.ts                  #   the pipeline (design 3.2)
│   │   ├── prompt/systemPrompt.ts        #   moved from services/aiSystemPrompt.ts; versioned; canary
│   │   ├── prompt/PromptBuilder.ts       #   tags, escaping, context and tool results
│   │   ├── guards/RuleFilter.ts
│   │   ├── guards/TopicClassifier.ts
│   │   ├── guards/OutputGuard.ts
│   │   ├── guards/Redactor.ts            #   removes emails and phone numbers
│   │   ├── history/HistorySigner.ts
│   │   ├── limits/UsageBars.ts           #   5h and weekly windows
│   │   ├── limits/InFlightGuard.ts
│   │   ├── limits/RepeatCache.ts
│   │   ├── limits/ProjectLimiter.ts      #   system-wide RPM/RPD and concurrency
│   │   ├── limits/CooldownPolicy.ts
│   │   ├── settings/AISettings.ts        #   reads SystemSetting ai.*, cached 10 s
│   │   ├── retrieval/Chunker.ts
│   │   ├── retrieval/Indexer.ts
│   │   ├── retrieval/Retriever.ts
│   │   ├── tools/ToolRegistry.ts         #   tools by role
│   │   ├── tools/student/*.ts            #   search_activities, get_activity, get_my_registrations,
│   │   │                                 #   get_my_training_score, get_scoring_rules
│   │   ├── tools/manager/*.ts            #   get_hosting_rules, get_allowed_venues,
│   │   │                                 #   suggest_score_criterion, get_my_managed_activities
│   │   ├── logging/UsageLogger.ts
│   │   └── flags/FlagService.ts
│   ├── repositories/                     # NEW, flat like AuthRepository.ts (interface + class per file): AiRequestLogRepository, AiUsageWindowRepository, AiFlagRepository,
│   │                                     #   AiKnowledgeRepository, AiToolViewsRepository, AiSettingsRepository,
│   │                                     #   AiConsentRepository, AiUserQuotaRepository
│   ├── services/AdminAIService.ts        # NEW: dashboard queries, settings changes + AuditLog
│   ├── services/AIService.ts             # CHANGED: thin wrapper that calls AIGateway (keeps /prompt working)
│   └── jobs/aiMaintenance.ts             # NEW: daily flag clean-up, re-index of changed activities
└── tests/
    ├── unit/ai/...                       # one file per guard, limit, tool, signer, builder
    ├── integration/aiChat.test.ts
    ├── integration/aiLimits.test.ts
    ├── integration/aiAdmin.test.ts
    ├── integration/aiGrounding.test.ts
    └── ai-redteam/
        ├── cases.jsonl
        └── redteam.test.ts               # CI with fake client; `npm run redteam` against Gemini

src/client/src/
├── features/ai-assistant/
│   ├── components/ChatPanel.tsx, UsageBars.tsx, AINoticeModal.tsx, ChatDisclaimer.tsx, SourceList.tsx
│   ├── services/ai.service.ts            # calls /api/ai/* through api-client.ts
│   └── types/ai.types.ts
├── features/admin-ai/
│   ├── components/UsageSummary.tsx, TrendChart.tsx, TopicBreakdown.tsx, FlagQueue.tsx, AISettingsForm.tsx
│   └── services/admin-ai.service.ts
├── app/(protected)/student/assistant/page.tsx
├── app/(protected)/organizer/assistant/page.tsx
└── app/(protected)/admin/ai/page.tsx, admin/ai/flags/page.tsx
```

**Structure Decision**: Keep the server's folder-per-layer layout for HTTP code (`routes/`, `controllers/`, `repositories/`) and add one module folder, `src/server/src/ai/`, for everything AI-specific. Only `AIGateway.ts` is imported from outside the folder, and the folder never imports `AuthService` or other services. This is the boundary that lets the team move the module into its own container later (design 3.1) without rewriting it. Client code follows the existing `features/<area>` layout.

## Delivery Sequence

Each step ends with its tests passing. US1 + US2 together are the first safe release.

1. **Setup**: merge `dev`, pgvector image, `ai_schema.sql`, config and `.env.example`, `aiDb.ts`.
2. **Foundational**: identity with roles and faculty, `RequirePermission`, `AISettings`, `LLMClient` extensions (token counts, JSON output), `UsageLogger` + `AiRequestLog`, `AIGateway` skeleton that reproduces phase 1 behaviour, `/api/ai/chat` with `/prompt` alias.
3. **US1**: system prompt v2 with canary, `PromptBuilder`, `RuleFilter`, `TopicClassifier`, `HistorySigner`, `OutputGuard`, `FlagService` (without the review UI), red-team set in CI.
4. **US2**: `UsageBars`, `InFlightGuard`, `RepeatCache`, `CooldownPolicy`, `ProjectLimiter`, `IpRateLimit`, body limit, `/me/quota`, chat UI bars.
5. **US3**: admin summary, request list, settings and user-limit endpoints with `AuditLog`, budget alert notification, admin dashboard page.
6. **US4**: notice endpoints and `AiConsent`, `Redactor`, flag review endpoints and page, daily clean-up job, `002` spec note.
7. **US5**: embeddings, `Chunker`, `Indexer`, `Retriever` with in-query filters, views and student tools, function calling loop, grounding checks in `OutputGuard`, sources in the reply.
8. **US6**: knowledge upload endpoint, manager tools, points check in `OutputGuard`, organizer chat page.
9. **Polish**: TSDoc, API docs in the style of `docs-api`, C4 and ERD updates (design section 10), quickstart run, `git grep` for keys.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New database extension (pgvector) | Retrieval must be filtered by role and faculty inside the same query as the similarity search (FR-012). | A separate vector database cannot join with our permission data in one query; storing vectors as arrays and comparing in TypeScript does not scale past a few hundred chunks and loses index support. |
| Separate database role and views for the AI module | FR-009 to FR-011: even a bug in the AI code must not reach other students' rows or password hashes. | Reusing the API Server's role would make every guard the only line of defence, against Principle V. |
| A second, cheaper model call per question (classifier) | FR-003 and SC-004: refuse clearly off-topic questions without the expensive call. | Rules alone miss paraphrases and Vietnamese; relying on the main model alone costs a full call for every spam message. |
