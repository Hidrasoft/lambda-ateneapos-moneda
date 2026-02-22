# Arquitectura Lambda Moneda - Sistema POS Atenea

## Tabla de Contenidos
1. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
2. [Comunicación Entre Capas](#comunicación-entre-capas)
3. [Ejemplo Completo: API de Monedas](#ejemplo-completo-api-de-monedas)
4. [Guía de Testing con SAM CLI](#guía-de-testing-con-sam-cli)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Checklist de Implementación](#checklist-de-implementación)

---

## Diagrama de Arquitectura

### Vista General de Capas

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                          API GATEWAY                              ┃
┃                    POST /v1/pos/monedas                           ┃
┃                    Headers: message-uuid, request-app-id          ┃
┃                    Body: {"codigoIso": "COP", "nombre": "Peso"}  ┃
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
┃    const body = JSON.parse(event.body);                          ┃
┃    const messageUuid = event.headers?.['message-uuid'];          ┃
┃    const requestAppId = event.headers?.['request-app-id'];       ┃
┃                                                                   ┃
┃    // Validar headers requeridos                                 ┃
┃    if (!messageUuid || !requestAppId) {                          ┃
┃      return { statusCode: 400, ... };                            ┃
┃    }                                                              ┃
┃                                                                   ┃
┃    // 🔧 Dependency Injection Manual                             ┃
┃    const controller = new MonedaController(                      ┃
┃      new MonedaBL(                                               ┃
┃        new MonedaRepository()                                    ┃
┃      )                                                            ┃
┃    );                                                             ┃
┃                                                                   ┃
┃    return await controller.createMoneda(body,                    ┃
┃                             messageUuid, requestAppId);          ┃
┃  }                                                                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ MonedaRequestDTO + Headers
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 1: CONTROLLER              📍 src/controller/              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  class MonedaController {                                        ┃
┃    constructor(private monedaBL: IMonedaBL) {}                   ┃
┃                                                                   ┃
┃    async createMoneda(data, messageUuid, requestAppId) {         ┃
┃      try {                                                        ┃
┃        // Llamar Business Logic                                  ┃
┃        const moneda = await this.monedaBL.createMoneda(data);    ┃
┃                                                                   ┃
┃        // Construir respuesta Swagger 201 CREATED                ┃
┃        const response = SwaggerResponseBuilder                   ┃
┃                           .buildSuccessResponse(                 ┃
┃                             201, moneda, messageUuid,            ┃
┃                             requestAppId                         ┃
┃                           );                                     ┃
┃                                                                   ┃
┃        return { statusCode: 201, headers: {...},                 ┃
┃                 body: JSON.stringify(response) };                ┃
┃                                                                   ┃
┃      } catch (e) {                                               ┃
┃        return this.handleError(e, messageUuid, requestAppId);    ┃
┃      }                                                            ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  ┌────────────────────────────────────────────────────┐          ┃
┃  │  SwaggerResponseBuilder                           │          ┃
┃  ├────────────────────────────────────────────────────┤          ┃
┃  │  + buildSuccessResponse(statusCode, data, ...)    │          ┃
┃  │  + buildErrorResponse(statusCode, errors, ...)    │          ┃
┃  │  + buildErrorItem(errorCode, errorDetail)         │          ┃
┃  │                                                    │          ┃
┃  │  Formato estandarizado con headers:               │          ┃
┃  │  - httpStatusCode, httpStatusDesc                 │          ┃
┃  │  - messageUuid, requestDatetime, requestAppId     │          ┃
┃  └────────────────────────────────────────────────────┘          ┃
┃                                                                   ┃
┃  Responsabilidades:                                              ┃
┃  ✓ Orquestar peticiones HTTP                                    ┃
┃  ✓ Invocar Business Logic                                       ┃
┃  ✓ Formatear respuestas según contrato Swagger                  ┃
┃  ✓ Manejo centralizado de errores (400, 404, 409, 500)          ┃
┃  ✗ NO contiene lógica de negocio ni validaciones                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ MonedaRequestDTO
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 2: BUSINESS LOGIC             📍 src/domain/               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  class MonedaBL {                                                ┃
┃    constructor(private repo: IMonedaRepository) {}               ┃
┃                                                                   ┃
┃    async createMoneda(data: MonedaRequestDTO) {                  ┃
┃      // 1️⃣ Validar datos de entrada                             ┃
┃      this.validateMonedaData(data);                              ┃
┃                                                                   ┃
┃      // 2️⃣ Validar regla de negocio: código ISO único           ┃
┃      const exists = await this.repo                              ┃
┃                       .checkMonedaExistsByIso(data.codigoIso);   ┃
┃      if (exists) {                                               ┃
┃        throw new ConflictError(                                  ┃
┃          `Ya existe moneda con código: ${data.codigoIso}`        ┃
┃        );                                                         ┃
┃      }                                                            ┃
┃                                                                   ┃
┃      // 3️⃣ Llamar al repositorio                                ┃
┃      const monedaDTO = await this.repo.createMoneda(data);       ┃
┃                                                                   ┃
┃      // 4️⃣ Transformar DTO → Domain Model                       ┃
┃      return MonedaMapper.toDomain(monedaDTO);                    ┃
┃    }                                                              ┃
┃                                                                   ┃
┃    private validateMonedaData(data) {                            ┃
┃      if (!data.codigoIso || data.codigoIso.length !== 3) {       ┃
┃        throw new ValidationError('Código ISO inválido');         ┃
┃      }                                                            ┃
┃      // ... más validaciones                                     ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  ┌────────────────────────────────────────────────────┐          ┃
┃  │  MAPPERS (src/domain/mappers/)                    │          ┃
┃  ├────────────────────────────────────────────────────┤          ┃
┃  │  MonedaMapper.toDomain(dto):                      │          ┃
┃  │    return {                                        │          ┃
┃  │      monedaId: dto.moneda_id,     // snake_case   │  ⚡ Mapeo┃
┃  │      codigoIso: dto.codigo_iso,   // → camelCase  │          ┃
┃  │      nombre: dto.nombre,                          │          ┃
┃  │      simbolo: dto.simbolo,                        │          ┃
┃  │      decimales: dto.decimales,                    │          ┃
┃  │      activo: dto.activo                           │          ┃
┃  │    }                                               │          ┃
┃  └────────────────────────────────────────────────────┘          ┃
┃                                                                   ┃
┃  ┌────────────────────────────────────────────────────┐          ┃
┃  │  EXCEPCIONES PERSONALIZADAS                       │          ┃
┃  ├────────────────────────────────────────────────────┤          ┃
┃  │  • ValidationError - Datos inválidos (→ 400)      │          ┃
┃  │  • NotFoundError - Recurso no existe (→ 404)      │          ┃
┃  │  • ConflictError - Violación unicidad (→ 409)     │          ┃
┃  └────────────────────────────────────────────────────┘          ┃
┃                                                                   ┃
┃  Responsabilidades:                                              ┃
┃  ✓ Implementar validaciones de entrada                          ┃
┃  ✓ Implementar reglas de negocio (unicidad, formato)            ┃
┃  ✓ Orquestar repositorios                                       ┃
┃  ✓ Aplicar transformaciones (DTOs → Domain Models)              ┃
┃  ✓ Lanzar excepciones tipadas                                   ┃
┃  ✗ NO accede directamente a la BD                               ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                │ MonedaRequestDTO
                                ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  CAPA 3: REPOSITORY            📍 src/repositories/              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                   ┃
┃  class MonedaRepository {                                        ┃
┃                                                                   ┃
┃    async createMoneda(data: MonedaRequestDTO) {                  ┃
┃      // Valores por defecto                                      ┃
┃      const decimales = data.decimales ?? 2;                      ┃
┃      const activo = data.activo ?? true;                         ┃
┃                                                                   ┃
┃      // 1️⃣ Ejecutar INSERT con RETURNING (PostgreSQL)           ┃
┃      const result = await pgPool.query(                          ┃
┃        QUERIES.CREATE_MONEDA,                                    ┃
┃        [data.codigoIso, data.nombre,                             ┃
┃         data.simbolo, decimales, activo]  // ⚡ Parametrizado    ┃
┃      );                                                           ┃
┃                                                                   ┃
┃      // 2️⃣ Retornar registro insertado (con ID autogenerado)    ┃
┃      return result.rows[0] as MonedaDTO;                         ┃
┃    }                                                              ┃
┃                                                                   ┃
┃    async listMonedasPaginated(pagination) {                      ┃
┃      // Calcular offset                                          ┃
┃      const offset = (pagination.pageNumber - 1)                  ┃
┃                   * pagination.pageSize;                         ┃
┃                                                                   ┃
┃      // Obtener total de registros                               ┃
┃      const countResult = await pgPool.query(                     ┃
┃        QUERIES.COUNT_MONEDAS                                     ┃
┃      );                                                           ┃
┃                                                                   ┃
┃      // Obtener datos paginados                                  ┃
┃      const dataResult = await pgPool.query(                      ┃
┃        QUERIES.LIST_MONEDAS_PAGINATED,                           ┃
┃        [pagination.pageSize, offset]                             ┃
┃      );                                                           ┃
┃                                                                   ┃
┃      return {                                                     ┃
┃        data: dataResult.rows as MonedaDTO[],                     ┃
┃        totalRecords: parseInt(countResult.rows[0]?.total || '0') ┃
┃      };                                                           ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  ┌────────────────────────────────────────────────────┐          ┃
┃  │  DTOs (src/repositories/dtos/)                    │          ┃
┃  ├────────────────────────────────────────────────────┤          ┃
┃  │  // DTO de request (camelCase)                    │          ┃
┃  │  interface MonedaRequestDTO {                     │          ┃
┃  │    codigoIso: string;                             │          ┃
┃  │    nombre: string;                                │          ┃
┃  │    simbolo: string;                               │          ┃
┃  │    decimales?: number;                            │          ┃
┃  │    activo?: boolean;                              │          ┃
┃  │  }                                                 │          ┃
┃  │                                                    │          ┃
┃  │  // DTO de respuesta BD (snake_case)              │          ┃
┃  │  interface MonedaDTO {                            │          ┃
┃  │    moneda_id: number;      // ⚡ Snake case        │          ┃
┃  │    codigo_iso: string;     //    de PostgreSQL    │          ┃
┃  │    nombre: string;                                │          ┃
┃  │    simbolo: string;                               │          ┃
┃  │    decimales: number;                             │          ┃
┃  │    activo: boolean;                               │          ┃
┃  │  }                                                 │          ┃
┃  └────────────────────────────────────────────────────┘          ┃
┃                                                                   ┃
┃  Responsabilidades:                                              ┃
┃  ✓ Ejecutar queries SQL con parametrización ($1, $2...)         ┃
┃  ✓ Gestionar pool de conexiones PostgreSQL                      ┃
┃  ✓ Mapear resultados a DTOs                                     ┃
┃  ✓ Manejar paginación a nivel de BD                             ┃
┃  ✗ NO contiene lógica de negocio ni validaciones                ┃
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
┃  import { Pool } from 'pg';                                      ┃
┃  import config from '../config';                                 ┃
┃                                                                   ┃
┃  // Pool de conexiones PostgreSQL                                ┃
┃  const pgPool = new Pool(                                        ┃
┃    config.DATABASE[config.NODE_ENVIRONMENT]                      ┃
┃  );                                                               ┃
┃                                                                   ┃
┃  pgPool.on('error', (err) => {                                   ┃
┃    console.error('Error en pool PostgreSQL:', err);              ┃
┃  });                                                              ┃
┃                                                                   ┃
┃  export const mysqlClient = pgPool;  // Alias histórico          ┃
┃                                                                   ┃
┃  config/index.ts:                                                ┃
┃  ─────────────────────────────────────────────────────           ┃
┃  DATABASE: {                                                     ┃
┃    DEV: {                                                        ┃
┃      host: "db-atenea-pos...us-east-1.rds.amazonaws.com",        ┃
┃      user: "postgres",                                           ┃
┃      password: process.env.PG_PASSWORD,                          ┃
┃      database: "ateneapos",                                      ┃
┃      port: 5432,                                                 ┃
┃      ssl: { rejectUnauthorized: false }                          ┃
┃    }                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┃  Constans.ts:                                                    ┃
┃  ─────────────────────────────────────────────────────           ┃
┃  enum QUERIES {                                                  ┃
┃    CREATE_MONEDA = `                                             ┃
┃      INSERT INTO moneda                                          ┃
┃        (codigo_iso, nombre, simbolo, decimales, activo)          ┃
┃      VALUES ($1, $2, $3, $4, $5)    // ⚡ PostgreSQL placeholders┃
┃      RETURNING moneda_id, codigo_iso, nombre,                    ┃
┃                simbolo, decimales, activo                        ┃
┃    `,                                                             ┃
┃                                                                   ┃
┃    GET_MONEDA_BY_ID = `                                          ┃
┃      SELECT moneda_id, codigo_iso, nombre, simbolo,              ┃
┃             decimales, activo                                    ┃
┃      FROM moneda                                                 ┃
┃      WHERE moneda_id = $1                                        ┃
┃    `,                                                             ┃
┃                                                                   ┃
┃    LIST_MONEDAS_PAGINATED = `                                    ┃
┃      SELECT moneda_id, codigo_iso, nombre, simbolo,              ┃
┃             decimales, activo                                    ┃
┃      FROM moneda                                                 ┃
┃      ORDER BY moneda_id                                          ┃
┃      LIMIT $1 OFFSET $2       // ⚡ Paginación PostgreSQL         ┃
┃    `                                                              ┃
┃  }                                                                ┃
┃                                                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                │
                                ▼
                    ┌───────────────────────┐
                    │ PostgreSQL RDS        │
                    │ db-atenea-pos         │
                    │ us-east-1             │
                    │ Database: ateneapos   │
                    └───────────────────────┘
```

---

## Comunicación Entre Capas

### Flujo de Datos: Request → Response

```
REQUEST                                                          RESPONSE
────────                                                         ────────

POST /v1/pos/monedas                                    201 CREATED + JSON
Headers:                                                ┌──────────────────┐
  message-uuid: abc-123                                 │ {                │
  request-app-id: POS-APP                               │   headers: {     │
Body: {                                                 │     httpStatus...,
  "codigoIso": "COP",                                   │     messageUuid,│
  "nombre": "Peso Colombiano",                          │     ...         │
  "simbolo": "$",                                       │   },            │
  "decimales": 2                                        │   data: {       │
}                                                        │     monedaId: 1,│
       │                                                 │     codigoIso...,
       │                                                 │   },            │
       ▼                                                 │   messageResp.. │
┌─────────────────┐                                     │ }                │
│  Lambda Handler │ ──┐                                 └──────────────────┘
│  app.ts         │   │                                        ▲
└─────────────────┘   │                                        │
       │              │                                        │
       │ Parse body   │                                        │
       │ Extract hdrs │                                        │
       ▼              │                                        │
MonedaRequestDTO       │                              APIGatewayProxyResult
{ codigoIso: "COP",   │                                        │
  nombre: "Peso..."   │                                        │
  ... }               │                                        │
       │              │                                        │
       ▼              │                                        │
┌─────────────────┐  │ DI                              ┌──────┴───────────┐
│  Controller     │ ◀┘ new MonedaController(           │ SwaggerResponse  │
│  MonedaCtrl.ts  │      new MonedaBL(                 │ Builder          │
└─────────────────┘        new Repo()                  │ .buildSuccess..()│
       │                 )                              └──────────────────┘
       │                )                                      ▲
       ▼                                                       │
  call BL method                                        Moneda (Domain)
       │                                                { monedaId, ...  }
       │                                                       │
       ▼                                                       │
┌─────────────────┐                                     ┌──────┴───────┐
│  Business Logic │                                     │  MonedaBL    │
│  MonedaBL.ts    │ ────────────────────────────────▶  │  return {...}│
└─────────────────┘                                     └──────────────┘
       │                                                       ▲
       │ 1. Validate                                          │
       │ 2. Check exists                                      │
       │ 3. Call repository                                   │
       │ 4. Map to domain                                     │
       ▼                                                       │
MonedaRequestDTO                                  MonedaDTO (from DB)
       │                                           │           │
       │                                           │  Mapper   │
       ▼                                           │  converts │
┌─────────────────┐                                │  snake to │
│  Repository     │                                │  camel    │
│  MonedaRepo.ts  │ ───────────────────────────────┘           │
└─────────────────┘                                            │
       │                                                       │
       │ pgPool.query(QUERY, [params])                        │
       ▼                                                       │
  SQL Execution                                                │
       │                                                       │
       ▼                                                       │
┌─────────────────┐                                            │
│  PostgreSQL RDS │                                            │
│  Database       │ ───────────────────────────────────────────┘
└─────────────────┘        Raw rows as DTO

```

### Transformación de Datos por Capa

```
Capa               Input                       Output                      Tipo
─────              ─────                       ──────                      ────

Handler            APIGatewayProxyEvent        APIGatewayProxyResult       AWS Types
                   ↓
                   { body: '{"codigoIso":..}', headers: {...} }
                   ↓ JSON.parse + extract

Controller         MonedaRequestDTO +          APIGatewayProxyResult       HTTP/Swagger
                   messageUuid +                { statusCode: 201,
                   requestAppId                   headers: {...},
                   ↓                              body: JSON Swagger }

Business Logic     MonedaRequestDTO            Moneda (Domain Model)       Domain
                   { codigoIso, nombre, ... }   { monedaId, codigoIso,
                   ↓                              nombre, ... }

Repository         MonedaRequestDTO            MonedaDTO (snake_case)      Data
                   { codigoIso, nombre, ... }   { moneda_id, codigo_iso,
                   ↓                              nombre, ... }

Database           SQL Query + Params          Raw Rows                    SQL
                   [$1, $2, $3...]             ResultSet
```

---

## Ejemplo Completo: API de Monedas

### Endpoints Implementados

La API de Monedas implementa los siguientes endpoints:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/v1/pos/monedas` | Crear nueva moneda |
| GET | `/v1/pos/monedas?pageNumber=1&pageSize=10` | Listar monedas paginadas |
| GET | `/v1/pos/monedas/{monedaId}` | Obtener moneda por ID |
| PUT | `/v1/pos/monedas/{monedaId}` | Actualizar moneda |
| DELETE | `/v1/pos/monedas/{monedaId}` | Eliminar moneda |

### Análisis Detallado: POST /v1/pos/monedas

#### 📋 Request

```http
POST /v1/pos/monedas
Headers:
  message-uuid: 550e8400-e29b-41d4-a716-446655440000
  request-app-id: POS-ATENEA
  Content-Type: application/json

Body:
{
  "codigoIso": "COP",
  "nombre": "Peso Colombiano",
  "simbolo": "$",
  "decimales": 2,
  "activo": true
}
```

#### ✅ Response (Éxito - 201 CREATED)

```json
{
  "headers": {
    "httpStatusCode": 201,
    "httpStatusDesc": "CREATED",
    "messageUuid": "550e8400-e29b-41d4-a716-446655440000",
    "requestDatetime": "2026-02-21T10:30:00.000Z",
    "requestAppId": "POS-ATENEA"
  },
  "messageResponse": {
    "responseCode": "0000",
    "responseMessage": "Success",
    "responseDetails": "Resource created successfully"
  },
  "data": {
    "monedaId": 1,
    "codigoIso": "COP",
    "nombre": "Peso Colombiano",
    "simbolo": "$",
    "decimales": 2,
    "activo": true
  }
}
```

#### ❌ Response (Error - 409 CONFLICT)

```json
{
  "headers": {
    "httpStatusCode": 409,
    "httpStatusDesc": "CONFLICT",
    "messageUuid": "550e8400-e29b-41d4-a716-446655440000",
    "requestDatetime": "2026-02-21T10:30:00.000Z",
    "requestAppId": "POS-ATENEA"
  },
  "messageResponse": {
    "responseCode": "0409",
    "responseMessage": "Conflict",
    "responseDetails": "Resource already exists or violates unique constraint"
  },
  "errors": [
    {
      "errorCode": "E003",
      "errorDetail": "Ya existe una moneda con el código ISO: COP"
    }
  ]
}
```

### Flujo Completo de Implementación

#### 🔧 PASO 1: Crear DTOs

**Archivo:** `src/repositories/dtos/MonedaDTO.ts`

```typescript
// DTO de request (lo que recibe el endpoint - camelCase)
export interface MonedaRequestDTO {
  codigoIso: string;
  nombre: string;
  simbolo: string;
  decimales?: number;  // Opcional, default: 2
  activo?: boolean;    // Opcional, default: true
}

// DTO de respuesta de la BD (snake_case - nomenclatura PostgreSQL)
export interface MonedaDTO {
  moneda_id: number;
  codigo_iso: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
}
```

---

#### 🔧 PASO 2: Agregar Queries en Constans.ts

**Archivo:** `src/core/utils/Constans.ts`

```typescript
export enum QUERIES {
  // Crear moneda con RETURNING (PostgreSQL)
  CREATE_MONEDA = `
    INSERT INTO moneda (codigo_iso, nombre, simbolo, decimales, activo)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING moneda_id, codigo_iso, nombre, simbolo, decimales, activo
  `,

  // Obtener moneda por ID
  GET_MONEDA_BY_ID = `
    SELECT moneda_id, codigo_iso, nombre, simbolo, decimales, activo
    FROM moneda
    WHERE moneda_id = $1
  `,

  // Listar con paginación
  LIST_MONEDAS_PAGINATED = `
    SELECT moneda_id, codigo_iso, nombre, simbolo, decimales, activo
    FROM moneda
    ORDER BY moneda_id
    LIMIT $1 OFFSET $2
  `,

  // Contar total de registros
  COUNT_MONEDAS = `
    SELECT COUNT(*) as total
    FROM moneda
  `,

  // Actualizar moneda
  UPDATE_MONEDA = `
    UPDATE moneda
    SET codigo_iso = $1, nombre = $2, simbolo = $3,
        decimales = $4, activo = $5
    WHERE moneda_id = $6
    RETURNING moneda_id, codigo_iso, nombre, simbolo, decimales, activo
  `,

  // Eliminar moneda
  DELETE_MONEDA = `
    DELETE FROM moneda
    WHERE moneda_id = $1
    RETURNING moneda_id, codigo_iso, nombre, simbolo, decimales, activo
  `,

  // Verificar si existe código ISO
  CHECK_MONEDA_EXISTS_BY_ISO = `
    SELECT COUNT(*) as count
    FROM moneda
    WHERE codigo_iso = $1 AND moneda_id != $2
  `
}
```

---

#### 🔧 PASO 3: Implementar Repository

**Archivo:** `src/repositories/IMonedaRepository.ts`

```typescript
import { MonedaRequestDTO, MonedaDTO } from './dtos/MonedaDTO';
import { PaginationParams } from '../domain/models/MonedaDomain';

export interface PaginatedResult<T> {
  data: T[];
  totalRecords: number;
}

export interface IMonedaRepository {
  createMoneda(data: MonedaRequestDTO): Promise<MonedaDTO>;
  getMonedaById(monedaId: number): Promise<MonedaDTO | null>;
  listMonedasPaginated(pagination: PaginationParams): Promise<PaginatedResult<MonedaDTO>>;
  updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<MonedaDTO | null>;
  deleteMoneda(monedaId: number): Promise<MonedaDTO | null>;
  checkMonedaExistsByIso(codigoIso: string, excludeId?: number): Promise<boolean>;
}
```

**Archivo:** `src/repositories/MonedaRepository.ts`

```typescript
import { IMonedaRepository, PaginatedResult } from './IMonedaRepository';
import { MonedaRequestDTO, MonedaDTO } from './dtos/MonedaDTO';
import { mysqlClient } from '../core/utils/DatabaseManager';  // Es pgPool
import { QUERIES } from '../core/utils/Constans';
import { PaginationParams } from '../domain/models/MonedaDomain';

export class MonedaRepository implements IMonedaRepository {

  async createMoneda(data: MonedaRequestDTO): Promise<MonedaDTO> {
    const decimales = data.decimales ?? 2;
    const activo = data.activo ?? true;

    const result = await mysqlClient.query(
      QUERIES.CREATE_MONEDA,
      [data.codigoIso, data.nombre, data.simbolo, decimales, activo]
    );

    return result.rows[0] as MonedaDTO;
  }

  async getMonedaById(monedaId: number): Promise<MonedaDTO | null> {
    const result = await mysqlClient.query(
      QUERIES.GET_MONEDA_BY_ID,
      [monedaId]
    );

    return result.rows.length > 0 ? result.rows[0] as MonedaDTO : null;
  }

  async listMonedasPaginated(
    pagination: PaginationParams
  ): Promise<PaginatedResult<MonedaDTO>> {
    const offset = (pagination.pageNumber - 1) * pagination.pageSize;

    // Total de registros
    const countResult = await mysqlClient.query(QUERIES.COUNT_MONEDAS);
    const totalRecords = parseInt(countResult.rows[0]?.total || '0');

    // Datos paginados
    const dataResult = await mysqlClient.query(
      QUERIES.LIST_MONEDAS_PAGINATED,
      [pagination.pageSize, offset]
    );

    return {
      data: dataResult.rows as MonedaDTO[],
      totalRecords
    };
  }

  async updateMoneda(
    monedaId: number,
    data: MonedaRequestDTO
  ): Promise<MonedaDTO | null> {
    const decimales = data.decimales ?? 2;
    const activo = data.activo ?? true;

    const result = await mysqlClient.query(
      QUERIES.UPDATE_MONEDA,
      [data.codigoIso, data.nombre, data.simbolo, decimales, activo, monedaId]
    );

    return result.rows.length > 0 ? result.rows[0] as MonedaDTO : null;
  }

  async deleteMoneda(monedaId: number): Promise<MonedaDTO | null> {
    const result = await mysqlClient.query(
      QUERIES.DELETE_MONEDA,
      [monedaId]
    );

    return result.rows.length > 0 ? result.rows[0] as MonedaDTO : null;
  }

  async checkMonedaExistsByIso(
    codigoIso: string,
    excludeId: number = 0
  ): Promise<boolean> {
    const result = await mysqlClient.query(
      QUERIES.CHECK_MONEDA_EXISTS_BY_ISO,
      [codigoIso, excludeId]
    );

    const count = parseInt(result.rows[0]?.count || '0');
    return count > 0;
  }
}
```

---

#### 🔧 PASO 4: Crear Modelo de Dominio y Mapper

**Archivo:** `src/domain/models/MonedaDomain.ts`

```typescript
// Modelo de dominio (camelCase)
export interface Moneda {
  monedaId: number;
  codigoIso: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
}

// Parámetros de paginación
export interface PaginationParams {
  pageNumber: number;  // Inicia en 1
  pageSize: number;    // Máximo 500
}

// Respuesta de paginación
export interface PaginationResponse {
  totalElement: number;
  pageSize: number;
  pageNumber: number;
  hasMoreElements: boolean;
}

// Respuesta para listado con paginación
export interface MonedaListData {
  monedas: Moneda[];
  pagination: PaginationResponse;
}
```

**Archivo:** `src/domain/mappers/MonedaMapper.ts`

```typescript
import { MonedaDTO } from '../../repositories/dtos/MonedaDTO';
import { Moneda } from '../models/MonedaDomain';

export class MonedaMapper {

  /**
   * Convertir DTO de BD (snake_case) a Modelo de Dominio (camelCase)
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
   * Convertir lista de DTOs a lista de modelos de dominio
   */
  static toDomainList(dtos: MonedaDTO[]): Moneda[] {
    return dtos.map(dto => this.toDomain(dto));
  }
}
```

---

#### 🔧 PASO 5: Implementar Business Logic

**Archivo:** `src/domain/IMonedaBL.ts`

```typescript
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { Moneda, MonedaListData, PaginationParams } from './models/MonedaDomain';

export interface IMonedaBL {
  createMoneda(data: MonedaRequestDTO): Promise<Moneda>;
  getMonedaById(monedaId: number): Promise<Moneda>;
  listMonedasPaginated(pagination: PaginationParams): Promise<MonedaListData>;
  updateMoneda(monedaId: number, data: MonedaRequestDTO): Promise<Moneda>;
  deleteMoneda(monedaId: number): Promise<Moneda>;
}
```

**Archivo:** `src/domain/MonedaBL.ts`

```typescript
import { IMonedaBL } from './IMonedaBL';
import { IMonedaRepository } from '../repositories/IMonedaRepository';
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { Moneda, MonedaListData, PaginationParams } from './models/MonedaDomain';
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
   * Crear nueva moneda
   */
  async createMoneda(data: MonedaRequestDTO): Promise<Moneda> {
    // 1. Validar datos de entrada
    this.validateMonedaData(data);

    // 2. Verificar que no exista código ISO duplicado
    const exists = await this.monedaRepository.checkMonedaExistsByIso(
      data.codigoIso
    );

    if (exists) {
      throw new ConflictError(
        `Ya existe una moneda con el código ISO: ${data.codigoIso}`
      );
    }

    // 3. Crear en BD
    const monedaDTO = await this.monedaRepository.createMoneda(data);

    // 4. Transformar a modelo de dominio
    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Obtener moneda por ID
   */
  async getMonedaById(monedaId: number): Promise<Moneda> {
    if (!monedaId || monedaId <= 0) {
      throw new ValidationError('El monedaId debe ser un número positivo');
    }

    const monedaDTO = await this.monedaRepository.getMonedaById(monedaId);

    if (!monedaDTO) {
      throw new NotFoundError(`Moneda con ID ${monedaId} no encontrada`);
    }

    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Listar monedas con paginación
   */
  async listMonedasPaginated(
    pagination: PaginationParams
  ): Promise<MonedaListData> {
    // Validar parámetros de paginación
    this.validatePaginationParams(pagination);

    // Obtener datos del repositorio
    const result = await this.monedaRepository.listMonedasPaginated(pagination);

    // Transformar a modelos de dominio
    const monedas = MonedaMapper.toDomainList(result.data);

    // Calcular si hay más elementos
    const totalPages = Math.ceil(result.totalRecords / pagination.pageSize);
    const hasMoreElements = pagination.pageNumber < totalPages;

    return {
      monedas,
      pagination: {
        totalElement: result.totalRecords,
        pageSize: pagination.pageSize,
        pageNumber: pagination.pageNumber,
        hasMoreElements
      }
    };
  }

  /**
   * Actualizar moneda
   */
  async updateMoneda(
    monedaId: number,
    data: MonedaRequestDTO
  ): Promise<Moneda> {
    if (!monedaId || monedaId <= 0) {
      throw new ValidationError('El monedaId debe ser un número positivo');
    }

    this.validateMonedaData(data);

    // Verificar que existe
    const existingMoneda = await this.monedaRepository.getMonedaById(monedaId);
    if (!existingMoneda) {
      throw new NotFoundError(`Moneda con ID ${monedaId} no encontrada`);
    }

    // Verificar que no haya otro con el mismo código ISO
    const exists = await this.monedaRepository.checkMonedaExistsByIso(
      data.codigoIso,
      monedaId
    );

    if (exists) {
      throw new ConflictError(
        `Ya existe otra moneda con el código ISO: ${data.codigoIso}`
      );
    }

    const monedaDTO = await this.monedaRepository.updateMoneda(monedaId, data);

    if (!monedaDTO) {
      throw new NotFoundError(`No se pudo actualizar moneda con ID ${monedaId}`);
    }

    return MonedaMapper.toDomain(monedaDTO);
  }

  /**
   * Eliminar moneda
   */
  async deleteMoneda(monedaId: number): Promise<Moneda> {
    if (!monedaId || monedaId <= 0) {
      throw new ValidationError('El monedaId debe ser un número positivo');
    }

    const monedaDTO = await this.monedaRepository.deleteMoneda(monedaId);

    if (!monedaDTO) {
      throw new NotFoundError(`Moneda con ID ${monedaId} no encontrada`);
    }

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
      throw new ValidationError(
        'El codigoIso debe tener exactamente 3 caracteres (ej: COP, USD, EUR)'
      );
    }

    const codigoIsoUpper = data.codigoIso.toUpperCase();
    if (!/^[A-Z]{3}$/.test(codigoIsoUpper)) {
      throw new ValidationError(
        'El codigoIso debe contener solo letras (ej: COP, USD, EUR)'
      );
    }

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

    // Validar decimales
    if (data.decimales !== undefined) {
      if (data.decimales < 0 || data.decimales > 10) {
        throw new ValidationError('El campo decimales debe estar entre 0 y 10');
      }
    }

    // Validar activo
    if (data.activo !== undefined && typeof data.activo !== 'boolean') {
      throw new ValidationError(
        'El campo activo debe ser un valor booleano (true o false)'
      );
    }
  }

  /**
   * Validar parámetros de paginación
   */
  private validatePaginationParams(pagination: PaginationParams): void {
    if (!Number.isInteger(pagination.pageNumber) || pagination.pageNumber < 1) {
      throw new ValidationError(
        'El parámetro pageNumber debe ser un entero mayor o igual a 1'
      );
    }

    if (!Number.isInteger(pagination.pageSize) || pagination.pageSize < 1) {
      throw new ValidationError(
        'El parámetro pageSize debe ser un entero mayor o igual a 1'
      );
    }

    if (pagination.pageSize > 500) {
      throw new ValidationError(
        'El parámetro pageSize no puede ser mayor a 500'
      );
    }
  }
}
```

---

#### 🔧 PASO 6: Implementar Controller

**Archivo:** `src/controller/IMonedaController.ts`

```typescript
import { APIGatewayProxyResult } from 'aws-lambda';
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { PaginationParams } from '../domain/models/MonedaDomain';

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

  listMonedas(
    pagination: PaginationParams,
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
```

**Archivo:** `src/controller/MonedaController.ts`

```typescript
import { APIGatewayProxyResult } from 'aws-lambda';
import { IMonedaController } from './IMonedaController';
import { IMonedaBL } from '../domain/IMonedaBL';
import { MonedaRequestDTO } from '../repositories/dtos/MonedaDTO';
import { SwaggerResponseBuilder } from '../core/common/SwaggerResponseBuilder';
import { ValidationError, NotFoundError, ConflictError } from '../domain/MonedaBL';
import { ALLOWED_HEADERS_VALUES } from '../core/utils/Constans';
import { PaginationParams } from '../domain/models/MonedaDomain';

export class MonedaController implements IMonedaController {

  constructor(private monedaBL: IMonedaBL) {}

  /**
   * POST /v1/pos/monedas - Crear moneda
   */
  async createMoneda(
    data: MonedaRequestDTO,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      const moneda = await this.monedaBL.createMoneda(data);

      const response = SwaggerResponseBuilder.buildSuccessResponse(
        201,
        moneda,
        messageUuid,
        requestAppId,
        '0000',
        'Success',
        'Resource created successfully'
      );

      return {
        statusCode: 201,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * GET /v1/pos/monedas/{monedaId} - Obtener por ID
   */
  async getMonedaById(
    monedaId: number,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      const moneda = await this.monedaBL.getMonedaById(monedaId);

      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        moneda,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * GET /v1/pos/monedas - Listar con paginación
   */
  async listMonedas(
    pagination: PaginationParams,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      const data = await this.monedaBL.listMonedasPaginated(pagination);

      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        data,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * PUT /v1/pos/monedas/{monedaId} - Actualizar
   */
  async updateMoneda(
    monedaId: number,
    data: MonedaRequestDTO,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      const moneda = await this.monedaBL.updateMoneda(monedaId, data);

      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        moneda,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * DELETE /v1/pos/monedas/{monedaId} - Eliminar
   */
  async deleteMoneda(
    monedaId: number,
    messageUuid: string,
    requestAppId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      const moneda = await this.monedaBL.deleteMoneda(monedaId);

      const response = SwaggerResponseBuilder.buildSuccessResponse(
        200,
        moneda,
        messageUuid,
        requestAppId,
        '0000',
        'Success',
        'Resource deleted successfully'
      );

      return {
        statusCode: 200,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };

    } catch (error: any) {
      return this.handleError(error, messageUuid, requestAppId);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(
    error: any,
    messageUuid: string,
    requestAppId: string
  ): APIGatewayProxyResult {
    console.error('Error in MonedaController:', error);

    // ValidationError → 400 BAD REQUEST
    if (error instanceof ValidationError) {
      const errors = [
        SwaggerResponseBuilder.buildErrorItem('E001', error.message)
      ];

      const response = SwaggerResponseBuilder.buildErrorResponse(
        400,
        errors,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 400,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };
    }

    // NotFoundError → 404 NOT FOUND
    if (error instanceof NotFoundError) {
      const errors = [
        SwaggerResponseBuilder.buildErrorItem('E002', error.message)
      ];

      const response = SwaggerResponseBuilder.buildErrorResponse(
        404,
        errors,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 404,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };
    }

    // ConflictError → 409 CONFLICT
    if (error instanceof ConflictError) {
      const errors = [
        SwaggerResponseBuilder.buildErrorItem('E003', error.message)
      ];

      const response = SwaggerResponseBuilder.buildErrorResponse(
        409,
        errors,
        messageUuid,
        requestAppId
      );

      return {
        statusCode: 409,
        headers: this.getCorsHeaders(),
        body: JSON.stringify(response)
      };
    }

    // Error genérico → 500 INTERNAL SERVER ERROR
    const errors = [
      SwaggerResponseBuilder.buildErrorItem(
        'E999',
        'Internal server error'
      )
    ];

    const response = SwaggerResponseBuilder.buildErrorResponse(
      500,
      errors,
      messageUuid,
      requestAppId
    );

    return {
      statusCode: 500,
      headers: this.getCorsHeaders(),
      body: JSON.stringify(response)
    };
  }

  /**
   * Obtener headers CORS
   */
  private getCorsHeaders(): Record<string, string> {
    return {
      'Content-Type': ALLOWED_HEADERS_VALUES.CONTENT_TYPE,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS_VALUES.ALLOWED_HEADERS,
      'Access-Control-Allow-Origin': ALLOWED_HEADERS_VALUES.ALLOW_ORIGIN,
      'Access-Control-Allow-Methods': ALLOWED_HEADERS_VALUES.ALLOWED_METHODS
    };
  }
}
```

---

## Guía de Testing con SAM CLI

### Opción 1: Testing Local con `sam local invoke`

#### 1. Crear archivo de evento de prueba

**Archivo:** `events/create-moneda-event.json`

```json
{
  "httpMethod": "POST",
  "path": "/v1/pos/monedas",
  "headers": {
    "Content-Type": "application/json",
    "message-uuid": "550e8400-e29b-41d4-a716-446655440000",
    "request-app-id": "POS-ATENEA"
  },
  "body": "{\"codigoIso\":\"COP\",\"nombre\":\"Peso Colombiano\",\"simbolo\":\"$\",\"decimales\":2}",
  "queryStringParameters": null,
  "pathParameters": null
}
```

#### 2. Ejecutar prueba local

```bash
# Build
sam build

# Invocar lambda localmente
sam local invoke MonedasFunction -e events/create-moneda-event.json
```

### Opción 2: Testing con API Local (`sam local start-api`)

#### 1. Iniciar API local

```bash
sam build
sam local start-api --port 3000
```

Output:
```
Mounting MonedasFunction at http://127.0.0.1:3000/v1/pos/monedas [POST]
Mounting MonedasFunction at http://127.0.0.1:3000/v1/pos/monedas [GET]
Mounting MonedasFunction at http://127.0.0.1:3000/v1/pos/monedas/{monedaId} [GET]
Mounting MonedasFunction at http://127.0.0.1:3000/v1/pos/monedas/{monedaId} [PUT]
Mounting MonedasFunction at http://127.0.0.1:3000/v1/pos/monedas/{monedaId} [DELETE]
```

#### 2. Probar con curl

**Test 1: Crear moneda**
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: POS-ATENEA" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso Colombiano",
    "simbolo": "$",
    "decimales": 2
  }'
```

**Test 2: Listar monedas con paginación**
```bash
curl "http://127.0.0.1:3000/v1/pos/monedas?pageNumber=1&pageSize=10" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: POS-ATENEA"
```

**Test 3: Obtener moneda por ID**
```bash
curl http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: POS-ATENEA"
```

**Test 4: Actualizar moneda**
```bash
curl -X PUT http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "Content-Type: application/json" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: POS-ATENEA" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso Colombiano Actualizado",
    "simbolo": "$",
    "decimales": 2,
    "activo": true
  }'
```

**Test 5: Eliminar moneda**
```bash
curl -X DELETE http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: POS-ATENEA"
```

### Opción 3: Testing en AWS (Deployed)

#### 1. Deploy

```bash
sam build
sam deploy
```

#### 2. Obtener URL de la API

```bash
aws cloudformation describe-stacks \
  --stack-name lambda-ateneapos-moneda \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

#### 3. Probar endpoint desplegado

```bash
export API_URL="https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod"

curl -X POST ${API_URL}/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: POS-ATENEA" \
  -d '{
    "codigoIso": "USD",
    "nombre": "Dólar Americano",
    "simbolo": "$",
    "decimales": 2
  }'
```

### Opción 4: Ver Logs en CloudWatch

```bash
# Ver logs en tiempo real
sam logs -n MonedasFunction --stack-name lambda-ateneapos-moneda --tail

# Ver logs de últimos 10 minutos
sam logs -n MonedasFunction --stack-name lambda-ateneapos-moneda --start-time '10min ago'

# Filtrar solo errores
sam logs -n MonedasFunction --stack-name lambda-ateneapos-moneda --filter 'ERROR'
```

---

## Estructura de Archivos

```
lambdaMoneda/
│
├── src/
│   ├── app.ts                              # Lambda Handler principal
│   │
│   ├── controller/
│   │   ├── MonedaController.ts
│   │   └── IMonedaController.ts
│   │
│   ├── domain/
│   │   ├── MonedaBL.ts                     # Lógica de negocio
│   │   ├── IMonedaBL.ts
│   │   ├── mappers/
│   │   │   └── MonedaMapper.ts             # DTO → Domain
│   │   └── models/
│   │       └── MonedaDomain.ts             # Modelos de dominio
│   │
│   ├── repositories/
│   │   ├── MonedaRepository.ts             # Acceso a datos
│   │   ├── IMonedaRepository.ts
│   │   └── dtos/
│   │       └── MonedaDTO.ts                # DTOs de BD
│   │
│   ├── core/
│   │   ├── common/
│   │   │   ├── SwaggerResponseBuilder.ts   # Formato respuestas Swagger
│   │   │   ├── swaggerTypes.ts
│   │   │   ├── ResponseWriter.ts
│   │   │   ├── Helper.ts
│   │   │   ├── types.ts
│   │   │   └── QueryFailException.ts
│   │   ├── config/
│   │   │   └── index.ts                    # Configuración por ambiente
│   │   └── utils/
│   │       ├── Constans.ts                 # Queries SQL y constantes
│   │       └── DatabaseManager.ts          # Pool PostgreSQL
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── events/                                  # Eventos de prueba SAM
│   ├── create-moneda-event.json
│   ├── list-monedas-event.json
│   └── get-moneda-event.json
│
├── template.yaml                            # SAM template (infraestructura)
├── samconfig.toml
├── package.json
├── ARQUITECTURA.md                          # Este archivo
├── TEST_COMMANDS.md
├── CONFIGURACION_CORS.md
└── GIT_WORKFLOW.md
```

---

## Checklist de Implementación

### Para crear un nuevo endpoint:

- [ ] **PASO 1:** Crear DTOs en `/repositories/dtos/`
  - [ ] Request DTO (camelCase)
  - [ ] Response DTO (snake_case)

- [ ] **PASO 2:** Agregar queries en `Constans.ts`
  - [ ] Query principal con placeholders $1, $2...
  - [ ] Queries auxiliares si son necesarias
  - [ ] Agregar códigos HTTP si se necesitan nuevos

- [ ] **PASO 3:** Implementar Repository
  - [ ] Crear interface `IXxxRepository.ts`
  - [ ] Implementar `XxxRepository.ts`
  - [ ] Usar parametrización PostgreSQL ($1, $2...)
  - [ ] Manejar resultado con `result.rows`

- [ ] **PASO 4:** Crear modelos de dominio
  - [ ] Definir interfaces en `/domain/models/` (camelCase)
  - [ ] Incluir campos calculados si hay lógica de negocio

- [ ] **PASO 5:** Crear Mapper
  - [ ] Implementar en `/domain/mappers/`
  - [ ] Convertir snake_case → camelCase

- [ ] **PASO 6:** Implementar Business Logic
  - [ ] Crear interface `IXxxBL.ts`
  - [ ] Implementar `XxxBL.ts`
  - [ ] Agregar validaciones de entrada
  - [ ] Aplicar reglas de negocio
  - [ ] Lanzar excepciones tipadas

- [ ] **PASO 7:** Implementar Controller
  - [ ] Crear interface `IXxxController.ts`
  - [ ] Implementar `XxxController.ts`
  - [ ] Usar SwaggerResponseBuilder
  - [ ] Manejar errores con try-catch
  - [ ] Retornar códigos HTTP apropiados

- [ ] **PASO 8:** Integrar en `app.ts`
  - [ ] Validar headers (message-uuid, request-app-id)
  - [ ] Agregar ruta (path + method)
  - [ ] Instanciar con DI
  - [ ] Agregar CORS headers

- [ ] **PASO 9:** Actualizar `template.yaml`
  - [ ] Agregar evento API Gateway
  - [ ] Verificar configuración de lambda

- [ ] **PASO 10:** Testing
  - [ ] Crear archivos de evento en `/events/`
  - [ ] Probar con `sam local invoke`
  - [ ] Probar con `sam local start-api`
  - [ ] Deploy y probar en AWS
  - [ ] Verificar logs en CloudWatch

---

## Mejores Prácticas

### Testing

1. Siempre testear localmente antes de deploy
2. Crear eventos de prueba para cada endpoint
3. Testear casos de éxito y error
4. Verificar logs en CloudWatch después de deploy
5. Usar Postman/Insomnia para testing manual

### Desarrollo

1. Seguir el patrón de capas estrictamente
2. Usar interfaces para todos los componentes
3. Validar en Business Logic, no en Controller
4. PostgreSQL: usar parametrización ($1, $2...) para evitar SQL injection
5. Lanzar excepciones tipadas (ValidationError, NotFoundError, ConflictError)
6. Usar SwaggerResponseBuilder para respuestas estandarizadas
7. Agregar logs para debugging

### Deployment

1. Revisar template.yaml antes de deploy
2. Verificar que credenciales no estén hardcodeadas
3. Testear en LOCAL → Deploy a DEV → QA → PROD
4. Monitorear logs después de deployment
5. Hacer rollback si hay errores críticos

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
sam list stack-outputs --stack-name lambda-ateneapos-moneda
```

### Testing Local

```bash
# Invocar lambda con evento
sam local invoke MonedasFunction -e events/create-moneda-event.json

# Iniciar API local
sam local start-api --port 3000

# Iniciar API con debug
sam local start-api --port 3000 --debug
```

### Logs

```bash
# Ver logs en tiempo real
sam logs -n MonedasFunction --stack-name lambda-ateneapos-moneda --tail

# Ver logs de últimos 10 minutos
sam logs -n MonedasFunction --stack-name lambda-ateneapos-moneda --start-time '10min ago'

# Filtrar logs
sam logs -n MonedasFunction --stack-name lambda-ateneapos-moneda --filter 'ERROR'
```

### Cleanup

```bash
# Eliminar stack completo
sam delete --stack-name lambda-ateneapos-moneda --region us-east-1

# Sin confirmación
sam delete --stack-name lambda-ateneapos-moneda --region us-east-1 --no-prompts
```

---

**Fin del documento**

Este documento describe la arquitectura completa del proyecto Lambda Moneda para el Sistema POS Atenea, implementado con TypeScript, PostgreSQL y siguiendo principios de Clean Architecture.
