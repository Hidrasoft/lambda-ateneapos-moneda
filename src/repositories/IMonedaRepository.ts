import { MonedaRequestDTO, MonedaDTO, UpdateMonedaRequestDTO } from './dtos/MonedaDTO';
import { PaginationParams } from '../domain/models/MonedaDomain';

export interface PaginatedResult<T> {
  data: T[];
  totalRecords: number;
}

export interface IMonedaRepository {
  createMoneda(data: MonedaRequestDTO): Promise<MonedaDTO>;
  getMonedaById(monedaId: number): Promise<MonedaDTO | null>;
  listAllMonedas(): Promise<MonedaDTO[]>;
  listMonedasPaginated(pagination: PaginationParams): Promise<PaginatedResult<MonedaDTO>>;
  updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<MonedaDTO | null>;
  deleteMoneda(monedaId: number): Promise<MonedaDTO | null>;
  checkMonedaExistsByIso(codigoIso: string, excludeId?: number): Promise<boolean>;
}
