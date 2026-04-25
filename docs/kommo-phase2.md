# Kommo - Fase 2

La fase 2 agrega un widget privado de Kommo conectado a la API del ERP.

## Archivos del widget

- Carpeta fuente: `integrations/kommo-widget/spacioarte_widget`
- Paquete listo para subir: `integrations/kommo-widget/spacioarte_widget.zip`

## Ubicaciones activas del widget

- `settings`
- `lcard-1`
- `ccard-1`

Eso significa:

- el widget aparece en la configuracion de Kommo
- se muestra en la barra lateral derecha del lead
- se muestra en la barra lateral derecha del contacto

## Que hace esta fase

- intenta identificar al cliente del ERP desde la tarjeta actual de Kommo
- permite sincronizar el lead o contacto actual al ERP
- muestra facturas del cliente
- muestra cotizaciones del cliente
- permite consultar una orden por numero
- genera enlace de WhatsApp para una factura
- abre el portal de tracking de la orden cuando existe

## Instalacion en Kommo

1. Crear o abrir tu integracion privada en Kommo.
2. Subir el archivo `spacioarte_widget.zip`.
3. Instalar el widget en la cuenta.
4. En la pantalla de settings del widget llenar:

- `ERP base URL`
- `ERP integration key`
- `Default order prefix` opcional, por ejemplo `OV-`

## Valores a usar desde este ERP

- `ERP integration key`: valor de `KOMMO_INTEGRATION_KEY` en `.env`
- `ERP base URL`: la URL publica HTTPS del ERP

Ejemplo:

```text
https://erp.tudominio.com
```

## Requisitos tecnicos

- El ERP debe estar publicado por HTTPS
- Kommo debe poder alcanzar la URL del ERP desde internet
- CORS para dominios de Kommo ya fue habilitado en `config/cors.php`

## Endpoints consumidos por el widget

- `GET /api/integrations/kommo/contacts/search`
- `POST /api/integrations/kommo/contacts/sync`
- `POST /api/integrations/kommo/leads/sync`
- `GET /api/integrations/kommo/invoices/by-contact/{contacto}`
- `GET /api/integrations/kommo/quotes/by-contact/{contacto}`
- `POST /api/integrations/kommo/invoices/{factura}/share-whatsapp`
- `GET /api/integrations/kommo/orders/{numeroOrden}`

## Siguiente fase recomendada

- OAuth real con Kommo
- tomar contacto y lead actual usando mas datos del Card SDK
- guardar configuracion del widget tambien del lado del ERP
- agregar boton de copiar texto de WhatsApp
- crear vista de cotizacion compartible y PDF publico
- enviar mensajes de estado hacia WhatsApp Cloud API
