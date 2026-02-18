<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $titulo }}</title>
    <style>
        @page { margin: 1cm; }
        body { font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.4; }
        
        .header-container { border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #2563eb; }
        .company-info { font-size: 10px; color: #64748b; }
        
        .report-title { text-align: right; float: right; }
        .report-title h1 { margin: 0; font-size: 18px; color: #0f172a; }
        .report-period { font-size: 11px; font-weight: bold; color: #475569; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #0f172a; color: white; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 5px; }
        
        .zebra tr:nth-child(even) { background-color: #f8fafc; }
        
        .summary-box { margin-top: 20px; background: #f1f5f9; padding: 15px; border-radius: 8px; width: 300px; float: right; }
        .summary-row { font-size: 12px; margin-bottom: 5px; }
        .summary-total { font-size: 16px; font-weight: bold; color: #2563eb; border-top: 2px solid #cbd5e1; padding-top: 5px; margin-top: 5px; }
        
        .clear { clear: both; }
    </style>
</head>
<body>
    <div class="header-container">
        <div style="float: left; width: 60%;">
            <div class="company-name">{{ $config->razon_social ?? '360 SPACIO ARTE' }}</div>
            <div class="company-info">
                RUC: {{ $config->ruc ?? '---' }} - DV: {{ $config->dv ?? '--' }}<br>
                {{ $config->direccion ?? '' }}<br>
                Tel: {{ $config->telefono ?? '' }} | Email: {{ $config->email ?? '' }}
            </div>
        </div>
        <div class="report-title">
            <h1>{{ $titulo }}</h1>
            <div class="report-period">Periodo: {{ $inicio }} al {{ $fin }}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 5px;">
                Generado el: {{ date('d/m/Y H:i:s') }}
            </div>
        </div>
        <div class="clear"></div>
    </div>

    <table class="zebra">
        <thead>
            <tr>
                @foreach($columnas as $col)
                    <th class="{{ str_contains(strtolower($col), 'total') || str_contains(strtolower($col), 'saldo') || str_contains(strtolower($col), 'venta') || str_contains(strtolower($col), 'costo') || str_contains(strtolower($col), 'monto') || str_contains(strtolower($col), 'margen') || str_contains(strtolower($col), 'itbms') ? 'text-right' : '' }}">
                        {{ $col }}
                    </th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @php $totalGral = 0; @endphp
            @foreach($data as $row)
                @php 
                    $numVal = data_get($row, 'total') ?: data_get($row, 'total_ventas') ?: data_get($row, 'saldo_pendiente') ?: data_get($row, 'saldo_actual') ?: 0;
                    $totalGral += is_numeric($numVal) ? $numVal : 0;
                @endphp
                <tr>
                    @foreach($fields as $field)
                        <td class="{{ str_contains($field, 'total') || str_contains($field, 'saldo') || str_contains($field, 'venta') || str_contains($field, 'costo') || str_contains($field, 'monto') || str_contains($field, 'itbms') || str_contains($field, 'margen') ? 'text-right' : '' }}">
                            @if(str_contains($field, 'total') || str_contains($field, 'saldo') || str_contains($field, 'venta') || str_contains($field, 'costo') || str_contains($field, 'monto') || str_contains($field, 'itbms'))
                                @if(is_numeric(data_get($row, $field)))
                                    {{ number_format(data_get($row, $field), 2) }}
                                @else
                                    {{ data_get($row, $field) }}
                                @endif
                            @elseif(str_contains($field, 'margen'))
                                {{ number_format(data_get($row, $field), 2) }}%
                            @else
                                {{ data_get($row, $field) }}
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Este documento es un reporte interno generado automáticamente por el Sistema ERP SpacioArte.<br>
        Página 1 de 1
    </div>
</body>
</html>
