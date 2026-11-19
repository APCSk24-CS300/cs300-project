import type { RequestLogRow, RequestLogStore } from '../../repositories/AiRequestLogRepository.ts';
import type { AISettingsSnapshot } from '../settings/AISettings.ts';

export type UsageEntry = Omit<RequestLogRow, 'costUsd'>;

/** Estimated cost in USD of one call, from the `ai.price.<model>` setting. 0 when no price is set. */
/**
 * Estimates the cost in USD of one model call from the <code>ai.price.&lt;model&gt;</code> setting, rounded to 6 decimals to fit <code>AiRequestLog.cost_usd</code>. On the Gemini free tier the real cost is 0; this shows what the call would cost at paid prices (design 7.6).
 * @param {AISettingsSnapshot | undefined} settings - Current settings, or undefined when they could not be read.
 * @param {string | null | undefined} model - The model that answered.
 * @param {number} inputTokens - Prompt tokens reported by the provider.
 * @param {number} outputTokens - Output tokens, including thinking tokens.
 * @returns {number} The estimated cost, or 0 when no price is set for the model.
 *
 * @example <caption>Usage (price: 0.30 USD in, 2.50 USD out per million tokens)</caption>
 * estimateCostUsd(settings, 'gemini-2.5-flash', 1000, 200);
 *
 * @example <caption>Result</caption>
 * 0.0008
 *
 * @example <caption>No price configured</caption>
 * estimateCostUsd(settings, 'some-other-model', 1000, 200); // 0
 */
export function estimateCostUsd(settings: AISettingsSnapshot | undefined, model: string | null | undefined,
	inputTokens: number, outputTokens: number): number {
	const price = model && settings ? settings.price(model) : null;
	if (!price) return 0;
	const cost = (inputTokens * price.inPer1m + outputTokens * price.outPer1m) / 1_000_000;
	return Math.round(cost * 1_000_000) / 1_000_000;    // NUMERIC(10, 6)
}

/**
 * Writes one AiRequestLog row per question (FR-024). Logging must never change what the
 * user receives, so `log` never throws: a failure is reported on the console (request id
 * and error name only) and remembered in `lastFailureAt` for the health check.
 */
export class UsageLogger {
	private readonly store: RequestLogStore;
	lastFailureAt: Date | null = null;

	constructor(store: RequestLogStore) {
		this.store = store;
	}

	/**
	 * Writes one <code>AiRequestLog</code> row for a question, adding the estimated cost (FR-024). Logging must never change what the user receives, so this method never throws: a failure is printed to the console with the request ID and error name only, and remembered in <code>lastFailureAt</code> for the health check.
	 * @param {UsageEntry} entry - Everything about the request except the cost. Must not contain the message or the reply.
	 * @param {AISettingsSnapshot} settings - Current settings, used for the price. Optional.
	 * @returns {Promise<void>}
	 *
	 * @example <caption>Usage</caption>
	 * await logger.log({
	 *   requestId: '6f1c2a9e-0b7d-4a51-9c43-2f8e1d5a7b10', userId: '23127001', role: 'student', facultyId: 'IT',
	 *   topic: 'unclassified', outcome: 'answered', model: 'gemini-2.5-flash', promptVersion: 'v1',
	 *   inputTokens: 1000, outputTokens: 200, classifierTokens: 0, embeddingTokens: 0, units: 1200,
	 *   latencyMs: 2350, toolRounds: 0, sourceCount: 0
	 * }, snap);
	 *
	 * @example <caption>Row written</caption>
	 * { "request_id": "6f1c2a9e-...", "user_id": "23127001", "outcome": "answered", "units": 1200, "cost_usd": 0.0008, "latency_ms": 2350, ... }
	 *
	 * @example <caption>Console output when the database is down</caption>
	 * [AI] 2026-11-18T09:40:00.000Z request=6f1c2a9e-0b7d-4a51-9c43-2f8e1d5a7b10 kind=usage_log_failed detail=Error
	 */
	async log(entry: UsageEntry, settings?: AISettingsSnapshot): Promise<void> {
		const row: RequestLogRow = {
			...entry,
			costUsd: estimateCostUsd(settings, entry.model, entry.inputTokens, entry.outputTokens)
		};
		try {
			await this.store.insert(row);
		} catch (err) {
			this.lastFailureAt = new Date();
			const name = err instanceof Error ? err.name : 'UnknownError';
			console.error(`[AI] ${new Date().toISOString()} request=${entry.requestId} kind=usage_log_failed detail=${name}`);
		}
	}
}
