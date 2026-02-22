import {
  SwaggerSuccessResponse,
  SwaggerErrorResponse,
  SwaggerPaginatedResponse,
  SwaggerResponseHeaders,
  SwaggerMessageResponse,
  SwaggerErrorItem
} from './swaggerTypes';

export class SwaggerResponseBuilder {

  /**
   * Construir respuesta exitosa en formato Swagger
   */
  static buildSuccessResponse<T>(
    statusCode: number,
    data: T,
    messageUuid: string,
    requestAppId: string,
    responseCode: string = '0000',
    responseMessage: string = 'Success',
    responseDetails: string = 'Operation completed successfully'
  ): SwaggerSuccessResponse<T> {

    const headers: SwaggerResponseHeaders = {
      httpStatusCode: statusCode,
      httpStatusDesc: this.getStatusDescription(statusCode),
      messageUuid: messageUuid,
      requestDatetime: new Date().toISOString(),
      requestAppId: requestAppId
    };

    const messageResponse: SwaggerMessageResponse = {
      responseCode,
      responseMessage,
      responseDetails
    };

    return {
      headers,
      messageResponse,
      data
    };
  }

  /**
   * Construir respuesta de error en formato Swagger
   */
  static buildErrorResponse(
    statusCode: number,
    errors: SwaggerErrorItem[],
    messageUuid: string,
    requestAppId: string,
    responseCode?: string,
    responseMessage?: string,
    responseDetails?: string
  ): SwaggerErrorResponse {

    const headers: SwaggerResponseHeaders = {
      httpStatusCode: statusCode,
      httpStatusDesc: this.getStatusDescription(statusCode),
      messageUuid: messageUuid,
      requestDatetime: new Date().toISOString(),
      requestAppId: requestAppId
    };

    const messageResponse: SwaggerMessageResponse = {
      responseCode: responseCode || `0${statusCode}`,
      responseMessage: responseMessage || this.getDefaultErrorMessage(statusCode),
      responseDetails: responseDetails || this.getDefaultErrorDetails(statusCode)
    };

    return {
      headers,
      messageResponse,
      errors
    };
  }

  /**
   * Obtener descripción del código HTTP
   */
  private static getStatusDescription(statusCode: number): string {
    const statusDescriptions: Record<number, string> = {
      200: 'OK',
      201: 'CREATED',
      400: 'BAD_REQUEST',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    };

    return statusDescriptions[statusCode] || 'UNKNOWN';
  }

  /**
   * Obtener mensaje de error por defecto
   */
  private static getDefaultErrorMessage(statusCode: number): string {
    const errorMessages: Record<number, string> = {
      400: 'Bad Request',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      415: 'Unsupported Media Type',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };

    return errorMessages[statusCode] || 'Error';
  }

  /**
   * Obtener detalles de error por defecto
   */
  private static getDefaultErrorDetails(statusCode: number): string {
    const errorDetails: Record<number, string> = {
      400: 'Invalid or malformed request data',
      404: 'Resource not found',
      405: 'Operation not allowed for this endpoint',
      409: 'Resource already exists or violates unique constraint',
      415: 'Content-Type must be application/json',
      500: 'Unexpected error in server execution',
      502: 'Upstream service error',
      503: 'Service temporarily unavailable'
    };

    return errorDetails[statusCode] || 'An error occurred';
  }

  /**
   * Construir respuesta paginada en formato Swagger
   */
  static buildPaginatedResponse<T>(
    statusCode: number,
    data: T,
    pagination: {
      totalElement: number;
      pageSize: number;
      pageNumber: number;
      hasMoreElements: boolean;
    },
    messageUuid: string,
    requestAppId: string,
    responseCode: string = '0000',
    responseMessage: string = 'Success',
    responseDetails: string = 'Operation completed successfully'
  ): SwaggerPaginatedResponse<T> {

    const headers: SwaggerResponseHeaders = {
      httpStatusCode: statusCode,
      httpStatusDesc: this.getStatusDescription(statusCode),
      messageUuid: messageUuid,
      requestDatetime: new Date().toISOString(),
      requestAppId: requestAppId
    };

    const messageResponse: SwaggerMessageResponse = {
      responseCode,
      responseMessage,
      responseDetails
    };

    return {
      headers,
      messageResponse,
      data,
      pagination
    };
  }

  /**
   * Construir error item
   */
  static buildErrorItem(errorCode: string, errorDetail: string): SwaggerErrorItem {
    return {
      errorCode,
      errorDetail
    };
  }
}
