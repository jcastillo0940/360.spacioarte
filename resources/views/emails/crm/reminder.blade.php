<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; }
        .box { max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; }
        .muted { color: #64748b; }
        .pill { display: inline-block; padding: 6px 10px; background: #e2e8f0; border-radius: 999px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="box">
        <h2>Recordatorio CRM</h2>
        <p>Tienes un seguimiento pendiente en el CRM.</p>

        <p><strong>Lead:</strong> {{ $lead->title }}</p>
        <p><strong>Embudo:</strong> {{ $lead->pipeline->name ?? 'N/D' }}</p>
        <p><strong>Etapa:</strong> {{ $lead->stage->name ?? 'N/D' }}</p>
        <p><strong>Actividad:</strong> {{ $activity->subject }}</p>
        <p><strong>Tipo:</strong> <span class="pill">{{ $activity->activity_type }}</span></p>
        <p><strong>Vencimiento:</strong> {{ optional($activity->due_at)->timezone('America/Panama')->format('d/m/Y h:i A') }}</p>

        @if($activity->notes)
            <p><strong>Notas:</strong><br>{{ $activity->notes }}</p>
        @endif

        <p class="muted">Puedes ingresar al CRM del sistema para registrar el seguimiento o marcarlo como completado.</p>
    </div>
</body>
</html>
