import type { CheckResult } from '../types/CheckResult.ts';
import config from '../config/config.ts';

export async function checkDatabase(): Promise<CheckResult> {
	if (!config.db?.dbHost) {
		return { 
			up: 'False', 
			message: 'Not configured. Check src/server/src/helper/databaseCheckHelper.ts' 
		};
	}

	const start = Date.now();
	try {
        // Uncomment following line when database connection is set up
		// await DbConnection.pool.query('SELECT 1');
		return { 
			up: 'True', 
			responseTimeMs: Date.now() - start 
		};
	} catch (err) {
		console.error('Health check: database unreachable', err);
		return { up: 'False' };
	}
}