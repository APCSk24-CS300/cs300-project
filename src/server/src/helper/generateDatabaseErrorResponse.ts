import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generateDatabaseErrorResponse(err: unknown): ServiceResponse {
	if (err instanceof Error) {
		const response: ServiceResponse = new ServiceResponse;
		response.success = false;
		response.statusCode = 500;
		response.payload = {
			message: 'The database is cooked. Good night',
			data: err.toString()
		};
		return response;
	} else {
		const response: ServiceResponse = new ServiceResponse;
		response.success = false;
		response.statusCode = 500;
		response.payload = {
			message: 'What the fuck bro even the ERROR is cooked??????',
		};
		return response;
	}
}