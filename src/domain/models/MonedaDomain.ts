import { SwaggerSuccessResponse, SwaggerErrorResponse, SwaggerPaginatedResponse } from '../../core/common/swaggerTypes';

// Modelo de dominio de Moneda (lo que se expone al cliente)
export interface Moneda {
  monedaId: number;
  codigoIso: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
}

// Parámetros de paginación (requeridos según contrato Swagger)
export interface PaginationParams {
  pageNumber: number;  // Número de página (inicia en 1)
  pageSize: number;    // Tamaño de página (1-500)
}

// Respuesta de paginación
export interface PaginationResponse {
  totalElement: number;
  pageSize: number;
  pageNumber: number;
  hasMoreElements: boolean;
}

// Respuesta para operación individual (GET, PUT, DELETE)
export type MonedaResponse = SwaggerSuccessResponse<Moneda>;

// Respuesta para creación (POST) - 201
export type MonedaCreatedResponse = SwaggerSuccessResponse<Moneda>;

// Data para listado (solo el arreglo de monedas)
export interface MonedaListData {
  monedas: Moneda[];
}

// Resultado de BL con paginación separada
export interface MonedaListResult {
  data: MonedaListData;
  pagination: PaginationResponse;
}

// Respuesta para listado (GET /monedas) con paginación fuera de data
export type MonedaListResponse = SwaggerPaginatedResponse<MonedaListData>;

// Respuesta de error
export type MonedaErrorResponse = SwaggerErrorResponse;
