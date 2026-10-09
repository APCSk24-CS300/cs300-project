import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate200Response(data: unknown): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = true,
	response.statusCode = 200,
	response.payload = {
		message: 'OK',
		data
	};
	
	return response;
}