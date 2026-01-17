# Configuración CORS para Lambdas - Sistema POS Atenea

## Resumen
Documento con los ajustes necesarios para habilitar CORS en las Lambdas que serán consumidas desde Angular u otros frontends cross-origin.

---

## 1. Ajustes en `src/app.ts` (Lambda Handler)

### Agregar Handler para OPTIONS (CORS Preflight)

**Ubicación:** Después de validar Content-Type y antes de Dependency Injection

```typescript
// =========================
// OPTIONS - CORS Preflight
// =========================
if (method === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: getCorsHeaders(),
    body: JSON.stringify({ message: 'CORS preflight successful' })
  };
}
```

**Líneas aproximadas:** Después de la validación de Content-Type (línea ~92)

**Explicación:**
- Cuando el navegador hace una petición cross-origin con headers personalizados, primero envía OPTIONS
- Este handler responde con código 200 y los headers CORS necesarios
- Es obligatorio para que Angular pueda enviar las peticiones reales (GET, POST, PUT, PATCH, DELETE)

---

## 2. Ajustes en `src/core/utils/Constans.ts`

### Actualizar Enum ALLOWED_HEADERS_VALUES

**Buscar:**
```typescript
export enum ALLOWED_HEADERS_VALUES {
  CONTENT_TYPE = 'application/json',
  ALLOWED_HEADERS = '*',
  ALLOW_ORIGIN = '*',
  ALLOWED_METHODS = 'POST,GET,PUT,DELETE,OPTIONS',
}
```

**Reemplazar por:**
```typescript
export enum ALLOWED_HEADERS_VALUES {
  CONTENT_TYPE = 'application/json',
  ALLOWED_HEADERS = 'Content-Type,message-uuid,request-app-id,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  ALLOW_ORIGIN = '*',
  ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}
```

**Cambios realizados:**
- ✅ `ALLOWED_HEADERS`: Explícitamente listados los headers personalizados permitidos
- ✅ `ALLOWED_METHODS`: **Agregado PATCH** y asegurado que OPTIONS esté incluido
- ✅ Orden recomendado: GET,POST,PUT,PATCH,DELETE,OPTIONS

**Headers personalizados importantes:**
- `message-uuid`: Header requerido por el contrato Swagger
- `request-app-id`: Header requerido por el contrato Swagger
- `Content-Type`: Requerido para POST/PUT/PATCH
- Otros headers de AWS para autenticación futura

---

## 3. Verificar Controller (Ya Debe Estar Correcto)

### Método privado `getCorsHeaders()`

**Ubicación:** `src/controller/[Nombre]Controller.ts`

```typescript
private getCorsHeaders(): Record<string, string> {
  return {
    'Content-Type': ALLOWED_HEADERS_VALUES.CONTENT_TYPE,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS_VALUES.ALLOWED_HEADERS,
    'Access-Control-Allow-Origin': ALLOWED_HEADERS_VALUES.ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': ALLOWED_HEADERS_VALUES.ALLOWED_METHODS
  };
}
```

**Importante:** Verificar que TODOS los métodos del controller usen headers CORS:
- ✅ `createRecurso()` (POST)
- ✅ `listRecursos()` (GET)
- ✅ `getRecursoById()` (GET)
- ✅ `updateRecurso()` (PUT)
- ✅ `patchRecurso()` (PATCH) ← **IMPORTANTE**
- ✅ `deleteRecurso()` (DELETE)
- ✅ `handleError()` (manejo de errores)

```typescript
return {
  statusCode: 200, // o el código que corresponda
  headers: this.getCorsHeaders(), // ← IMPORTANTE en todos
  body: JSON.stringify(response)
};
```

---

## 4. Configuración en API Gateway Global (Manual)

**IMPORTANTE:** Como usamos un API Gateway global que gestiona todas las lambdas, la configuración CORS debe hacerse ahí.

### Pasos en AWS Console:

1. **Navegar a API Gateway**
   - Ir a: AWS Console → API Gateway
   - Seleccionar: Tu API REST global (la que apunta a eat.ateneapos.com)

2. **Habilitar CORS en el Recurso**
   - Selecciona el recurso raíz o el recurso específico (ej: `/v1/pos/proveedores`, `/v1/pos/mesas`, etc.)
   - Click en **Actions** → **Enable CORS**

3. **Configurar Headers CORS**
   ```
   Access-Control-Allow-Origin: *

   Access-Control-Allow-Headers: Content-Type,message-uuid,request-app-id,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token

   Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
   ```

   **⚠️ IMPORTANTE:** Asegurarse que **PATCH** esté en la lista de métodos

