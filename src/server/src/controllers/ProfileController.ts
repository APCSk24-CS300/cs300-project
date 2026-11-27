import type { Request, Response } from 'express';
import { generate401Response } from '../helper/generate401Response.ts';
import type { ProfileService } from '../services/ProfileService.ts';
import type { ServiceResponse } from '../types/ServiceResponse.ts';

type ProfileServicePort = Pick<ProfileService, 'getProfile' | 'updateProfile'>;

function getAuthenticatedUserId(response: Response): string | null {
	const user: unknown = response.locals.user;
	if (
		typeof user !== 'object' ||
		user === null ||
		!('sub' in user) ||
		typeof user.sub !== 'string' ||
		user.sub.trim() === ''
	) {
		return null;
	}

	return user.sub;
}

export class ProfileController {
	private readonly service: ProfileServicePort;

	constructor(service: ProfileServicePort) {
		this.service = service;
	}

	getProfile = async (request: Request, response: Response): Promise<void> => {
		const userId = getAuthenticatedUserId(response);
		if (!userId) {
			const unauthorized = generate401Response();
			return void response.status(unauthorized.statusCode)
				.set('WWW-Authenticate', 'Bearer realm="api"')
				.json(unauthorized.get());
		}

		const result: ServiceResponse = await this.service.getProfile(userId);
		return void response.status(result.statusCode).json(result.get());
	};

	updateProfile = async (request: Request, response: Response): Promise<void> => {
		const userId = getAuthenticatedUserId(response);
		if (!userId) {
			const unauthorized = generate401Response();
			return void response.status(unauthorized.statusCode)
				.set('WWW-Authenticate', 'Bearer realm="api"')
				.json(unauthorized.get());
		}

		const result: ServiceResponse = await this.service.updateProfile(userId, request.body);
		return void response.status(result.statusCode).json(result.get());
	};
}
