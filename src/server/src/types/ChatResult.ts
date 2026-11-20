// Input and output of the AI module's AIGateway.chat (specs/003-ai-assistant-safety).
import type { PromptRequest } from './PromptRequest.ts';

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
