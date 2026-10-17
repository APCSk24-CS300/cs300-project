import type { Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../types/ServiceResponse.ts';

export const nonexistentRouteCallback = (req: Request, res: Response, next: NextFunction) => {
	const response = new ServiceResponse;
	response.success = false;
	response.statusCode = 404;
	response.payload = {
		message: `${req.originalUrl} not found`
	};

	res.status(response.statusCode).json(response.get());
}