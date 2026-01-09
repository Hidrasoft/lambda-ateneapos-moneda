import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ALLOWED_HEADERS_VALUES } from './core/utils/Constans';
import { MonedaController } from './controller/MonedaController';
import { MonedaBL } from './domain/MonedaBL';
import { MonedaRepository } from './repositories/MonedaRepository';
import { MonedaRequestDTO } from './repositories/dtos/MonedaDTO';
import { SwaggerResponseBuilder } from './core/common/SwaggerResponseBuilder';

/**
 * Lambda Handler para API de Monedas
 * Maneja todos los endpoints CRUD de monedas siguiendo el contrato Swagger
 */
export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const path = event.path;
        const method = event.httpMethod;

        // Extraer headers requeridos por Swagger
        const messageUuid = event.headers?.['message-uuid'] || event.headers?.['Message-Uuid'] || '';
        const requestAppId = event.headers?.['request-app-id'] || event.headers?.['Request-App-Id'] || '';

        // Validar headers requeridos
        if (!messageUuid || !requestAppId) {
            const errors = [
                SwaggerResponseBuilder.buildErrorItem(
                    'E000',
                    'Headers requeridos: message-uuid y request-app-id'
                )
            ];

            const errorResponse = SwaggerResponseBuilder.buildErrorResponse(
                400,
                errors,
                messageUuid || 'unknown',
                requestAppId || 'unknown'
            );

            return {
                statusCode: 400,
                headers: {
                    'Content-Type': ALLOWED_HEADERS_VALUES.CONTENT_TYPE,
                    'Access-Control-Allow-Headers': ALLOWED_HEADERS_VALUES.ALLOWED_HEADERS,
                    'Access-Control-Allow-Origin': ALLOWED_HEADERS_VALUES.ALLOW_ORIGIN,
                    'Access-Control-Allow-Methods': ALLOWED_HEADERS_VALUES.ALLOWED_METHODS,
                },
                body: JSON.stringify(errorResponse)
            };
        }

        // Instanciar controller de Moneda con DI
        const monedaController = new MonedaController(
            new MonedaBL(
                new MonedaRepository()
            )
        );

        // POST /v1/pos/monedas - Crear moneda
        if (method === 'POST' && path === '/v1/pos/monedas') {
            const body: MonedaRequestDTO = JSON.parse(event.body || '{}');
            return await monedaController.createMoneda(body, messageUuid, requestAppId);
        }

        // GET /v1/pos/monedas - Listar todas las monedas
        if (method === 'GET' && path === '/v1/pos/monedas') {
            return await monedaController.listAllMonedas(messageUuid, requestAppId);
        }

        // GET /v1/pos/monedas/{monedaId} - Consultar moneda por ID
        if (method === 'GET' && path.match(/^\/v1\/pos\/monedas\/\d+$/)) {
            const monedaId = parseInt(event.pathParameters?.monedaId || '0');
            return await monedaController.getMonedaById(monedaId, messageUuid, requestAppId);
        }

        // PUT /v1/pos/monedas/{monedaId} - Actualizar moneda
        if (method === 'PUT' && path.match(/^\/v1\/pos\/monedas\/\d+$/)) {
            const monedaId = parseInt(event.pathParameters?.monedaId || '0');
            const body: MonedaRequestDTO = JSON.parse(event.body || '{}');
            return await monedaController.updateMoneda(monedaId, body, messageUuid, requestAppId);
        }

        // DELETE /v1/pos/monedas/{monedaId} - Eliminar moneda
        if (method === 'DELETE' && path.match(/^\/v1\/pos\/monedas\/\d+$/)) {
            const monedaId = parseInt(event.pathParameters?.monedaId || '0');
            return await monedaController.deleteMoneda(monedaId, messageUuid, requestAppId);
        }

        // Si no coincide con ninguna ruta
        return {
            statusCode: 404,
            headers: {
                'Content-Type': ALLOWED_HEADERS_VALUES.CONTENT_TYPE,
                'Access-Control-Allow-Headers': ALLOWED_HEADERS_VALUES.ALLOWED_HEADERS,
                'Access-Control-Allow-Origin': ALLOWED_HEADERS_VALUES.ALLOW_ORIGIN,
                'Access-Control-Allow-Methods': ALLOWED_HEADERS_VALUES.ALLOWED_METHODS,
            },
            body: JSON.stringify({
                error: 'Endpoint not found',
                path: path,
                method: method
            })
        };

    } catch (e) {
        console.error('Error en lambdaHandler:', e);

        // Respuesta de error genérica
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ALLOWED_HEADERS_VALUES.CONTENT_TYPE,
                'Access-Control-Allow-Headers': ALLOWED_HEADERS_VALUES.ALLOWED_HEADERS,
                'Access-Control-Allow-Origin': ALLOWED_HEADERS_VALUES.ALLOW_ORIGIN,
                'Access-Control-Allow-Methods': ALLOWED_HEADERS_VALUES.ALLOWED_METHODS,
            },
            body: JSON.stringify({
                error: 'Internal Server Error'
            })
        };
    }
};
