<?php
namespace App\Http\Controllers\RRHH;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\Departamento;
use App\Models\Puesto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmpleadoController extends Controller
{
    /**
     * Lista empleados con sus relaciones para la tabla en React
     */
    public function index()
    {
        $empleados = Empleado::with('puesto.departamento')->latest()->get();
        $puestos = Puesto::all();

        // Si es una petición API, devolver JSON
        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json([
                'empleados' => $empleados,
                'puestos' => $puestos
            ]);
        }

        return Inertia::render('RRHH/Empleados/Index', [
            'empleados' => $empleados,
            'puestos' => $puestos
        ]);
    }

    /**
     * Procesa el registro de un nuevo colaborador
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre'           => 'required|string|max:255',
            'apellido'         => 'required|string|max:255',
            'cedula'           => 'required|string|unique:empleados,cedula',
            'email'            => 'nullable|email|unique:empleados,email',
            'telefono'         => 'nullable|string',
            'fecha_nacimiento' => 'nullable|date',
            'puesto_id'        => 'nullable|exists:puestos,id',
            'fecha_ingreso'    => 'required|date',
            'salario_base'     => 'required|numeric|min:0',
            'tipo_contrato'    => 'required|in:Indefinido,Temporal,Proyecto',
            'banco_nombre'     => 'nullable|string',
            'banco_cuenta'     => 'nullable|string',
        ]);

        // Compatibilidad DB: fecha_nacimiento es NOT NULL en algunos entornos.
        // Si no llega desde el front, usamos fecha_ingreso para evitar 500.
        if (empty($validated['fecha_nacimiento'])) {
            $validated['fecha_nacimiento'] = $validated['fecha_ingreso'];
        }

        // Generación de Código Correlativo
        $count = Empleado::count() + 1;
        $validated['codigo_empleado'] = 'EMP-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        $validated['activo'] = true;

        $empleado = Empleado::create($validated);

        // Si es API, devolver JSON
        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json([
                'message' => 'Empleado registrado correctamente',
                'data' => $empleado->load('puesto.departamento')
            ], 201);
        }

        // En Inertia redirigimos para que la tabla se refresque automáticamente
        return redirect()->route('rrhh.empleados.index')->with('success', 'Empleado registrado correctamente.');
    }

    /**
     * Actualiza empleado existente
     */
    public function update(Request $request, Empleado $empleado)
    {
        $validated = $request->validate([
            'nombre'           => 'required|string|max:255',
            'apellido'         => 'required|string|max:255',
            'cedula'           => 'required|string|unique:empleados,cedula,' . $empleado->id,
            'email'            => 'nullable|email|unique:empleados,email,' . $empleado->id,
            'telefono'         => 'nullable|string',
            'fecha_nacimiento' => 'nullable|date',
            'puesto_id'        => 'nullable|exists:puestos,id',
            'fecha_ingreso'    => 'required|date',
            'salario_base'     => 'required|numeric|min:0',
            'tipo_contrato'    => 'required|in:Indefinido,Temporal,Proyecto',
            'banco_nombre'     => 'nullable|string',
            'banco_cuenta'     => 'nullable|string',
            'activo'           => 'boolean',
        ]);

        // Compatibilidad DB: conservar valor existente si no llega fecha_nacimiento.
        if (empty($validated['fecha_nacimiento'])) {
            $validated['fecha_nacimiento'] = $empleado->fecha_nacimiento ?: $validated['fecha_ingreso'];
        }

        $empleado->update($validated);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json([
                'message' => 'Empleado actualizado correctamente',
                'data' => $empleado->fresh()->load('puesto.departamento')
            ]);
        }

        return redirect()->route('rrhh.empleados.index')->with('success', 'Empleado actualizado correctamente.');
    }

    /**
     * Retorna la estructura organizacional (Organigrama)
     */
    public function estructura()
    {
        $organigrama = Departamento::with('puestos.empleados')->get();

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($organigrama);
        }

        return Inertia::render('RRHH/Estructura', [
            'departamentos' => $organigrama
        ]);
    }
}
