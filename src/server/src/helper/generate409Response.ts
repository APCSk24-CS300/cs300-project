import { ServiceResponse } from "../types/ServiceResponse.ts";

// details: e.g. which field clashed, like { field: 'email' }
export function generate409Response(message: string = 'The request conflicts with the current state of the resource', 
                                    details?: unknown): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 409;
	response.payload = { message: message };
	if (details !== undefined) {
		response.payload.data = { details };
	}

	return response;
}
