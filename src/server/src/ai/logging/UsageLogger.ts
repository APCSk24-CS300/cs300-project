import type { RequestLogRow, RequestLogStore } from '../../repositories/ai/AiRequestLogRepository.ts';
import type { AISettingsSnapshot } from '../settings/AISettings.ts';

export type UsageEntry = Omit<RequestLogRow, 'costUsd'>;

/** Estimated cost in USD of one call, from the `ai.price.<model>` setting. 0 when no price is set. */
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
