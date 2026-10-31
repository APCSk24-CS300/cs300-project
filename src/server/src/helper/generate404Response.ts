import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate404Response(message: string = 'The requested resource was not found'): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 404;
	response.payload = { message: message };

	return response;
}
