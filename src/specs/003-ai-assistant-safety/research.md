# Research: AI Assistant Safety, Usage Limits and Admin Monitoring

**Feature**: `003-ai-assistant-safety` | **Date**: 2026-11-18

Each decision lists what was chosen, why, and what else was considered. Background and diagrams are in `docs/analysis-and-design/ai-chatbot/ai-chatbot-design.md`.

## R1. Where the AI code lives

- **Decision**: A module folder `src/server/src/ai/` inside the API Server, entered only through `AIGateway.chat()`, with its own `pg` pool that logs in as the `ai_gateway` database role.
- **Rationale**: Team decision (design 3.1). Less work than a second service now, while the boundary (one entry point, own DB role, no imports from other services) keeps a later move to a container a packaging change.
- **Alternatives considered**: Separate container now (more isolation, but needs internal auth, a second Dockerfile and Compose service; deferred). Putting the logic directly in `AIService` (no boundary, hard to split later).

## R2. Vector store

- **Decision**: pgvector in the existing PostgreSQL 18, image `pgvector/pgvector:pg18`, HNSW index with `vector_cosine_ops`, and `SET hnsw.iterative_scan = relaxed_order` on the AI connection.
- **Rationale**: Permission filters (audience, faculty, validity) run in the same `WHERE` as the similarity search, which is what FR-012 requires. No new service to run. Iterative scan (pgvector 0.8+) keeps returning enough rows when filters remove many candidates.
- **Alternatives considered**: A hosted vector database (cannot join permission data; another account and network dependency). Arrays compared in TypeScript (no index, does not scale). Full-text search only (misses paraphrases and mixed Vietnamese/English).

## R3. Embedding model

- **Decision**: Gemini `gemini-embedding-001` with `outputDimensionality: 768`, task type `RETRIEVAL_DOCUMENT` for chunks and `RETRIEVAL_QUERY` for questions. Vectors are L2-normalised before storing, because reduced-dimension outputs are not normalised by the API.
- **Rationale**: Same provider and key as chat; 768 dimensions keep the index small; multilingual, which matters for Vietnamese.
- **Alternatives considered**: A local embedding model (needs Python or a large npm package and CPU in the container). 3,072 dimensions (no quality gain worth 4× storage at our size).

## R4. Topic and injection classifier

- **Decision**: Two steps. `RuleFilter` (regular expressions and keyword lists for code requests, override phrases, SQL and schema terms, long encoded blobs) runs first and only adds hints. `TopicClassifier` then calls `gemini-2.5-flash-lite` with a JSON response schema (`topic`, `in_scope`, `injection_suspected`, `other_person_data`, `confidence`). The decision table is design 4.2. If the classifier fails or times out (2 s), the request continues as `unclassified` with the strict output check.
- **Rationale**: Rules are free and catch the obvious cases; a small model catches paraphrases and Vietnamese. Failing open on the cheaper layer avoids an outage when only the classifier is down, while the output guard still applies (defence in depth).
- **Alternatives considered**: Main model only (a full-price call for every spam message). Rules only (easy to bypass). Fail closed (an outage of the classifier would stop the whole assistant).

## R5. Lookups (function calling)

- **Decision**: Gemini function calling. The module declares only the tools for the user's role (`ToolRegistry.forRole`). For each function call the module validates arguments against a schema, runs a fixed parameterised SQL statement against an `ai_*_v` view, adds the verified `user_id` / `faculty_id` itself, applies a row limit and column allowlist, and returns the result inside `<tool_result>`. At most 3 rounds per question. Every call is written to `AiToolCall`.
- **Rationale**: FR-009 to FR-011. The model never sees or chooses identity, never writes SQL, and can only call what its role allows.
- **Alternatives considered**: Text-to-SQL with a read-only role (still exposes every row the role can read). Putting all of the student's records in the prompt (wastes tokens, sends more data to the provider than needed, against FR-013).

## R6. Trusting earlier turns

- **Decision**: Each reply carries `signature = HMAC-SHA256(AI_HISTORY_SECRET, user_id ‖ request_id ‖ reply)`, encoded base64url. The client returns it with that assistant turn. Unsigned or wrongly signed assistant turns make the request `400`.
- **Rationale**: FR-006 without storing conversations (`002` keeps the server stateless, and FR-031 forbids storing content). Uses `node:crypto`, no dependency.
- **Alternatives considered**: Store conversations on the server (contradicts FR-031). Ignore history (breaks follow-up questions from `002` US2).

