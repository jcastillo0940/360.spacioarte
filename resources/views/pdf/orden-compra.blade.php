<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Orden de Compra {{ $orden->numero_orden }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 40px; }
        .header { margin-bottom: 30px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
        .logo { font-size: 22px; font-weight: bold; color: #e74c3c; }
        .company-info { font-size: 9px; line-height: 1.4; margin-top: 5px; }
        .document-title { text-align: right; margin-top: -65px; margin-bottom: 30px; }
        .document-title h1 { font-size: 14px; color: #444; text-transform: uppercase; }
        .document-title .numero { font-size: 16px; font-weight: bold; color: #000; }
        .info-box { background: #f4f4f4; padding: 12px; margin-bottom: 20px; border-radius: 4px; }
        .info-box table { width: 100%; }
        .info-box td { padding: 2px 5px; vertical-align: top; }
        .label { font-weight: bold; width: 120px; font-size: 8px; color: #555; text-transform: uppercase; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table thead { background: #444; color: white; }
        .items-table th { padding: 10px; text-align: left; font-size: 9px; text-transform: uppercase; }
        .items-table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 10px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totales { float: right; width: 220px; margin-top: 10px; }
        .totales table { width: 100%; border-collapse: collapse; }
        .totales td { padding: 8px; text-align: right; border-bottom: 1px solid #eee; }
        .total-row { background: #e74c3c; color: white; font-weight: bold; font-size: 12px; }
        .footer { position: fixed; bottom: 30px; width: 100%; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        .status-badge { display: inline-block; padding: 2px 6px; background: #ddd; text-transform: uppercase; font-size: 8px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">TJC LOGISTICS</div>
        <div class="company-info">
            <strong>Jeremy A. Castillo.</strong><br>
            RUC 8-864-1164 DV: 39<br>
            Bda. Las Américas #3 calle Costa Rica - Santiago (Cabecera)<br>
            +507-6191-0214 | Info@tjclogisticspanama.com
        </div>
    </div>
    
    <div class="document-title">
        <h1>Orden de Compra</h1>
        <div class="numero">{{ $orden->numero_orden }}</div>
        <div class="status-badge">Estado: {{ $orden->estado }}</div>
    </div>
    
    <div class="info-box">
        <table>
            <tr>
                <td class="label">Proveedor:</td>
                <td><strong>{{ $orden->proveedor->nombre ?? 'N/A' }}</strong></td>
                <td class="label">Emisión:</td>
                <td>{{ $orden->fecha_emision->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label">Identificación:</td>
                <td>{{ $orden->proveedor->identificacion ?? '' }}</td>
                <td class="label">Entrega Est.:</td>
                <td>{{ $orden->fecha_entrega ? $orden->fecha_entrega->format('d/m/Y') : 'Pendiente' }}</td>
            </tr>
            <tr>
                <td class="label">Teléfono:</td>
                <td>{{ $orden->proveedor->telefono ?? 'N/A' }}</td>
                <td class="label">Creado:</td>
                <td>{{ $orden->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 40%;">Descripción del Ítem</th>
                <th style="width: 10%;">Unidad</th>
                <th class="text-center" style="width: 15%;">Cantidad</th>
                <th class="text-right" style="width: 15%;">Costo Unit.</th>
                <th class="text-right" style="width: 20%;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orden->detalles as $detalle)
            <tr>
                <td>{{ $detalle->item->nombre }}</td>
                <td>{{ $detalle->unit->nombre ?? 'Base' }}</td>
                <td class="text-center">{{ number_format($detalle->cantidad, 2) }}</td>
                <td class="text-right">B/.{{ number_format($detalle->costo_unitario, 2) }}</td>
                <td class="text-right">B/.{{ number_format($detalle->total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="totales">
        <table>
            <tr class="total-row">
                <td>TOTAL</td>
                <td>B/.{{ number_format($orden->total, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($orden->notas)
    <div style="margin-top: 50px; font-size: 9px;">
        <strong>NOTAS ADICIONALES:</strong><br>
        <p style="color: #444;">{{ $orden->notas }}</p>
    </div>
    @endif
    
    <div class="footer">
        Este documento es una Orden de Compra oficial de TJC LOGISTICS.<br>
        Generado el {{ date('d/m/Y H:i:s') }}
    </div>
</body>
</html>