import type { AIIdentity, AIRole } from '../types/AIIdentity.ts';

/**
 * Returns the most privileged role of a user (administrator, then manager, then student). Used to pick usage limits and to fill <code>AiRequestLog.role</code> when a user has several roles.
 * @param {AIIdentity} identity - The verified caller.
 * @returns {AIRole | 'unknown'} The highest role, or <code>'unknown'</code> when the user has none.
 *
 * @example <caption>Usage</caption>
 * primaryRole({ userId: 'm1', roles: ['student', 'manager'], facultyId: null });
 *
 * @example <caption>Result</caption>
 * "manager"
 *
 * @example <caption>User without roles</caption>
 * primaryRole({ userId: 'x', roles: [], facultyId: null }); // "unknown"
 */
export function primaryRole(identity: AIIdentity): AIRole | 'unknown' {
	for (const role of ['administrator', 'manager', 'student'] as const) {
		if (identity.roles.includes(role)) return role;
	}
	return 'unknown';
}
