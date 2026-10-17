import type { Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../types/ServiceResponse.ts';

export const rootCallback = (req: Request, res: Response, next: NextFunction) => {
	const response: ServiceResponse = new ServiceResponse;
	response.success = true,
	response.statusCode = 200,
	response.payload = {
		message: 'CampusHub API root endpoint',
		data: null
	};

	return void res.status(response.statusCode).json(response.get());
}