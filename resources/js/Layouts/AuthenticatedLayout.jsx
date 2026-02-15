import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notifications from '@/Components/Notifications';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState({});

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
            form.action = '/logout';
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            href: '/dashboard'
        },
        {
            name: 'Configuración',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            submenu: [
                { name: 'General', href: '/configuracion' },
                { name: 'Parámetros', href: '/configuracion/parametros' },
                { name: 'Vendedores', href: '/configuracion/vendedores' }
            ]
        },
        {
            name: 'Inventario',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            submenu: [
                { name: 'Productos', href: '/inventario/items' }
            ]
        },
        
        {
            name: 'Contactos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Contactos', href: '/inventario/contactos' },
                { name: 'Sucursales', href: '/inventario/sucursales' },
                { name: 'Estados de Cuenta', href: '/finanzas/estados-cuenta' } // <-- Añadido aquí
            ]
        },
        
        {
            name: 'Factoring',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Operaciones', href: '/finanzas/factoring' },
                { name: 'Factoring Compras', href: '/finanzas/factoring/compra/crear' },
                { name: 'Factoring Ventas', href: '/finanzas/factoring/venta/crear' }
            ]
        },
        
        {
            name: 'Contabilidad',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            submenu: [
                { name: 'Catálogo de Cuentas', href: '/contabilidad/catalogo' },
                { name: 'Bancos', href: '/contabilidad/bancos' },
                { name: 'Libro Diario', href: '/contabilidad/libro-diario' }
            ]
        },
        {
            name: 'Ventas',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Órdenes de Venta', href: '/ventas/ordenes' },
                { name: 'Facturas', href: '/ventas/facturas' },
                { name: 'Notas de Crédito', href: '/ventas/notas-credito' },
                { name: 'Cobros', href: '/ventas/cobros/crear' }
            ]
        },
        {
            name: 'Compras',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            submenu: [
                { name: 'Órdenes de Compra', href: '/compras/ordenes' },
                { name: 'Facturas de Compra', href: '/compras/facturas' },
                { name: 'Pagos', href: '/compras/pagos/crear' }
            ]
        },
        {
            name: 'Recursos Humanos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Empleados', href: '/rrhh/empleados' },
                { name: 'Nómina', href: '/rrhh/nomina' }
            ]
        },
        {
            name: 'Reportes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            submenu: [
                { name: 'Estado de Resultados', href: '/reportes/estado-resultados' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Notifications Component */}
            <Notifications />

            {/* Sidebar */}
            <aside className={`bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
                {/* Logo */}
                <div className="p-4 flex items-center justify-between border-b border-slate-800">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-black uppercase tracking-wider">ERP System</h1>
                    ) : (
                        <span className="text-xl font-black">E</span>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {menuItems.map((item, index) => (
                        <div key={index}>
                            {item.submenu ? (
                                <>
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            {sidebarOpen && <span className="font-medium">{item.name}</span>}
                                        </div>
                                        {sidebarOpen && (
                                            <svg className={`w-4 h-4 transition-transform ${openMenus[item.name] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>
                                    {openMenus[item.name] && sidebarOpen && (
                                        <div className="bg-slate-800 border-l-4 border-blue-500">
                                            {item.submenu.map((sub, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    href={sub.href}
                                                    className="block px-4 py-2 pl-14 text-sm hover:bg-slate-700 transition"
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
                                    className="px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition"
                                >
                                    {item.icon}
                                    {sidebarOpen && <span className="font-medium">{item.name}</span>}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User */}
                <div className="border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                            {auth.user?.name?.charAt(0) || 'U'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1">
                                <div className="font-bold text-sm">{auth.user?.name}</div>
                                <div className="text-xs text-slate-400">{auth.user?.email}</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && 'Cerrar Sesión'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}