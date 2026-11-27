import { Router } from 'express';
import type { ProfileController } from '../controllers/ProfileController.ts';
import ValidatorMiddleware from '../middleware/ValidatorMiddleware.ts';
import { HTTPMethod } from '../enums/HTTPMethod.ts';

export function createProfileRoute(controller: ProfileController): Router {
	const router = Router();

	router.all('/', ValidatorMiddleware.validateMethod([HTTPMethod.GET, HTTPMethod.PATCH]));
	router.get('/', ValidatorMiddleware.validateAccessToken, controller.getProfile);
	router.patch(
		'/',
		ValidatorMiddleware.validateAccessToken,
		ValidatorMiddleware.validateContentType,
		controller.updateProfile
	);

	return router;
}