4. **Aplicar y Desplegar**
   - Click en **Enable CORS and replace existing CORS headers**
   - **MUY IMPORTANTE:** Ir a **Actions** → **Deploy API** → Seleccionar el stage (Prod/Dev)
   - Sin este deploy, los cambios NO se aplicarán

---

## 5. Template SAM (Opcional - Solo si NO usas API Gateway Global)

**NOTA:** Este paso NO es necesario si ya tienes un API Gateway global configurado.

Si desplegaras la Lambda con su propio API Gateway, agregar en `template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Lambda para gestion de [recurso] - Sistema POS Atenea

Globals:
  Api:
    Cors:
      AllowMethods: "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,message-uuid,request-app-id,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowOrigin: "'*'"

Resources:
  # ... resto de la configuración
```

**Nota:** PATCH debe estar explícitamente en `AllowMethods`

---

## 6. Checklist de Implementación

Para cada nueva Lambda que necesite CORS:

- [ ] ✅ **app.ts**: Agregar handler OPTIONS antes de Dependency Injection
- [ ] ✅ **app.ts**: Verificar que `getCorsHeaders()` se use en endpoint 404 y errores 500
- [ ] ✅ **Constans.ts**: Actualizar `ALLOWED_HEADERS_VALUES` con headers explícitos
- [ ] ✅ **Constans.ts**: Incluir **PATCH** en `ALLOWED_METHODS` (muy importante)
- [ ] ✅ **Controller**: Verificar que `getCorsHeaders()` esté en todos los returns (GET, POST, PUT, PATCH, DELETE)
- [ ] ✅ **Controller**: Verificar que método `patchRecurso()` retorne headers CORS
- [ ] ✅ **Controller**: Verificar que `handleError()` use `getCorsHeaders()`
- [ ] ✅ **API Gateway**: Configurar CORS en el recurso con **PATCH** incluido
- [ ] ✅ **API Gateway**: Deploy API después de configurar CORS
- [ ] ✅ **Testing**: Probar desde navegador/Angular (GET, POST, PUT, PATCH, DELETE)

---

## 7. Ejemplo de Pruebas con curl

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://eat.ateneapos.com/v1/pos/mesas \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: message-uuid,request-app-id" \
  -v

# Test GET
curl -X GET "https://eat.ateneapos.com/v1/pos/mesas?clienteId=1&pageSize=10&pageNumber=1" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: app-pos-frontend" \
  -v

# Test POST
curl -X POST https://eat.ateneapos.com/v1/pos/mesas \
  -H "Content-Type: application/json" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: app-pos-frontend" \
  -d '{"clienteId":1,"numero":5,"estado":"libre"}' \
  -v

# Test PATCH (actualización parcial)
curl -X PATCH https://eat.ateneapos.com/v1/pos/mesas/10?clienteId=1 \
  -H "Content-Type: application/json" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: app-pos-frontend" \
  -d '{"estado":"ocupada"}' \
  -v

# Test PUT (actualización completa)
curl -X PUT https://eat.ateneapos.com/v1/pos/mesas/10?clienteId=1 \
  -H "Content-Type: application/json" \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: app-pos-frontend" \
  -d '{"numero":5,"estado":"ocupada"}' \
  -v

# Test DELETE
curl -X DELETE https://eat.ateneapos.com/v1/pos/mesas/10?clienteId=1 \
  -H "message-uuid: 550e8400-e29b-41d4-a716-446655440000" \
  -H "request-app-id: app-pos-frontend" \
  -v
```

Buscar en todas las respuestas:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
< Access-Control-Allow-Headers: Content-Type,message-uuid,request-app-id,...
```

---

## 8. Errores Comunes y Soluciones

### Error: "No 'Access-Control-Allow-Origin' header is present"
**Causa:** API Gateway no tiene CORS configurado o no se hizo deploy
**Solución:** Configurar CORS en API Gateway y hacer deploy del API

### Error: "Response to preflight request doesn't pass access control check"
**Causa:** Handler OPTIONS no está configurado o retorna error
**Solución:** Verificar que el handler OPTIONS esté ANTES de validación de headers requeridos

### Error: "Method PATCH is not allowed by Access-Control-Allow-Methods"
**Causa:** PATCH no está en la configuración CORS
**Solución:**
1. Verificar que en `Constans.ts` esté: `ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'`
2. Verificar en API Gateway que PATCH esté habilitado
3. Hacer deploy del API Gateway después del cambio

