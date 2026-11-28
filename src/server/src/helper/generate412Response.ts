import { ServiceResponse } from "../types/ServiceResponse.ts";

// 412 Precondition Failed: the If-Match version is not the current one; the client must reload.
// details: e.g. { currentVersion: 4 }
export function generate412Response(message: string = 'The resource was changed by someone else, reload it and try again',
                                    details?: unknown): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 412;
	response.payload = { message: message };
	if (details !== undefined) {
		response.payload.data = { details };
	}

	return response;
}
