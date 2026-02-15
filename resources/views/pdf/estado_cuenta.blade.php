<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Estado de Cuenta - {{ $contacto->razon_social }}</title>
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
        
        .resumen-box {
            background: #e8e8e8;
            padding: 15px;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .saldo-principal {
            font-size: 18px;
            font-weight: bold;
            color: #e74c3c;
        }
        
        .movimientos-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .movimientos-table thead {
            background: #808080;
            color: white;
        }
        
        .movimientos-table th {
            padding: 6px 8px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
        }
        
        .movimientos-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 9px;
        }
        
        .movimientos-table .saldo-anterior-row {
            background: #f5f5f5;
            font-weight: bold;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .concept-ref {
            font-size: 8px;
            color: #666;
            font-style: italic;
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
        
        .fecha-generacion {
            text-align: center;
            font-size: 8px;
            color: #666;
            margin-top: 30px;
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
            <div class="document-title">Estado de Cuenta</div>
            <div class="document-numero">{{ $contacto->razon_social }}</div>
        </div>
    </div>
    
    <!-- Info Box -->
    <div class="info-box">
        <table class="info-table">
            <tr>
                <td class="label-left">CLIENTE/PROVEEDOR</td>
                <td class="value-left">{{ $contacto->razon_social }}</td>
                <td class="label-right">PERIODO</td>
                <td class="value-right">{{ $filtros['desde'] }} - {{ $filtros['hasta'] }}</td>
            </tr>
            <tr>
                <td class="label-left">IDENTIFICACIÓN</td>
                <td class="value-left">{{ $contacto->identificacion }}{{ $contacto->dv ? ' - DV: '.$contacto->dv : '' }}</td>
                <td class="label-right">FECHA DE CORTE</td>
                <td class="value-right">{{ now()->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label-left">DIRECCIÓN</td>
                <td class="value-left">{{ $contacto->direccion ?? 'N/A' }}</td>
                <td class="label-right"></td>
                <td class="value-right"></td>
            </tr>
            <tr>
                <td class="label-left">TELÉFONO</td>
                <td class="value-left">{{ $contacto->telefono ?? 'N/A' }}</td>
                <td class="label-right"></td>
                <td class="value-right"></td>
            </tr>
        </table>
    </div>
    
    <!-- Resumen Box -->
    <div class="resumen-box">
        <div class="saldo-principal">
            Saldo al Corte: ${{ number_format($saldo_total, 2) }}
        </div>
    </div>
    
    <!-- Movimientos -->
    <table class="movimientos-table">
        <thead>
            <tr>
                <th style="width: 12%;">Fecha</th>
                <th style="width: 43%;">Concepto / Referencia</th>
                <th class="text-right" style="width: 15%;">Débito (+)</th>
                <th class="text-right" style="width: 15%;">Crédito (-)</th>
                <th class="text-right" style="width: 15%;">Saldo</th>
            </tr>
        </thead>
        <tbody>
            <tr class="saldo-anterior-row">
                <td>{{ $filtros['desde'] }}</td>
                <td><strong>SALDO ANTERIOR</strong></td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right"><strong>${{ number_format($saldo_anterior, 2) }}</strong></td>
            </tr>
            @foreach($movimientos as $mov)
            <tr>
                <td>{{ $mov['fecha'] }}</td>
                <td>
                    <strong>{{ $mov['descripcion'] }}</strong><br>
                    <span class="concept-ref">REF: {{ $mov['referencia'] }}</span>
                </td>
                <td class="text-right">{{ $mov['debito'] > 0 ? '$'.number_format($mov['debito'], 2) : '-' }}</td>
                <td class="text-right">{{ $mov['credito'] > 0 ? '$'.number_format($mov['credito'], 2) : '-' }}</td>
                <td class="text-right"><strong>${{ number_format($mov['saldo_acumulado'], 2) }}</strong></td>
            </tr>
            @endforeach
            <tr style="background: #808080; color: white; font-weight: bold;">
                <td colspan="4" class="text-right">SALDO FINAL</td>
                <td class="text-right">${{ number_format($saldo_total, 2) }}</td>
            </tr>
        </tbody>
    </table>
    
    <!-- Fecha de Generación -->
    <div class="fecha-generacion">
        ERP System - Generado el {{ now()->format('d/m/Y H:i:s') }}
    </div>
    
    <!-- Footer -->
    <div class="footer">
        Generado en www.tjclogisticspanama.com - Con TJC Logistics ganas tiempo y tranquilidad
    </div>
</body>
</html>