import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrearNotaCreditoModal from '@/Components/NotasCredito/CrearNotaCreditoModal';
import { FileX, Printer } from 'lucide-react';

export default function Show({ facturaId }) {
    const [factura, setFactura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalNCOpen, setModalNCOpen] = useState(false);

    const fetchFactura = () => {
        fetch(`/api/ventas/facturas/${facturaId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Factura cargada:', data);
                setFactura(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading factura:', error);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFactura();
    }, [facturaId]);

    const handleNotaCreditoCreada = (notaCredito) => {
        console.log('Nota de crédito creada:', notaCredito);
        // Recargar la factura para mostrar el nuevo saldo
        fetchFactura();
        // Opcional: Mostrar mensaje de éxito
        alert('Nota de crédito creada exitosamente');
    };

    // Verificar si se puede crear NC
    const puedeCrearNC = factura && 
                         factura.saldo_pendiente > 0 && 
                         factura.estado !== 'Anulada' &&
                         factura.estado !== 'Cancelada';

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Cargando factura..." />
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando factura...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!factura) {
        return (
            <AuthenticatedLayout>
                <Head title="Factura no encontrada" />
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <p className="text-slate-600">Factura no encontrada</p>
                        <Link href="/ventas/facturas" className="mt-4 inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-bold">
                            ← Volver a Facturas
                        </Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Factura ${factura.numero_factura}`} />
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header con botones de acción */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black text-slate-900">📄 {factura.numero_factura}</h1>
                    
                    <div className="flex gap-3">
                        <Link 
                            href="/ventas/facturas" 
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
                        >
                            ← Volver
                        </Link>
                        
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition inline-flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimir
                        </button>
                        
                        {/* Botón de Nota de Crédito */}
                        {puedeCrearNC && (
                            <button
                                onClick={() => setModalNCOpen(true)}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition inline-flex items-center gap-2"
                            >
                                <FileX className="w-5 h-5" />
                                Nota de Crédito
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Badge de Estado */}
                    <div className="mb-6 flex justify-between items-center">
                        <div className="flex gap-3">
                            <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                                factura.estado === 'Pagada' ? 'bg-green-100 text-green-800' :
                                factura.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                factura.estado === 'Vencida' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {factura.estado}
                            </span>
                            
                            {factura.saldo_pendiente > 0 && (
                                <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                                    Saldo: ${parseFloat(factura.saldo_pendiente).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-4">Cliente</h2>
                            <p className="font-bold text-slate-900">{factura.cliente?.razon_social || 'N/A'}</p>
                            <p className="text-slate-600">RUC: {factura.cliente?.identificacion || 'N/A'}</p>
                            <p className="text-slate-600">{factura.cliente?.email || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-4">
                                <span className="text-sm font-bold text-slate-500 uppercase">Fecha Emisión</span>
                                <p className="text-xl font-bold text-slate-900">
                                    {factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString('es-PA') : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-500 uppercase">Vencimiento</span>
                                <p className="text-xl font-bold text-slate-900">
                                    {factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento).toLocaleDateString('es-PA') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left font-black uppercase">Item</th>
                                <th className="px-4 py-3 text-right font-black uppercase">Cantidad</th>
                                <th className="px-4 py-3 text-right font-black uppercase">Precio</th>
                                <th className="px-4 py-3 text-right font-black uppercase">ITBMS</th>
                                <th className="px-4 py-3 text-right font-black uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {factura.detalles && factura.detalles.length > 0 ? (
                                factura.detalles.map((detalle, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 font-medium">{detalle.item?.nombre || 'N/A'}</td>
                                        <td className="px-4 py-3 text-right">{detalle.cantidad}</td>
                                        <td className="px-4 py-3 text-right">${parseFloat(detalle.precio_unitario || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">{detalle.porcentaje_itbms}%</td>
                                        <td className="px-4 py-3 text-right font-bold">${parseFloat(detalle.total_item || 0).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                        No hay detalles en esta factura
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between py-2 border-b border-slate-200">
                                <span className="font-bold text-slate-700">Subtotal:</span>
                                <span className="font-bold text-slate-900">${parseFloat(factura.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200">
                                <span className="font-bold text-slate-700">ITBMS:</span>
                                <span className="font-bold text-slate-900">${parseFloat(factura.itbms_total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-3 bg-slate-900 text-white px-4 rounded-xl">
                                <span className="font-black text-xl">TOTAL:</span>
                                <span className="font-black text-2xl">${parseFloat(factura.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-bold text-blue-700">Saldo Pendiente:</span>
                                <span className="font-bold text-blue-700 text-xl">${parseFloat(factura.saldo_pendiente || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Nota de Crédito */}
            <CrearNotaCreditoModal
                isOpen={modalNCOpen}
                onClose={() => setModalNCOpen(false)}
                facturaId={factura.id}
                onSuccess={handleNotaCreditoCreada}
            />
        </AuthenticatedLayout>
    );
}