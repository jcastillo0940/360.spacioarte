import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/ventas/facturas')
            .then(res => res.json())
            .then(data => {
                console.log('Facturas cargadas:', data);
                setFacturas(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading facturas:', error);
                setFacturas([]);
                setLoading(false);
            });
    }, []);

    const getEstadoBadge = (estado) => {
        const badges = {
            'Pendiente': 'bg-orange-100 text-orange-700',
            'Pagada': 'bg-green-100 text-green-700',
            'Parcial': 'bg-blue-100 text-blue-700',
            'Vencida': 'bg-red-100 text-red-700',
            'Anulada': 'bg-slate-100 text-slate-700',
        };
        return badges[estado] || 'bg-slate-100 text-slate-700';
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(value || 0);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Facturas de Venta" />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando facturas...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const stats = {
        total: facturas.length,
        pendientes: facturas.filter(f => f.estado === 'Pendiente').length,
        pagadas: facturas.filter(f => f.estado === 'Pagada').length,
        valorTotal: facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0)
    };

    return (
        <AuthenticatedLayout>
            <Head title="Facturas de Venta" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Facturas de Venta
                            </h1>
                            <p className="text-slate-600 mt-2">Gestión de facturas emitidas</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Total Facturas</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.total}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Pendientes</div>
                        <div className="text-3xl font-black text-orange-600 mt-2">{stats.pendientes}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Pagadas</div>
                        <div className="text-3xl font-black text-green-600 mt-2">{stats.pagadas}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Valor Total</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(stats.valorTotal)}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Número</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Cliente</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold uppercase">Fecha</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">Total</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {facturas.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-bold">No hay facturas de venta</p>
                                            <p className="text-sm mt-2">Las facturas se crean desde órdenes confirmadas</p>
                                        </td>
                                    </tr>
                                ) : (
                                    facturas.map((factura) => (
                                        <tr key={factura.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-slate-900">
                                                    {factura.numero_factura}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">
                                                    {factura.cliente?.razon_social || 'N/A'}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {factura.cliente?.identificacion || ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString('es-PA') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-blue-600">
                                                    {formatCurrency(factura.total)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(factura.estado)}`}>
                                                    {factura.estado || 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/ventas/facturas/${factura.id}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Ver detalles"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    
                                                    <button
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Descargar PDF"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
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