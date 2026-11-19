import { PROMPT_LIMITS } from '../types/PromptRequest.ts';
import type { ConversationTurn, PromptRequest } from '../types/PromptRequest.ts';

export type PromptValidation =
	| { ok: true, value: PromptRequest }
	| { ok: false, details: string[] };

function checkText(text: unknown, label: string, details: string[]): void {
	if (typeof text !== 'string') {
		details.push(`${label} must be a non-empty string`);
	} else if (text.trim().length === 0) {
		details.push(`${label} must not be empty`);
	} else if (text.length > PROMPT_LIMITS.maxMessageLength) {
		details.push(`${label} must be at most ${PROMPT_LIMITS.maxMessageLength} characters`);
	}
}

/**
 * Checks an untrusted request body. Returns the cleaned request, or a list of
 * human-readable problems (all of them, not just the first). Pure function: no Express.
 */
export function validatePromptRequest(body: unknown): PromptValidation {
	const details: string[] = [];
	const input = (body !== null && typeof body === 'object' ? body : {}) as Record<string, unknown>;

	if (input.message === undefined || input.message === null) {
		details.push('message is required');
	} else if (typeof input.message !== 'string') {
		details.push('message must be a string');
	} else {
		checkText(input.message, 'message', details);
	}

	const history: ConversationTurn[] = [];
	if (input.history !== undefined && input.history !== null) {
		if (!Array.isArray(input.history)) {
			details.push('history must be an array');
		} else if (input.history.length > PROMPT_LIMITS.maxHistoryTurns) {
			details.push(`history must have at most ${PROMPT_LIMITS.maxHistoryTurns} turns`);
		} else {
			input.history.forEach((turn: unknown, i: number) => {
				if (turn === null || typeof turn !== 'object' || Array.isArray(turn)) {
					details.push(`history[${i}] must be an object`);
					return;
				}
				const t = turn as Record<string, unknown>;
				if (t.role !== 'user' && t.role !== 'assistant') {
					details.push(`history[${i}].role must be "user" or "assistant"`);
				}
				checkText(t.text, `history[${i}].text`, details);
				if ((t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string') {
					history.push({ role: t.role, text: t.text.trim() });
				}
			});
		}
	}

	if (details.length > 0) {
		return { ok: false, details };
	}
	return { ok: true, value: { message: (input.message as string).trim(), history } };
}
