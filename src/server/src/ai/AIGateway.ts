import { randomUUID } from 'node:crypto';
import { LLMError } from '../clients/LLMClient.ts';
import type { LLMClient, LLMResult } from '../clients/LLMClient.ts';
import { AISettings } from './settings/AISettings.ts';
import type { AISettingsSnapshot } from './settings/AISettings.ts';
import { UsageLogger } from './logging/UsageLogger.ts';
import type { UsageEntry } from './logging/UsageLogger.ts';
import { AI_SYSTEM_PROMPT, BLOCKED_REPLY, DISABLED_REPLY, PROMPT_VERSION } from './prompt/systemPrompt.ts';
import { primaryRole } from '../helper/primaryRole.ts';
import type { AIIdentity } from '../types/AIIdentity.ts';
import type { AIOutcome, ChatRequest, ChatResult } from '../types/ChatResult.ts';

export const UNAVAILABLE_MESSAGE = 'AI assistant is temporarily unavailable, please try again later';
const QUOTA_RETRY_AFTER_SECONDS = 30;

export interface AIGatewayDeps {
	llm: LLMClient,
	settings: AISettings,
	logger: UsageLogger,
	now?: () => number,          // injectable clock for tests
	newRequestId?: () => string
}

/**
 * The AI module's only entry point (specs/003 plan, "Structure Decision"). Code outside
 * `src/ai/` calls `chat()` and nothing else, so the module can later move to its own
 * container without changes to its callers.
 *
 * Pipeline today (Foundational phase): kill switch → model call → one usage record.
 * The guards, usage bars, retrieval and tools of user stories 1 to 6 are added as steps
 * here, in the order of design section 3.2.
 */
export class AIGateway {
	private readonly deps: Required<AIGatewayDeps>;

	/**
	 * Creates the AI module's pipeline. Supports dependency injection so tests can pass a fake model, in-memory settings and an in-memory log.
	 * @param {AIGatewayDeps} deps - The model client, the settings cache, the usage logger, and optionally a clock (<code>now</code>) and a request ID generator (<code>newRequestId</code>).
	 * @returns {AIGateway}
	 *
	 * @example <caption>Production (see app.ts)</caption>
	 * const gateway = new AIGateway({
	 *   llm: new GeminiClient(config.gemini),
	 *   settings: new AISettings(new AiSettingsRepository(getAiPool())),
	 *   logger: new UsageLogger(new AiRequestLogRepository(getAiPool()))
	 * });
	 *
	 * @example <caption>Test</caption>
	 * const gateway = new AIGateway({
	 *   llm: { async generate() { return { text: 'Hi', blocked: false }; } },
	 *   settings: new AISettings(new FakeSettingsSource()),
	 *   logger: new UsageLogger(new FakeRequestLogStore()),
	 *   newRequestId: () => 'req-1'
	 * });
	 */
	constructor(deps: AIGatewayDeps) {
		this.deps = {
			now: Date.now,
			newRequestId: randomUUID,
			...deps
		};
	}

