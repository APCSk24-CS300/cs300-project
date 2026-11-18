import { LLMError } from './LLMClient.ts';
import type { LLMClient, LLMResult } from './LLMClient.ts';
import type { ConversationTurn } from '../types/PromptRequest.ts';

export interface GeminiOptions {
	apiKey?: string,
	model: string,
	timeoutMs: number,
	fetchFn?: typeof fetch      // replaced by a stub in tests
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_OUTPUT_TOKENS = 1024;

/**
 * Calls Google's Gemini REST API (generateContent). The only class that knows Gemini's
 * URL, JSON shapes and HTTP codes. Error messages contain only status codes and error
 * names, never the API key or Google's error text.
 */
export class GeminiClient implements LLMClient {
	private readonly options: GeminiOptions;

	constructor(options: GeminiOptions) {
		this.options = options;
	}

	async generate(turns: ConversationTurn[], systemInstruction: string): Promise<LLMResult> {
		const { apiKey, model, timeoutMs } = this.options;
		if (!apiKey) {
			throw new LLMError('not_configured', 'GEMINI_API_KEY is not set');
		}
		const doFetch = this.options.fetchFn ?? fetch;

		const body = {
			systemInstruction: { parts: [{ text: systemInstruction }] },
			contents: turns.map(t => ({
				role: t.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: t.text }]
			})),
			generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS }
		};

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		let res: Response;
		try {
			res = await doFetch(`${BASE_URL}/${encodeURIComponent(model)}:generateContent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
				body: JSON.stringify(body),
				signal: controller.signal
			});
		} catch (err) {
			const name = err instanceof Error ? err.name : 'UnknownError';
			if (name === 'AbortError' || name === 'TimeoutError') {
				throw new LLMError('timeout', `No answer within ${timeoutMs} ms`);
			}
			throw new LLMError('unavailable', `Network error (${name})`);
		} finally {
			clearTimeout(timer);
		}

		if (res.status === 429) {
			throw new LLMError('quota', 'Gemini returned HTTP 429 (free quota used up)');
		}
		if (res.status >= 500) {
			throw new LLMError('unavailable', `Gemini returned HTTP ${res.status}`);
		}
		if (!res.ok) {
			// 400/401/403/404: bad key or model name. Our configuration problem, not the student's.
			throw new LLMError('config', `Gemini returned HTTP ${res.status} (check key and model name)`);
		}

		let json: any;
		try {
			json = await res.json();
		} catch {
			throw new LLMError('bad_response', 'Gemini returned a body that is not JSON');
		}

		if (json?.promptFeedback?.blockReason) {
			return { text: '', blocked: true };
		}
		const candidate = json?.candidates?.[0];
		const parts: unknown = candidate?.content?.parts;
		const text = Array.isArray(parts)
			? parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('').trim()
			: '';
		if (text.length === 0) {
			if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
				return { text: '', blocked: true };
			}
			throw new LLMError('bad_response', 'Gemini returned no text');
		}
		return { text, blocked: false };
	}
}
