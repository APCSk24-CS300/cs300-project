export type CheckStatus = 'True' | 'False';

export interface CheckResult {
	up: CheckStatus,
	[detail: string]: unknown
}
