# Integracion Kommo - Fase 1

Esta fase deja lista la base tecnica para conectar Kommo con el ERP:

- API protegida por llave de integracion
- recepcion de webhooks de Kommo
- sincronizacion inicial de contactos y leads
- consulta de clientes, ordenes, facturas y cotizaciones
- generacion de link de WhatsApp para facturas

## Variables de entorno

Configurar en `.env`:

```env
KOMMO_INTEGRATION_KEY=tu_llave_de_integracion
KOMMO_WEBHOOK_SECRET=tu_secreto_de_webhook
KOMMO_DEFAULT_PIPELINE_SLUG=
```

## Autenticacion de la API

Enviar cualquiera de estas opciones:

- Header `Authorization: Bearer {KOMMO_INTEGRATION_KEY}`
- Header `X-Integration-Key: {KOMMO_INTEGRATION_KEY}`

## Endpoints disponibles

Base local:

```text
/api/integrations/kommo
```

### Ping

```http
GET /api/integrations/kommo/ping
```

### Buscar clientes

```http
GET /api/integrations/kommo/contacts/search?phone=50760000000
GET /api/integrations/kommo/contacts/search?email=cliente@correo.com
GET /api/integrations/kommo/contacts/search?query=Spacio
```

### Sincronizar contacto desde Kommo

```http
POST /api/integrations/kommo/contacts/sync
Content-Type: application/json

{
  "kommo_contact_id": "987654",
  "name": "Juan Perez",
  "email": "juan@correo.com",
  "phone": "50760000000"
}
```

### Consultar orden por numero

```http
GET /api/integrations/kommo/orders/OV-000001
```

Respuesta esperada:

- estado de la orden
- estado de diseno
- fecha de entrega
- saldo pendiente
- tracking link
- factura asociada si existe

### Listar facturas por cliente

```http
GET /api/integrations/kommo/invoices/by-contact/1
```

### Listar cotizaciones por cliente

```http
GET /api/integrations/kommo/quotes/by-contact/1
```

### Generar link de WhatsApp para factura

```http
POST /api/integrations/kommo/invoices/15/share-whatsapp
```

Retorna:

- `share_url`
- `message`
- `phone`
- `whatsapp_url`

### Sincronizar lead desde Kommo

```http
POST /api/integrations/kommo/leads/sync
Content-Type: application/json

{
  "kommo_lead_id": "123456",
  "kommo_contact_id": "987654",
  "title": "Cliente interesado en impresion",
  "company_name": "Spacio Arte",
  "contact_name": "Juan Perez",
  "email": "juan@correo.com",
  "phone": "50760000000",
  "expected_value": 250.00,
  "probability": 40,
  "notes": "Lead sincronizado desde widget"
}
```

## Webhook de Kommo

Kommo debe apuntar a:

```text
POST /api/integrations/kommo/webhooks/events?secret={KOMMO_WEBHOOK_SECRET}
```

Actualmente procesa:

- `contacts.add`
- `contacts.update`
- `leads.add`
- `leads.update`

Cada webhook recibido queda guardado en:

- `kommo_webhook_receipts`

Los mapeos Kommo <-> ERP quedan guardados en:

- `kommo_entity_links`

## Tablas agregadas

- `kommo_entity_links`
- `kommo_webhook_receipts`

## Siguiente fase recomendada

- OAuth real con Kommo
- widget privado en lead/contact card
- acciones directas desde widget
- sincronizacion de etapas bidireccional
- envio por WhatsApp API en vez de solo `wa.me`
