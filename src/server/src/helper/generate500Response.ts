import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate500Response(): ServiceResponse {
    const response: ServiceResponse = new ServiceResponse;
    response.success = false;
    response.statusCode = 500;
    response.payload = {
        message: 'Internal Server is cooked. Good night.',
    };
    
    return response;
}