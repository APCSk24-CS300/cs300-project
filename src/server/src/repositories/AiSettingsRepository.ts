import type { Pool } from 'pg';

/** Where the raw `ai.*` settings come from (SystemSetting in production, a map in tests). */
export interface SettingsSource {
	loadAiSettings(): Promise<Record<string, string>>
}

/** Reads the `ai.*` rows of SystemSetting. */
export class AiSettingsRepository implements SettingsSource {
	private readonly pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	/**
	 * Reads every <code>SystemSetting</code> row whose key starts with <code>ai.</code>. Runs as the <code>ai_gateway</code> database role.
	 * @returns {Promise<Record<string, string>>} Setting key to raw setting value.
	 *
	 * @example <caption>Usage</caption>
	 * await new AiSettingsRepository(getAiPool()).loadAiSettings();
	 *
	 * @example <caption>Result</caption>
	 * {
	 *   "ai.enabled": "true",
	 *   "ai.monthly_budget_usd": "5.00",
	 *   "ai.limit.5h.student": "40000",
	 *   "ai.model.chat": "gemini-2.5-flash"
	 * }
	 */
	async loadAiSettings(): Promise<Record<string, string>> {
		const { rows } = await this.pool.query<{ setting_key: string, setting_value: string }>(
			`SELECT setting_key, setting_value FROM "SystemSetting" WHERE setting_key LIKE 'ai.%'`);
		return Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
	}
}
