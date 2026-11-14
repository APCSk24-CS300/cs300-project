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
	 * Asks the AI to answer `request.message` given the earlier turns.
	 * Never throws: an AI failure becomes a 503 response with a generic message
	 * (no provider text), and is logged with time, user and error kind only.
	 * A safety refusal is a normal 200 with a fixed reply and `blocked: true`.
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
