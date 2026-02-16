<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\OrdenProduccion;
use App\Models\Proceso;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KdsController extends Controller
{
    public function index()
    {
        $procesos = Proceso::where('activo', true)->get();
        return Inertia::render('Produccion/KDS/Index', [
            'procesos' => $procesos
        ]);
    }

    public function getData()
    {
        $user = auth()->user();
        $userRoles = $user->roles->pluck('name')->toArray();
        
        // Determinar qué ver según roles
        $verDiseno = in_array('Administrador Total', $userRoles) || 
                     in_array('Diseñador', $userRoles);
        
        $verProduccion = in_array('Administrador Total', $userRoles) || 
                         in_array('Impresor', $userRoles) || 
                         in_array('Operador de Máquina', $userRoles);

        $disenos = collect([]);
        $producciones = collect([]);

        // 1. Trabajos de Diseño (solo si tiene permiso)
        if ($verDiseno) {
            $disenos = OrdenVenta::with(['cliente', 'latestDiseno', 'tiempos' => function($q) {
                    $q->whereNull('hora_fin');
                }])
                ->whereIn('estado', ['En Proceso de Diseño', 'Diseño Rechazado', 'Rediseñando', 'Confirmada', 'Borrador'])
                ->where('estado_diseno', '!=', 'Aprobado')
                ->orderBy('fecha_entrega', 'asc')
                ->get()
                ->map(function($o) {
                    return [
                        'id' => $o->id,
                        'tipo' => 'diseno',
                        'numero' => $o->numero_orden,
                        'cliente' => $o->cliente->razon_social ?? 'S/N',
                        'estado' => $o->estado,
                        'fecha_entrega' => $o->fecha_entrega,
                        'minutos_transcurridos' => $o->tiempos->first() ? now()->diffInMinutes($o->tiempos->first()->hora_inicio) : 0,
                        'timer_activo' => $o->tiempos->first() ? true : false,
                        'fase_nombre' => 'Diseño'
                    ];
                });
        }

        // 2. Trabajos de Producción (solo si tiene permiso)
        if ($verProduccion) {
            $query = OrdenProduccion::with(['venta.cliente', 'maquina', 'materiaPrima', 'materiaUsada'])
                ->whereIn('estado', ['Pendiente', 'En Máquina'])
                ->orderBy('fecha_entrega_proyectada', 'asc');

            // Si es operador específico, filtrar por tipo de máquina
            if (in_array('Impresor', $userRoles) && !in_array('Administrador Total', $userRoles)) {
                $query->whereHas('maquina', function($q) {
                    $q->where('tipo_maquina', 'like', '%Impresión%')
                      ->orWhere('categoria_tecnologia', 'like', '%Sublimación%')
                      ->orWhere('categoria_tecnologia', 'like', '%Láser%');
                });
            }

            $producciones = $query->get()
                ->map(function($p) {
                    return [
                        'id' => $p->id,
                        'tipo' => 'produccion',
                        'numero' => $p->venta->numero_orden ?? 'ST',
                        'cliente' => $p->venta->cliente->razon_social ?? 'S/N',
                        'estado' => $p->estado,
                        'fecha_entrega' => $p->fecha_entrega_proyectada,
                        'proceso_id' => $p->proceso_id,
                        'proceso_nombre' => $p->maquina->nombre ?? 'N/A',
                        'categoria' => $p->maquina->categoria_tecnologia ?? 'N/A',
                        'item' => $p->materiaPrima->nombre ?? 'Producto',
                        'materia_prima' => $p->materiaUsada->nombre ?? 'N/A',
                        'pliegos' => $p->pliegos,
                        'capacidad' => $p->capacidad_nesting,
                        'cantidad' => $p->cantidad
                    ];
                });
        }

        return response()->json([
            'disenos' => $disenos,
            'producciones' => $producciones,
            'permisos' => [
                'ver_diseno' => $verDiseno,
                'ver_produccion' => $verProduccion
            ]
        ]);
    }
}
