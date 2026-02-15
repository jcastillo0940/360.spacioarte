import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/compras/ordenes')
            .then(res => res.json())
            .then(data => {
                setOrdenes(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading ordenes:', error);
                setOrdenes([]);
                setLoading(false);
            });
    };

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar esta orden de compra?')) {
            router.delete(`/compras/ordenes/${id}`, {
                onSuccess: () => loadData()
            });
        }
    };

    const handleConvertir = (id) => {
        if (confirm('¿Convertir esta orden en factura de compra? Se recibirá la mercancía y se actualizará el inventario.')) {
            router.post(`/compras/facturas/convertir/${id}`, {}, {
                onSuccess: () => {
                    loadData();
                }
            });
        }
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'Borrador': 'bg-slate-100 text-slate-700',
            'Confirmada': 'bg-blue-100 text-blue-700',
            'Recibida Total': 'bg-green-100 text-green-700',
            'Recibida Parcial': 'bg-orange-100 text-orange-700',
            'Cancelada': 'bg-red-100 text-red-700'
        };
        return badges[estado] || badges['Borrador'];
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Órdenes de Compra" />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando órdenes...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const stats = {
        total: ordenes.length,
        pendientes: ordenes.filter(o => o.estado === 'Confirmada').length,
        recibidas: ordenes.filter(o => o.estado === 'Recibida Total').length,
        valorTotal: ordenes.reduce((acc, o) => acc + parseFloat(o.total || 0), 0)
    };

    return (
        <AuthenticatedLayout>
            <Head title="Órdenes de Compra" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Órdenes de Compra
                        </h1>
                        <p className="text-slate-600 mt-2">Gestión de pedidos a proveedores</p>
                    </div>
                    <Link
                        href="/compras/ordenes/crear"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Orden
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Total Órdenes</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-orange-500 uppercase">Pendientes</div>
                        <div className="text-3xl font-black text-orange-600 mt-2">{stats.pendientes}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-green-500 uppercase">Recibidas</div>
                        <div className="text-3xl font-black text-green-600 mt-2">{stats.recibidas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Valor Total</div>
                        <div className="text-2xl font-black text-blue-600 mt-2">{formatCurrency(stats.valorTotal)}</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Orden</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Proveedor</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Fecha</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">Total</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {ordenes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                            <p className="text-lg font-bold">No hay órdenes de compra</p>
                                        </td>
                                    </tr>
                                ) : (
                                    ordenes.map(orden => (
                                        <tr key={orden.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-slate-900">{orden.numero_orden}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{orden.proveedor?.razon_social}</div>
                                                <div className="text-sm text-slate-500">{orden.proveedor?.identificacion}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(orden.fecha_emision).toLocaleDateString('es-PA')}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">
                                                {formatCurrency(orden.total)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(orden.estado)}`}>
                                                    {orden.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/compras/ordenes/${orden.id}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Ver detalles"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    
                                                    {(orden.estado === 'Borrador' || orden.estado === 'Confirmada') && (
                                                        <Link
                                                            href={`/compras/ordenes/${orden.id}/editar`}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                                            title="Editar"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                    )}

                                                    <a 
                                                        href={`/compras/ordenes/${orden.id}/pdf`}
                                                        target="_blank"
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Descargar PDF"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </a>

                                                    {orden.estado === 'Confirmada' && (
                                                        <button
                                                            onClick={() => handleConvertir(orden.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Convertir a Factura"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {orden.estado === 'Borrador' && (
                                                        <button
                                                            onClick={() => handleDelete(orden.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Eliminar"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}