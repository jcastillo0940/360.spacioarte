<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #0f172a;
            margin: 0;
            padding: 10px;
        }
        .center { text-align: center; }
        .title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
        .muted { color: #64748b; font-size: 9px; }
        .block { margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px 0; vertical-align: top; }
        .label { color: #475569; }
        .value { text-align: right; font-weight: bold; }
        .total {
            margin-top: 10px;
            border-top: 1px dashed #94a3b8;
            padding-top: 8px;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="center block">
        <div class="title">Corte X</div>
        <div>{{ $config->razon_social ?? 'ERP / POS' }}</div>
        <div class="muted">{{ $sesion->caja->nombre ?? 'Caja' }} | {{ $sesion->cajero->name ?? 'Usuario' }}</div>
        <div class="muted">{{ now()->timezone('America/Panama')->format('d/m/Y h:i A') }}</div>
    </div>

    <div class="block">
        <table>
            <tr><td class="label">Apertura</td><td class="value">${{ number_format($resumen['apertura'], 2) }}</td></tr>
            <tr><td class="label">Ventas efectivo</td><td class="value">${{ number_format($resumen['ventas_efectivo'], 2) }}</td></tr>
            <tr><td class="label">Ventas tarjeta</td><td class="value">${{ number_format($resumen['ventas_tarjeta'], 2) }}</td></tr>
            <tr><td class="label">Transferencias</td><td class="value">${{ number_format($resumen['ventas_transferencia'], 2) }}</td></tr>
            <tr><td class="label">Entradas</td><td class="value">${{ number_format($resumen['entradas'], 2) }}</td></tr>
            <tr><td class="label">Salidas</td><td class="value">${{ number_format($resumen['salidas'], 2) }}</td></tr>
        </table>
    </div>

    <div class="total">
        Efectivo esperado<br>
        ${{ number_format($esperado, 2) }}
    </div>
</body>
</html>
