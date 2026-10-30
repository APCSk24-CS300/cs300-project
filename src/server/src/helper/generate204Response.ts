import { ServiceResponse } from "../types/ServiceResponse.ts";

export function generate204Response(): ServiceResponse {
    const response: ServiceResponse = new ServiceResponse;
    response.success = true;
    response.statusCode = 204;
    response.payload = {
        message: 'No Content',
    };
    
    return response;
}