import type { NextFunction, Request, Response } from 'express';
import { AIService } from '../services/AIService.ts';
import { validatePromptRequest } from '../helper/validatePromptRequest.ts';
import { generate400Response } from '../helper/generate400Response.ts';

/** HTTP handling for the AI endpoint: validate the body, call AIService, send the response. */
export class AIController {
	private readonly service: AIService;

	constructor(service: AIService) {
		this.service = service;
	}

	/**
	 * Handler for <code>/api/ai/prompt</code>. Sends the student's message (and, optionally, the earlier turns of the conversation) to the AI Student Assistant and returns its answer. The server does not store conversations, so the client must send the earlier turns with every request. Requires a Bearer access token. Each user may send at most 10 requests per minute. Supports <code>POST</code> requests.
	 * @param {Request} req - Express request. The JSON body is <code>{ "message": string, "history"?: { "role": "user" | "assistant", "text": string }[] }</code>. <code>message</code> is 1-2000 characters; <code>history</code> has at most 20 turns of 1-2000 characters each, oldest first.
	 * @param {Response} res - Express response.
	 * @param {NextFunction} next - Express next function.
	 * @returns {Promise<void>}
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
	prompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const validation = validatePromptRequest(req.body);
		if (!validation.ok) {
			const response = generate400Response('Invalid prompt request', validation.details);
			return void res.status(response.statusCode).json(response.get());
		}

		const user = res.locals.user as { sub?: string } | undefined;
		const userId = user?.sub ?? req.ip ?? 'unknown';
		const { response, retryAfterSeconds } = await this.service.prompt(validation.value, userId);
		if (retryAfterSeconds !== undefined) {
			res.set('Retry-After', String(retryAfterSeconds));
		}
		return void res.status(response.statusCode).json(response.get());
	}
}
