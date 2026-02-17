<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Auth & Core
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;

// Configuración
use App\Http\Controllers\Config\{SettingsController, ParametrizacionController, VendedorController};

// Contabilidad & Finanzas
use App\Http\Controllers\Contabilidad\{AccountController, BankController, LibroDiarioController, ReporteController};
use App\Http\Controllers\Finanzas\{EstadoCuentaController, FactoringController};

// Inventario
use App\Http\Controllers\Inventario\{ItemController, ContactoController, SucursalController};

// Ventas
use App\Http\Controllers\Ventas\{OrdenVentaController, FacturaController, CobroController, NotaCreditoController, CustomerPortalController, PosController};

// Compras
use App\Http\Controllers\Compras\{OrdenCompraController, FacturaCompraController, EgresoController, RecepcionOrdenController, ConsolidarVentasController};

// RRHH & Flota
use App\Http\Controllers\RRHH\{EmpleadoController, NominaController};
use App\Http\Controllers\Flota\VehiculoController;

// Producción (Módulo Manufactura SRS v2.0)
use App\Http\Controllers\Produccion\{ProcesoController, PliegoController, PlantaController, RequisicionController, KdsController, DisenoController};

// PWA Sync
use App\Http\Controllers\PWA\MobileSyncController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/
Route::get('/session-test', function () {
    $count = session('test_count', 0) + 1;
    session(['test_count' => $count]);
    return "Session count: " . $count;
});

// ========================================================================
//  RUTAS PÚBLICAS (Sin Autenticación)
// ========================================================================

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:login');
    // Redireccionamos la raíz al login para mayor claridad
    Route::get('/', function() { return redirect()->route('login'); });
});

// Portal del Cliente - Seguimiento y Aprobación (SRS Punto 9)
Route::prefix('tracking')->group(function () {
    Route::get('/{token}', [CustomerPortalController::class, 'show'])->name('tracking.publico');
    Route::post('/{token}/mensaje', [CustomerPortalController::class, 'sendMessage'])->name('tracking.mensaje');
    
    // CORRECCIÓN: Se ajustó 'approve' para que coincida con la petición de la vista React
    Route::post('/{token}/approve', [CustomerPortalController::class, 'approveDesign'])->name('tracking.aprobar');
    Route::post('/{token}/reject', [CustomerPortalController::class, 'rejectDesign'])->name('tracking.rechazar');
    Route::post('/{token}/approve-billing', [CustomerPortalController::class, 'approveBilling'])->name('tracking.aprobar_cobro');
    Route::post('/{token}/brief', [CustomerPortalController::class, 'submitBrief'])->name('tracking.brief');
    Route::post('/{token}/own-design', [CustomerPortalController::class, 'submitOwnDesign'])->name('tracking.own_design');
});

// Ruta rápida para Diseñadores (Carga de diseño)
Route::middleware(['auth'])->get('/diseno/subir', function() { 
    return Inertia::render('Ventas/Diseno/Upload'); 
})->name('diseno.view_upload');

// API Interna para Diseño (Usando Sesión Web)
Route::middleware(['auth'])->prefix('api')->group(function () {
    Route::get('/ventas/ordenes/{id}/historial', [OrdenVentaController::class, 'getHistorial']);
    Route::get('/diseno/search', [DisenoController::class, 'search']);
    Route::post('/diseno/upload', [DisenoController::class, 'enviarPropuesta']); // Mapped for legacy support
    Route::post('/diseno/timer/start', [DisenoController::class, 'startTimer']);
    Route::post('/diseno/timer/stop', [DisenoController::class, 'stopTimer']);
    Route::post('/diseno/approve-billing', [DisenoController::class, 'approveBillingForDesign']);
    Route::get('/produccion/kds/data', [KdsController::class, 'getData']);
});

// KDS Board
Route::get('/produccion/kds', [KdsController::class, 'index'])->name('produccion.kds')->middleware('auth');

