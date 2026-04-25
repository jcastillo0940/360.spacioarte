# SpacioArte Kommo Widget

Carpeta del widget privado de Kommo para la fase 2.

## Ubicacion del paquete

- Carpeta fuente: `integrations/kommo-widget/spacioarte_widget`
- Zip de carga en Kommo: `integrations/kommo-widget/spacioarte_widget.zip`

## Configuracion al instalar

Usar estos valores del ERP:

- `API Base URL`: URL publica base del ERP, por ejemplo `https://erp.tudominio.com`
- `ERP integration key`: valor de `KOMMO_INTEGRATION_KEY` del `.env`
- `Default order prefix`: opcional, por ejemplo `OV-`

## Lo que hace esta version

- Se muestra en `lead card` y `contact card`
- Intenta vincular automaticamente el contacto del card con el ERP
- Permite sincronizar la tarjeta actual al ERP
- Lista facturas y cotizaciones del cliente vinculado
- Busca una orden por numero
- Genera enlace de WhatsApp para una factura

## Requisito importante

La URL base del ERP debe ser accesible desde Kommo y tener HTTPS valido.
