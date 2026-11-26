// Shapes used by the AI prompt endpoint. See specs/002-ai-prompt-endpoint/data-model.md

export type ConversationRole = 'user' | 'assistant';

export interface ConversationTurn {
	role: ConversationRole,
	text: string
}

export interface PromptRequest {
	message: string,
	history: ConversationTurn[]   // oldest first; empty means a new conversation
}

export interface PromptResult {
	reply: string,
	blocked: boolean              // true when the fixed safety refusal was returned
}

export const PROMPT_LIMITS = {
	maxMessageLength: 2000,
	maxHistoryTurns: 20
} as const;
