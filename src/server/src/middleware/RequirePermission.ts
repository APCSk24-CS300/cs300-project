import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { IdentityStore } from '../ai/identity/IdentityStore.ts';
import { ServiceResponse } from '../types/ServiceResponse.ts';
import { generate503Response } from '../helper/generate503Response.ts';

/**
 * Returns a factory of middleware that let a request through only when the caller has
 * the named permission (Permission.code, through their roles). Put it after
 * `validateAccessToken`. Responds 403 without the permission, 503 if the check fails.
 *
 * @example
 * const requirePermission = createRequirePermission(identityStore);
 * router.get('/usage/summary', validateAccessToken, requirePermission('ai.usage.read'), handler);
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
