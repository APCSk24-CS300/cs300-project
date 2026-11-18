import { randomUUID } from 'node:crypto';
import { LLMError } from '../clients/LLMClient.ts';
import type { LLMClient, LLMResult } from '../clients/LLMClient.ts';
import { AISettings } from './settings/AISettings.ts';
import type { AISettingsSnapshot } from './settings/AISettings.ts';
import { UsageLogger } from './logging/UsageLogger.ts';
import type { UsageEntry } from './logging/UsageLogger.ts';
import { AI_SYSTEM_PROMPT, BLOCKED_REPLY, DISABLED_REPLY, PROMPT_VERSION } from './prompt/systemPrompt.ts';
import { primaryRole } from './types.ts';
import type { AIIdentity, AIOutcome, ChatRequest, ChatResult } from './types.ts';

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

	constructor(deps: AIGatewayDeps) {
		this.deps = {
			now: Date.now,
			newRequestId: randomUUID,
			...deps
		};
	}

	/**
	 * Answers one question for a verified user. Never throws: every failure becomes a
	 * ChatResult with a status code, and every call writes exactly one AiRequestLog row.
	 *
	 * @param identity - The verified caller (from LoadIdentity). The only source of identity.
	 * @param request - A validated body: message 1-2000 characters, history of at most 20 turns.
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
