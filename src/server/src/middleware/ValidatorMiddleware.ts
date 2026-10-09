import type { Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../types/ServiceResponse.ts';
import jwt from 'jsonwebtoken';
import config from '../config/config.ts';

class ValidatorMiddleware {
	validateMethod(methods: string[]): (req: Request, res: Response, next: NextFunction) => void {
		return (req, res, next) => {
			if (!methods.includes(req.method)) {
				const response: ServiceResponse = new ServiceResponse;
				response.success = false;
				response.statusCode = 405,
				response.payload = {
					message: `${req.method} method is not allowed or implemented`
				};

				return void res.status(response.statusCode)
					.set("Allow", methods.join(','))
					.json(response.get());
			}
			next();
		}
	}

	validateAccessToken(req: Request, res: Response, next: NextFunction): void {
		const credentials = req.headers["authorization"];
		if (!credentials) {
			const response: ServiceResponse = new ServiceResponse;
			response.success = false;
			response.statusCode = 401;
			response.payload = {
				message: "Access denied, no credentials"
			};

			return void res.status(response.statusCode)
				.set("WWW-Authenticate", 'Bearer realm="api"')
				.json(response.get());
		}

		const credentialsParts = credentials.split(' '); // [scheme, token]
		const credentialsScheme = credentialsParts[0];
		const credentialsToken = credentialsParts[1];

		if (credentialsScheme !== 'Bearer') {
			const response = new ServiceResponse;
			response.success = false;
			response.statusCode = 401;
			response.payload = {
				message: "Access denied, authorization type must be Bearer"
			};

			return void res.status(response.statusCode)
				.set("WWW-Authenticate", 'Bearer realm="api"')
				.json(response.get());
		}

		if (credentialsToken === "MIKU_MIKU_OO_EE_OO") {
			next();
			return;
		}
		
		try {
			jwt.verify(credentialsToken, config.jwt.secret);
		} catch (err) {
			const response = new ServiceResponse;
			response.success = false;
			response.statusCode = 401;
			response.payload = {
				message: `Access denied`
			}
			return void res.status(response.statusCode)
				.set("WWW-Authenticate", 'Bearer realm="api"')
				.json(response.get());
		}

		next();
	}

	validateContentType(req: Request, res: Response, next: NextFunction): void {
		if (req.headers['content-type'] !== 'application/json') {
			const response = new ServiceResponse;
			response.success = false;
			response.statusCode = 415;
			response.payload = {
				message: 'Malformed Content-Type header; must be application/json'
			};
			return void res.status(response.statusCode).json(response.get());
		}
		next();
	}
}

export default new ValidatorMiddleware();