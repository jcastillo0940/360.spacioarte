# Kommo - Fase 3

La fase 3 agrega OAuth real de Kommo en el ERP y conecta el widget a ese estado.

## Lo nuevo del backend

- almacenamiento de instalaciones OAuth en `kommo_installations`
- callback publico para recibir `code` y `referer/referrer`
- refresh manual del token desde API
- webhook de revocacion de acceso
- endpoint de estado por subdominio para que el widget sepa si la cuenta ya esta conectada

## Variables nuevas

Configurar en `.env`:

```env
KOMMO_CLIENT_ID=
KOMMO_CLIENT_SECRET=
KOMMO_REDIRECT_URI=
KOMMO_OAUTH_SUCCESS_REDIRECT=
```

## Rutas nuevas

### Publicas

```text
GET /integrations/kommo/oauth/callback
GET /integrations/kommo/oauth/revoked
```

### Protegidas con KOMMO_INTEGRATION_KEY

```text
GET  /api/integrations/kommo/oauth/status
GET  /api/integrations/kommo/oauth/start-url
POST /api/integrations/kommo/oauth/refresh
```

## Flujo esperado

1. Crear la integracion privada en Kommo.
2. Configurar el `Redirect URL` de Kommo apuntando a:

```text
https://tu-erp.com/integrations/kommo/oauth/callback
```

3. Configurar el `Access revoked notification web hook` apuntando a:

```text
https://tu-erp.com/integrations/kommo/oauth/revoked
```

4. Guardar en `.env`:

- `KOMMO_CLIENT_ID`
- `KOMMO_CLIENT_SECRET`
- `KOMMO_REDIRECT_URI`

5. Abrir el widget en una tarjeta de Kommo.
6. Si la cuenta no esta conectada, usar `Connect Kommo account`.
7. Kommo redirige al callback del ERP.
8. El ERP intercambia `code` por `access_token` y `refresh_token`.
9. La instalacion queda guardada en `kommo_installations`.

## Datos que guarda el ERP

- cuenta de Kommo
- subdominio
- referer/base domain
- scopes
- access token
- refresh token
- expiracion
- fechas de autorizacion y refresh
- estado de revocacion

## Lo nuevo del widget

El widget ahora muestra:

- subdominio actual de Kommo
- estado OAuth de esa cuenta
- enlace para conectar la cuenta cuando falta autorizacion

## Limitacion actual

La fase 3 deja el OAuth operativo del lado del ERP, pero no consume aun la API de Kommo para:

- leer leads directamente por token del servidor
- actualizar stages en Kommo
- escribir notas/comentarios en Kommo

Eso quedaria para la siguiente fase de sincronizacion bidireccional.
