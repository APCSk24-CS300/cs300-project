import type { Request, Response, NextFunction } from 'express';
import { ServiceResponse } from '../types/ServiceResponse.ts';

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
	console.error(err);

	const response = new ServiceResponse;
	response.success = false;
	response.statusCode = 500;
	response.payload = {
		message: "We are so cooked",
		data: err.toString()
	};

	return void res.status(response.statusCode).json(response.get());
}

export default errorHandler;