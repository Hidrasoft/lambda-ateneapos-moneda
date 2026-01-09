import { IMonedaRepository } from './IMonedaRepository';
import { MonedaRequestDTO, MonedaDTO } from './dtos/MonedaDTO';
import { mysqlClient } from '../core/utils/DatabaseManager';
import { QUERIES } from '../core/utils/Constans';

export class MonedaRepository implements IMonedaRepository {

  /**
   * Crear una nueva moneda
   */
  async createMoneda(data: MonedaRequestDTO): Promise<MonedaDTO> {
    // Valores por defecto
    const decimales = data.decimales ?? 2;
    const activo = data.activo ?? true;

    // Ejecutar INSERT y retornar el registro creado
    const result = await mysqlClient.query(
      QUERIES.CREATE_MONEDA,
      [data.codigoIso, data.nombre, data.simbolo, decimales, activo]
    );

    return result.rows[0] as MonedaDTO;
  }

  /**
   * Obtener moneda por ID
   */
  async getMonedaById(monedaId: number): Promise<MonedaDTO | null> {
    const result = await mysqlClient.query(
      QUERIES.GET_MONEDA_BY_ID,
      [monedaId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as MonedaDTO;
  }

  /**
   * Listar todas las monedas
   */
  async listAllMonedas(): Promise<MonedaDTO[]> {
    const result = await mysqlClient.query(QUERIES.LIST_ALL_MONEDAS);
    return result.rows as MonedaDTO[];
  }

  /**
   * Actualizar moneda existente
   */
  async updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<MonedaDTO | null> {
    // Valores por defecto
    const decimales = data.decimales ?? 2;
    const activo = data.activo ?? true;

    // Ejecutar UPDATE y retornar el registro actualizado
    const result = await mysqlClient.query(
      QUERIES.UPDATE_MONEDA,
      [data.codigoIso, data.nombre, data.simbolo, decimales, activo, monedaId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as MonedaDTO;
  }

  /**
   * Eliminar moneda (retorna la data antes de eliminar)
   */
  async deleteMoneda(monedaId: number): Promise<MonedaDTO | null> {
    // Ejecutar DELETE y retornar el registro eliminado
    const result = await mysqlClient.query(
      QUERIES.DELETE_MONEDA,
      [monedaId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as MonedaDTO;
  }

  /**
   * Verificar si ya existe una moneda con el código ISO
   * (excluyendo opcionalmente un ID específico para actualizaciones)
   */
  async checkMonedaExistsByIso(codigoIso: string, excludeId: number = 0): Promise<boolean> {
    const result = await mysqlClient.query(
      QUERIES.CHECK_MONEDA_EXISTS_BY_ISO,
      [codigoIso, excludeId]
    );

    const count = parseInt(result.rows[0]?.count || '0');
    return count > 0;
  }
}
