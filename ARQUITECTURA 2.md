# Arquitectura Lambda Moneda - Guía de Desarrollo

## Tabla de Contenidos
1. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
2. [Comunicación Entre Capas](#comunicación-entre-capas)
3. [Ejemplo Paso a Paso: Crear Cliente](#ejemplo-paso-a-paso-crear-cliente)
4. [Guía de Testing con SAM CLI](#guía-de-testing-con-sam-cli)
5. [Estructura de Archivos](#estructura-de-archivos)

---

## Diagrama de Arquitectura

### Vista General de Capas

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                          API GATEWAY                              ┃
┃                    POST /InfoEmojis                               ┃
┃                    Body: {"customerId": 1234}                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ APIGatewayProxyEvent
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 0: LAMBDA HANDLER                        📍 src/app.ts     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  export const lambdaHandler = async (event, context) => {        ┃
┃    const method = event.httpMethod;  // 'POST'                   ┃
┃    const body = JSON.parse(event.body);  // {customerId: 1234}   ┃
┃                                                                   ┃
┃    // 🔧 Dependency Injection Manual                             ┃
┃    const controller = new EmojisController(                      ┃
┃      new EmojisBL(                                               ┃
┃        new ListEmojisRepository()                                ┃
┃      )                                                            ┃
┃    );                                                             ┃
┃                                                                   ┃
┃    return await controller.listEmojisByCustomer(body);           ┃
┃  }                                                                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ StatusByCustomerDTO
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 1: CONTROLLER              📍 src/controller/              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  class EmojisController {                                        ┃
┃    constructor(private emojisBL: IEmojisBL) {}                   ┃
┃                                                                   ┃
┃    async listEmojisByCustomer(data) {                            ┃
┃      try {                                                        ┃
┃        const result = await this.emojisBL                        ┃
┃                           .listEmojisByCustomer(data);           ┃
┃                                                                   ┃
┃        return ResponseWriter.objectResponse(200, result);        ┃
┃      } catch (e) {                                               ┃
┃        return ResponseWriter.objectResponse(500, e);             ┃
┃      }                                                            ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  Responsabilidades:                                              ┃
┃  ✓ Orquestar peticiones HTTP                                    ┃
┃  ✓ Invocar Business Logic                                       ┃
┃  ✓ Formatear respuestas HTTP (200, 500)                         ┃
┃  ✗ NO contiene lógica de negocio                                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ StatusByCustomerDTO
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 2: BUSINESS LOGIC             📍 src/domain/               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  class EmojisBL {                                                ┃
┃    constructor(private repo: IListEmojisRepository) {}           ┃
┃                                                                   ┃
┃    async listEmojisByCustomer(data) {                            ┃
┃      // 1️⃣ Llamar al repositorio                                ┃
┃      const dtos = await this.repo                                ┃
┃                       .listEmojisByCustomer(data);               ┃
┃                                                                   ┃
┃      // 2️⃣ Aplicar transformaciones con Mapper                  ┃
┃      const domainModels = EmojisMapper                           ┃
┃                            .toDomainCustomer(dtos);              ┃
┃                                                                   ┃
┃      // 3️⃣ Construir respuesta de dominio                        ┃
┃      return {                                                     ┃
┃        data: domainModels,                                       ┃
┃        operation: OPERATION_SUCCESS_RESPONSE                     ┃
┃      };                                                           ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  ┌────────────────────────────────────────────────────┐          ┃
┃  │  MAPPERS (src/domain/mappers/)                    │          ┃
┃  ├────────────────────────────────────────────────────┤          ┃
┃  │  EmojisMapper.toDomainCustomer(dtos):             │          ┃
┃  │    return dtos.map(dto => ({                      │          ┃
┃  │      ...dto,                                       │          ┃
┃  │      bought: dayjs(dto.endDate).isAfter(dayjs())  │  ⚡ Lógica┃
┃  │    }))                                             │          ┃
┃  └────────────────────────────────────────────────────┘          ┃
┃                                                                   ┃
┃  Responsabilidades:                                              ┃
┃  ✓ Implementar reglas de negocio                                ┃
┃  ✓ Orquestar repositorios                                       ┃
┃  ✓ Aplicar transformaciones (DTOs → Domain Models)              ┃
┃  ✗ NO accede directamente a la BD                               ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ StatusByCustomerDTO
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 3: REPOSITORY            📍 src/repositories/              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  class ListEmojisRepository {                                    ┃
┃                                                                   ┃
┃    async listEmojisByCustomer(status) {                          ┃
┃      // 1️⃣ Obtener conexión del pool                            ┃
┃      const conn = await mysqlClient.getConnection();             ┃
┃                                                                   ┃
┃      try {                                                        ┃
┃        // 2️⃣ Ejecutar query con prepared statement              ┃
┃        const [rows] = await conn.query(                          ┃
┃          QUERIES.LIST_EMOJIS_BY_CUSTOMER,                        ┃
┃          [status.customerId]    // ⚡ Protección SQL Injection   ┃
┃        );                                                         ┃
┃                                                                   ┃
┃        // 3️⃣ Mapear a DTO                                        ┃
┃        return rows as LisEmojisByCustomerDTO[];                  ┃
┃                                                                   ┃
┃      } finally {                                                  ┃
┃        // 4️⃣ SIEMPRE liberar conexión                           ┃
┃        conn.release();                                           ┃
┃      }                                                            ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  ┌────────────────────────────────────────────────────┐          ┃
┃  │  DTOs (src/repositories/dtos/)                    │          ┃
┃  ├────────────────────────────────────────────────────┤          ┃
┃  │  interface LisEmojisByCustomerDTO {               │          ┃
┃  │    itemId: number;                                │          ┃
┃  │    nameItem: string;                              │          ┃
┃  │    price: number;                                 │          ┃
┃  │    purchaseDate: string;                          │          ┃
┃  │    endDate: string;       // ⚡ Estructura exacta │          ┃
┃  │    url: string;           //    de la BD          │          ┃
┃  │  }                                                 │          ┃
┃  └────────────────────────────────────────────────────┘          ┃
┃                                                                   ┃
┃  Responsabilidades:                                              ┃
┃  ✓ Ejecutar queries SQL                                         ┃
┃  ✓ Gestionar conexiones                                         ┃
┃  ✓ Mapear resultados a DTOs                                     ┃
┃  ✗ NO contiene lógica de negocio                                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ SQL Query
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 4: DATABASE              📍 src/core/utils/                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  DatabaseManager.ts:                                             ┃
┃  ─────────────────────────────────────────────────────           ┃
┃  export const mysqlClient = mysql.createPool({                   ┃
┃    host: 'db-game.c1g6mycog0un.me-south-1.rds...',              ┃
┃    database: 'db-game',                                          ┃
┃    user: 'admin',                                                ┃
┃    password: '***',                                              ┃
┃    connectionLimit: 10   // ⚡ Pool de conexiones                ┃
┃  });                                                             ┃
┃                                                                   ┃
┃  Constans.ts:                                                    ┃
┃  ─────────────────────────────────────────────────────           ┃
┃  enum QUERIES {                                                  ┃
┃    LIST_EMOJIS_BY_CUSTOMER = `                                   ┃
┃      SELECT i.itemId, i.nameItem, i.price, i.url,               ┃
┃             p.purchaseDate, p.endDate                            ┃
┃      FROM customer c, account a, purchaseItem p,                ┃
┃           item i, category ct                                    ┃
┃      WHERE ct.descriptionCategory = "Emojis"                     ┃
┃        AND c.customerId = ?       // ⚡ Prepared statement        ┃
┃        AND ct.categoryId = i.itemCategory                        ┃
┃        AND i.itemId = p.itemId                                   ┃
┃        AND a.accountId = p.accountId                             ┃
┃        AND c.customerId = a.accountCustomer                      ┃
┃      ORDER BY p.itemId                                           ┃
┃    `                                                             ┃
┃  }                                                                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                ▼
                    ┌───────────────────────┐
                    │   MySQL RDS Database  │
                    │   db-game             │
                    │   me-south-1          │
                    └───────────────────────┘
```

---

## Comunicación Entre Capas

### Flujo de Datos: Request → Response

```
REQUEST                                                          RESPONSE
────────                                                         ────────

POST /InfoEmojis                                        200 OK + JSON
Body: {"customerId": 1234}                             ┌──────────────┐
       │                                                │ {            │
       │                                                │   data: [...],
       ▼                                                │   operation  │
┌─────────────────┐                                     │ }            │
│  Lambda Handler │ ──┐                                 └──────────────┘
│  app.ts         │   │                                        ▲
└─────────────────┘   │                                        │
       │              │                                        │
       │ Parse body   │                                        │
       │              │                                        │
       ▼              │                                        │
StatusByCustomerDTO   │                              APIGatewayProxyResult
{ customerId: 1234 }  │                                        │
       │              │                                        │
       │              │                                        │
       ▼              │                                        │
┌─────────────────┐  │ DI                              ┌──────┴───────┐
│  Controller     │ ◀┘ new Controller(                 │ ResponseWriter
│  EmojisCtrl.ts  │      new BL(                       │ .objectResponse()
└─────────────────┘        new Repo()                  └──────────────┘
       │                 )                                     ▲
       │                )                                      │
       ▼                                                       │
  call BL method                                        EmojisDomainCustomer
       │                                                { data, operation }
       │                                                       │
       ▼                                                       │
┌─────────────────┐                                     ┌──────┴───────┐
│  Business Logic │                                     │  EmojisBL    │
│  EmojisBL.ts    │ ────────────────────────────────▶  │  return {... }
└─────────────────┘                                     └──────────────┘
       │                                                       ▲
       │ call repository                                      │
       ▼                                                       │
StatusByCustomerDTO                      LisEmojisByCustomerDTO[]
       │                                           │           │
       │                                           │  Mapper   │
       ▼                                           │  applies  │
┌─────────────────┐                                │  business │
│  Repository     │                                │  logic    │
│  ListEmojisRepo │ ───────────────────────────────┘           │
└─────────────────┘                                            │
       │                                                       │
       │ conn.query(QUERY, [customerId])                      │
       ▼                                                       │
  SQL Execution                                                │
       │                                                       │
       │                                                       │
       ▼                                                       │
┌─────────────────┐                                            │
│  MySQL RDS      │                                            │
│  Database       │ ───────────────────────────────────────────┘
└─────────────────┘        Raw rows as DTO[]
```

### Transformación de Datos por Capa

```
Capa               Input                    Output                    Tipo
─────              ─────                    ──────                    ────

Handler            APIGatewayProxyEvent     APIGatewayProxyResult     AWS Types
                   ↓
                   { body: '{"customerId": 1234}' }
                   ↓ JSON.parse

Controller         StatusByCustomerDTO      APIResponse               HTTP
                   { customerId: 1234 }     { statusCode, headers,
                   ↓                          body: JSON }

Business Logic     StatusByCustomerDTO      EmojisDomainCustomer      Domain
                   { customerId: 1234 }     { data: [...],
                   ↓                          operation: {...} }

Repository         StatusByCustomerDTO      LisEmojisByCustomerDTO[]  Data
                   { customerId: 1234 }     [{ itemId, nameItem,
                   ↓                          price, purchaseDate,
                                              endDate, url }]

Database           SQL Query + Params       Raw Rows                  SQL
                   [1234]                   ResultSet
```

---

## Ejemplo Paso a Paso: Crear Cliente

Vamos a crear una nueva lambda para **insertar un cliente** en la tabla `customer` de la BD.

### 📋 Requisitos

**Endpoint:** `POST /CreateCustomer`

**Body Request:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "data": {
    "customerId": 123,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "createdAt": "2026-01-07T10:30:00Z"
  },
  "operation": {
    "statusCode": 201,
    "status": "Success",
    "message": "Customer created successfully"
  }
}
```

---

### 🔧 PASO 1: Crear DTOs

**Archivo:** `src/repositories/dtos/CreateCustomerDTO.ts`

```typescript
// DTO de entrada (lo que recibe el endpoint)
export interface CreateCustomerRequestDTO {
  name: string;
  email: string;
  phone: string;
}

// DTO de respuesta (lo que devuelve la BD después del INSERT)
export interface CreateCustomerResponseDTO {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}
```

---

### 🔧 PASO 2: Agregar Query SQL en Constans.ts

**Archivo:** `src/core/utils/Constans.ts`

```typescript
export enum QUERIES {
  // ... queries existentes

  // Nueva query para crear cliente
  CREATE_CUSTOMER = `
    INSERT INTO customer (name, email, phone, createdAt)
    VALUES (?, ?, ?, NOW())
  `,

  // Query para obtener el cliente recién creado
  GET_CUSTOMER_BY_ID = `
    SELECT customerId, name, email, phone, createdAt
    FROM customer
    WHERE customerId = ?
  `
}

// Nuevo código HTTP para creación
export enum HttpStatus {
  OK = 200,
  CREATED = 201,  // ⭐ Agregar este
  BAD_REQUEST = 400,  // ⭐ Agregar este para validaciones
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// Nueva respuesta de éxito para CREATE
export const OPERATION_CREATED_RESPONSE = {
  statusCode: 201,
  status: "Success",
  message: "Customer created successfully"
};
```

---

### 🔧 PASO 3: Crear Repository

**Archivo:** `src/repositories/ICustomerRepository.ts`

```typescript
import { CreateCustomerRequestDTO, CreateCustomerResponseDTO } from './dtos/CreateCustomerDTO';

export interface ICustomerRepository {
  createCustomer(data: CreateCustomerRequestDTO): Promise<CreateCustomerResponseDTO>;
}
```

**Archivo:** `src/repositories/CustomerRepository.ts`

```typescript
import { ICustomerRepository } from './ICustomerRepository';
import { CreateCustomerRequestDTO, CreateCustomerResponseDTO } from './dtos/CreateCustomerDTO';
import { mysqlClient } from '../core/utils/DatabaseManager';
import { QUERIES } from '../core/utils/Constans';
import { ResultSetHeader } from 'mysql2';

export class CustomerRepository implements ICustomerRepository {

  async createCustomer(data: CreateCustomerRequestDTO): Promise<CreateCustomerResponseDTO> {
    const conn = await mysqlClient.getConnection();

    try {
      // 1️⃣ Ejecutar INSERT
      const [result] = await conn.query<ResultSetHeader>(
        QUERIES.CREATE_CUSTOMER,
        [data.name, data.email, data.phone]
      );

      // 2️⃣ Obtener el ID del registro insertado
      const customerId = result.insertId;

      // 3️⃣ Consultar el registro completo (para obtener createdAt generado)
      const [rows]: any = await conn.query(
        QUERIES.GET_CUSTOMER_BY_ID,
        [customerId]
      );

      // 4️⃣ Retornar el primer registro como DTO
      return rows[0] as CreateCustomerResponseDTO;

    } finally {
      // 5️⃣ SIEMPRE liberar la conexión
      conn.release();
    }
  }
}
```

---

### 🔧 PASO 4: Crear Modelo de Dominio

**Archivo:** `src/domain/models/CustomerDomain.ts`

```typescript
import { OPERATION_CREATED_RESPONSE } from '../../core/utils/Constans';

export interface CustomerDomain {
  data: CustomerModel;
  operation: typeof OPERATION_CREATED_RESPONSE;
}

export interface CustomerModel {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  // Campos calculados (si hay lógica de negocio)
  displayName?: string;  // Ejemplo: "Juan P."
}
```

---

### 🔧 PASO 5: Crear Mapper (opcional)

**Archivo:** `src/domain/mappers/CustomerMapper.ts`

```typescript
import { CreateCustomerResponseDTO } from '../../repositories/dtos/CreateCustomerDTO';
import { CustomerModel } from '../models/CustomerDomain';

export class CustomerMapper {

  static toDomain(dto: CreateCustomerResponseDTO): CustomerModel {
    return {
      customerId: dto.customerId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      createdAt: dto.createdAt,

      // 🔥 Lógica de negocio: crear displayName
      displayName: this.createDisplayName(dto.name)
    };
  }

  private static createDisplayName(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;

    return `${parts[0]} ${parts[1].charAt(0)}.`;  // "Juan P."
  }
}
```

---

### 🔧 PASO 6: Crear Business Logic

**Archivo:** `src/domain/ICustomerBL.ts`

```typescript
import { CreateCustomerRequestDTO } from '../repositories/dtos/CreateCustomerDTO';
import { CustomerDomain } from './models/CustomerDomain';

export interface ICustomerBL {
  createCustomer(data: CreateCustomerRequestDTO): Promise<CustomerDomain>;
}
```

**Archivo:** `src/domain/CustomerBL.ts`

```typescript
import { ICustomerBL } from './ICustomerBL';
import { ICustomerRepository } from '../repositories/ICustomerRepository';
import { CreateCustomerRequestDTO } from '../repositories/dtos/CreateCustomerDTO';
import { CustomerDomain } from './models/CustomerDomain';
import { CustomerMapper } from './mappers/CustomerMapper';
import { OPERATION_CREATED_RESPONSE } from '../core/utils/Constans';

export class CustomerBL implements ICustomerBL {

  constructor(private customerRepository: ICustomerRepository) {}

  async createCustomer(data: CreateCustomerRequestDTO): Promise<CustomerDomain> {

    // 🔥 Validaciones de negocio
    this.validateCustomerData(data);

    // 1️⃣ Llamar al repositorio
    const customerDTO = await this.customerRepository.createCustomer(data);

    // 2️⃣ Aplicar mapper
    const customerModel = CustomerMapper.toDomain(customerDTO);

    // 3️⃣ Construir respuesta de dominio
    return {
      data: customerModel,
      operation: OPERATION_CREATED_RESPONSE
    };
  }

  private validateCustomerData(data: CreateCustomerRequestDTO): void {
    // Validar nombre
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Customer name is required');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      throw new Error('Valid email is required');
    }

    // Validar teléfono
    if (!data.phone || data.phone.trim().length === 0) {
      throw new Error('Phone number is required');
    }
  }
}
```

---

### 🔧 PASO 7: Crear Controller

**Archivo:** `src/controller/ICustomerController.ts`

```typescript
import { APIResponse } from '../core/common/types';
import { CreateCustomerRequestDTO } from '../repositories/dtos/CreateCustomerDTO';

export interface ICustomerController {
  createCustomer(data: CreateCustomerRequestDTO): Promise<APIResponse>;
}
```

**Archivo:** `src/controller/CustomerController.ts`

```typescript
import { ICustomerController } from './ICustomerController';
import { ICustomerBL } from '../domain/ICustomerBL';
import { CreateCustomerRequestDTO } from '../repositories/dtos/CreateCustomerDTO';
import { ResponseWriter } from '../core/common/ResponseWriter';
import { HttpStatus } from '../core/utils/Constans';
import { APIResponse } from '../core/common/types';

export class CustomerController implements ICustomerController {

  constructor(private customerBL: ICustomerBL) {}

  async createCustomer(data: CreateCustomerRequestDTO): Promise<APIResponse> {
    try {
      // Llamar a la lógica de negocio
      const result = await this.customerBL.createCustomer(data);

      // Retornar con código 201 CREATED
      return ResponseWriter.objectResponse(HttpStatus.CREATED, result);

    } catch (error: any) {
      console.error('Error in CustomerController.createCustomer:', error);

      // Si es un error de validación, retornar 400 BAD REQUEST
      if (error.message.includes('required') || error.message.includes('Valid')) {
        return ResponseWriter.objectResponse(
          HttpStatus.BAD_REQUEST,
          {
            error: error.message,
            operation: {
              statusCode: 400,
              status: 'Error',
              message: 'Validation failed'
            }
          }
        );
      }

      // Otros errores: 500 INTERNAL SERVER ERROR
      return ResponseWriter.objectResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          error: 'Internal server error',
          operation: {
            statusCode: 500,
            status: 'Error',
            message: 'Failed to create customer'
          }
        }
      );
    }
  }
}
```

---

### 🔧 PASO 8: Integrar en Lambda Handler

**Archivo:** `src/app.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseWriter } from './core/common/ResponseWriter';
import { HttpStatus, ALLOWED_HEADERS_VALUES } from './core/utils/Constans';

// Controllers
import { EmojisController } from './controller/EmojisController';
import { CustomerController } from './controller/CustomerController';  // ⭐ NUEVO

// Business Logic
import { EmojisBL } from './domain/EmojisBL';
import { CustomerBL } from './domain/CustomerBL';  // ⭐ NUEVO

// Repositories
import { ListEmojisRepository } from './repositories/ListEmojisRepository';
import { CustomerRepository } from './repositories/CustomerRepository';  // ⭐ NUEVO

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // ========== ENDPOINT: POST /CreateCustomer ========== ⭐ NUEVO
    if (method === 'POST' && path === '/CreateCustomer') {
      // Parse body
      const body = JSON.parse(event.body || '{}');

      // Dependency Injection
      const controller = new CustomerController(
        new CustomerBL(
          new CustomerRepository()
        )
      );

      // Ejecutar
      const response = await controller.createCustomer(body);

      // Agregar CORS headers
      return {
        ...response,
        headers: ALLOWED_HEADERS_VALUES
      };
    }

    // ========== ENDPOINT: GET /InfoEmojis ==========
    if (method === 'GET' && path === '/InfoEmojis') {
      const { customerId } = event.queryStringParameters || {};

      const controller = new EmojisController(
        new EmojisBL(
          new ListEmojisRepository()
        )
      );

      const response = await controller.getListEmojis(Number(customerId));

      return {
        ...response,
        headers: ALLOWED_HEADERS_VALUES
      };
    }

    // ========== ENDPOINT: POST /InfoEmojis ==========
    if (method === 'POST' && path === '/InfoEmojis') {
      const body = JSON.parse(event.body || '{}');

      const controller = new EmojisController(
        new EmojisBL(
          new ListEmojisRepository()
        )
      );

      const response = await controller.listEmojisByCustomer(body);

      return {
        ...response,
        headers: ALLOWED_HEADERS_VALUES
      };
    }

    // No se encontró el endpoint
    return ResponseWriter.objectResponse(
      404,
      { error: 'Endpoint not found' }
    );

  } catch (error) {
    console.error('Lambda Handler Error:', error);

    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      headers: ALLOWED_HEADERS_VALUES,
      body: JSON.stringify({ error: 'Service unavailable' })
    };
  }
};
```

---

### 🔧 PASO 9: Actualizar template.yaml

**Archivo:** `template.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Lambda para gestión de emojis y clientes

Resources:
  # Lambda existente
  InfoEmojis:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: app.lambdaHandler
      Runtime: nodejs20.x
      Architecture: arm64
      MemorySize: 128
      Timeout: 3
      Environment:
        Variables:
          password: admin1234*
          url: db-game.c1g6mycog0un.me-south-1.rds.amazonaws.com
          user: admin
      Events:
        GetEmojis:
          Type: Api
          Properties:
            Path: /InfoEmojis
            Method: GET
        PostEmojis:
          Type: Api
          Properties:
            Path: /InfoEmojis
            Method: POST
        CreateCustomer:  # ⭐ NUEVO ENDPOINT
          Type: Api
          Properties:
            Path: /CreateCustomer
            Method: POST
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: es2020
        EntryPoints: [app.ts]

Outputs:
  ApiUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

**Nota:** Como estamos usando la misma función Lambda para múltiples endpoints, solo agregamos el nuevo evento `CreateCustomer` a la función existente.

---

### 📦 PASO 10: Build y Deploy

```bash
# 1. Build del proyecto
sam build

# 2. Deploy
sam deploy
```

**Output esperado:**
```
Successfully created/updated stack - sam-app in me-south-1

Stack Outputs:
  ApiUrl: https://abc123xyz.execute-api.me-south-1.amazonaws.com/Prod/
```

---

## Guía de Testing con SAM CLI

### 🧪 Opción 1: Testing Local con `sam local invoke`

#### Crear archivo de evento de prueba

**Archivo:** `events/create-customer-event.json`

```json
{
  "httpMethod": "POST",
  "path": "/CreateCustomer",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"name\":\"Juan Pérez\",\"email\":\"juan@example.com\",\"phone\":\"+1234567890\"}",
  "queryStringParameters": null,
  "pathParameters": null,
  "requestContext": {
    "requestId": "test-request-id"
  }
}
```

#### Ejecutar prueba local

```bash
# Build primero
sam build

# Invocar lambda localmente con el evento
sam local invoke InfoEmojis -e events/create-customer-event.json
```

**Output esperado:**
```json
{
  "statusCode": 201,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...
  },
  "body": "{\"data\":{\"customerId\":123,\"name\":\"Juan Pérez\",\"email\":\"juan@example.com\",\"phone\":\"+1234567890\",\"createdAt\":\"2026-01-07T10:30:00Z\",\"displayName\":\"Juan P.\"},\"operation\":{\"statusCode\":201,\"status\":\"Success\",\"message\":\"Customer created successfully\"}}"
}
```

---

### 🧪 Opción 2: Testing con API Local (`sam local start-api`)

#### Iniciar API local

```bash
# Build
sam build

# Iniciar API Gateway local en puerto 3000
sam local start-api --port 3000
```

**Output:**
```
Mounting InfoEmojis at http://127.0.0.1:3000/CreateCustomer [POST]
Mounting InfoEmojis at http://127.0.0.1:3000/InfoEmojis [GET]
Mounting InfoEmojis at http://127.0.0.1:3000/InfoEmojis [POST]
```

#### Probar con curl

**Test 1: Crear cliente válido**
```bash
curl -X POST http://127.0.0.1:3000/CreateCustomer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890"
  }'
```

**Respuesta esperada:**
```json
{
  "data": {
    "customerId": 123,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+1234567890",
    "createdAt": "2026-01-07T10:30:00Z",
    "displayName": "Juan P."
  },
  "operation": {
    "statusCode": 201,
    "status": "Success",
    "message": "Customer created successfully"
  }
}
```

---

**Test 2: Email inválido (debe fallar con 400)**
```bash
curl -X POST http://127.0.0.1:3000/CreateCustomer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "invalid-email",
    "phone": "+1234567890"
  }'
```

**Respuesta esperada:**
```json
{
  "error": "Valid email is required",
  "operation": {
    "statusCode": 400,
    "status": "Error",
    "message": "Validation failed"
  }
}
```

---

**Test 3: Nombre vacío (debe fallar con 400)**
```bash
curl -X POST http://127.0.0.1:3000/CreateCustomer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "juan@example.com",
    "phone": "+1234567890"
  }'
```

---

#### Probar con Postman

1. **URL:** `http://127.0.0.1:3000/CreateCustomer`
2. **Method:** POST
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "name": "María García",
  "email": "maria@example.com",
  "phone": "+9876543210"
}
```

---

### 🧪 Opción 3: Testing en AWS (Deployed)

#### Ver URL de la API desplegada

```bash
# Obtener outputs del stack
aws cloudformation describe-stacks \
  --stack-name sam-app \
  --region me-south-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Output:**
```
---------------------------------------------------------
|                    DescribeStacks                     |
+-------------+-----------------------------------------+
| OutputKey   | ApiUrl                                  |
| OutputValue | https://abc123.execute-api.me-south... |
+-------------+-----------------------------------------+
```

#### Probar endpoint desplegado

```bash
# URL completa
export API_URL="https://abc123xyz.execute-api.me-south-1.amazonaws.com/Prod"

# Crear cliente
curl -X POST ${API_URL}/CreateCustomer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente de Producción",
    "email": "prod@example.com",
    "phone": "+1111111111"
  }'
```

---

### 🧪 Opción 4: Ver Logs en CloudWatch

#### Ver logs en tiempo real (durante deploy)

```bash
sam logs -n InfoEmojis \
  --stack-name sam-app \
  --region me-south-1 \
  --tail
```

#### Ver logs de una invocación específica

```bash
# Ver últimos 10 minutos
sam logs -n InfoEmojis \
  --stack-name sam-app \
  --region me-south-1 \
  --start-time '10min ago'
```

#### Ver logs con filtro

```bash
# Solo errores
sam logs -n InfoEmojis \
  --stack-name sam-app \
  --region me-south-1 \
  --filter 'ERROR'
```

---

### 🧪 Scripts de Testing (package.json)

Agrega estos scripts para facilitar testing:

**Archivo:** `package.json`

```json
{
  "name": "lambda-moneda",
  "version": "1.0.0",
  "scripts": {
    "build": "sam build",
    "deploy": "sam deploy",
    "local:api": "sam build && sam local start-api --port 3000",
    "local:invoke": "sam build && sam local invoke InfoEmojis -e events/create-customer-event.json",
    "logs": "sam logs -n InfoEmojis --stack-name sam-app --region me-south-1 --tail",
    "test:create-customer": "curl -X POST http://127.0.0.1:3000/CreateCustomer -H 'Content-Type: application/json' -d @events/create-customer-body.json"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.2"
  }
}
```

**Uso:**
```bash
# Iniciar API local
npm run local:api

# Invocar lambda localmente
npm run local:invoke

# Ver logs
npm run logs

# Test rápido
npm run test:create-customer
```

---

### 🧪 Archivo de datos de prueba

**Archivo:** `events/create-customer-body.json`

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+5551234567"
}
```

---

## Estructura de Archivos (Resumen)

```
lambdaMoneda/
│
├── src/
│   ├── app.ts                                    # ⭐ Lambda Handler (modificado)
│   │
│   ├── controller/
│   │   ├── CustomerController.ts                 # ⭐ NUEVO
│   │   ├── ICustomerController.ts                # ⭐ NUEVO
│   │   ├── EmojisController.ts
│   │   └── IEmojisController.ts
│   │
│   ├── domain/
│   │   ├── CustomerBL.ts                         # ⭐ NUEVO
│   │   ├── ICustomerBL.ts                        # ⭐ NUEVO
│   │   ├── EmojisBL.ts
│   │   ├── IEmojisBL.ts
│   │   ├── mappers/
│   │   │   ├── CustomerMapper.ts                 # ⭐ NUEVO
│   │   │   └── EmojisMapper.ts
│   │   └── models/
│   │       ├── CustomerDomain.ts                 # ⭐ NUEVO
│   │       ├── EmojisDomain.ts
│   │       └── EmojisDomainCustomer.ts
│   │
│   ├── repositories/
│   │   ├── CustomerRepository.ts                 # ⭐ NUEVO
│   │   ├── ICustomerRepository.ts                # ⭐ NUEVO
│   │   ├── ListEmojisRepository.ts
│   │   ├── IListEmojisRepository.ts
│   │   └── dtos/
│   │       ├── CreateCustomerDTO.ts              # ⭐ NUEVO
│   │       ├── ListEmojisDTO.ts
│   │       └── ...
│   │
│   └── core/
│       ├── common/
│       │   ├── Helper.ts
│       │   ├── ResponseWriter.ts
│       │   └── types.ts
│       ├── config/
│       │   └── index.ts
│       └── utils/
│           ├── Constans.ts                       # ⭐ MODIFICADO (agregar queries)
│           └── DatabaseManager.ts
│
├── events/                                        # ⭐ NUEVO (para testing)
│   ├── create-customer-event.json                # ⭐ NUEVO
│   └── create-customer-body.json                 # ⭐ NUEVO
│
├── template.yaml                                  # ⭐ MODIFICADO (agregar endpoint)
├── samconfig.toml
└── package.json                                   # ⭐ MODIFICADO (agregar scripts)
```

---

## Checklist de Implementación

### Para crear nueva lambda:

- [ ] **PASO 1:** Crear DTOs en `/repositories/dtos/`
  - [ ] Request DTO
  - [ ] Response DTO

- [ ] **PASO 2:** Agregar queries en `Constans.ts`
  - [ ] Query principal (INSERT/UPDATE/DELETE)
  - [ ] Queries auxiliares si son necesarias
  - [ ] Agregar códigos HTTP si se necesitan nuevos

- [ ] **PASO 3:** Implementar Repository
  - [ ] Crear interface `IXxxRepository.ts`
  - [ ] Implementar `XxxRepository.ts`
  - [ ] Usar `try-finally` para liberar conexiones
  - [ ] Usar prepared statements (`?`)

- [ ] **PASO 4:** Crear modelos de dominio
  - [ ] Definir interfaces en `/domain/models/`
  - [ ] Incluir campos calculados si hay lógica de negocio

- [ ] **PASO 5:** Crear Mapper (si es necesario)
  - [ ] Implementar en `/domain/mappers/`
  - [ ] Aplicar transformaciones DTO → Domain

- [ ] **PASO 6:** Implementar Business Logic
  - [ ] Crear interface `IXxxBL.ts`
  - [ ] Implementar `XxxBL.ts`
  - [ ] Agregar validaciones de negocio
  - [ ] Aplicar mappers

- [ ] **PASO 7:** Implementar Controller
  - [ ] Crear interface `IXxxController.ts`
  - [ ] Implementar `XxxController.ts`
  - [ ] Manejar errores con try-catch
  - [ ] Retornar códigos HTTP apropiados

- [ ] **PASO 8:** Integrar en `app.ts`
  - [ ] Agregar ruta (path + method)
  - [ ] Instanciar con DI
  - [ ] Agregar CORS headers

- [ ] **PASO 9:** Actualizar `template.yaml`
  - [ ] Agregar evento API Gateway
  - [ ] Verificar configuración de lambda

- [ ] **PASO 10:** Testing
  - [ ] Crear archivo de evento en `/events/`
  - [ ] Probar con `sam local invoke`
  - [ ] Probar con `sam local start-api`
  - [ ] Deploy y probar en AWS
  - [ ] Verificar logs en CloudWatch

---

## Comandos SAM CLI Útiles

### Build y Deploy

```bash
# Build (compilar TypeScript)
sam build

# Deploy con configuración guiada (primera vez)
sam deploy --guided

# Deploy rápido (con configuración guardada)
sam deploy

# Validar template.yaml
sam validate

# Ver configuración del stack
sam list stack-outputs --stack-name sam-app
```

### Testing Local

```bash
# Invocar lambda con evento
sam local invoke InfoEmojis -e events/create-customer-event.json

# Iniciar API local
sam local start-api --port 3000

# Iniciar API con debug
sam local start-api --port 3000 --debug

# Invocar con variables de entorno custom
sam local invoke -e events/test.json --env-vars env.json
```

### Logs

```bash
# Ver logs en tiempo real
sam logs -n InfoEmojis --stack-name sam-app --tail

# Ver logs de últimos 10 minutos
sam logs -n InfoEmojis --stack-name sam-app --start-time '10min ago'

# Filtrar logs
sam logs -n InfoEmojis --stack-name sam-app --filter 'ERROR'

# Exportar logs
sam logs -n InfoEmojis --stack-name sam-app > logs.txt
```

### Cleanup

```bash
# Eliminar stack completo
sam delete --stack-name sam-app --region me-south-1

# Sin confirmación
sam delete --stack-name sam-app --region me-south-1 --no-prompts
```

---

## Debugging Tips

### Ver variables de entorno en lambda local

```bash
# Crear archivo env.json
cat > env.json <<EOF
{
  "InfoEmojis": {
    "NODE_ENVIRONMENT": "LOCAL",
    "DEBUG": "true"
  }
}
EOF

# Usar en local invoke
sam local invoke -e events/test.json --env-vars env.json
```

### Conectar a BD local para testing

Modificar `src/core/config/index.ts`:

```typescript
export const config = {
  NODE_ENVIRONMENT: process.env.NODE_ENVIRONMENT || 'LOCAL',
  DATABASE: {
    LOCAL: {
      host: 'localhost',  // ⭐ MySQL local
      database: 'db-game-local',
      user: 'root',
      password: 'root',
      port: 3306
    },
    // ...
  }
};
```

### Ver logs de conexión MySQL

Agregar logging en `DatabaseManager.ts`:

```typescript
export const mysqlClient = mysql.createPool({
  ...config.DATABASE[config.NODE_ENVIRONMENT],
  debug: process.env.DEBUG === 'true'  // ⭐ Ver queries SQL
});
```

---

## Mejores Prácticas

### ✅ Testing

1. **Siempre testear localmente** antes de deploy
2. **Crear eventos de prueba** para cada endpoint
3. **Testear casos de error** (validaciones, BD down, etc.)
4. **Verificar logs** en CloudWatch después de deploy
5. **Usar Postman/Insomnia** para testing manual

### ✅ Desarrollo

1. **Seguir el patrón de capas** estrictamente
2. **Usar interfaces** para todos los componentes
3. **Validar en Business Logic**, no en Controller
4. **Liberar conexiones** siempre con `try-finally`
5. **Usar prepared statements** para evitar SQL injection
6. **Manejar errores** apropiadamente en cada capa
7. **Agregar logs** para debugging (`console.log`, `console.error`)

### ✅ Deployment

1. **Revisar template.yaml** antes de deploy
2. **Verificar credenciales** no estén hardcodeadas
3. **Testear en LOCAL** → **Deploy a DEV** → **QA** → **PROD**
4. **Monitorear logs** después de deployment
5. **Hacer rollback** si hay errores críticos

---

**Fin del documento**

Este documento te guía paso a paso para entender y desarrollar nuevas lambdas siguiendo la arquitectura establecida del proyecto.
