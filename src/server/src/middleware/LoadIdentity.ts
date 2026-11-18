import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { IdentityStore } from '../ai/identity/IdentityStore.ts';
import type { AIIdentity, AIRole } from '../ai/types.ts';
import { ServiceResponse } from '../types/ServiceResponse.ts';
import { generate503Response } from '../helper/generate503Response.ts';

const ROLES: readonly string[] = ['student', 'manager', 'administrator'];

/**
 * Builds `res.locals.identity` (an AIIdentity) for the AI routes. Put it after
 * `validateAccessToken`. Roles and faculty come from the token when it carries them
 * (`roles`, `faculty_id` claims), otherwise from the database, so this works both before
 * and after login issues role-bearing tokens (specs/003 Assumptions).
 *
 * Responds 401 when the token has no subject, 503 when the database cannot be read.
 */
export function createLoadIdentity(store: IdentityStore): RequestHandler {
	return async (_req: Request, res: Response, next: NextFunction) => {
		const claims = (res.locals.user ?? {}) as { sub?: unknown, roles?: unknown, faculty_id?: unknown };
		const userId = typeof claims.sub === 'string' && claims.sub.trim() !== '' ? claims.sub : undefined;
		if (!userId) {
			const response = new ServiceResponse;
			response.success = false;
			response.statusCode = 401;
			response.payload = { message: 'Access denied, token has no subject' };
			return void res.status(401).set('WWW-Authenticate', 'Bearer realm="api"').json(response.get());
		}

		try {
			const tokenRoles = Array.isArray(claims.roles)
				? claims.roles.filter((r): r is AIRole => typeof r === 'string' && ROLES.includes(r))
				: undefined;
			const roles = tokenRoles ?? await store.getRoles(userId);
			const facultyId = typeof claims.faculty_id === 'string'
				? claims.faculty_id
				: (roles.includes('student') ? await store.getFacultyId(userId) : null);

			const identity: AIIdentity = { userId, roles, facultyId };
			res.locals.identity = identity;
		} catch {
			console.error(`[AI] ${new Date().toISOString()} user=${userId} kind=identity_lookup_failed`);
			const response = generate503Response('The service is temporarily unavailable, please try again later');
			return void res.status(503).json(response.get());
		}
		next();
	};
}
