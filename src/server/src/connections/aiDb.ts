import { Pool } from 'pg';
import config from '../config/config.ts';

let pool: Pool | undefined;

/**
 * Returns the connection pool of the AI module, creating it on first use so the server starts even when the AI database settings are missing. It logs in as the least-privilege <code>ai_gateway</code> role (<code>db/ai_schema.sql</code>), which can read only the <code>ai_*_v</code> views and a few settings tables and write only the <code>Ai*</code> tables, so a bug in AI code cannot reach other data (specs/003 research R1). Each new connection sets <code>hnsw.iterative_scan = relaxed_order</code> for filtered vector search.
 * @returns {Pool}
 *
 * @example <caption>Usage</caption>
 * const { rows } = await getAiPool().query('SELECT count(*) FROM "AiRequestLog"');
 *
 * @example <caption>What the role cannot do</caption>
 * await getAiPool().query('SELECT * FROM "User"'); // rejects: permission denied for table User
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
/**
 * Closes the AI connection pool on shutdown, if it was ever opened. Safe to call more than once.
 * @returns {Promise<void>}
 *
 * @example <caption>Usage (graceful shutdown in index.ts)</caption>
 * process.on('SIGTERM', async () => {
 *   await closeAiPool();
 * });
 *
 * @example <caption>Pool never used</caption>
 * await closeAiPool(); // does nothing
 */
export async function closeAiPool(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = undefined;
	}
}
