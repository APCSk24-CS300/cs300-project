import { ServiceResponse } from "../types/ServiceResponse.ts";

// retryAfter is in seconds; caller should also set the Retry-After header to the same value
export function generate429Response(retryAfter: number, 
                                    message: string = `Too many requests, 
                                                        please try again in ${retryAfter} seconds`): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 429;
	response.payload = { message: message };

	return response;
}
