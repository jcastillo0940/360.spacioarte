import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/ventas/ordenes/${ordenId}`)
            .then(res => res.json())
            .then(data => {
                setOrden(data);
                setLoading(false);
            });
    }, [ordenId]);

    const handleFacturar = () => {
        if (confirm('¿Desea generar la factura fiscal a partir de esta orden?')) {
            router.post(route('facturas.convertir', orden.id));
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="max-w-4xl mx-auto p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">Cargando orden...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Orden ${orden.numero_orden}`} />
            
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Orden de Venta: {orden.numero_orden}</h1>
                            <p className="text-sm text-slate-500">Cliente: {orden.cliente.razon_social}</p>
                        </div>
                        <div className="flex gap-3">
                            {orden.estado === 'Confirmada' && (
                                <button 
                                    onClick={handleFacturar}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Generar Factura
                                </button>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                orden.estado === 'Confirmada' ? 'bg-blue-100 text-blue-700' :
                                orden.estado === 'Facturada' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                                {orden.estado}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <table className="w-full">
                            <thead className="border-b border-slate-200">
                                <tr>
                                    <th className="pb-4 text-left text-xs font-bold uppercase text-slate-600">Descripción</th>
                                    <th className="pb-4 text-center text-xs font-bold uppercase text-slate-600">Cant.</th>
                                    <th className="pb-4 text-right text-xs font-bold uppercase text-slate-600">Precio</th>
                                    <th className="pb-4 text-right text-xs font-bold uppercase text-slate-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orden.detalles.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-4 text-slate-900">{item.item.nombre}</td>
                                        <td className="py-4 text-center text-slate-600">{item.cantidad}</td>
                                        <td className="py-4 text-right text-slate-600">{formatCurrency(item.precio_unitario)}</td>
                                        <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-8 flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal:</span>
                                    <span className="font-bold">{formatCurrency(orden.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>ITBMS (7%):</span>
                                    <span className="font-bold">{formatCurrency(orden.itbms_total)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black border-t border-slate-200 pt-2 text-slate-900">
                                    <span>Total:</span>
                                    <span>{formatCurrency(orden.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}