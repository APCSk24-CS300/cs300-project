import type { ConversationTurn } from '../types/PromptRequest.ts';

// Why a call to the AI service failed. Every kind becomes a 503 for the client;
// the kind only decides what is logged and whether Retry-After is sent.
export type LLMErrorKind = 'not_configured' | 'unavailable' | 'timeout' | 'quota' | 'config' | 'bad_response';

export class LLMError extends Error {
	kind: LLMErrorKind;

	constructor(kind: LLMErrorKind, message: string) {
		super(message);
		this.name = 'LLMError';
		this.kind = kind;
	}
}

export interface LLMResult {
	text: string,       // the answer ('' when blocked)
	blocked: boolean    // the AI service refused for safety reasons
}

/**
 * A text-generation service. AIService only knows this interface, so the provider
 * (Gemini today) can be swapped, and tests can use a fake.
 *
 * `turns` is the whole conversation, oldest first, ending with the newest student message.
 * Implementations must throw an LLMError (never a raw error) when the call fails, must give
 * up after a timeout, and must never put the API key or provider error text in the error message.
 */
export interface LLMClient {
	generate(turns: ConversationTurn[], systemInstruction: string): Promise<LLMResult>;
}
