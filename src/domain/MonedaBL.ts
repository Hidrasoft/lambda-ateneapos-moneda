import { IMonedaBL } from './IMonedaBL';
import { IMonedaRepository } from '../repositories/IMonedaRepository';
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { Moneda, MonedaListData, MonedaListResult, PaginationParams } from './models/MonedaDomain';
import { MonedaMapper } from './mappers/MonedaMapper';

// Excepciones personalizadas
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class MonedaBL implements IMonedaBL {

  constructor(private monedaRepository: IMonedaRepository) {}

  /**
   * Crear una nueva moneda
   */
  async createMoneda(data: MonedaRequestDTO): Promise<Moneda> {
    // Validar datos de entrada
    this.validateMonedaData(data);

    // Verificar que no exista una moneda con el mismo código ISO
    const exists = await this.monedaRepository.checkMonedaExistsByIso(data.codigoIso);
    if (exists) {
      throw new ConflictError(`Ya existe una moneda con el código ISO: ${data.codigoIso}`);
    }

    // Crear la moneda
    const monedaDTO = await this.monedaRepository.createMoneda(data);

    // Transformar a modelo de dominio
    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Obtener moneda por ID
   */
  async getMonedaById(monedaId: number): Promise<Moneda> {
    // Validar ID
    if (!monedaId || monedaId <= 0) {
      throw new ValidationError('El monedaId debe ser un número positivo válido');
    }

    // Buscar moneda
    const monedaDTO = await this.monedaRepository.getMonedaById(monedaId);

    if (!monedaDTO) {
      throw new NotFoundError(`Moneda con ID ${monedaId} no encontrada`);
    }

    // Transformar a modelo de dominio
    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Listar todas las monedas (sin paginación)
   */
  async listAllMonedas(): Promise<MonedaListData> {
    // Obtener todas las monedas
    const monedasDTO = await this.monedaRepository.listAllMonedas();

    // Transformar a modelos de dominio
    const monedas = MonedaMapper.toDomainList(monedasDTO);

    return {
      monedas,
      pagination: {
        totalElement: monedas.length,
        pageSize: monedas.length,
        pageNumber: 1,
        hasMoreElements: false
      }
    };
  }

  /**
   * Listar monedas con paginación
   */
  async listMonedasPaginated(pagination: PaginationParams): Promise<MonedaListResult> {
    // Validar parámetros de paginación
    this.validatePaginationParams(pagination);

    // Obtener monedas paginadas
    const result = await this.monedaRepository.listMonedasPaginated(pagination);

    // Transformar a modelos de dominio
    const monedas = MonedaMapper.toDomainList(result.data);

    // Calcular si hay más elementos
    const totalPages = Math.ceil(result.totalRecords / pagination.pageSize);
    const hasMoreElements = pagination.pageNumber < totalPages;

    return {
      data: {
        monedas
      },
      pagination: {
        totalElement: result.totalRecords,
        pageSize: pagination.pageSize,
        pageNumber: pagination.pageNumber,
        hasMoreElements
      }
    };
  }

  /**
   * Validar parámetros de paginación
   */
  private validatePaginationParams(pagination: PaginationParams): void {
    // Validar pageNumber
    if (pagination.pageNumber === undefined || pagination.pageNumber === null) {
      throw new ValidationError('El parámetro pageNumber es requerido');
    }

    if (!Number.isInteger(pagination.pageNumber) || pagination.pageNumber < 1) {
      throw new ValidationError('El parámetro pageNumber debe ser un entero mayor o igual a 1');
    }

    // Validar pageSize
    if (pagination.pageSize === undefined || pagination.pageSize === null) {
      throw new ValidationError('El parámetro pageSize es requerido');
    }

    if (!Number.isInteger(pagination.pageSize) || pagination.pageSize < 1) {
      throw new ValidationError('El parámetro pageSize debe ser un entero mayor o igual a 1');
    }

    if (pagination.pageSize > 500) {
      throw new ValidationError('El parámetro pageSize no puede ser mayor a 500');
    }
  }

  /**
   * Actualizar moneda existente
   */
  async updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<Moneda> {
    // Validar ID
    if (!monedaId || monedaId <= 0) {
      throw new ValidationError('El monedaId debe ser un número positivo válido');
    }

    // Validar datos de entrada
    this.validateMonedaData(data);

    // Verificar que la moneda existe
    const existingMoneda = await this.monedaRepository.getMonedaById(monedaId);
    if (!existingMoneda) {
      throw new NotFoundError(`Moneda con ID ${monedaId} no encontrada`);
    }

    // Verificar que no exista otra moneda con el mismo código ISO
    const exists = await this.monedaRepository.checkMonedaExistsByIso(data.codigoIso, monedaId);
    if (exists) {
      throw new ConflictError(`Ya existe otra moneda con el código ISO: ${data.codigoIso}`);
    }

    // Actualizar la moneda
    const monedaDTO = await this.monedaRepository.updateMoneda(monedaId, data);

    if (!monedaDTO) {
      throw new NotFoundError(`No se pudo actualizar la moneda con ID ${monedaId}`);
    }

    // Transformar a modelo de dominio
    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Eliminar moneda (retorna la data eliminada)
   */
  async deleteMoneda(monedaId: number): Promise<Moneda> {
    // Validar ID
    if (!monedaId || monedaId <= 0) {
      throw new ValidationError('El monedaId debe ser un número positivo válido');
    }

    // Eliminar y obtener la data eliminada
    const monedaDTO = await this.monedaRepository.deleteMoneda(monedaId);

    if (!monedaDTO) {
      throw new NotFoundError(`Moneda con ID ${monedaId} no encontrada`);
    }

    // Transformar a modelo de dominio
    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Validar datos de moneda
   */
  private validateMonedaData(data: MonedaRequestDTO): void {
    // Validar código ISO
    if (!data.codigoIso || data.codigoIso.trim().length === 0) {
      throw new ValidationError('El campo codigoIso es requerido');
    }

    if (data.codigoIso.length !== 3) {
      throw new ValidationError('El codigoIso debe tener exactamente 3 caracteres (ej: COP, USD, EUR)');
    }

    // Convertir a mayúsculas para validación
    const codigoIsoUpper = data.codigoIso.toUpperCase();
    if (!/^[A-Z]{3}$/.test(codigoIsoUpper)) {
      throw new ValidationError('El codigoIso debe contener solo letras mayúsculas (ej: COP, USD, EUR)');
    }

    // Actualizar el valor con mayúsculas
    data.codigoIso = codigoIsoUpper;

    // Validar nombre
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new ValidationError('El campo nombre es requerido');
    }

    if (data.nombre.length > 50) {
      throw new ValidationError('El nombre no puede exceder 50 caracteres');
    }

    // Validar símbolo
    if (!data.simbolo || data.simbolo.trim().length === 0) {
      throw new ValidationError('El campo simbolo es requerido');
    }

    if (data.simbolo.length > 10) {
      throw new ValidationError('El simbolo no puede exceder 10 caracteres');
    }

    // Validar decimales (opcional, pero si viene debe ser válido)
    if (data.decimales !== undefined) {
      if (data.decimales < 0 || data.decimales > 10) {
        throw new ValidationError('El campo decimales debe estar entre 0 y 10');
      }
    }

    // Validar activo (opcional, pero si viene debe ser booleano)
    if (data.activo !== undefined && typeof data.activo !== 'boolean') {
      throw new ValidationError('El campo activo debe ser un valor booleano (true o false)');
    }
  }
}
