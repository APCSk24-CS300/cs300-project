import { Pool } from 'pg';
import config from '../config/config.ts';

let pool: Pool | undefined;

/**
 * Connection pool of the AI module. Logs in as the least-privilege `ai_gateway` role
 * (db/ai_schema.sql), which can read only the ai_*_v views and write only the Ai* tables,
 * so a bug in AI code cannot reach other data (specs/003 research R1).
 *
 * Created on first use, so the server starts even when the AI database settings are missing.
 */
export function getAiPool(): Pool {
	if (!pool) {
		pool = new Pool({
			host: config.ai.db.dbHost,
			user: config.ai.db.dbUser,
			password: config.ai.db.dbPassword,
			port: Number(config.ai.db.dbPort ?? 5432),
			database: config.ai.db.dbName,
			max: 5
		});
		// keep filtered vector searches returning enough rows (pgvector 0.8+, research R2)
		pool.on('connect', client => {
			client.query('SET hnsw.iterative_scan = relaxed_order').catch(() => { /* older pgvector: ignore */ });
		});
	}
	return pool;
}

/** Closes the pool on shutdown, if it was ever opened. */
export async function closeAiPool(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = undefined;
	}
}
