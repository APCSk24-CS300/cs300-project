import type { Pool } from 'pg';
import type { SettingsSource } from '../../ai/settings/AISettings.ts';

/** Reads the `ai.*` rows of SystemSetting. */
export class AiSettingsRepository implements SettingsSource {
	private readonly pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	async loadAiSettings(): Promise<Record<string, string>> {
		const { rows } = await this.pool.query<{ setting_key: string, setting_value: string }>(
			`SELECT setting_key, setting_value FROM "SystemSetting" WHERE setting_key LIKE 'ai.%'`);
		return Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
	}
}
