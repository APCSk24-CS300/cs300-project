import type { AIRole } from '../types.ts';

/** Where the raw `ai.*` settings come from (SystemSetting in production, a map in tests). */
export interface SettingsSource {
	loadAiSettings(): Promise<Record<string, string>>
}

export interface ModelPrice { inPer1m: number, outPer1m: number }

/** Typed, validated view of the `ai.*` rows of SystemSetting at one moment. */
export interface AISettingsSnapshot {
	enabled: boolean,
	monthlyBudgetUsd: number,
	budgetAlertPercent: number,
	minUnits: number,
	projectRpm: number,
	projectRpd: number,
	chatModel: string,
	classifierModel: string,
	embeddingModel: string,
	noticeVersion: string,
	limit5h(role: AIRole | 'unknown'): number,
	limitWeek(role: AIRole | 'unknown'): number,
	price(model: string): ModelPrice | null
}

// Used when a row is missing or invalid. Same values as db/ai_schema.sql.
const DEFAULT_LIMITS: Record<string, { h5: number, week: number }> = {
	student: { h5: 40_000, week: 200_000 },
	manager: { h5: 80_000, week: 400_000 },
	administrator: { h5: 80_000, week: 400_000 }
};

function num(raw: Record<string, string>, key: string, fallback: number, min = 0): number {
	const value = Number(raw[key]);
	return raw[key] !== undefined && Number.isFinite(value) && value >= min ? value : fallback;
}

function str(raw: Record<string, string>, key: string, fallback: string): string {
	const value = raw[key]?.trim();
	return value ? value : fallback;
}

/** Turns raw rows into a snapshot. Never throws: bad values fall back to defaults. */
export function parseSettings(raw: Record<string, string>): AISettingsSnapshot {
	const limit = (kind: '5h' | 'week', role: AIRole | 'unknown') => {
		const fallback = DEFAULT_LIMITS[role]?.[kind === '5h' ? 'h5' : 'week'] ?? DEFAULT_LIMITS.student[kind === '5h' ? 'h5' : 'week'];
		return num(raw, `ai.limit.${kind}.${role}`, fallback);
	};
	return {
		// anything other than the exact text "false" keeps the assistant on, so a typo cannot
		// silently disable it; switching off is always an explicit "false"
		enabled: raw['ai.enabled']?.trim().toLowerCase() !== 'false',
		monthlyBudgetUsd: num(raw, 'ai.monthly_budget_usd', 5),
		budgetAlertPercent: num(raw, 'ai.budget_alert_percent', 80),
		minUnits: num(raw, 'ai.limit.min_units', 500),
		projectRpm: num(raw, 'ai.limit.project_rpm', 8, 1),
		projectRpd: num(raw, 'ai.limit.project_rpd', 200, 1),
		chatModel: str(raw, 'ai.model.chat', 'gemini-2.5-flash'),
		classifierModel: str(raw, 'ai.model.classifier', 'gemini-2.5-flash-lite'),
		embeddingModel: str(raw, 'ai.model.embedding', 'gemini-embedding-001'),
		noticeVersion: str(raw, 'ai.notice.version', '1'),
		limit5h: role => limit('5h', role),
		limitWeek: role => limit('week', role),
		price: model => {
			const text = raw[`ai.price.${model}`];
			if (!text) return null;
			try {
				const json = JSON.parse(text);
				const inPer1m = Number(json?.in_per_1m), outPer1m = Number(json?.out_per_1m);
				return Number.isFinite(inPer1m) && Number.isFinite(outPer1m) && inPer1m >= 0 && outPer1m >= 0
					? { inPer1m, outPer1m } : null;
			} catch {
				return null;
			}
		}
	};
}

export interface AISettingsOptions {
	ttlMs?: number,           // how long a snapshot is reused; 10 s keeps the kill switch within FR-026
	now?: () => number
}

/**
 * Cached access to the AI settings. A snapshot is reused for `ttlMs` (default 10 s), so
 * a change made by an administrator takes effect within that time (FR-026, SC-007).
 *
 * If the source fails, the last snapshot is reused; if there has never been one, the
 * error is thrown and the caller must refuse the request (fail safe, design P5).
 */
export class AISettings {
	private readonly source: SettingsSource;
	private readonly ttlMs: number;
	private readonly now: () => number;
	private cached?: { at: number, snapshot: AISettingsSnapshot };

	constructor(source: SettingsSource, options: AISettingsOptions = {}) {
		this.source = source;
		this.ttlMs = options.ttlMs ?? 10_000;
		this.now = options.now ?? Date.now;
	}

	async snapshot(): Promise<AISettingsSnapshot> {
		const now = this.now();
		if (this.cached && now - this.cached.at < this.ttlMs) {
			return this.cached.snapshot;
		}
		try {
			const snapshot = parseSettings(await this.source.loadAiSettings());
			this.cached = { at: now, snapshot };
			return snapshot;
		} catch (err) {
			if (this.cached) return this.cached.snapshot;
			throw err;
		}
	}
}
