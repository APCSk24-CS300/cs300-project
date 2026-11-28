import { Router } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { HubController } from '../controllers/HubController.ts';
import ValidatorMiddleware from '../middleware/ValidatorMiddleware.ts';
import { HTTPMethod } from '../enums/HTTPMethod.ts';

export interface HubRouteMiddleware {
	requirePermission: (permissionCode: string) => RequestHandler
}

/** Read permission for the hub (every role) and manage permission for its administration (administrator). */
export const HUB_READ = 'hub.services.read';
export const HUB_MANAGE = 'hub.services.manage';

/** Checks Content-Type only for methods that carry a body. */
function jsonBodyFor(methods: string[]): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) =>
		methods.includes(req.method) ? ValidatorMiddleware.validateContentType(req, res, next) : next();
}

/**
 * Hub routes, mounted at /api/v1/hub. Check order: method, token, permission, controller.
 * specs/004-university-service-hub/contracts/hub-api.md
 */
export function createHubRoute(controller: HubController, mw: HubRouteMiddleware): Router {
	const router: Router = Router();

	router.all('/services',
		ValidatorMiddleware.validateMethod([HTTPMethod.GET]),
		ValidatorMiddleware.validateAccessToken,
		mw.requirePermission(HUB_READ),
		controller.list
	);

	router.all('/services/:serviceId',
		ValidatorMiddleware.validateMethod([HTTPMethod.GET]),
		ValidatorMiddleware.validateAccessToken,
		mw.requirePermission(HUB_READ),
		controller.get
	);

	return router;
}

/**
 * Service-link administration, mounted at /api/v1/admin/services.
 * Check order: method, token, permission, content type (POST/PATCH), controller.
 */
export function createAdminServicesRoute(controller: HubController, mw: HubRouteMiddleware): Router {
	const router: Router = Router();

	router.all('/',
		ValidatorMiddleware.validateMethod([HTTPMethod.GET, HTTPMethod.POST]),
		ValidatorMiddleware.validateAccessToken,
		mw.requirePermission(HUB_MANAGE),
		jsonBodyFor([HTTPMethod.POST]),
		(req: Request, res: Response) => req.method === HTTPMethod.POST ? controller.create(req, res) : controller.adminList(req, res)
	);

	router.all('/:serviceId',
		ValidatorMiddleware.validateMethod([HTTPMethod.PATCH, HTTPMethod.DELETE]),
		ValidatorMiddleware.validateAccessToken,
		mw.requirePermission(HUB_MANAGE),
		jsonBodyFor([HTTPMethod.PATCH]),
		(req: Request, res: Response) => req.method === HTTPMethod.PATCH ? controller.update(req, res) : controller.deactivate(req, res)
	);

	return router;
}
