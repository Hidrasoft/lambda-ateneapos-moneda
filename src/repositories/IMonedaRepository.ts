import { MonedaRequestDTO, MonedaDTO, UpdateMonedaRequestDTO } from './dtos/MonedaDTO';

export interface IMonedaRepository {
  createMoneda(data: MonedaRequestDTO): Promise<MonedaDTO>;
  getMonedaById(monedaId: number): Promise<MonedaDTO | null>;
  listAllMonedas(): Promise<MonedaDTO[]>;
  updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<MonedaDTO | null>;
  deleteMoneda(monedaId: number): Promise<MonedaDTO | null>;
  checkMonedaExistsByIso(codigoIso: string, excludeId?: number): Promise<boolean>;
}
