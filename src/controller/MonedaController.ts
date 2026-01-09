import { APIGatewayProxyResult } from 'aws-lambda';
import { IMonedaController } from './IMonedaController';
import { IMonedaBL } from '../domain/IMonedaBL';
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { SwaggerResponseBuilder } from '../core/common/SwaggerResponseBuilder';
import { ValidationError, NotFoundError, ConflictError } from '../domain/MonedaBL';
import { ALLOWED_HEADERS_VALUES } from '../core/utils/Constans';
import { PaginationParams } from '../domain/models/MonedaDomain';

export class MonedaController implements IMonedaController {

  constructor(private monedaBL: IMonedaBL) {}

  /**
   * POST /v1/pos/monedas - Crear moneda
   */
  async createMoneda(
    data: MonedaRequestDTO,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      // Llamar a la lógica de negocio
      const moneda = await this.monedaBL.createMoneda(data);

      // Construir respuesta exitosa (201 CREATED)
      const response = SwaggerResponseBuilder.buildSuccessResponse(
        201,
        moneda,
        messageUuid,
        requestAppId,
        '0000',
        'Success',
        'Resource created successfully'
      );

      return {
        statusCode: 201,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * GET /v1/pos/monedas/{monedaId} - Consultar moneda por ID
   */
  async getMonedaById(
    monedaId: number,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      // Llamar a la lógica de negocio
      const moneda = await this.monedaBL.getMonedaById(monedaId);

      // Construir respuesta exitosa (200 OK)
      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        moneda,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * GET /v1/pos/monedas - Listar monedas con paginación
   * Parámetros requeridos: pageNumber, pageSize
   */
  async listMonedas(
    pagination: PaginationParams,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      // Llamar a la lógica de negocio con paginación
      const data = await this.monedaBL.listMonedasPaginated(pagination);

      // Construir respuesta exitosa (200 OK)
      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        data,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * PUT /v1/pos/monedas/{monedaId} - Actualizar moneda
   */
  async updateMoneda(
    monedaId: number,
    data: MonedaRequestDTO,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      // Llamar a la lógica de negocio
      const moneda = await this.monedaBL.updateMoneda(monedaId, data);

      // Construir respuesta exitosa (200 OK)
      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        moneda,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * DELETE /v1/pos/monedas/{monedaId} - Eliminar moneda
   */
  async deleteMoneda(
    monedaId: number,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      // Llamar a la lógica de negocio (retorna la data eliminada)
      const moneda = await this.monedaBL.deleteMoneda(monedaId);

      // Construir respuesta exitosa (200 OK) con la data eliminada
      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        moneda,
        messageUuid,
        requestAppId,
        '0000',
        'Success',
        'Resource deleted successfully'
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(
    error: any,
    messageUuid: string,
    requestAppId: string
  ): APIGatewayProxyResult {
    console.error('Error in MonedaController:', error);

    // Determinar el tipo de error y construir respuesta apropiada
    if (error instanceof ValidationError) {
      // 400 BAD REQUEST
      const errors = [
        SwaggerResponseBuilder.buildErrorItem('E001', error.message)
      ];

      const response = SwaggerResponseBuilder.buildErrorResponse(
        400,
        errors,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 400,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };
    }

    if (error instanceof NotFoundError) {
      // 404 NOT FOUND
      const errors = [
        SwaggerResponseBuilder.buildErrorItem('E002', error.message)
      ];

      const response = SwaggerResponseBuilder.buildErrorResponse(
        404,
        errors,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 404,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };
    }

    if (error instanceof ConflictError) {
      // 409 CONFLICT
      const errors = [
        SwaggerResponseBuilder.buildErrorItem('E003', error.message)
      ];

      const response = SwaggerResponseBuilder.buildErrorResponse(
        409,
        errors,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 409,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };
    }

    // 500 INTERNAL SERVER ERROR (error no manejado)
    const errors = [
      SwaggerResponseBuilder.buildErrorItem(
        'E999',
        'Internal server error'
      )
    ];

    const response = SwaggerResponseBuilder.buildErrorResponse(
      500,
      errors,
      messageUuid,
      requestAppId
    );

    return {
      statusCode: 500,
      headers: this.getCorsHeaders(),
      body: JSON.stringify(response)
    };
  }

  /**
   * Obtener headers CORS
   */
  private getCorsHeaders(): Record<string, string> {
    return {
      'Content-Type': ALLOWED_HEADERS_VALUES.CONTENT_TYPE,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS_VALUES.ALLOWED_HEADERS,
      'Access-Control-Allow-Origin': ALLOWED_HEADERS_VALUES.ALLOW_ORIGIN,
      'Access-Control-Allow-Methods': ALLOWED_HEADERS_VALUES.ALLOWED_METHODS
    };
  }
}
