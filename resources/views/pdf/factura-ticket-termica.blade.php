<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket {{ $factura->numero_factura }}</title>
    <style>
        @page {
            margin: 6mm 4mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #111827;
            margin: 0;
        }

        .ticket {
            width: 100%;
        }

        .center {
            text-align: center;
        }

        .title {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 2px;
        }

        .small {
            font-size: 8px;
            line-height: 1.35;
        }

        .muted {
            color: #4b5563;
        }

        .section {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #9ca3af;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 3px 0;
            vertical-align: top;
        }

        th {
            text-align: left;
            font-size: 8px;
            text-transform: uppercase;
            border-bottom: 1px solid #111827;
        }

        .qty, .amount {
            text-align: right;
            white-space: nowrap;
        }

        .totals td {
            padding: 2px 0;
        }

        .totals .label {
            text-align: left;
            font-weight: 700;
        }

        .totals .value {
            text-align: right;
            font-weight: 700;
        }

        .totals .grand td {
            border-top: 1px solid #111827;
            padding-top: 6px;
            font-size: 11px;
        }

        .qr {
            margin-top: 10px;
            text-align: center;
        }

        .qr img {
            width: 120px;
            height: 120px;
        }

        .cufe {
            margin-top: 8px;
            font-size: 8px;
            word-break: break-all;
        }

        .status {
            margin-top: 6px;
            font-size: 8px;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="center">
            <div class="title">{{ $config->empresa_nombre ?? config('app.name', 'POS ERP') }}</div>
            @if(!empty($config->empresa_ruc))
                <div class="small">RUC: {{ $config->empresa_ruc }}</div>
            @endif
            @if(!empty($config->empresa_direccion))
                <div class="small">{{ $config->empresa_direccion }}</div>
            @endif
            @if(!empty($config->empresa_telefono))
                <div class="small">Tel: {{ $config->empresa_telefono }}</div>
            @endif
            <div class="small">Factura: {{ $factura->numero_factura }}</div>
        </div>

        <div class="section small">
            <table>
                <tr>
                    <td><strong>Fecha:</strong></td>
                    <td class="amount">{{ \Carbon\Carbon::parse($factura->fecha_emision)->format('d/m/Y') }}</td>
                </tr>
                <tr>
                    <td><strong>Cliente:</strong></td>
                    <td class="amount">{{ $factura->cliente->razon_social ?? 'Consumidor Final' }}</td>
                </tr>
                <tr>
                    <td><strong>ID:</strong></td>
                    <td class="amount">{{ $factura->cliente->identificacion ?? 'CF' }}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <table>
                <thead>
                    <tr>
                        <th>Descripcion</th>
                        <th class="qty">Cant</th>
                        <th class="amount">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($factura->detalles as $detalle)
                        <tr>
                            <td>
                                {{ $detalle->item->nombre ?? 'Item' }}
                                <div class="small muted">
                                    {{ number_format((float) $detalle->precio_unitario, 2) }} x {{ number_format((float) $detalle->cantidad, 2) }}
                                </div>
                            </td>
                            <td class="qty">{{ rtrim(rtrim(number_format((float) $detalle->cantidad, 2, '.', ''), '0'), '.') }}</td>
                            <td class="amount">{{ number_format((float) $detalle->total_item, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="section">
            <table class="totals">
                <tr>
                    <td class="label">Subtotal</td>
                    <td class="value">{{ number_format((float) $factura->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td class="label">ITBMS</td>
                    <td class="value">{{ number_format((float) $factura->itbms_total, 2) }}</td>
                </tr>
                <tr class="grand">
                    <td class="label">TOTAL</td>
                    <td class="value">{{ number_format((float) $factura->total, 2) }}</td>
                </tr>
            </table>
        </div>

        @if ($factura->fe_cufe || $qrImageUrl)
            <div class="section center">
                <div class="small"><strong>Factura Electronica</strong></div>
                @if ($factura->fe_legal_status)
                    <div class="status">{{ $factura->fe_legal_status }}</div>
                @endif
                @if ($qrImageUrl)
                    <div class="qr">
                        <img src="{{ $qrImageUrl }}" alt="QR FE">
                    </div>
                @endif
                @if ($factura->fe_cufe)
                    <div class="cufe">
                        <strong>CUFE:</strong><br>
                        {{ $factura->fe_cufe }}
                    </div>
                @endif
            </div>
        @endif

        <div class="section center small">
            <div>Documento generado para impresion termica {{ $ticketWidthMm }}mm</div>
            @if ($factura->fe_public_url)
                <div class="cufe">{{ $factura->fe_public_url }}</div>
            @endif
        </div>
    </div>
</body>
</html>
