import { ServiceResponse } from "../types/ServiceResponse.ts";

// details: e.g. a list of fields that failed validation
export function generate400Response(message: string = 'The request is invalid', details?: unknown): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 400;
	response.payload = { message: message };
	if (details !== undefined) {
		response.payload.data = { details };
	}

	return response;
}
