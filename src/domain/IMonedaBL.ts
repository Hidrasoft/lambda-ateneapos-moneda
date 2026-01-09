import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { Moneda, MonedaListData } from './models/MonedaDomain';

export interface IMonedaBL {
  createMoneda(data: MonedaRequestDTO): Promise<Moneda>;
  getMonedaById(monedaId: number): Promise<Moneda>;
  listAllMonedas(): Promise<MonedaListData>;
  updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<Moneda>;
  deleteMoneda(monedaId: number): Promise<Moneda>;
}
