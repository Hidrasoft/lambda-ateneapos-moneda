import { APIResponse } from './types';

export class ResponseWriter {
    
    public static objectResponse(statusCode: number, body: any): APIResponse {
        const response = {
            statusCode,
        } as APIResponse;

        if (body && typeof body === 'object') {
            console.log('entro aqui la api'+body);
            response.body = JSON.stringify(body);
            
        }

        return response;
    }
}