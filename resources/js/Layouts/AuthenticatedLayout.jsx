import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notifications from '@/Components/Notifications';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState({});

    // Helper robusto para verificar roles
    const hasRole = (requiredRoles) => {
        if (!requiredRoles) return true;

        // Convertimos a array por si Spatie envía un objeto indexado
        const userRoles = Array.isArray(auth.user?.roles)
            ? auth.user.roles
            : Object.values(auth.user?.roles || {});

        if (userRoles.includes('Administrador Total')) return true;
        return requiredRoles.some(role => userRoles.includes(role));
    };

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const handleLogout = () => {
        if (confirm('¿Cerrar sesión?')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('logout');
            const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
            document.body.appendChild(form);
            form.submit();
        }
    };

    // Estructura de Menú Corregida
    const menuItems = [
        {
            name: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            href: route('dashboard'),
            roles: null
        },
        {
            name: 'Operaciones',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            roles: ['Administrador Total', 'Diseñador', 'Impresor', 'Operador de Máquina', 'Jefe de Bodega'],
            submenu: [
                { name: 'Monitor KDS', href: route('produccion.kds'), roles: ['Administrador Total', 'Operador de Máquina'] },
                { name: 'Cola de Diseño', href: route('produccion.diseno.index'), roles: ['Administrador Total', 'Diseñador'] },
                { name: 'Nesting / Pliegos', href: route('produccion.pliegos.index'), roles: ['Administrador Total', 'Impresor'] },
                { name: 'Control de Planta', href: route('produccion.planta.index'), roles: ['Administrador Total', 'Operador de Máquina'] },
                { name: 'Bodega / Requisiciones', href: route('produccion.requisiciones.index'), roles: ['Administrador Total', 'Jefe de Bodega'] },
                { name: 'Gestión de Insumos', href: route('items.index'), roles: ['Administrador Total', 'Jefe de Bodega'] }
            ]
        },
        {
            name: 'Ciclo Comercial',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            roles: ['Administrador Total', 'Vendedor', 'Cobrador', 'Atención al Cliente'],
            submenu: [
                { name: 'Punto de Venta (POS)', href: route('pos.index') },
                { name: 'Órdenes de Venta', href: route('ordenes.index') },
                { name: 'Facturación', href: route('facturas.index') },
                { name: 'Notas de Crédito', href: route('ventas.nc.index') },
                { name: 'Cobros / Recibos', href: route('cobros.create') },
                { name: 'Órdenes de Compra', href: route('compras.ordenes.index'), roles: ['Administrador Total', 'Jefe de Bodega'] },
                { name: 'Facturas de Compra', href: route('compras.facturas.index'), roles: ['Administrador Total'] }
            ]
        },
        {
            name: 'Inventario',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            roles: ['Administrador Total', 'Vendedor', 'Jefe de Bodega'],
            submenu: [
                { name: 'Catálogo Productos', href: route('items.index') },
                { name: 'Contactos / Clientes', href: route('contactos.index') },
                { name: 'Sucursales / Almacén', href: route('sucursales.index') }
            ]
        },
        {
            name: 'Finanzas y RRHH',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            roles: ['Administrador Total', 'Cobrador'],
            submenu: [
                { name: 'Gestión Bancaria', href: route('bancos.index') },
                { name: 'Catálogo Contable', href: route('accounts.index') },
                { name: 'Libro Diario', href: route('contabilidad.diario') },
                { name: 'Factoring', href: route('finanzas.factoring.index') },
                { name: 'Nómina de Empleados', href: route('rrhh.empleados.index'), roles: ['Administrador Total'] },
                { name: 'Pagos de Nómina', href: route('rrhh.nomina.index'), roles: ['Administrador Total'] }
            ]
        },
        {
            name: 'Reportes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-8 13h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            roles: ['Administrador Total'],
            submenu: [
                { name: 'Estado Resultados', href: route('reportes.financieros.resultados') },
                { name: 'Estados de Cuenta', href: route('finanzas.estados-cuenta.index') }
            ]
        },
        {
            name: 'Configuración',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            roles: ['Administrador Total'],
            submenu: [
                { name: 'Ajustes Generales', href: route('settings.index') },
                { name: 'Parámetros Sistema', href: route('params.index') },
                { name: 'Métodos de Pago POS', href: route('config.pos.metodos.index') },
                { name: 'Gestión Vendedores', href: route('vendedores.index') },
                { name: 'Plantillas de Diseño', href: route('config.diseno.index') }
            ]
        },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
            <Notifications />

            {/* Sidebar */}
            <aside className={`bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} flex flex-col shadow-2xl`}>
                {/* Header / Logo */}
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-black uppercase tracking-widest text-blue-400">SpacioArte</h1>
                    ) : (
                        <span className="text-2xl font-black text-blue-400">S</span>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                    </button>
                </div>

                {/* Navigation - Filtrada por roles */}
                <nav className="flex-1 overflow-y-auto py-6 space-y-1">
                    {menuItems.filter(item => hasRole(item.roles)).map((item, index) => (
                        <div key={index} className="px-3">
                            {item.submenu ? (
                                <>
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-all ${openMenus[item.name] ? 'bg-white/10 text-blue-400' : 'hover:bg-white/5 text-slate-400'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={openMenus[item.name] ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</span>
                                            {sidebarOpen && <span className="font-bold text-sm uppercase tracking-tight">{item.name}</span>}
                                        </div>
                                        {sidebarOpen && (
                                            <svg className={`w-4 h-4 transition-transform ${openMenus[item.name] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>
                                    {openMenus[item.name] && sidebarOpen && (
                                        <div className="mt-1 ml-4 border-l border-white/10 space-y-1">
                                            {item.submenu.filter(sub => hasRole(sub.roles)).map((sub, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    href={sub.href}
                                                    className={`block px-4 py-2 pl-10 text-xs font-bold transition-all rounded-r-lg ${route().current(sub.href + '*') ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`px-4 py-3 flex items-center gap-3 rounded-xl transition-all ${route().current(item.href + '*') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <span className={route().current(item.href + '*') ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                                    {sidebarOpen && <span className="font-bold text-sm uppercase tracking-tight">{item.name}</span>}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Profile & Logout */}
                <div className="p-4 bg-black/20 mt-auto">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">
                            {auth.user?.name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 overflow-hidden">
                                <div className="font-black text-xs truncate uppercase tracking-tighter">{auth.user?.name}</div>
                                <div className="text-[10px] text-blue-400 font-bold truncate tracking-widest">
                                    {auth.user?.roles?.[0] || 'Sin Rol'}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-3 w-full px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && 'Desconectar'}
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 h-screen overflow-y-auto bg-slate-50 relative">
                <div className="p-4 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}