## R7. The two usage bars

- **Decision**: Table `AiUsageWindow`, one row per user per bar. In one transaction: `SELECT … FOR UPDATE` both rows; reset a row if `now() >= window_end` (5h: start now, end now + 5 h; week: start at `date_trunc('week', now() AT TIME ZONE 'Asia/Saigon') AT TIME ZONE 'Asia/Saigon'`, end + 7 days); refuse if `units_used + estimate > limit` for either bar; otherwise add the estimate. After the answer, a second update replaces the estimate with the real units (`usageMetadata` token counts, minimum 500 for refusals). The estimate is input tokens counted roughly as characters / 4 plus the output token limit.
- **Rationale**: Row locks make parallel requests safe (SC-006) without Redis. Reserving the estimate first prevents a burst of parallel questions from all passing on an almost-full bar. Monday 00:00 in the user's time zone is predictable for students.
- **Alternatives considered**: Sliding-window sums over `AiRequestLog` (simple, but racy under parallel requests and slower as the log grows). In-memory counters (lost on restart; the bars must survive restarts).

## R8. Spam controls kept in memory

- **Decision**: `InFlightGuard` (a `Set` of user ids), `RepeatCache` (map of `hash(user_id + message)` to the reply, 2-minute TTL, only for unflagged answers), `ProjectLimiter` (system RPM/RPD counters and a semaphore of 5 concurrent Gemini calls with a 5 s wait) and `IpRateLimit` (30 per minute per IP), all in process memory, like phase 1's rate limiter.
- **Rationale**: A single server instance; these protect against short bursts, where losing state on restart does no harm. The daily project counter is re-seeded on startup from `AiRequestLog` for the current day.
- **Alternatives considered**: Redis (new service and dependency, not needed for one instance; revisit when there are several instances).

## R9. Output checks

- **Decision**: `OutputGuard` runs in this order: canary and long verbatim system-prompt fragments (block, high); code detection (fenced blocks or a code-line density threshold; block); personal data (email, phone and ID patterns not belonging to the user or a public source; block, high); link allowlist (`ServiceLink` hosts and `*.hcmus.edu.vn`; strip); grounding (activity ids or titles and point values must appear in this request's sources or tool results; correct or block); length (1,500 characters; trim at a sentence).
- **Rationale**: FR-002, FR-007, SC-001, SC-010. Code checks the reply regardless of what the model was told.
- **Alternatives considered**: A second model call to judge the reply (costly and itself injectable). Rely on Gemini safety settings (they target harmful content, not scope or data leaks).

## R10. Red-team regression set

- **Decision**: `tests/ai-redteam/cases.jsonl` with the categories and minimum counts of design 5.5 (about 155 cases, a third in Vietnamese). `redteam.test.ts` runs in `npm test` with a fake `LLMClient` that behaves like a compromised model (it obeys the injection), so the test proves the code layers catch it. `npm run redteam` runs the same cases against Gemini and prints success rates per category against SC-001 to SC-003.
- **Rationale**: Deterministic CI tests check our code; the live run measures the real model. Each confirmed bypass from the review queue becomes a new case (FR-008).
- **Alternatives considered**: Manual testing only (no regression protection). An external red-team service (cost, data leaves the team).

## R11. Dependencies

- **Decision**: No new npm package. Gemini via `fetch` (existing), HMAC via `node:crypto`, scheduling via `setInterval` in `jobs/aiMaintenance.ts`, schema validation for tool arguments written by hand like `validatePromptRequest.ts`.
- **Rationale**: Constitution V(2). `pg` comes from `dev`.
- **Alternatives considered**: LangChain or LlamaIndex (large, hide the filters we must control), `express-rate-limit` (our limits need user and bar logic anyway), `zod` on the server (useful, but one more dependency for a handful of schemas).

## R12. Redaction and retention

- **Decision**: `Redactor` replaces emails, Vietnamese and international phone numbers, and the user's own student id with placeholders before an `AiFlag` row is written. `expires_at = created_at + 30 days`. `aiMaintenance` runs at startup and every 24 h: `DELETE FROM "AiFlag" WHERE expires_at < now()` for content, keeping the metadata in `AiRequestLog`.
- **Rationale**: FR-032, SC-009, and the notice text in US4.
- **Alternatives considered**: Keep flags until reviewed (unbounded storage of content, breaks the promise in the notice). A PostgreSQL scheduler extension (not in the image).
