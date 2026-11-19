import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { AIController } from '../controllers/AIController.ts';
import ValidatorMiddleware from '../middleware/ValidatorMiddleware.ts';
import { HTTPMethod } from '../enums/HTTPMethod.ts';

export function createAIRoute(controller: AIController, rateLimit: RequestHandler): Router {
	const router: Router = Router();

	router.all('/prompt',
		ValidatorMiddleware.validateMethod([HTTPMethod.POST]),
		ValidatorMiddleware.validateAccessToken,
		ValidatorMiddleware.validateContentType,
		rateLimit,
		controller.prompt
	);

	return router;
}
