<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\OrdenProduccion;
use App\Models\Proceso;
use App\Models\ProduccionTiempo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PlantaController extends Controller
{
    public function index()
    {
        $procesos = Proceso::where('activo', true)->get();
        return Inertia::render('Produccion/Planta/Index', [
            'procesos' => $procesos
        ]);
    }

    public function mostrarCola($id)
    {
        $proceso = Proceso::findOrFail($id);
        $trabajos = OrdenProduccion::with(['venta.cliente', 'materiaPrima'])
            ->where('proceso_id', $id)
            ->whereIn('estado', ['Pendiente', 'Impreso', 'En Máquina'])
            ->orderBy('fecha_entrega_proyectada', 'asc')
            ->get();

        return response()->json([
            'proceso' => $proceso,
            'trabajos' => $trabajos
        ]);
    }

    public function iniciar($id)
    {
        $orden = OrdenProduccion::findOrFail($id);

        DB::beginTransaction();
        try {
            $orden->update(['estado' => 'En Máquina']);
            
            // Sincronizar estado con la orden de venta principal
            if ($orden->venta) {
                $orden->venta->update(['estado' => 'En Producción']);
            }

            ProduccionTiempo::create([
                'orden_produccion_id' => $orden->id,
                'maquina_id' => $orden->proceso_id,
                'operario_id' => auth()->id(),
                'hora_inicio' => now(),
            ]);

            DB::commit();
            return back()->with('success', 'Trabajo iniciado correctamente.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al iniciar: ' . $e->getMessage());
        }
    }

    /**
     * Terminar trabajo con reporte de Mermas
     */
    public function terminar(Request $request, $id)
    {
        $request->validate([
            'cantidad_merma' => 'required|numeric|min:0'
        ]);

        $orden = OrdenProduccion::with('materiaPrima')->findOrFail($id);
        $tiempoLog = ProduccionTiempo::where('orden_produccion_id', $id)
            ->whereNull('hora_fin')
            ->first();

        DB::beginTransaction();
        try {
            // 1. Finalizar registro de tiempos
            if ($tiempoLog) {
                $fin = now();
                $inicio = \Carbon\Carbon::parse($tiempoLog->hora_inicio);
                $tiempoLog->update([
                    'hora_fin' => $fin,
                    'tiempo_total_minutos' => $inicio->diffInMinutes($fin)
                ]);
            }

            // 2. Descontar Inventario (Material usado + Merma)
            $merma = $request->input('cantidad_merma', 0);
            $cantidadConsumida = $orden->cantidad + $merma;
            
            if ($orden->materiaPrima) {
                $orden->materiaPrima->decrement('stock_actual', $cantidadConsumida);
            }

            // 3. Si hubo MERMA, generar ORDEN DE REIMPRESIÓN
            if ($merma > 0) {
                $this->generarReproceso($orden, $merma);
            }

            // 4. Finalizar orden actual
            $orden->update(['estado' => 'Terminado']);

            // 5. Verificar si todas las tareas de producción de esta venta están terminadas
            $venta = $orden->venta;
            if ($venta) {
                $pendientes = OrdenProduccion::where('orden_venta_id', $venta->id)
                    ->where('estado', '!=', 'Terminado')
                    ->count();
                
                if ($pendientes === 0) {
                    $venta->update(['estado' => 'En Espera de Entrega']);
                }
            }

            DB::commit();
            return back()->with('success', 'Trabajo finalizado. ' . ($request->cantidad_merma > 0 ? 'Se generó orden de reimpresión.' : ''));
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al finalizar: ' . $e->getMessage());
        }
    }

    /**
     * Lógica interna para enviar mermas a la Cola de Impresión
     */
    private function generarReproceso(OrdenProduccion $ordenOriginal, $cantidadMerma)
    {
        // Buscamos el proceso de "Impresión" para devolver la tarea a Fase 1
        $procesoImpresion = Proceso::where('tipo_maquina', 'like', '%Impresión%')
                                   ->orWhere('nombre', 'like', '%Impresión%')
                                   ->first();

        OrdenProduccion::create([
            'orden_venta_id' => $ordenOriginal->orden_venta_id,
            'proceso_id'     => $procesoImpresion ? $procesoImpresion->id : $ordenOriginal->proceso_id,
            'item_id'        => $ordenOriginal->item_id,
            'cantidad'       => $cantidadMerma,
            'estado'         => 'Pendiente', // Vuelve a ser visible en el Módulo de Pliegos
            'notas_operario' => "REPROCESO de Orden #{$ordenOriginal->id} por merma en planta.",
            'fecha_entrega_proyectada' => now()->addDay()
        ]);
    }
}