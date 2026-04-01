import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notifications from '@/Components/Notifications';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState({});

    const hasRole = (requiredRoles) => {
        if (!requiredRoles) return true;

        const userRoles = Array.isArray(auth.user?.roles)
            ? auth.user.roles
            : Object.values(auth.user?.roles || {});

        if (userRoles.includes('Administrador Total')) return true;
        return requiredRoles.some((role) => userRoles.includes(role));
    };

    const toggleMenu = (menu) => {
        setOpenMenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
    };

    const handleLogout = () => {
        if (confirm('Cerrar sesion?')) {
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

    const menuItems = [
        {
            name: 'Dashboard',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            href: route('dashboard'),
            roles: null,
        },
        {
            name: 'Compras & Prov.',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            roles: ['Administrador Total', 'Jefe de Bodega'],
            submenu: [
                { name: 'Ordenes de Compra', href: route('compras.ordenes.index') },
                { name: 'Facturas de Proveedor', href: route('compras.facturas.index') },
                { name: 'Ingresos a Bodega', href: route('compras.recepciones.index') },
                { name: 'Egresos / Pagos', href: route('compras.pagos.create') },
                { name: 'Directorio Proveedores', href: route('contactos.index') },
            ],
        },
        {
            name: 'Ventas & Clientes',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            roles: ['Administrador Total', 'Vendedor', 'Atencion al Cliente'],
            submenu: [
                { name: 'Punto de Venta (POS)', href: route('pos.index') },
                { name: 'Cotizaciones', href: route('cotizaciones.index') },
                { name: 'Ordenes de Trabajo', href: route('ordenes.index') },
                { name: 'Facturacion Clientes', href: route('facturas.index') },
                { name: 'Notas de Credito', href: route('ventas.nc.index') },
                { name: 'Notas de Debito', href: route('ventas.nd.index') },
                { name: 'Recibos de Cobro', href: route('cobros.create') },
                { name: 'CRM', href: route('crm.index') },
                { name: 'Base de Clientes', href: route('contactos.index') },
            ],
        },
        {
            name: 'Produccion',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            roles: ['Administrador Total', 'Disenador', 'Impresor', 'Operador de Maquina', 'Jefe de Bodega'],
            submenu: [
                { name: 'Familias Productivas', href: route('produccion.familias.index'), roles: ['Administrador Total'] },
                { name: 'Maquinas / Centros de Trabajo', href: route('produccion.procesos.index'), roles: ['Administrador Total'] },
                { name: 'Monitor KDS', href: route('produccion.kds'), roles: ['Administrador Total', 'Operador de Maquina'] },
                { name: 'Cola de Diseno', href: route('produccion.diseno.index'), roles: ['Administrador Total', 'Disenador'] },
                { name: 'Nesting / Pliegos', href: route('produccion.pliegos.index'), roles: ['Administrador Total', 'Impresor'] },
                { name: 'Control de Planta', href: route('produccion.planta.index'), roles: ['Administrador Total', 'Operador de Maquina'] },
                { name: 'Requisiciones Insumos', href: route('produccion.requisiciones.index'), roles: ['Administrador Total', 'Jefe de Bodega'] },
            ],
        },
        {
            name: 'Inventarios',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            roles: ['Administrador Total', 'Jefe de Bodega'],
            submenu: [
                { name: 'Catalogo Maestro', href: route('items.index') },
                { name: 'Categorias Productos', href: route('inventario.categorias.index') },
                { name: 'Sucursales / Bodegas', href: route('sucursales.index') },
                { name: 'Ajustes de Stock', href: '#', roles: ['Administrador Total'] },
            ],
        },
        {
            name: 'Tesoreria',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            roles: ['Administrador Total', 'Cobrador'],
            submenu: [
                { name: 'Cajas y Bancos', href: route('bancos.index') },
                { name: 'Factoring', href: route('finanzas.factoring.index') },
                { name: 'Libro Diario', href: route('contabilidad.diario') },
                { name: 'Plan de Cuentas', href: route('accounts.index') },
            ],
        },
        {
            name: 'Capital Humano',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            roles: ['Administrador Total'],
            submenu: [
                { name: 'Colaboradores', href: route('rrhh.empleados.index') },
                { name: 'Nomina Operativa', href: route('rrhh.nomina.index') },
            ],
        },
        {
            name: 'Reportes & BI',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            roles: ['Administrador Total'],
            submenu: [
                { name: 'Todos los Reportes', href: route('reportes.index') },
                { name: 'Ventas', href: route('reportes.ventas.index') },
                { name: 'Administrativos', href: route('reportes.admin.index') },
                { name: 'Financieros', href: route('reportes.financieros.index') },
                { name: 'Contabilidad', href: route('reportes.contabilidad.index') },
                { name: 'Exportar Datos', href: route('reportes.exportar.index') },
            ],
        },
        {
            name: 'Configuracion',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            roles: ['Administrador Total'],
            submenu: [
                { name: 'Ajustes Generales', href: route('settings.index') },
                { name: 'Usuarios y Roles', href: route('usuarios.index') },
                { name: 'Parametros Sistema', href: route('params.index') },
                { name: 'Equipo de Ventas', href: route('vendedores.index') },
                { name: 'Plantillas Diseno', href: route('config.diseno.index') },
            ],
        },
    ];

    return (
        <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
            <Notifications />

            <aside className={`flex flex-col bg-slate-900 text-white shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
                <div className="flex items-center justify-between border-b border-white/10 p-6">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-black uppercase tracking-widest text-blue-400">SpacioArte</h1>
                    ) : (
                        <span className="text-2xl font-black text-blue-400">S</span>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-xl p-2 transition hover:bg-white/10">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto py-6">
                    {menuItems.filter((item) => hasRole(item.roles)).map((item, index) => (
                        <div key={index} className="px-3">
                            {item.submenu ? (
                                <>
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${openMenus[item.name] ? 'bg-white/10 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={openMenus[item.name] ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</span>
                                            {sidebarOpen && <span className="text-sm font-bold uppercase tracking-tight">{item.name}</span>}
                                        </div>
                                        {sidebarOpen && (
                                            <svg className={`h-4 w-4 transition-transform ${openMenus[item.name] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>

                                    {openMenus[item.name] && sidebarOpen && (
                                        <div className="mt-1 ml-4 space-y-1 border-l border-white/10">
                                            {item.submenu.filter((sub) => hasRole(sub.roles)).map((sub, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    href={sub.href}
                                                    className="block rounded-r-lg px-4 py-2 pl-10 text-xs font-bold text-slate-500 transition-all hover:bg-white/5 hover:text-white"
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
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                                >
                                    <span className="text-slate-500">{item.icon}</span>
                                    {sidebarOpen && <span className="text-sm font-bold uppercase tracking-tight">{item.name}</span>}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="mt-auto bg-black/20 p-4">
                    <div className="flex items-center gap-3 p-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
                            {auth.user?.name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 overflow-hidden">
                                <div className="truncate text-xs font-black uppercase tracking-tighter">{auth.user?.name}</div>
                                <div className="truncate text-[10px] font-bold tracking-widest text-blue-400">
                                    {auth.user?.roles?.[0] || 'Sin Rol'}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && 'Desconectar'}
                    </button>
                </div>
            </aside>

            <main className="relative h-screen flex-1 overflow-y-auto bg-slate-50">
                <div className="mx-auto max-w-[1600px] p-4 sm:p-8 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
