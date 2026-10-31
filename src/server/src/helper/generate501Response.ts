import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate501Response(): ServiceResponse {
    const response: ServiceResponse = new ServiceResponse;
    response.success = false;
    response.statusCode = 501;
    response.payload = {
        message: 'Not Implemented',
    };
    
    return response;
}