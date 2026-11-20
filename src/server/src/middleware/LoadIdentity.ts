import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { IdentityStore } from '../repositories/IdentityRepository.ts';
import type { AIIdentity, AIRole } from '../types/AIIdentity.ts';
import { ServiceResponse } from '../types/ServiceResponse.ts';
import { generate503Response } from '../helper/generate503Response.ts';

const ROLES: readonly string[] = ['student', 'manager', 'administrator'];

/**
 * Middleware factory for <code>/api/ai/chat</code> and <code>/api/ai/prompt</code>. Builds <code>res.locals.identity</code> (an <code>AIIdentity</code>) after <code>validateAccessToken</code>. Roles and faculty come from the token when it carries them (<code>roles</code>, <code>faculty_id</code> claims; unknown roles are dropped), otherwise from the database, so it works both before and after login issues role-bearing tokens. A deactivated account gets no roles. Supports any HTTP method.
 * @param {IdentityStore} store - Reads roles and faculty (<code>IdentityRepository</code> in production).
 * @returns {RequestHandler}
 *
 * @example <caption>Usage</caption>
 * router.all('/chat',
 *   ValidatorMiddleware.validateAccessToken,
 *   createLoadIdentity(new IdentityRepository(DbConnection.pool)),
 *   controller.prompt
 * );
 *
 * @example <caption>res.locals.identity (token { "sub": "23127001" }, student in faculty IT)</caption>
 * {
 *   "userId": "23127001",
 *   "roles": ["student"],
 *   "facultyId": "IT"
 * }
 *
 * @example <caption>Response (401, token has no subject)</caption>
 * {
 *   "success": false,
 *   "statusCode": 401,
 *   "payload": {
 *     "message": "Access denied, token has no subject (UNAUTHORIZED)"
 *   }
 * }
 *
 * @response
 * - `401 UNAUTHORIZED` - The access token has no `sub` claim (header `WWW-Authenticate: Bearer realm="api"`)
 * - `503 SERVICE_UNAVAILABLE` - Roles or faculty could not be read from the database
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
