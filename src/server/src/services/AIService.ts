import { LLMError } from '../clients/LLMClient.ts';
import type { LLMClient } from '../clients/LLMClient.ts';
import { generate503Response } from '../helper/generate503Response.ts';
import { ServiceResponse } from '../types/ServiceResponse.ts';
import type { PromptRequest, PromptResult } from '../types/PromptRequest.ts';
import { AI_SYSTEM_PROMPT, BLOCKED_REPLY } from './aiSystemPrompt.ts';

const UNAVAILABLE_MESSAGE = 'AI assistant is temporarily unavailable, please try again later';
const QUOTA_RETRY_AFTER_SECONDS = 30;

export interface AIServiceResult {
	response: ServiceResponse,
	retryAfterSeconds?: number   // the controller sends this as the Retry-After header
}

/** Business logic of the AI assistant. Knows nothing about Express or about Gemini. */
export class AIService {
	private readonly llm: LLMClient;

	constructor(llm: LLMClient) {
		this.llm = llm;
	}

	/**
	 * Service function for <code>/api/ai/prompt</code>. Sends the student's message (and, optionally, the earlier turns of the conversation) to the AI Student Assistant and returns its answer. The server does not store conversations, so the client must send the earlier turns with every request. Requires a Bearer access token. Each user may send at most 10 requests per minute. Supports <code>POST</code> requests. Never throws: an AI failure becomes a <code>503</code> with a generic message, logged with time, user and error kind only (never the message or the API key).
	 * @param {PromptRequest} request - Validated request body: <code>{ "message": string, "history"?: { "role": "user" | "assistant", "text": string }[] }</code>. <code>message</code> is 1-2000 characters; <code>history</code> has at most 20 turns of 1-2000 characters each, oldest first.
	 * @param {string} userId - ID of the caller, used only for logging.
	 * @returns {Promise<AIServiceResult>} The response to send, plus <code>retryAfterSeconds</code> when the controller should set the <code>Retry-After</code> header.
	 *
	 * @example <caption>cURL (first message, no history)</caption>
	 * curl -X POST \
	 * --header 'Content-Type:application/json' \
	 * --header 'Authorization: Bearer <access token>' \
	 * --data '{"message": "How do I earn training points?"}' \
	 * http://localhost:8080/api/ai/prompt
	 *
	 * @example <caption>Response (200, answer)</caption>
	 * {
	 *   "success": true,
	 *   "statusCode": 200,
	 *   "payload": {
	 *     "message": "Prompt answered (OK)",
	 *     "data": {
	 *       "reply": "You earn training points by joining verified activities such as volunteering, clubs and academic events...",
	 *       "blocked": false
	 *     }
	 *   }
	 * }
	 *
	 * @example <caption>cURL (follow-up, with history)</caption>
	 * curl -X POST \
	 * --header 'Content-Type:application/json' \
	 * --header 'Authorization: Bearer <access token>' \
	 * --data '{"message": "Tell me more about the second one", "history": [{"role": "user", "text": "Which volunteer clubs can I join?"}, {"role": "assistant", "text": "Two popular ones are the Green Summer Club and the Blood Donation Club."}]}' \
	 * http://localhost:8080/api/ai/prompt
	 *
	 * @example <caption>Response (200, follow-up answer)</caption>
	 * {
	 *   "success": true,
	 *   "statusCode": 200,
	 *   "payload": {
	 *     "message": "Prompt answered (OK)",
	 *     "data": {
	 *       "reply": "The Blood Donation Club runs a donation day each semester...",
	 *       "blocked": false
	 *     }
	 *   }
	 * }
	 *
	 * @example <caption>Response (200, blocked by AI safety filter)</caption>
	 * {
	 *   "success": true,
	 *   "statusCode": 200,
	 *   "payload": {
	 *     "message": "Prompt answered (OK)",
	 *     "data": {
	 *       "reply": "Sorry, I can't help with that request. I can answer questions about student activities, training points and university procedures.",
	 *       "blocked": true
	 *     }
	 *   }
	 * }
	 *
	 * @example <caption>Response (400, invalid body: '{"message": "   ", "history": [{"role": "bot", "text": "hi"}]}')</caption>
	 * {
	 *   "success": false,
	 *   "statusCode": 400,
	 *   "payload": {
	 *     "message": "Invalid prompt request (BAD_REQUEST)",
	 *     "data": {
	 *       "details": [
	 *         "message must not be empty",
	 *         "history[0].role must be \"user\" or \"assistant\""
	 *       ]
	 *     }
	 *   }
	 * }
	 *
	 * @example <caption>Response (429, 11th request within a minute; header Retry-After: 42)</caption>
	 * {
	 *   "success": false,
	 *   "statusCode": 429,
	 *   "payload": {
	 *     "message": "Too many requests, please try again in 42 seconds (TOO_MANY_REQUESTS)"
	 *   }
	 * }
	 *
	 * @example <caption>Response (503, AI service down or out of quota)</caption>
	 * {
	 *   "success": false,
	 *   "statusCode": 503,
	 *   "payload": {
	 *     "message": "AI assistant is temporarily unavailable, please try again later (SERVICE_UNAVAILABLE)"
	 *   }
	 * }
	 *
	 * @response
	 * - `200 OK` - Successful request. If the AI refuses for safety reasons, `blocked` is `true` and `reply` is a fixed polite refusal
	 * - `400 BAD_REQUEST` - Invalid body; `payload.data.details` lists every problem (missing/blank/too long message, bad history)
	 * - `401 UNAUTHORIZED` - Missing, malformed or invalid Bearer token
	 * - `405 METHOD_NOT_ALLOWED` - The endpoint does not support the HTTP method specified
	 * - `415 UNSUPPORTED_MEDIA_TYPE` - Content-Type is not exactly `application/json`
	 * - `429 TOO_MANY_REQUESTS` - More than 10 requests in a minute; see the `Retry-After` header
	 * - `503 SERVICE_UNAVAILABLE` - The AI service is down, slow, out of free quota or not configured; try again later (`Retry-After: 30` when the quota is used up)
	 */

	async prompt(request: PromptRequest, userId: string): Promise<AIServiceResult> {
		const turns = [...request.history, { role: 'user' as const, text: request.message }];
		try {
			const result = await this.llm.generate(turns, AI_SYSTEM_PROMPT);
			const data: PromptResult = result.blocked
				? { reply: BLOCKED_REPLY, blocked: true }
				: { reply: result.text, blocked: false };

			const response = new ServiceResponse;
			response.success = true;
			response.statusCode = 200;
			response.payload = { message: 'Prompt answered', data };
			return { response };
		} catch (err) {
			const kind = err instanceof LLMError ? err.kind : 'unavailable';
			const detail = err instanceof LLMError ? err.message : 'unexpected error';
			// never log the student's message or the API key (FR-014)
			console.error(`[AI] ${new Date().toISOString()} user=${userId} kind=${kind} detail=${detail}`);
			return {
				response: generate503Response(UNAVAILABLE_MESSAGE),
				retryAfterSeconds: kind === 'quota' ? QUOTA_RETRY_AFTER_SECONDS : undefined
			};
		}
	}
}
