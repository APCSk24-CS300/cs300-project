// Shared types of the AI module (specs/003-ai-assistant-safety).
import type { PromptRequest } from '../types/PromptRequest.ts';

export type AIRole = 'student' | 'manager' | 'administrator';

/**
 * Who is asking, as verified by the API Server (access token, then database).
 * The AI module trusts only this object for identity: never the message, the
 * history or anything the model produces (FR-010).
 */
export interface AIIdentity {
	userId: string,
	roles: AIRole[],
	facultyId: string | null     // students only; null for staff
}

/** Every way a question can end. Stored in AiRequestLog.outcome. */
export type AIOutcome =
	| 'answered' | 'refused_off_topic' | 'blocked_input' | 'blocked_output'
	| 'quota_exceeded' | 'budget_exceeded' | 'disabled' | 'busy'
	| 'cooldown' | 'notice_required' | 'error';

export type ChatRequest = PromptRequest;

/** What AIGateway.chat returns. The controller turns it into a ServiceResponse. */
export interface ChatResult {
	statusCode: number,
	requestId: string,
	outcome: AIOutcome,
	reply?: string,              // present on 200
	blocked: boolean,            // true when reply is one of the fixed refusal or unavailable texts
	message?: string,            // error message for non-200 results
	retryAfterSeconds?: number
}

/** The role used for limits and logging when a user has several: the most privileged one. */
export function primaryRole(identity: AIIdentity): AIRole | 'unknown' {
	for (const role of ['administrator', 'manager', 'student'] as const) {
		if (identity.roles.includes(role)) return role;
	}
	return 'unknown';
}
