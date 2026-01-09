# Comandos de Testing para Lambda Moneda

## Pre-requisitos

1. **Build del proyecto:**
```bash
sam build
```

2. **Iniciar API local:**
```bash
sam local start-api --port 3000
```

Esto levantará el API Gateway en `http://127.0.0.1:3000`

---

## Testing con CURL

### 1. POST - Crear Moneda

**Crear Peso Colombiano:**
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso Colombiano",
    "simbolo": "$",
    "decimales": 2,
    "activo": true
  }'
```

**Crear Dólar Estadounidense:**
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "USD",
    "nombre": "Dólar Estadounidense",
    "simbolo": "$",
    "decimales": 2,
    "activo": true
  }'
```

**Crear Euro:**
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "EUR",
    "nombre": "Euro",
    "simbolo": "€",
    "decimales": 2,
    "activo": true
  }'
```

**Respuesta esperada (201 CREATED):**
```json
{
  "headers": {
    "httpStatusCode": 201,
    "httpStatusDesc": "CREATED",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
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

---

### 2. GET - Listar todas las Monedas

```bash
curl -X GET http://127.0.0.1:3000/v1/pos/monedas \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd"
```

**Respuesta esperada (200 OK):**
```json
{
  "headers": {
    "httpStatusCode": 200,
    "httpStatusDesc": "OK",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
  },
  "messageResponse": {
    "responseCode": "0000",
    "responseMessage": "Success",
    "responseDetails": "Operation completed successfully"
  },
  "data": {
    "monedas": [
      {
        "monedaId": 1,
        "codigoIso": "COP",
        "nombre": "Peso Colombiano",
        "simbolo": "$",
        "decimales": 2,
        "activo": true
      },
      {
        "monedaId": 2,
        "codigoIso": "USD",
        "nombre": "Dólar Estadounidense",
        "simbolo": "$",
        "decimales": 2,
        "activo": true
      }
    ]
  }
}
```

---

### 3. GET - Consultar Moneda por ID

```bash
# Consultar moneda con ID 1
curl -X GET http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd"
```

**Respuesta esperada (200 OK):**
```json
{
  "headers": {
    "httpStatusCode": 200,
    "httpStatusDesc": "OK",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
  },
  "messageResponse": {
    "responseCode": "0000",
    "responseMessage": "Success",
    "responseDetails": "Operation completed successfully"
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

**Error - Moneda no encontrada (404):**
```bash
curl -X GET http://127.0.0.1:3000/v1/pos/monedas/999 \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd"
```

**Respuesta esperada (404 NOT FOUND):**
```json
{
  "headers": {
    "httpStatusCode": 404,
    "httpStatusDesc": "NOT_FOUND",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
  },
  "messageResponse": {
    "responseCode": "0404",
    "responseMessage": "Not Found",
    "responseDetails": "Resource not found"
  },
  "errors": [
    {
      "errorCode": "E002",
      "errorDetail": "Moneda con ID 999 no encontrada"
    }
  ]
}
```

---

### 4. PUT - Actualizar Moneda

```bash
# Actualizar moneda con ID 1
curl -X PUT http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso Colombiano Actualizado",
    "simbolo": "COL$",
    "decimales": 2,
    "activo": true
  }'
```

**Respuesta esperada (200 OK):**
```json
{
  "headers": {
    "httpStatusCode": 200,
    "httpStatusDesc": "OK",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
  },
  "messageResponse": {
    "responseCode": "0000",
    "responseMessage": "Success",
    "responseDetails": "Operation completed successfully"
  },
  "data": {
    "monedaId": 1,
    "codigoIso": "COP",
    "nombre": "Peso Colombiano Actualizado",
    "simbolo": "COL$",
    "decimales": 2,
    "activo": true
  }
}
```

---

### 5. DELETE - Eliminar Moneda

```bash
# Eliminar moneda con ID 1
curl -X DELETE http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd"
```

**Respuesta esperada (200 OK) - Retorna la data eliminada:**
```json
{
  "headers": {
    "httpStatusCode": 200,
    "httpStatusDesc": "OK",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
  },
  "messageResponse": {
    "responseCode": "0000",
    "responseMessage": "Success",
    "responseDetails": "Resource deleted successfully"
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

---

## Testing de Validaciones (Errores)

### Error 400 - Código ISO inválido (menos de 3 caracteres)
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "CO",
    "nombre": "Peso",
    "simbolo": "$"
  }'
```

**Respuesta esperada (400 BAD REQUEST):**
```json
{
  "headers": {
    "httpStatusCode": 400,
    "httpStatusDesc": "BAD_REQUEST",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
  },
  "messageResponse": {
    "responseCode": "0400",
    "responseMessage": "Bad Request",
    "responseDetails": "Invalid or malformed request data"
  },
  "errors": [
    {
      "errorCode": "E001",
      "errorDetail": "El codigoIso debe tener exactamente 3 caracteres (ej: COP, USD, EUR)"
    }
  ]
}
```

### Error 400 - Campo requerido faltante
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "COP",
    "simbolo": "$"
  }'
```

**Respuesta esperada:**
```json
{
  "errors": [
    {
      "errorCode": "E001",
      "errorDetail": "El campo nombre es requerido"
    }
  ]
}
```

### Error 409 - Código ISO duplicado
```bash
# Primero crear una moneda
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso Colombiano",
    "simbolo": "$"
  }'

# Intentar crear otra con el mismo código ISO
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: c4e6bd04-5149-11e7-b114-a2f933d5fe66" \
  -H "request-app-id: acxff62e-6f12-42de-9012-1e7304418abd" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso Colombiano 2",
    "simbolo": "$"
  }'
```

**Respuesta esperada (409 CONFLICT):**
```json
{
  "headers": {
    "httpStatusCode": 409,
    "httpStatusDesc": "CONFLICT",
    "messageUuid": "c4e6bd04-5149-11e7-b114-a2f933d5fe66",
    "requestDatetime": "2026-01-07T...",
    "requestAppId": "acxff62e-6f12-42de-9012-1e7304418abd"
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

### Error 400 - Headers faltantes
```bash
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -d '{
    "codigoIso": "COP",
    "nombre": "Peso",
    "simbolo": "$"
  }'
```

**Respuesta esperada (400 BAD REQUEST):**
```json
{
  "errors": [
    {
      "errorCode": "E000",
      "errorDetail": "Headers requeridos: message-uuid y request-app-id"
    }
  ]
}
```

---

## Secuencia Completa de Testing

Ejecuta estos comandos en orden para probar todo el flujo CRUD:

```bash
# 1. Crear 3 monedas
curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: test-uuid-001" \
  -H "request-app-id: test-app-001" \
  -d '{"codigoIso": "COP", "nombre": "Peso Colombiano", "simbolo": "$", "decimales": 2}'

curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: test-uuid-002" \
  -H "request-app-id: test-app-001" \
  -d '{"codigoIso": "USD", "nombre": "Dólar", "simbolo": "$", "decimales": 2}'

curl -X POST http://127.0.0.1:3000/v1/pos/monedas \
  -H "Content-Type: application/json" \
  -H "message-uuid: test-uuid-003" \
  -H "request-app-id: test-app-001" \
  -d '{"codigoIso": "EUR", "nombre": "Euro", "simbolo": "€", "decimales": 2}'

# 2. Listar todas
curl -X GET http://127.0.0.1:3000/v1/pos/monedas \
  -H "message-uuid: test-uuid-004" \
  -H "request-app-id: test-app-001"

# 3. Consultar una específica (ID 1)
curl -X GET http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: test-uuid-005" \
  -H "request-app-id: test-app-001"

# 4. Actualizar (ID 1)
curl -X PUT http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "Content-Type: application/json" \
  -H "message-uuid: test-uuid-006" \
  -H "request-app-id: test-app-001" \
  -d '{"codigoIso": "COP", "nombre": "Peso Colombiano Actualizado", "simbolo": "COL$", "decimales": 2}'

# 5. Verificar actualización
curl -X GET http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: test-uuid-007" \
  -H "request-app-id: test-app-001"

# 6. Eliminar (ID 1)
curl -X DELETE http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: test-uuid-008" \
  -H "request-app-id: test-app-001"

# 7. Verificar eliminación (debe dar 404)
curl -X GET http://127.0.0.1:3000/v1/pos/monedas/1 \
  -H "message-uuid: test-uuid-009" \
  -H "request-app-id: test-app-001"
```

---

## Notas Importantes

1. **Headers requeridos:** Todos los endpoints de moneda requieren:
   - `message-uuid`: UUID de trazabilidad
   - `request-app-id`: UUID de la aplicación

2. **Content-Type:** Para POST y PUT, siempre incluir:
   - `Content-Type: application/json`

3. **Formato de respuesta:** Todas las respuestas siguen el formato Swagger definido en el contrato

4. **Base de datos:** Asegúrate de que la tabla `moneda` exista antes de probar:
   ```sql
   CREATE TABLE moneda (
       moneda_id INT AUTO_INCREMENT PRIMARY KEY,
       codigo_iso VARCHAR(3) NOT NULL UNIQUE,
       nombre VARCHAR(50) NOT NULL,
       simbolo VARCHAR(10) NOT NULL,
       decimales INT NOT NULL DEFAULT 2,
       activo BOOLEAN DEFAULT TRUE
   );
   ```
