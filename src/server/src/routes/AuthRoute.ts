import { Router } from "express";
import AuthController from "../controllers/AuthController.ts";
import ValidatorMiddleware from "../middleware/ValidatorMiddleware.ts";
import { HTTPMethod } from "../enums/HTTPMethod.ts";

const router: Router = Router();

router.all('/register',
	ValidatorMiddleware.validateMethod([HTTPMethod.POST]),
	ValidatorMiddleware.validateContentType,
	AuthController.register
);

router.all('/login',
	ValidatorMiddleware.validateMethod([HTTPMethod.POST]),
	ValidatorMiddleware.validateContentType,
	AuthController.login
);

export default router;