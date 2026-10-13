export type CheckStatus = 'up' | 'down' | 'not_configured';

export interface CheckResult {
	status: CheckStatus,
	[detail: string]: unknown
}
