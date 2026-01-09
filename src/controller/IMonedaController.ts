import { APIGatewayProxyResult } from 'aws-lambda';
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';

export interface IMonedaController {
  createMoneda(
    data: MonedaRequestDTO,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult>;

  getMonedaById(
    monedaId: number,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult>;

  listAllMonedas(
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult>;

  updateMoneda(
    monedaId: number,
    data: MonedaRequestDTO,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult>;

  deleteMoneda(
    monedaId: number,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult>;
}
