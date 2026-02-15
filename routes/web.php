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
use App\Http\Controllers\Ventas\{OrdenVentaController, FacturaController, CobroController, NotaCreditoController};

// Compras
use App\Http\Controllers\Compras\{OrdenCompraController, FacturaCompraController, EgresoController, RecepcionOrdenController, ConsolidarVentasController};

// RRHH & Flota
use App\Http\Controllers\RRHH\{EmpleadoController, NominaController};
use App\Http\Controllers\Flota\VehiculoController;

// PWA Sync
use App\Http\Controllers\PWA\MobileSyncController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// --- RUTAS PÚBLICAS (LOGIN) ---
Route::middleware('guest')->group(function () {
    Route::get('/', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

// --- RUTAS PROTEGIDAS (ERP CORE + PWA) ---
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // --- DASHBOARD ---
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // ========================================================================
    //  RUTAS PWA / API INTERNAS (Retornan JSON para IndexedDB)
    // ========================================================================
    Route::prefix('api')->group(function () {
        // Configuración
        Route::get('/configuracion', [SettingsController::class, 'index']);
        Route::get('/configuracion/parametros', [ParametrizacionController::class, 'index']);
        Route::get('/configuracion/vendedores', [VendedorController::class, 'index']);
        
        // Inventario
        Route::get('/inventario/items', [ItemController::class, 'index']);
        Route::get('/inventario/contactos', [ContactoController::class, 'index']);
        Route::get('/inventario/sucursales', [SucursalController::class, 'index']);
        Route::get('/inventario/sucursales/contacto/{contacto}', [SucursalController::class, 'getByContacto']);
        
        // Contabilidad
        Route::get('/contabilidad/cuentas', [AccountController::class, 'index']);
        Route::get('/contabilidad/bancos', [BankController::class, 'index']);
        Route::get('/contabilidad/libro-diario', [LibroDiarioController::class, 'index']);
        
        // Ventas (Datos Crudos)
        Route::get('/ventas/ordenes', [OrdenVentaController::class, 'index']);
        Route::get('/ventas/ordenes/datos', [OrdenVentaController::class, 'getDatos']);
        Route::get('/ventas/ordenes/{orden}', [OrdenVentaController::class, 'show']);
        Route::get('/ventas/facturas', [FacturaController::class, 'index']);
        Route::get('/ventas/facturas/{factura}', [FacturaController::class, 'show']);
        Route::get('/ventas/cobros/datos', [CobroController::class, 'getDatos']);
        
        // Notas de Crédito (Datos)
        Route::get('/ventas/facturas/{factura}/datos-nc', [NotaCreditoController::class, 'getDatosFactura']);
        Route::get('/ventas/notas-credito', [NotaCreditoController::class, 'index']);
        Route::get('/ventas/notas-credito/{nota}', [NotaCreditoController::class, 'show']);
        
        // Compras (Datos Crudos)
        Route::get('/compras/ordenes', [OrdenCompraController::class, 'index']);
        Route::get('/compras/ordenes/datos', [OrdenCompraController::class, 'getDatos']);
        Route::get('/compras/ordenes/{orden}', [OrdenCompraController::class, 'show']);
        Route::get('/compras/facturas', [FacturaCompraController::class, 'index']);
        Route::get('/compras/facturas/{factura}', [FacturaCompraController::class, 'show']);
        Route::get('/compras/egresos/datos', [EgresoController::class, 'getDatos']);
        
        // RRHH
        Route::get('/rrhh/empleados', [EmpleadoController::class, 'index']);
        Route::get('/rrhh/nomina', [NominaController::class, 'index']);
        
        // Reportes & Finanzas
        Route::get('/reportes/estado-resultados', [ReporteController::class, 'estadoResultados']);
        Route::get('/finanzas/factoring', [FactoringController::class, 'index']);
        Route::get('/finanzas/estados-cuenta/{contacto}/data', [EstadoCuentaController::class, 'getRawData']);
    });

    // ========================================================================
    //  RUTAS PWA (OFFLINE FIRST & VISTAS)
    // ========================================================================
    Route::prefix('pwa')->group(function () {
        // API Sync
        Route::get('/sync/initial', [MobileSyncController::class, 'initialSync'])->name('pwa.sync.initial');
        Route::post('/sync/upload', [MobileSyncController::class, 'syncUp'])->name('pwa.sync.upload');

        // Vistas PWA (Inertia)
        // 1. HOME / DASHBOARD
        Route::get('/home', function () {
    return Inertia::render('PWA/DashboardPwa'); // <--- Cambio aquí
})->name('pwa.home');

        // 2. RUTA
        Route::get('/ruta-entrega', function () {
            return Inertia::render('PWA/RutaEntrega');
        })->name('pwa.ruta');

        // 3. VENTA
        Route::get('/venta/{cliente_id}', function ($cliente_id) {
            return Inertia::render('PWA/NuevaVenta', ['cliente_id' => $cliente_id]);
        })->name('pwa.venta.create');

        // 4. INVENTARIO
        Route::get('/inventario', function () {
            return Inertia::render('PWA/Inventario');
        })->name('pwa.inventario');
    });

    // ========================================================================
    //  MÓDULOS WEB (Retornan Inertia::render)
    // ========================================================================
    
    // --- MÓDULO 1: CONFIGURACIÓN ---
    Route::prefix('configuracion')->group(function () {
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
    });
    
    // --- MÓDULO 2: INVENTARIOS Y CONTACTOS ---
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
    
    // --- MÓDULO 3: FINANCIERO Y CONTABLE ---
    Route::prefix('contabilidad')->group(function () {
        Route::get('/catalogo', function() { return Inertia::render('Contabilidad/Cuentas/Index'); })->name('accounts.index');
        Route::post('/cuentas', [AccountController::class, 'store'])->name('accounts.store');
        
        Route::prefix('bancos')->group(function () {
            Route::get('/', function() { return Inertia::render('Contabilidad/Bancos/Index'); })->name('bancos.index');
            Route::post('/', [BankController::class, 'store'])->name('bancos.store');
            Route::post('/transferir', [BankController::class, 'transfer'])->name('bancos.transfer');
        });

        Route::get('/libro-diario', function() { return Inertia::render('Contabilidad/LibroDiario/Index'); })->name('contabilidad.diario');
    });
    
    // --- MÓDULO 4: VENTAS ---
    Route::prefix('ventas')->group(function () {
        Route::prefix('ordenes')->group(function () {
            Route::get('/', function() { return Inertia::render('Ventas/Ordenes/Index'); })->name('ordenes.index');
            Route::get('/crear', function() { return Inertia::render('Ventas/Ordenes/Create'); })->name('ordenes.create');
            Route::post('/', [OrdenVentaController::class, 'store'])->name('ordenes.store');
            Route::get('/{orden}', function($id) { return Inertia::render('Ventas/Ordenes/Show', ['ordenId' => $id]); })->name('ordenes.show');
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

        // Notas de Crédito
        Route::prefix('notas-credito')->name('ventas.nc.')->group(function () {
            Route::get('/', [NotaCreditoController::class, 'index'])->name('index');
            Route::get('/crear-manual', function() { return Inertia::render('Ventas/NotasCredito/CreateManual'); })->name('crear-manual');
            Route::get('/factura/{factura}/datos', [NotaCreditoController::class, 'getDatosFactura'])->name('datos-factura');
            Route::post('/', [NotaCreditoController::class, 'store'])->name('store');
            Route::post('/{nota}/anular', [NotaCreditoController::class, 'anular'])->name('anular');
            Route::get('/{nota}', [NotaCreditoController::class, 'show'])->name('show');
        });
    });
    
    // --- MÓDULO 5: FACTORING ---
    Route::prefix('finanzas/factoring')->name('finanzas.factoring.')->group(function () {
        Route::get('/', [FactoringController::class, 'index'])->name('index');
        Route::get('/compra/crear', [FactoringController::class, 'createCompra'])->name('compra.create');
        Route::get('/venta/crear', [FactoringController::class, 'createVenta'])->name('venta.create');
        
        // Endpoints API internos
        Route::get('/facturas-compra-pendientes', [FactoringController::class, 'getFacturasCompraPendientes'])->name('facturas-compra');
        Route::get('/facturas-venta-pendientes', [FactoringController::class, 'getFacturasVentaPendientes'])->name('facturas-venta');
        Route::get('/notas-credito-pendientes', [FactoringController::class, 'getNotasCreditoPendientes'])->name('notas-credito-pendientes');
        
        Route::post('/', [FactoringController::class, 'store'])->name('store');
        Route::post('/{operacion}/anular', [FactoringController::class, 'anular'])->name('anular');
        Route::get('/{operacion}', [FactoringController::class, 'show'])->name('show');
    });
    
    // --- MÓDULO 6: COMPRAS ---
    Route::prefix('compras')->name('compras.')->group(function () {
        
        Route::post('/consolidar-ventas', [ConsolidarVentasController::class, 'store'])->name('consolidar.store');

        Route::prefix('ordenes')->group(function () {
            Route::get('/', function() { return Inertia::render('Compras/Ordenes/Index'); })->name('ordenes.index');
            Route::get('/crear', function() { return Inertia::render('Compras/Ordenes/Create'); })->name('ordenes.create');
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
    
    // --- MÓDULO 7: RRHH ---
    Route::prefix('rrhh')->group(function () {
        Route::get('/empleados', function() { return Inertia::render('RRHH/Empleados/Index'); })->name('rrhh.empleados.index');
        Route::post('/empleados', [EmpleadoController::class, 'store'])->name('rrhh.empleados.store');
        Route::put('/empleados/{empleado}', [EmpleadoController::class, 'update'])->name('rrhh.empleados.update');
    
        Route::prefix('nomina')->group(function () {
            Route::get('/', function() { return Inertia::render('RRHH/Nomina/Index'); })->name('rrhh.nomina.index');
            Route::get('/procesar', function() { return Inertia::render('RRHH/Nomina/Create'); })->name('rrhh.nomina.create');
            Route::post('/procesar', [NominaController::class, 'procesar'])->name('nomina.procesar');
        });
    });
    
    // --- MÓDULO 8: REPORTES FINANCIEROS ---
    Route::prefix('reportes')->group(function () {
        Route::get('/estado-resultados', function() { return Inertia::render('Contabilidad/Reportes/EstadoResultados'); })->name('reportes.financieros.resultados');
    });
    
    // --- MÓDULO 9: ESTADOS DE CUENTA ---
    Route::prefix('finanzas')->group(function () {
        Route::get('/estados-cuenta', [EstadoCuentaController::class, 'index'])->name('finanzas.estados-cuenta.index');
        Route::get('/estados-cuenta/{contacto}', [EstadoCuentaController::class, 'show'])->name('finanzas.estado-cuenta');
        Route::get('/estado-cuenta/{contacto}/pdf', [EstadoCuentaController::class, 'generarPDF'])->name('finanzas.estado-cuenta.pdf');
    });
    
    

});