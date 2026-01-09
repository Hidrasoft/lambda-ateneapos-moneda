// DTO de request (lo que recibe el endpoint)
export interface MonedaRequestDTO {
  codigoIso: string;
  nombre: string;
  simbolo: string;
  decimales?: number;
  activo?: boolean;
}

// DTO de respuesta de la BD
export interface MonedaDTO {
  moneda_id: number;
  codigo_iso: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
}

// DTO para actualización
export interface UpdateMonedaRequestDTO {
  monedaId: number;
  codigoIso: string;
  nombre: string;
  simbolo: string;
  decimales?: number;
  activo?: boolean;
}
