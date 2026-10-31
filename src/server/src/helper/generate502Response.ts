import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate502Response(): ServiceResponse {
    const response: ServiceResponse = new ServiceResponse;
    response.success = false;
    response.statusCode = 502;
    response.payload = {
        message: 'Bad Gateway',
    };
    
    return response;
}