import { ServiceResponse } from "../types/ServiceResponse.ts";

// caller should also set the WWW-Authenticate header
export function generate401Response(message: string = 'Authentication is required or the token is invalid'): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 401;
	response.payload = { message: message };

	return response;
}
