import type { CheckResult } from '../types/CheckResult.ts';

export function checkServer(): CheckResult {
	return {
		status: 'up',
		uptime: process.uptime()
	};
}
