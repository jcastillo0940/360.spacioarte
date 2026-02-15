import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ facturaId }) {
    const [factura, setFactura] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/compras/facturas/${facturaId}`)
            .then(res => res.json())
            .then(data => {
                setFactura(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading factura:', error);
                setLoading(false);
            });
    }, [facturaId]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'Abierta': 'bg-orange-100 text-orange-700',
            'Pagada': 'bg-green-100 text-green-700',
            'Anulada': 'bg-red-100 text-red-700'
        };
        return badges[estado] || badges['Abierta'];
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Cargando..." />
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando factura...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!factura) {
        return (
            <AuthenticatedLayout>
                <Head title="Error" />
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <p className="text-red-600 font-bold">Factura no encontrada</p>
                        <Link href="/compras/facturas" className="text-blue-600 mt-4 inline-block">Volver</Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Factura ${factura.numero_factura_proveedor}`} />
            
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <Link 
                            href="/compras/facturas" 
                            className="text-slate-600 hover:text-slate-900 flex items-center gap-2 mb-4"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver a facturas
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900">Factura de Compra</h1>
                        <p className="text-slate-600 mt-2 font-mono text-2xl font-bold">{factura.numero_factura_proveedor}</p>
                    </div>
                    <div className="flex gap-2">
                        <a 
                            href={`/compras/facturas/${factura.id}/pdf`}
                            target="_blank"
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Descargar PDF
                        </a>
                        {factura.estado === 'Abierta' && (
                            <Link
                                href={`/compras/pagos/crear?factura=${factura.id}`}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Registrar Pago
                            </Link>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Información del Proveedor</h2>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm font-bold text-slate-500">Razón Social:</span>
                                    <p className="text-slate-900 font-bold">{factura.proveedor?.razon_social}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-slate-500">RUC:</span>
                                    <p className="text-slate-900 font-mono">{factura.proveedor?.identificacion}</p>
                                </div>
                                {factura.orden_original && (
                                    <div>
                                        <span className="text-sm font-bold text-slate-500">Orden de Compra:</span>
                                        <Link 
                                            href={`/compras/ordenes/${factura.orden_original.id}`}
                                            className="text-blue-600 hover:underline font-mono"
                                        >
                                            {factura.orden_original.numero_orden}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${getEstadoBadge(factura.estado)}`}>
                                {factura.estado}
                            </span>
                            <div className="mt-4 space-y-1">
                                <div className="text-sm text-slate-500">Fecha Emisión:</div>
                                <div className="font-bold text-slate-900">{new Date(factura.fecha_emision).toLocaleDateString('es-PA')}</div>
                            </div>
                            <div className="mt-2 space-y-1">
                                <div className="text-sm text-slate-500">Fecha Vencimiento:</div>
                                <div className="font-bold text-slate-900">{new Date(factura.fecha_vencimiento).toLocaleDateString('es-PA')}</div>
                            </div>
                        </div>
                    </div>

                    {factura.estado === 'Abierta' && parseFloat(factura.saldo_pendiente) > 0 && (
                        <div className="pt-4 border-t border-slate-200 bg-red-50 -m-6 p-6 mt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-bold text-red-600">Saldo Pendiente</div>
                                    <div className="text-3xl font-black text-red-700">{formatCurrency(factura.saldo_pendiente)}</div>
                                </div>
                                <Link
                                    href={`/compras/pagos/crear?factura=${factura.id}`}
                                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                                >
                                    Pagar Ahora
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Detalles de la Factura</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-600">Producto</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-600">Cantidad</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">Costo Unit.</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">Subtotal</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">ITBMS</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {factura.detalles?.map(detalle => (
                                    <tr key={detalle.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{detalle.item?.nombre}</div>
                                            <div className="text-sm text-slate-500 font-mono">{detalle.item?.codigo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-900">
                                            {detalle.cantidad}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {formatCurrency(detalle.costo_unitario)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {formatCurrency(detalle.subtotal)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {formatCurrency(detalle.monto_itbms)}
                                            <div className="text-xs text-slate-500">({detalle.tasa_itbms}%)</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">
                                            {formatCurrency(detalle.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white">
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right font-bold">Subtotal:</td>
                                    <td className="px-6 py-3 text-right font-bold">{formatCurrency(factura.subtotal)}</td>
                                    <td colSpan="2"></td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right font-bold">ITBMS Total:</td>
                                    <td className="px-6 py-3 text-right font-bold">{formatCurrency(factura.itbms_total)}</td>
                                    <td colSpan="2"></td>
                                </tr>
                                <tr className="bg-slate-950">
                                    <td colSpan="3" className="px-6 py-4 text-right font-bold text-lg uppercase">Total:</td>
                                    <td colSpan="3" className="px-6 py-4 text-right font-black text-2xl">
                                        {formatCurrency(factura.total)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}