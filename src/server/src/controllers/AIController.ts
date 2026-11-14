import type { NextFunction, Request, Response } from 'express';
import { AIService } from '../services/AIService.ts';
import { validatePromptRequest } from '../helper/validatePromptRequest.ts';
import { generate400Response } from '../helper/generate400Response.ts';

/** HTTP handling for the AI endpoint: validate the body, call AIService, send the response. */
export class AIController {
	private readonly service: AIService;

	constructor(service: AIService) {
		this.service = service;
	}

	// arrow function so `this` still works when passed to router.all()
	prompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const validation = validatePromptRequest(req.body);
		if (!validation.ok) {
			const response = generate400Response('Invalid prompt request', validation.details);
			return void res.status(response.statusCode).json(response.get());
		}

		const user = res.locals.user as { sub?: string } | undefined;
		const userId = user?.sub ?? req.ip ?? 'unknown';
		const { response, retryAfterSeconds } = await this.service.prompt(validation.value, userId);
		if (retryAfterSeconds !== undefined) {
			res.set('Retry-After', String(retryAfterSeconds));
		}
		return void res.status(response.statusCode).json(response.get());
	}
}
