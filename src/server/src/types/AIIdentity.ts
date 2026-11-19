// Who is calling the AI endpoints (specs/003-ai-assistant-safety).

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
