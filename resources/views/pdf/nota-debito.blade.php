<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Nota de Debito {{ $nota->numero_nota }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1f2937; }
        .header, .card { margin-bottom: 18px; }
        .title { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
        .muted { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d1d5db; padding: 8px; }
        th { background: #f3f4f6; text-align: left; }
        .text-right { text-align: right; }
        .totals { width: 320px; margin-left: auto; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: #fef3c7; color: #92400e; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Nota de Debito {{ $nota->numero_nota }}</div>
        <div class="muted">Referencia: {{ optional($nota->factura)->numero_factura ?: $nota->factura_manual_ref ?: 'Manual' }}</div>
        <div style="margin-top:8px;"><span class="badge">{{ $nota->tipo_nota }}</span></div>
    </div>

    <div class="card">
        <table>
            <tr>
                <th>Cliente</th>
                <td>{{ optional($nota->factura?->cliente)->razon_social ?: optional($nota->cliente)->razon_social }}</td>
                <th>Fecha</th>
                <td>{{ optional($nota->fecha)->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <th>Identificacion</th>
                <td>{{ optional($nota->factura?->cliente)->identificacion ?: optional($nota->cliente)->identificacion }}</td>
                <th>Estado</th>
                <td>{{ $nota->estado }}</td>
            </tr>
            <tr>
                <th>Motivo</th>
                <td colspan="3">{{ $nota->motivo }}</td>
            </tr>
        </table>
    </div>

    <div class="card">
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th class="text-right">Cantidad</th>
                    <th class="text-right">Precio Unit.</th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right">ITBMS</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($nota->detalles as $detalle)
                    <tr>
                        <td>{{ $detalle->descripcion_item ?: optional($detalle->item)->nombre }}</td>
                        <td class="text-right">{{ number_format((float) $detalle->cantidad, 2) }}</td>
                        <td class="text-right">${{ number_format((float) $detalle->precio_unitario, 2) }}</td>
                        <td class="text-right">${{ number_format((float) ($detalle->subtotal_item ?? 0), 2) }}</td>
                        <td class="text-right">${{ number_format((float) ($detalle->itbms_item ?? 0), 2) }}</td>
                        <td class="text-right">${{ number_format((float) ($detalle->total_item ?? 0), 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <table class="totals">
        <tr><th>Subtotal</th><td class="text-right">${{ number_format((float) $nota->subtotal, 2) }}</td></tr>
        <tr><th>ITBMS</th><td class="text-right">${{ number_format((float) $nota->itbms_total, 2) }}</td></tr>
        <tr><th>Total</th><td class="text-right"><strong>${{ number_format((float) $nota->total, 2) }}</strong></td></tr>
    </table>

    @if($nota->fe_cufe)
        <div class="card" style="margin-top:18px;">
            <div><strong>CUFE:</strong> {{ $nota->fe_cufe }}</div>
            <div><strong>Estado FE:</strong> {{ $nota->fe_status ?: 'No emitida' }} {{ $nota->fe_legal_status ? ' / ' . $nota->fe_legal_status : '' }}</div>
        </div>
    @endif
</body>
</html>
