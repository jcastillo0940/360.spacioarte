<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use App\Models\Asiento;
use Inertia\Inertia;

class LibroDiarioController extends Controller
{
    public function index()
    {
        return Inertia::render('Contabilidad/LibroDiario/Index', [
            'asientos' => Asiento::with('detalles.cuenta')
                ->latest('fecha')
                ->latest('id')
                ->paginate(10)
        ]);
    }
}