	/**
	 * Entry point of the AI module for <code>/api/ai/chat</code> and <code>/api/ai/prompt</code>. Answers one question for a verified user: checks the kill switch (<code>ai.enabled</code> in <code>SystemSetting</code>), calls the model, and writes exactly one <code>AiRequestLog</code> row with tokens, estimated cost and latency, never the message text. Never throws: every failure becomes a <code>ChatResult</code> with a status code. Code outside <code>src/ai/</code> must call only this method (specs/003 plan, "Structure Decision").
	 * @param {AIIdentity} identity - The verified caller, built by the <code>LoadIdentity</code> middleware. The only source of identity; nothing in the message or history can change it.
	 * @param {ChatRequest} request - Validated request body: <code>message</code> is 1-2000 characters; <code>history</code> has at most 20 turns, oldest first.
	 * @returns {Promise<ChatResult>}
	 *
	 * @example <caption>Usage</caption>
	 * const gateway = new AIGateway({ llm: new GeminiClient(config.gemini), settings, logger });
	 * const result = await gateway.chat(
	 *   { userId: '23127001', roles: ['student'], facultyId: 'IT' },
	 *   { message: 'How do I earn training points?', history: [] }
	 * );
	 *
	 * @example <caption>Result (answered)</caption>
	 * {
	 *   "statusCode": 200,
	 *   "requestId": "6f1c2a9e-0b7d-4a51-9c43-2f8e1d5a7b10",
	 *   "outcome": "answered",
	 *   "blocked": false,
	 *   "reply": "You earn training points by joining verified activities..."
	 * }
	 *
	 * @example <caption>Result (assistant switched off by an administrator)</caption>
	 * {
	 *   "statusCode": 200,
	 *   "requestId": "0d4e8b2c-5f61-4c7a-8e93-1a2b3c4d5e6f",
	 *   "outcome": "disabled",
	 *   "blocked": true,
	 *   "reply": "The assistant is temporarily unavailable. Please try again later."
	 * }
	 *
	 * @example <caption>Result (AI service out of free quota)</caption>
	 * {
	 *   "statusCode": 503,
	 *   "requestId": "9a8b7c6d-1e2f-4a3b-8c4d-5e6f7a8b9c0d",
	 *   "outcome": "error",
	 *   "blocked": false,
	 *   "message": "AI assistant is temporarily unavailable, please try again later",
	 *   "retryAfterSeconds": 30
	 * }
	 *
	 * @response
	 * - `200 OK` - Answered (`outcome: "answered"`); refused by the provider's safety filter (`outcome: "blocked_output"`, fixed refusal); or switched off (`outcome: "disabled"`, fixed unavailable text)
	 * - `503 SERVICE_UNAVAILABLE` - AI settings could not be read, or the AI service failed, timed out or ran out of quota (`retryAfterSeconds: 30` for quota)
	 */
	async chat(identity: AIIdentity, request: ChatRequest): Promise<ChatResult> {
		const { llm, settings, logger, now, newRequestId } = this.deps;
		const startedAt = now();
		const requestId = newRequestId();
		const base: Omit<UsageEntry, 'outcome' | 'latencyMs'> = {
			requestId,
			userId: identity.userId,
			role: primaryRole(identity),
			facultyId: identity.facultyId,
			topic: 'unclassified',
			promptVersion: PROMPT_VERSION,
			inputTokens: 0, outputTokens: 0, classifierTokens: 0, embeddingTokens: 0, units: 0,
			toolRounds: 0, sourceCount: 0
		};
		const finish = async (result: ChatResult, extra: Partial<UsageEntry>, snap?: AISettingsSnapshot) => {
			await logger.log({ ...base, ...extra, outcome: result.outcome, latencyMs: Math.max(0, now() - startedAt) }, snap);
			return result;
		};

		// 1. Settings. Without them we cannot know if the assistant is switched off: refuse.
		let snap: AISettingsSnapshot;
		try {
			snap = await settings.snapshot();
		} catch {
			this.logFailure(identity.userId, 'settings_unavailable', 'could not read AI settings');
			return finish(this.unavailable(requestId), { blockReason: 'settings_unavailable' });
		}

		// 2. Kill switch (FR-026).
		if (!snap.enabled) {
			return finish({ statusCode: 200, requestId, outcome: 'disabled', reply: DISABLED_REPLY, blocked: true },
				{ blockReason: 'ai_disabled' }, snap);
		}

		// 3. Model call.
		const turns = [...request.history, { role: 'user' as const, text: request.message }];
		const llmStartedAt = now();
		let result: LLMResult;
		try {
			result = await llm.generate(turns, AI_SYSTEM_PROMPT);
		} catch (err) {
			const kind = err instanceof LLMError ? err.kind : 'unavailable';
			const detail = err instanceof LLMError ? err.message : 'unexpected error';
			this.logFailure(identity.userId, kind, detail);
			return finish(this.unavailable(requestId, kind === 'quota' ? QUOTA_RETRY_AFTER_SECONDS : undefined),
				{ blockReason: `llm_${kind}`, llmLatencyMs: Math.max(0, now() - llmStartedAt) }, snap);
		}

		const inputTokens = result.usage?.inputTokens ?? 0;
		const outputTokens = result.usage?.outputTokens ?? 0;
		const outcome: AIOutcome = result.blocked ? 'blocked_output' : 'answered';
		return finish(
			{
				statusCode: 200, requestId, outcome, blocked: result.blocked,
				reply: result.blocked ? BLOCKED_REPLY : result.text
			},
			{
				model: result.model ?? null,
				inputTokens, outputTokens,
				units: Math.max(inputTokens + outputTokens, result.blocked ? snap.minUnits : 0),
				blockReason: result.blocked ? 'provider_safety' : null,
				llmLatencyMs: Math.max(0, now() - llmStartedAt)
			},
			snap);
	}

	private unavailable(requestId: string, retryAfterSeconds?: number): ChatResult {
		return { statusCode: 503, requestId, outcome: 'error', blocked: false, message: UNAVAILABLE_MESSAGE, retryAfterSeconds };
	}

	// Never logs the message or the API key (002 FR-014).
	private logFailure(userId: string, kind: string, detail: string) {
		console.error(`[AI] ${new Date(this.deps.now()).toISOString()} user=${userId} kind=${kind} detail=${detail}`);
	}
}
