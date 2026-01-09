import { MonedaDTO } from '../../repositories/dtos/MonedaDTO';
import { Moneda } from '../models/MonedaDomain';

export class MonedaMapper {

  /**
   * Transformar MonedaDTO (snake_case de BD) a Moneda (camelCase de dominio)
   */
  static toDomain(dto: MonedaDTO): Moneda {
    return {
      monedaId: dto.moneda_id,
      codigoIso: dto.codigo_iso,
      nombre: dto.nombre,
      simbolo: dto.simbolo,
      decimales: dto.decimales,
      activo: dto.activo
    };
  }

  /**
   * Transformar array de DTOs a array de modelos de dominio
   */
  static toDomainList(dtos: MonedaDTO[]): Moneda[] {
    return dtos.map(dto => this.toDomain(dto));
  }
}
