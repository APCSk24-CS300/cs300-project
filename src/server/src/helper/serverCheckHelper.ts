import type { CheckResult } from '../types/CheckResult.ts';

export function checkServer(): CheckResult {
	return {
		up: true,
		uptime: process.uptime()
	};
}
