import type { Request, Response } from 'express';
import type { PasswordService } from '../services/PasswordService.ts';

type PasswordServicePort = Pick<PasswordService, 'changePassword'>;

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

export class PasswordController {
	private readonly service: PasswordServicePort;

	constructor(service: PasswordServicePort) {
		this.service = service;
	}

	changePassword = async (request: Request, response: Response): Promise<void> => {
		const userId = getAuthenticatedUserId(response);
		if (!userId) {
			return void response
				.status(401)
				.set('WWW-Authenticate', 'Bearer realm="api"')
				.json({
					success: false,
					code: 'UNAUTHENTICATED',
					message: 'Authentication is required or the token is invalid'
				});
		}

		const result = await this.service.changePassword(userId, request.body);
		const apiResponse = response.status(result.statusCode);
		if (result.statusCode === 401) {
			apiResponse.set('WWW-Authenticate', 'Bearer realm="api"');
		}
		return void apiResponse.json(result.body);
	};
}
