import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/compras/ordenes/${ordenId}`)
            .then(res => res.json())
            .then(data => {
                setOrden(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading orden:', error);
                setLoading(false);
            });
    }, [ordenId]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Cargando..." />
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando orden...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!orden) {
        return (
            <AuthenticatedLayout>
                <Head title="Error" />
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <p className="text-red-600 font-bold">Orden no encontrada</p>
                        <Link href="/compras/ordenes" className="text-blue-600 mt-4 inline-block">Volver</Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Orden de Compra" />
            <div className="max-w-5xl mx-auto">
                <Link href="/compras/ordenes" className="text-blue-600 mb-4 inline-block">Volver</Link>
                <h1 className="text-3xl font-black mb-4">Orden {orden.numero_orden}</h1>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4">Proveedor</h2>
                    <p className="font-bold">{orden.proveedor?.razon_social}</p>
                    <p className="text-sm text-slate-500">{orden.proveedor?.identificacion}</p>
                    <p className="mt-4">Fecha: {new Date(orden.fecha_emision).toLocaleDateString()}</p>
                    <div className="mt-4">
                        <a href={`/compras/ordenes/${orden.id}/pdf`} target="_blank" className="px-4 py-2 bg-red-600 text-white rounded">PDF</a>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left">Producto</th>
                                <th className="px-6 py-3 text-center">Cantidad</th>
                                <th className="px-6 py-3 text-right">Costo</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orden.detalles?.map(detalle => (
                                <tr key={detalle.id}>
                                    <td className="px-6 py-4">{detalle.item?.nombre}</td>
                                    <td className="px-6 py-4 text-center">{detalle.cantidad}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(detalle.costo_unitario)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(detalle.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white">
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-right font-bold">Total:</td>
                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(orden.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}