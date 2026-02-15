import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/compras/facturas')
            .then(res => res.json())
            .then(data => {
                setFacturas(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading facturas:', error);
                setFacturas([]);
                setLoading(false);
            });
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'Abierta': 'bg-orange-100 text-orange-700',
            'Pagada': 'bg-green-100 text-green-700',
            'Anulada': 'bg-red-100 text-red-700'
        };
        return badges[estado] || badges['Abierta'];
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Facturas de Compra" />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando facturas...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const stats = {
        total: facturas.length,
        abiertas: facturas.filter(f => f.estado === 'Abierta').length,
        pagadas: facturas.filter(f => f.estado === 'Pagada').length,
        saldoPendiente: facturas.filter(f => f.estado === 'Abierta').reduce((acc, f) => acc + parseFloat(f.saldo_pendiente || 0), 0)
    };

    return (
        <AuthenticatedLayout>
            <Head title="Facturas de Compra" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Facturas de Compra
                        </h1>
                        <p className="text-slate-600 mt-2">Cuentas por pagar a proveedores</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Total Facturas</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-orange-500 uppercase">Abiertas</div>
                        <div className="text-3xl font-black text-orange-600 mt-2">{stats.abiertas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-green-500 uppercase">Pagadas</div>
                        <div className="text-3xl font-black text-green-600 mt-2">{stats.pagadas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-red-500 uppercase">Saldo Pendiente</div>
                        <div className="text-2xl font-black text-red-600 mt-2">{formatCurrency(stats.saldoPendiente)}</div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Factura</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Proveedor</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Fecha</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">Total</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">Saldo</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {facturas.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            <p className="text-lg font-bold">No hay facturas de compra</p>
                                        </td>
                                    </tr>
                                ) : (
                                    facturas.map(factura => (
                                        <tr key={factura.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-slate-900">{factura.numero_factura_proveedor}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{factura.proveedor?.razon_social}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(factura.fecha_emision).toLocaleDateString('es-PA')}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {formatCurrency(factura.total)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">
                                                {formatCurrency(factura.saldo_pendiente)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(factura.estado)}`}>
                                                    {factura.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/compras/facturas/${factura.id}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Ver detalles"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>

                                                    <a 
                                                        href={`/compras/facturas/${factura.id}/pdf`}
                                                        target="_blank"
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Descargar PDF"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </a>

                                                    {factura.estado === 'Abierta' && (
                                                        <Link
                                                            href={`/compras/pagos/crear?factura=${factura.id}`}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Registrar pago"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                        </Link>
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