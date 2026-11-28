import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { IdentityStore } from '../repositories/IdentityRepository.ts';
import { ServiceResponse } from '../types/ServiceResponse.ts';
import { generate503Response } from '../helper/generate503Response.ts';

/**
 * Middleware factory that lets a request through only when the caller's roles grant the named permission (<code>Permission.code</code> through <code>RolePermission</code>). Put it after <code>validateAccessToken</code>. Used with <code>ai.chat</code> on <code>/api/ai/chat</code> and <code>/api/ai/prompt</code>, and with the <code>ai.*</code> admin permissions on later admin routes. Supports any HTTP method.
 * @param {IdentityStore} store - Answers permission checks (<code>IdentityRepository</code> in production).
 * @returns {(permissionCode: string) => RequestHandler} A function that returns the middleware for one permission code.
 *
 * @example <caption>Usage</caption>
 * const requirePermission = createRequirePermission(new IdentityRepository(DbConnection.pool));
 * router.all('/chat', ValidatorMiddleware.validateAccessToken, requirePermission('ai.chat'), controller.prompt);
 *
 * @example <caption>Response (403, user without the ai.chat permission)</caption>
 * {
 *   "success": false,
 *   "statusCode": 403,
 *   "payload": {
 *     "message": "You do not have permission to do this (FORBIDDEN)"
 *   }
 * }
 *
 * @example <caption>Response (503, permission tables could not be read)</caption>
 * {
 *   "success": false,
 *   "statusCode": 503,
 *   "payload": {
 *     "message": "The service is temporarily unavailable, please try again later (SERVICE_UNAVAILABLE)"
 *   }
 * }
 *
 * @response
 * - `403 FORBIDDEN` - The caller's roles do not include the permission, or the account is deactivated
 * - `503 SERVICE_UNAVAILABLE` - The permission check failed (database error)
 */
export function createRequirePermission(store: IdentityStore): (permissionCode: string) => RequestHandler {
	return (permissionCode: string) => async (_req: Request, res: Response, next: NextFunction) => {
		const userId = (res.locals.user as { sub?: unknown } | undefined)?.sub;
		let allowed = false;
		if (typeof userId === 'string') {
			try {
				allowed = await store.hasPermission(userId, permissionCode);
			} catch {
				console.error(`[AUTH] ${new Date().toISOString()} user=${userId} kind=permission_lookup_failed`);
				const response = generate503Response('The service is temporarily unavailable, please try again later');
				return void res.status(503).json(response.get());
			}
		}
		if (!allowed) {
			const response = new ServiceResponse;
			response.success = false;
			response.statusCode = 403;
			response.payload = { message: 'You do not have permission to do this' };
			return void res.status(403).json(response.get());
		}
		next();
	};
}
