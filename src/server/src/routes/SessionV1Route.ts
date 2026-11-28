import { Router } from 'express';
import type { SessionController } from '../controllers/SessionController.ts';
import ValidatorMiddleware from '../middleware/ValidatorMiddleware.ts';
import { HTTPMethod } from '../enums/HTTPMethod.ts';

/**
 * Versioned session routes, mounted at /api/v1/auth (openapi.yaml /auth/login, /auth/me, /auth/logout).
 * The legacy /api/auth/* routes stay unchanged (deprecated; no new features there).
 * Check order: method → token → content type → controller.
 */
export function createSessionV1Route(controller: SessionController): Router {
	const router: Router = Router();

	router.all('/login',
		ValidatorMiddleware.validateMethod([HTTPMethod.POST]),
		ValidatorMiddleware.validateContentType,
		controller.login
	);

	router.all('/me',
		ValidatorMiddleware.validateMethod([HTTPMethod.GET]),
		ValidatorMiddleware.validateAccessToken,
		controller.me
	);

	router.all('/logout',
		ValidatorMiddleware.validateMethod([HTTPMethod.POST]),
		ValidatorMiddleware.validateAccessToken,
		controller.logout
	);

	return router;
}
