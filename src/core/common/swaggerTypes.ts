// Tipos para formato de respuesta Swagger

export interface SwaggerResponseHeaders {
  httpStatusCode: number;
  httpStatusDesc: string;
  messageUuid: string;
  requestDatetime: string;
  requestAppId: string;
}

export interface SwaggerMessageResponse {
  responseCode: string;
  responseMessage: string;
  responseDetails: string;
}

export interface SwaggerErrorItem {
  errorCode: string;
  errorDetail: string;
}

// Respuesta exitosa genérica
export interface SwaggerSuccessResponse<T> {
  headers: SwaggerResponseHeaders;
  messageResponse: SwaggerMessageResponse;
  data: T;
}

// Respuesta con paginación (paginación fuera de data)
export interface SwaggerPaginatedResponse<T> {
  headers: SwaggerResponseHeaders;
  messageResponse: SwaggerMessageResponse;
  data: T;
  pagination: {
    totalElement: number;
    pageSize: number;
    pageNumber: number;
    hasMoreElements: boolean;
  };
}

// Respuesta de error genérica
export interface SwaggerErrorResponse {
  headers: SwaggerResponseHeaders;
  messageResponse: SwaggerMessageResponse;
  errors: SwaggerErrorItem[];
}

// Headers de request
export interface SwaggerRequestHeaders {
  'message-uuid': string;
  'request-app-id': string;
  'content-type'?: string;
}
