import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate403Response(message: string = 'You do not have permission to access this resource'): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 403;
	response.payload = { message: message };

	return response;
}
