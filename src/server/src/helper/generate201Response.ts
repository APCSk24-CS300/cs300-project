import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate201Response(data?: unknown): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = true,
	response.statusCode = 201,
	response.payload = {
		message: 'OK',
		data
	};
	
	return response;
}