import type { CheckResult } from '../types/CheckResult.ts';

export function checkServer(): CheckResult {
	return {
		up: 'True',
		uptime: process.uptime()
	};
}
