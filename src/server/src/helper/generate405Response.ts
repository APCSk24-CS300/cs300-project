import { ServiceResponse } from "../types/ServiceResponse.ts";

// caller should also set the Allow header, e.g. res.set('Allow', allowedMethods.join(', '))
export function generate405Response(reqMethod: string, allowedMethods: string[] = []): ServiceResponse {
	const response: ServiceResponse = new ServiceResponse;
	response.success = false;
	response.statusCode = 405;
	response.payload = { message: `${reqMethod} method is not allowed on this route` };
	response.payload.data = { allowedMethods };

	return response;
}
