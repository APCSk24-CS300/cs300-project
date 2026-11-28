import { Router } from 'express';
import type { ProfileController } from '../controllers/ProfileController.ts';
import type { PasswordController } from '../controllers/PasswordController.ts';
import ValidatorMiddleware from '../middleware/ValidatorMiddleware.ts';
import { HTTPMethod } from '../enums/HTTPMethod.ts';

export function createProfileRoute(
	controller: ProfileController,
	passwordController: PasswordController
): Router {
	const router = Router();

	router.all('/', ValidatorMiddleware.validateMethod([HTTPMethod.GET, HTTPMethod.PATCH]));
	router.get('/', ValidatorMiddleware.validateAccessToken, controller.getProfile);
	router.patch(
		'/',
		ValidatorMiddleware.validateAccessToken,
		ValidatorMiddleware.validateContentType,
		controller.updateProfile
	);
	router.all('/password', ValidatorMiddleware.validateMethod([HTTPMethod.PATCH]));
	router.patch(
		'/password',
		ValidatorMiddleware.validateAccessToken,
		ValidatorMiddleware.validateContentType,
		passwordController.changePassword
	);

	return router;
}
