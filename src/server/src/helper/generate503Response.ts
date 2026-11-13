import { ServiceResponse } from '../types/ServiceResponse.ts';

// 503 Service Unavailable: the server is running but can't handle the request right now
// (e.g. the database is down). Optionally set the Retry-After header on the Express response.
export function generate503Response(message: string = 'The service is temporarily unavailable', details?: unknown): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 503;
	response.payload = { message: message };
	if (details !== undefined) { response.payload.data = { details }; }
	return response;
}