// ========================================================================
//  RUTAS PROTEGIDAS (ERP CORE + PWA + PRODUCCIÓN)
// ========================================================================
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // --- DASHBOARD ---
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ========================================================================
    //  MÓDULO PRODUCCIÓN (UNIFICADO Y CORREGIDO)
    // ========================================================================
    Route::prefix('produccion')->group(function () {
        // 1. Centros de Trabajo (Máquinas / Configuración)
        Route::get('/procesos', [ProcesoController::class, 'index'])->name('produccion.procesos.index');
        Route::post('/procesos', [ProcesoController::class, 'store'])->name('produccion.procesos.store');
        Route::put('/procesos/{proceso}', [ProcesoController::class, 'update'])->name('produccion.procesos.update');

        // 2. Pliegos (Nesting / Pre-prensa)
        Route::get('/pliegos', [PliegoController::class, 'index'])->name('produccion.pliegos.index');
        Route::post('/pliegos', [PliegoController::class, 'store'])->name('produccion.pliegos.store');
        Route::post('/pliegos/{id}/imprimir', [PliegoController::class, 'imprimir'])->name('produccion.pliegos.imprimir');

        // Diseño
        Route::get('/diseno', [DisenoController::class, 'index'])->name('produccion.diseno.index');
        Route::get('/diseno/{id}', [DisenoController::class, 'show'])->name('produccion.diseno.show');
        Route::post('/diseno/{orden}/iniciar', [DisenoController::class, 'iniciar'])->name('produccion.diseno.iniciar');
        Route::post('/diseno/{orden}/enviar', [DisenoController::class, 'enviarPropuesta'])->name('produccion.diseno.enviar');

        // 3. Planta (Interfaz Touch / Tiempos Reales)
        Route::get('/planta', [PlantaController::class, 'index'])->name('produccion.planta.index');
        Route::get('/planta/cola/{id}', [PlantaController::class, 'mostrarCola'])->name('produccion.planta.cola');
        Route::post('/planta/iniciar/{id}', [PlantaController::class, 'iniciar'])->name('produccion.iniciar');
        Route::post('/planta/terminar/{id}', [PlantaController::class, 'terminar'])->name('produccion.terminar');

        // 4. Requisiciones (Insumos / Tintas de Bodega)
        Route::get('/requisiciones', [RequisicionController::class, 'index'])->name('produccion.requisiciones.index');
        Route::post('/requisiciones', [RequisicionController::class, 'store'])->name('produccion.requisiciones.store');
        Route::post('/requisiciones/{id}/entregar', [RequisicionController::class, 'entregar'])->name('produccion.requisiciones.entregar');
    });

    // ========================================================================
    //  RUTAS API INTERNAS (JSON para IndexedDB / React)
    // ========================================================================
    Route::prefix('api')->group(function () {
        Route::get('/configuracion', [SettingsController::class, 'index'])->name('api.settings.index');
        Route::get('/configuracion/parametros', [ParametrizacionController::class, 'index']);
        Route::get('/configuracion/vendedores', [VendedorController::class, 'index']);
        Route::get('/inventario/items', [ItemController::class, 'index']);
        Route::get('/inventario/contactos', [ContactoController::class, 'index']);
        Route::post('/inventario/contactos', [ContactoController::class, 'store']);
        Route::get('/inventario/sucursales', [SucursalController::class, 'index']);
        Route::get('/inventario/sucursales/contacto/{contacto}', [SucursalController::class, 'getByContacto']);
        Route::get('/contabilidad/cuentas', [AccountController::class, 'index']);
        Route::get('/contabilidad/bancos', [BankController::class, 'index']);
        Route::get('/contabilidad/libro-diario', [LibroDiarioController::class, 'index']);
        Route::get('/ventas/ordenes', [OrdenVentaController::class, 'index']);
        Route::get('/ventas/ordenes/datos', [OrdenVentaController::class, 'getDatos']);
        Route::get('/ventas/ordenes/{orden}', [OrdenVentaController::class, 'show']);
        Route::post('/ventas/enviar-chat', function (Illuminate\Http\Request $request) {
            $request->validate([
                'mensaje' => 'required|array', 
                'token'   => 'required|string',
            ]);
            $existe = \App\Models\OrdenVenta::where('tracking_token', $request->token)->exists();
            if (!$existe) return response()->json(['error' => 'Token inválido'], 403);
            broadcast(new \App\Events\ChatMessageEvent($request->mensaje, $request->token))->toOthers();
            return response()->json(['status' => 'Enviado']);
        });
        Route::post('/ventas/ordenes/{orden}/reimprimir', [OrdenVentaController::class, 'reimprimir']);
        Route::get('/ventas/facturas', [FacturaController::class, 'index']);
        Route::get('/ventas/facturas/{factura}', [FacturaController::class, 'show']);
        Route::get('/ventas/cobros/datos', [CobroController::class, 'getDatos']);
        Route::get('/ventas/facturas/{factura}/datos-nc', [NotaCreditoController::class, 'getDatosFactura']);
        Route::get('/ventas/notas-credito', [NotaCreditoController::class, 'index']);
        Route::get('/ventas/notas-credito/{nota}', [NotaCreditoController::class, 'show']);
        Route::get('/compras/ordenes', [OrdenCompraController::class, 'index']);
        Route::get('/compras/ordenes/datos', [OrdenCompraController::class, 'getDatos']);
        Route::get('/compras/ordenes/{orden}', [OrdenCompraController::class, 'show']);
        Route::get('/compras/facturas', [FacturaCompraController::class, 'index']);
        Route::get('/compras/facturas/{factura}', [FacturaCompraController::class, 'show']);
        Route::get('/compras/egresos/datos', [EgresoController::class, 'getDatos']);
        Route::get('/rrhh/empleados', [EmpleadoController::class, 'index']);
        Route::get('/rrhh/nomina', [NominaController::class, 'index']);
        Route::get('/reportes/estado-resultados', [ReporteController::class, 'estadoResultados']);
        Route::get('/finanzas/factoring', [FactoringController::class, 'index']);
        Route::get('/finanzas/estados-cuenta/{contacto}/data', [EstadoCuentaController::class, 'getRawData']);
    });

    // ========================================================================
    //  RUTAS PWA (MÓVILES)
    // ========================================================================
    Route::prefix('pwa')->group(function () {
        Route::get('/sync/initial', [MobileSyncController::class, 'initialSync'])->name('pwa.sync.initial');
        Route::post('/sync/upload', [MobileSyncController::class, 'syncUp'])->name('pwa.sync.upload');
        Route::get('/home', function () { return Inertia::render('PWA/DashboardPwa'); })->name('pwa.home');
        Route::get('/ruta-entrega', function () { return Inertia::render('PWA/RutaEntrega'); })->name('pwa.ruta');
        Route::get('/venta/{cliente_id}', function ($cliente_id) { 
            return Inertia::render('PWA/NuevaVenta', ['cliente_id' => $cliente_id]); 
        })->name('pwa.venta.create');
        Route::get('/inventario', function () { return Inertia::render('PWA/Inventario'); })->name('pwa.inventario');
    });

    // ========================================================================
    //  RESTO DE MÓDULOS WEB
    // ========================================================================
    
    // CONFIGURACIÓN
    Route::prefix('configuracion')->middleware(['role:Administrador Total'])->group(function () {
        Route::get('/', function() { return Inertia::render('Config/Settings/Index'); })->name('settings.index');
        Route::post('/actualizar', [SettingsController::class, 'update'])->name('settings.update');
        Route::prefix('parametros')->group(function () {
            Route::get('/', function() { return Inertia::render('Config/Parametrizacion/Index'); })->name('params.index');
            Route::post('/impuestos', [ParametrizacionController::class, 'storeTax'])->name('params.tax.store');
            Route::post('/terminos-pago', [ParametrizacionController::class, 'storePaymentTerm'])->name('params.terms.store');
        });
        Route::prefix('vendedores')->group(function () {
            Route::get('/', function() { return Inertia::render('Config/Vendedores/Index'); })->name('vendedores.index');
            Route::post('/', [VendedorController::class, 'store'])->name('vendedores.store');
            Route::put('/{vendedor}', [VendedorController::class, 'update'])->name('vendedores.update');
        });
        Route::prefix('diseno')->group(function () {
            Route::get('/', [App\Http\Controllers\Config\DesignConfigController::class, 'index'])->name('config.diseno.index');
            Route::post('/actualizar', [App\Http\Controllers\Config\DesignConfigController::class, 'update'])->name('config.diseno.update');
        });
        Route::prefix('pos')->group(function () {
            Route::prefix('metodos-pago')->group(function () {
                Route::get('/', [\App\Http\Controllers\Config\PosMetodoPagoController::class, 'index'])->name('config.pos.metodos.index');
                Route::post('/', [\App\Http\Controllers\Config\PosMetodoPagoController::class, 'store'])->name('config.pos.metodos.store');
                Route::put('/{metodo}', [\App\Http\Controllers\Config\PosMetodoPagoController::class, 'update'])->name('config.pos.metodos.update');
                Route::delete('/{metodo}', [\App\Http\Controllers\Config\PosMetodoPagoController::class, 'destroy'])->name('config.pos.metodos.destroy');
            });
        });
    });
    
    // INVENTARIO
    Route::prefix('inventario')->group(function () {
        Route::get('/items', function() { return Inertia::render('Inventario/Items/Index'); })->name('items.index');
        Route::post('/items', [ItemController::class, 'store'])->name('items.store');
        Route::put('/items/{item}', [ItemController::class, 'update'])->name('items.update');
        Route::get('/contactos', function() { return Inertia::render('Inventario/Contactos/Index'); })->name('contactos.index');
        Route::post('/contactos', [ContactoController::class, 'store'])->name('contactos.store');
        Route::put('/contactos/{contacto}', [ContactoController::class, 'update'])->name('contactos.update');
        Route::prefix('sucursales')->group(function () {
            Route::get('/', function() { return Inertia::render('Inventario/Sucursales/Index'); })->name('sucursales.index');
            Route::post('/', [SucursalController::class, 'store'])->name('sucursales.store');
            Route::put('/{sucursal}', [SucursalController::class, 'update'])->name('sucursales.update');
        });
    });
    
    // CONTABILIDAD
    Route::prefix('contabilidad')->middleware(['role:Administrador Total'])->group(function () {
        Route::get('/catalogo', function() { return Inertia::render('Contabilidad/Cuentas/Index'); })->name('accounts.index');
        Route::post('/cuentas', [AccountController::class, 'store'])->name('accounts.store');
        Route::prefix('bancos')->group(function () {
            Route::get('/', function() { return Inertia::render('Contabilidad/Bancos/Index'); })->name('bancos.index');
            Route::post('/', [BankController::class, 'store'])->name('bancos.store');
            Route::post('/transferir', [BankController::class, 'transfer'])->name('bancos.transfer');
        });
        Route::get('/libro-diario', function() { return Inertia::render('Contabilidad/LibroDiario/Index'); })->name('contabilidad.diario');
    });
    
    // VENTAS
    Route::prefix('ventas')->group(function () {
        Route::prefix('ordenes')->group(function () {
            Route::get('/', [OrdenVentaController::class, 'index'])->name('ordenes.index');
            Route::get('/crear', function() { return Inertia::render('Ventas/Ordenes/Create'); })->name('ordenes.create');
            Route::post('/', [OrdenVentaController::class, 'store'])->name('ordenes.store');
            Route::get('/{orden}', [OrdenVentaController::class, 'show'])->name('ordenes.show');
            Route::get('/{orden}/editar', function($id) { return Inertia::render('Ventas/Ordenes/Edit', ['ordenId' => $id]); })->name('ordenes.edit');
            Route::put('/{orden}', [OrdenVentaController::class, 'update'])->name('ordenes.update');
            Route::put('/{orden}/estado', [OrdenVentaController::class, 'updateEstado'])->name('ordenes.estado');
        });
        Route::prefix('facturas')->group(function () {
            Route::get('/', function() { return Inertia::render('Ventas/Facturas/Index'); })->name('facturas.index');
            Route::get('/{factura}', function($id) { return Inertia::render('Ventas/Facturas/Show', ['facturaId' => $id]); })->name('facturas.show');
            Route::post('/convertir/{orden}', [FacturaController::class, 'convertirDesdeOrden'])->name('facturas.convertir');
        });
        Route::prefix('cobros')->group(function () {
            Route::get('/crear', [CobroController::class, 'create'])->name('cobros.create');
            Route::post('/', [CobroController::class, 'store'])->name('cobros.store');
        });
        Route::prefix('notas-credito')->name('ventas.nc.')->group(function () {
            Route::get('/', [NotaCreditoController::class, 'index'])->name('index');
            Route::get('/crear-manual', function() { return Inertia::render('Ventas/NotasCredito/CreateManual'); })->name('crear-manual');
            Route::get('/factura/{factura}/datos', [NotaCreditoController::class, 'getDatosFactura'])->name('datos-factura');
            Route::post('/', [NotaCreditoController::class, 'store'])->name('store');
            Route::post('/{nota}/anular', [NotaCreditoController::class, 'anular'])->name('anular');
            Route::get('/{nota}', [NotaCreditoController::class, 'show'])->name('show');
        });
        Route::prefix('pos')->name('pos.')->group(function () {
            Route::get('/', [PosController::class, 'index'])->name('index');
            Route::post('/abrir', [PosController::class, 'openSession'])->name('abrir');
            Route::post('/cerrar', [PosController::class, 'closeSession'])->name('cerrar');
            Route::get('/items', [PosController::class, 'searchItems'])->name('items');
            Route::get('/ordenes', [PosController::class, 'searchOrders'])->name('ordenes');
            Route::post('/procesar', [PosController::class, 'processSale'])->name('procesar');
            Route::get('/corte-x', [PosController::class, 'getCorteX'])->name('corte-x');
        });
    });
    
    // FACTORING
    Route::prefix('finanzas/factoring')->name('finanzas.factoring.')->group(function () {
        Route::get('/', [FactoringController::class, 'index'])->name('index');
        Route::get('/compra/crear', [FactoringController::class, 'createCompra'])->name('compra.create');
        Route::get('/venta/crear', [FactoringController::class, 'createVenta'])->name('venta.create');
        Route::get('/facturas-compra-pendientes', [FactoringController::class, 'getFacturasCompraPendientes'])->name('facturas-compra');
        Route::get('/facturas-venta-pendientes', [FactoringController::class, 'getFacturasVentaPendientes'])->name('facturas-venta');
        Route::get('/notas-credito-pendientes', [FactoringController::class, 'getNotasCreditoPendientes'])->name('notas-credito-pendientes');
        Route::post('/', [FactoringController::class, 'store'])->name('store');
        Route::post('/{operacion}/anular', [FactoringController::class, 'anular'])->name('anular');
        Route::get('/{operacion}', [FactoringController::class, 'show'])->name('show');
    });
    
    // COMPRAS
    Route::prefix('compras')->name('compras.')->group(function () {
        Route::post('/consolidar-ventas', [ConsolidarVentasController::class, 'store'])->name('consolidar.store');
        Route::prefix('ordenes')->group(function () {
            Route::get('/', function() { return Inertia::render('Compras/Ordenes/Index'); })->name('ordenes.index');
            Route::get('/crear', function() { return Inertia::render('Compras/Ordenes/Create'); })->name('ordenes.create');
            
            // CORRECCIÓN: Ahora usa OrdenCompraController para guardar
            Route::post('/', [OrdenCompraController::class, 'store'])->name('ordenes.store');
            
            Route::get('/{id}/pdf', [OrdenCompraController::class, 'generarPDF'])->name('ordenes.pdf');
            Route::put('/{orden}/estado', [OrdenCompraController::class, 'updateEstado'])->name('ordenes.estado');
            Route::get('/{orden}', function($id) { return Inertia::render('Compras/Ordenes/Show', ['ordenId' => $id]); })->name('ordenes.show');
            Route::get('/{orden}/editar', [OrdenCompraController::class, 'edit'])->name('ordenes.edit');
            Route::put('/{orden}', [OrdenCompraController::class, 'update'])->name('ordenes.update');
            Route::delete('/{orden}', [OrdenCompraController::class, 'destroy'])->name('ordenes.destroy');
        });
        Route::prefix('facturas')->group(function () {
            Route::get('/', function() { return Inertia::render('Compras/Facturas/Index'); })->name('facturas.index');
            Route::get('/{factura}', function($id) { return Inertia::render('Compras/Facturas/Show', ['facturaId' => $id]); })->name('facturas.show');
            Route::post('/convertir/{orden}', [FacturaCompraController::class, 'convertirDesdeOrden'])->name('facturas.convertir');
            Route::get('/{factura}/pdf', [FacturaCompraController::class, 'generarPDF'])->name('facturas.pdf');
        });
        Route::prefix('pagos')->group(function () {
            Route::get('/crear', function() { return Inertia::render('Compras/Egresos/Create'); })->name('pagos.create');
            Route::post('/', [EgresoController::class, 'store'])->name('pagos.store');
        });
        Route::prefix('recepciones')->name('recepciones.')->group(function () {
            Route::get('/', [RecepcionOrdenController::class, 'index'])->name('index');
            Route::get('/historial', [RecepcionOrdenController::class, 'historial'])->name('historial');
            Route::get('/recibir/{id}', [RecepcionOrdenController::class, 'recibir'])->name('recibir');
            Route::post('/', [RecepcionOrdenController::class, 'store'])->name('store');
            Route::post('/buscar-codigo', [RecepcionOrdenController::class, 'buscarPorCodigo'])->name('buscar-codigo');
            Route::get('/{id}', [RecepcionOrdenController::class, 'show'])->name('show');
        });
    });
    
    // RRHH
    // Se asume que solo el administrador maneja RRHH por el momento
    Route::prefix('rrhh')->middleware(['role:Administrador Total'])->group(function () {
        Route::get('/empleados', function() { return Inertia::render('RRHH/Empleados/Index'); })->name('rrhh.empleados.index');
        Route::post('/empleados', [EmpleadoController::class, 'store'])->name('rrhh.empleados.store');
        Route::put('/empleados/{empleado}', [EmpleadoController::class, 'update'])->name('rrhh.empleados.update');
        Route::prefix('nomina')->group(function () {
            Route::get('/', function() { return Inertia::render('RRHH/Nomina/Index'); })->name('rrhh.nomina.index');
            Route::get('/procesar', function() { return Inertia::render('RRHH/Nomina/Create'); })->name('rrhh.nomina.create');
            Route::post('/procesar', [NominaController::class, 'procesar'])->name('nomina.procesar');
        });
    });
    
    // REPORTES Y FINANZAS
    Route::prefix('reportes')->group(function () {
        Route::get('/estado-resultados', function() { return Inertia::render('Contabilidad/Reportes/EstadoResultados'); })->name('reportes.financieros.resultados');
    });
    Route::prefix('finanzas')->group(function () {
        Route::get('/estados-cuenta', [EstadoCuentaController::class, 'index'])->name('finanzas.estados-cuenta.index');
        Route::get('/estados-cuenta/{contacto}', [EstadoCuentaController::class, 'show'])->name('finanzas.estado-cuenta');
        Route::get('/estado-cuenta/{contacto}/pdf', [EstadoCuentaController::class, 'generarPDF'])->name('finanzas.estado-cuenta.pdf');
    });

});