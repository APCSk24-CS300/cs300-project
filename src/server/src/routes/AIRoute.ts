import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { AIController } from '../controllers/AIController.ts';
import ValidatorMiddleware from '../middleware/ValidatorMiddleware.ts';
import { HTTPMethod } from '../enums/HTTPMethod.ts';

export interface AIRouteMiddleware {
	rateLimit: RequestHandler,                                   // per user, after the token check
	loadIdentity: RequestHandler,                                // fills res.locals.identity
	requirePermission: (permissionCode: string) => RequestHandler
}

/**
 * Routes of the AI assistant, mounted at /api/ai. `/prompt` is the phase 1 path, kept as
 * an alias of `/chat` until the client has moved (specs/003 contracts/ai-chat-api.md).
 * Check order: method, token, identity, permission, content type, rate limit, controller.
 */
export function createAIRoute(controller: AIController, mw: AIRouteMiddleware): Router {
	const router: Router = Router();

	router.all(['/chat', '/prompt'],
		ValidatorMiddleware.validateMethod([HTTPMethod.POST]),
		ValidatorMiddleware.validateAccessToken,
		mw.loadIdentity,
		mw.requirePermission('ai.chat'),
		ValidatorMiddleware.validateContentType,
		mw.rateLimit,
		controller.prompt
	);

	return router;
}