### Error: Headers requeridos incluso en OPTIONS
**Causa:** La validación de headers está antes del handler OPTIONS
**Solución:** Mover el handler OPTIONS para que sea lo primero que se evalúe después del método

---

## 9. Flujo Completo CORS (Ejemplo con PATCH)

```
1. Angular hace petición PATCH con headers personalizados
   ↓
2. Navegador detecta cross-origin + headers personalizados + método no simple (PATCH)
   ↓
3. Navegador envía OPTIONS (preflight) automáticamente
   ↓
4. API Gateway recibe OPTIONS
   ↓
5. API Gateway (con CORS habilitado) pasa a Lambda
   ↓
6. Lambda handler detecta method === 'OPTIONS'
   ↓
7. Lambda retorna 200 con headers CORS (incluyendo PATCH en Allow-Methods)
   ↓
8. Navegador recibe 200 + headers OK + PATCH permitido
   ↓
9. Navegador envía petición PATCH real
   ↓
10. Lambda procesa PATCH y retorna con headers CORS
    ↓
11. Angular recibe la respuesta ✅
```

---

## 10. Diferencia entre PUT y PATCH

### PUT (Actualización Completa)
- Envía TODOS los campos del recurso
- Reemplaza completamente el objeto
- Campos no enviados se pueden establecer en null o default

### PATCH (Actualización Parcial)
- Envía SOLO los campos a actualizar
- Campos no enviados NO se modifican
- Más eficiente para cambios pequeños
- Usa `COALESCE()` en SQL para mantener valores existentes

**Ejemplo:**
```sql
-- Query PATCH (solo actualiza lo enviado)
UPDATE mesa
SET numero = COALESCE($1, numero),      -- Si $1 es null, mantiene valor actual
    estado = COALESCE($2, estado)       -- Si $2 es null, mantiene valor actual
WHERE mesa_id = $3
RETURNING *
```

**Ambos métodos requieren CORS:**
- Ambos deben estar en `ALLOWED_METHODS`
- Ambos requieren preflight OPTIONS
- Ambos necesitan headers CORS en la respuesta

---

## 11. Notas Importantes

### Seguridad en Producción
- Actualmente `AllowOrigin: '*'` permite cualquier origen
- En producción considerar restringir a dominios específicos:
  ```typescript
  ALLOW_ORIGIN = 'https://app.ateneapos.com,https://admin.ateneapos.com'
  ```

### Headers Personalizados
- `message-uuid` y `request-app-id` son obligatorios según contrato Swagger
- Aplican para todos los métodos: GET, POST, PUT, PATCH, DELETE
- Para GET desde navegador podrían hacerse opcionales generando valores por defecto
- Para POST/PUT/PATCH/DELETE mantenerlos obligatorios

### Performance
- Handler OPTIONS es muy liviano (solo headers, sin lógica)
- No afecta concurrencia ni performance de la Lambda
- Costo adicional insignificante
- PATCH suele ser más eficiente que PUT (menos datos transferidos)

### Métodos HTTP y CORS
- **Métodos simples** (GET, POST básico): No requieren preflight
- **Métodos no simples** (PUT, PATCH, DELETE, POST con headers custom): Requieren preflight
- **OPTIONS**: Siempre debe estar habilitado para CORS

---

## 12. Resumen de Archivos Modificados

### Archivo 1: `src/app.ts`
- Agregado handler OPTIONS (líneas ~94-103)
- Debe estar ANTES de Dependency Injection
- Debe estar DESPUÉS de validación Content-Type

### Archivo 2: `src/core/utils/Constans.ts`
- Actualizado `ALLOWED_METHODS` para incluir PATCH
- Actualizado `ALLOWED_HEADERS` con lista explícita
- Líneas ~227-232

### Archivo 3: `src/controller/[Nombre]Controller.ts`
- Método `getCorsHeaders()` debe estar presente
- Todos los métodos (GET, POST, PUT, PATCH, DELETE) usan `getCorsHeaders()`
- `handleError()` también usa `getCorsHeaders()`

### Archivo 4: API Gateway (Manual en AWS Console)
- Configuración CORS con PATCH incluido
- Deploy del API después de configurar

---

**Fecha de creación:** 2026-01-15
**Versión:** 1.0
**Aplicado en:** Lambda Mesas (lambda-ateneapos-mesa)
**Métodos soportados:** GET, POST, PUT, PATCH, DELETE, OPTIONS
**Pendiente aplicar en:** Lambda Proveedores, Lambda Productos, etc.
