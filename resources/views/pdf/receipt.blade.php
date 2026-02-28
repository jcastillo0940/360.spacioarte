<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Recibo {{ $recibo->numero_recibo }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #111827; }
        .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .right { text-align: right; }
    </style>
</head>
<body>
    <div class="box">
        <div class="title">Recibo de Pago {{ $recibo->numero_recibo }}</div>
        <div class="muted">Fecha: {{ optional($recibo->fecha_pago)->format('d/m/Y') ?? $recibo->fecha_pago }}</div>
    </div>

    <div class="box">
        <strong>Cliente:</strong> {{ $cliente->razon_social ?? 'N/A' }}<br>
        <strong>Factura:</strong> {{ $factura->numero_factura ?? 'N/A' }}<br>
        <strong>Método:</strong> {{ $recibo->metodo_pago }}<br>
        <strong>Referencia:</strong> {{ $recibo->referencia ?? 'N/A' }}
    </div>

    <table>
        <tr>
            <td>Monto pagado</td>
            <td class="right">${{ number_format((float) $recibo->monto_pagado, 2) }}</td>
        </tr>
        <tr>
            <td>Saldo pendiente factura</td>
            <td class="right">${{ number_format((float) ($factura->saldo_pendiente ?? 0), 2) }}</td>
        </tr>
    </table>
</body>
</html>
