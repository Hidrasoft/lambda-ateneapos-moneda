import { HEADER_NULL, HEADER_UNDEFINED } from '../utils/Constans';
interface HttpRequest {
    rawPath: string;
    headers: Headers | typeof HEADER_NULL;
    pathParameters?: PathParameters;
    queryStringParameters?: QueryStringParameters;
    body?: string;
}

interface HttpResult {
    statusCode: number;
    body: string;
}

interface Headers {
    [name: string]: string | typeof HEADER_UNDEFINED;
}

interface PathParameters {
    [name: string]: string | undefined;
}

interface QueryStringParameters {
    [name: string]: string | undefined;
}

export type APIResponse = HttpResult;
export type APIRequest = HttpRequest;
