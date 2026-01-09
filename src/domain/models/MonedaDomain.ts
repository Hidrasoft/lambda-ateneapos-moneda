import { SwaggerSuccessResponse, SwaggerErrorResponse } from '../../core/common/swaggerTypes';

// Modelo de dominio de Moneda (lo que se expone al cliente)
export interface Moneda {
  monedaId: number;
  codigoIso: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
}

// Respuesta para operación individual (GET, PUT, DELETE)
export type MonedaResponse = SwaggerSuccessResponse<Moneda>;

// Respuesta para creación (POST) - 201
export type MonedaCreatedResponse = SwaggerSuccessResponse<Moneda>;

// Respuesta para listado (GET /monedas)
export interface MonedaListData {
  monedas: Moneda[];
}

export type MonedaListResponse = SwaggerSuccessResponse<MonedaListData>;

// Respuesta de error
export type MonedaErrorResponse = SwaggerErrorResponse;
