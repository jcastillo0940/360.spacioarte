<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Factura de Compra {{ $factura->numero_factura_proveedor }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #000;
            padding: 30px;
        }
        
        .header-section {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .header-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        
        .header-right {
            display: table-cell;
            width: 50%;
            text-align: right;
            vertical-align: top;
        }
        
        .logo {
            font-size: 22px;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 8px;
        }
        
        .company-info {
            font-size: 9px;
            line-height: 1.3;
        }
        
        .document-title {
            font-size: 11px;
            margin-bottom: 3px;
        }
        
        .document-numero {
            font-size: 13px;
            font-weight: bold;
        }
        
        .info-box {
            background: #e8e8e8;
            padding: 8px 10px;
            margin-bottom: 15px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .info-table td {
            padding: 3px 5px;
            vertical-align: top;
        }
        
        .label-left {
            font-weight: bold;
            width: 90px;
        }
        
        .value-left {
            width: 330px;
        }
        
        .label-right {
            font-weight: bold;
            width: 170px;
        }
        
        .value-right {
            width: auto;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .items-table thead {
            background: #808080;
            color: white;
        }
        
        .items-table th {
            padding: 6px 8px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
        }
        
        .items-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 9px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totales {
            float: right;
            width: 180px;
            margin-top: 10px;
        }
        
        .totales table {
            width: 100%;
        }
        
        .totales td {
            padding: 4px 8px;
            text-align: right;
            font-size: 10px;
        }
        
        .totales .total-row {
            background: #808080;
            color: white;
            font-weight: bold;
        }
        
        .firmas {
            margin-top: 80px;
            clear: both;
        }
        
        .firma-box {
            display: inline-block;
            width: 48%;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 9px;
        }
        
        .footer {
            position: fixed;
            bottom: 20px;
            right: 30px;
            font-size: 8px;
            color: #666;
            text-align: right;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header-section">
        <div class="header-left">
            <div class="logo">TJC LOGISTICS</div>
            <div class="company-info">
                <strong>Jeremy A. Castillo.</strong><br>
                RUC 8-864-1164 DV: 39<br>
                Bda. Las Américas #3 calle Costa Rica - Santiago (Cabecera)<br>
                +507-6191-0214<br>
                Tjclogisticspanama.com<br>
                Info@tjclogisticspanama.com
            </div>
        </div>
        <div class="header-right">
            <div class="document-title">Factura de Compra</div>
            <div class="document-numero">No. {{ $factura->numero_factura_proveedor }}</div>
        </div>
    </div>
    
    <!-- Info Box -->
    <div class="info-box">
        <table class="info-table">
            <tr>
                <td class="label-left">SEÑOR(ES)</td>
                <td class="value-left">{{ $factura->proveedor->razon_social }}</td>
                <td class="label-right">FECHA DE EXPEDICIÓN</td>
                <td class="value-right"></td>
            </tr>
            <tr>
                <td class="label-left">DIRECCIÓN</td>
                <td class="value-left">{{ $factura->proveedor->direccion ?? '' }}</td>
                <td class="label-right"></td>
                <td class="value-right">{{ \Carbon\Carbon::parse($factura->fecha_emision)->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label-left">CIUDAD</td>
                <td class="value-left"></td>
                <td class="label-right">FECHA DE VENCIMIENTO</td>
                <td class="value-right"></td>
            </tr>
            <tr>
                <td class="label-left">TELÉFONO</td>
                <td class="value-left">{{ $factura->proveedor->telefono ?? '' }}</td>
                <td class="label-right">RUC</td>
                <td class="value-right">{{ \Carbon\Carbon::parse($factura->fecha_vencimiento)->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label-left"></td>
                <td class="value-left"></td>
                <td class="label-right"></td>
                <td class="value-right">{{ $factura->proveedor->identificacion }}{{ $factura->proveedor->dv ? '-'.$factura->proveedor->dv : '' }}</td>
            </tr>
        </table>
    </div>
    
    <!-- Items -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 45%;">Ítem</th>
                <th class="text-right" style="width: 15%;">Precio</th>
                <th class="text-center" style="width: 12%;">Cantidad</th>
                <th class="text-center" style="width: 13%;">Descuento</th>
                <th class="text-right" style="width: 15%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($factura->detalles as $detalle)
            <tr>
                <td>{{ $detalle->item->nombre }}</td>
                <td class="text-right">B/.{{ number_format($detalle->costo_unitario, 2) }}</td>
                <td class="text-center">{{ number_format($detalle->cantidad, 0) }}</td>
                <td class="text-center">{{ number_format($detalle->tasa_itbms, 2) }}%</td>
                <td class="text-right">B/.{{ number_format($detalle->total, 2) }}</td>
            </tr>
            @endforeach
            @if($factura->ordenOriginal)
            <tr>
                <td colspan="5" style="background: #808080; color: white; padding: 5px;">{{ $factura->ordenOriginal->numero_orden }}</td>
            </tr>
            @endif
        </tbody>
    </table>
    
    <!-- Totales -->
    <div class="totales">
        <table>
            <tr>
                <td>Subtotal</td>
                <td><strong>B/.{{ number_format($factura->subtotal, 2) }}</strong></td>
            </tr>
            <tr class="total-row">
                <td>Total</td>
                <td><strong>B/.{{ number_format($factura->total, 2) }}</strong></td>
            </tr>
        </table>
    </div>
    
    <!-- Firmas -->
    <div class="firmas">
        <div class="firma-box">
            ELABORADO POR
        </div>
        <div class="firma-box" style="float: right;">
            ACEPTADA, FIRMA Y/O SELLO Y FECHA
        </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
        Generado en www.tjclogisticspanama.com - Con TJC Logistics ganas tiempo y tranquilidad
    </div>
</body>
</html>