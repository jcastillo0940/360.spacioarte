import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrearNotaCreditoModal from '@/Components/NotasCredito/CrearNotaCreditoModal';
import CrearNotaDebitoModal from '@/Components/NotasDebito/CrearNotaDebitoModal';
import { FileX, MessageCircle, Printer, RefreshCw, Send } from 'lucide-react';

export default function Show({ facturaId }) {
    const [factura, setFactura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalNCOpen, setModalNCOpen] = useState(false);
    const [modalNDOpen, setModalNDOpen] = useState(false);
    const [sharingWhatsapp, setSharingWhatsapp] = useState(false);

    const fetchFactura = () => {
        fetch(`/api/ventas/facturas/${facturaId}`)
            .then((res) => res.json())
            .then((data) => {
                setFactura(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error loading factura:', error);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFactura();
    }, [facturaId]);

    const handleNotaCreditoCreada = () => {
        fetchFactura();
        alert('Nota de crédito creada exitosamente');
    };

    const handleNotaDebitoCreada = () => {
        fetchFactura();
        alert('Nota de debito creada exitosamente');
    };

    const handleWhatsappShare = async () => {
        if (!factura?.id || sharingWhatsapp) {
            return;
        }

        setSharingWhatsapp(true);

        try {
            const response = await fetch(`/api/ventas/facturas/${factura.id}/whatsapp-link`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({}),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message || 'No se pudo generar el enlace de WhatsApp.');
            }

            if (payload?.whatsapp_url) {
                window.open(payload.whatsapp_url, '_blank', 'noopener,noreferrer');
                return;
            }

            if (payload?.share_url) {
                if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(payload.share_url);
                }

                alert('El cliente no tiene teléfono válido. Se copió el enlace corto de la factura al portapapeles.');
                return;
            }

            throw new Error('No se pudo generar el enlace para compartir.');
        } catch (error) {
            alert(error.message || 'No se pudo abrir WhatsApp.');
        } finally {
            setSharingWhatsapp(false);
        }
    };

    const puedeCrearNC = factura &&
        factura.saldo_pendiente > 0 &&
        factura.estado !== 'Anulada' &&
        factura.estado !== 'Cancelada';

    const puedeCrearND = factura &&
        factura.estado !== 'Anulada' &&
        factura.estado !== 'Cancelada';

    const feStatus = String(factura?.fe_status || '').toUpperCase();
    const feLegalStatus = String(factura?.fe_legal_status || '').toUpperCase();
    const feYaEmitida = Boolean(
        factura?.fe_document_id ||
        factura?.fe_cufe ||
        ['SENT', 'PROCESSED', 'FINISHED'].includes(feStatus) ||
        feLegalStatus.includes('AUTHORIZED')
    );

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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black text-slate-900">📄 {factura.numero_factura}</h1>

                    <div className="flex gap-3 flex-wrap justify-end">
                        <Link
                            href="/ventas/facturas"
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
                        >
                            ← Volver
                        </Link>

                        <button
                            onClick={() => window.open(route('facturas.ticket-termico', factura.id), '_blank', 'noopener,noreferrer')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition inline-flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimir
                        </button>

                        <button
                            onClick={handleWhatsappShare}
                            disabled={sharingWhatsapp}
                            className={`px-6 py-3 rounded-xl font-bold transition inline-flex items-center gap-2 ${
                                sharingWhatsapp
                                    ? 'bg-emerald-300 text-white cursor-wait'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                        >
                            <MessageCircle className="w-5 h-5" />
                            {sharingWhatsapp ? 'Generando enlace...' : 'Enviar por WhatsApp'}
                        </button>

                        {puedeCrearNC && (
                            <button
                                onClick={() => setModalNCOpen(true)}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition inline-flex items-center gap-2"
                            >
                                <FileX className="w-5 h-5" />
                                Nota de Crédito
                            </button>
                        )}

                        {puedeCrearND && (
                            <button
                                onClick={() => setModalNDOpen(true)}
                                className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition inline-flex items-center gap-2"
                            >
                                <FileX className="w-5 h-5" />
                                Nota de Debito
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (!feYaEmitida) {
                                    router.post(route('facturas.emitir-electronica', factura.id));
                                }
                            }}
                            disabled={feYaEmitida}
                            title={feYaEmitida ? 'La factura ya fue emitida electronicamente' : 'Emitir factura electronica'}
                            className={`px-6 py-3 rounded-xl font-bold transition inline-flex items-center gap-2 ${
                                feYaEmitida
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            <Send className="w-5 h-5" />
                            {feYaEmitida ? 'FE Emitida' : 'Emitir FE'}
                        </button>

                        {factura.fe_document_id && (
                            <button
                                onClick={() => router.post(route('facturas.sincronizar-electronica', factura.id))}
                                className="px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 transition inline-flex items-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Consultar FE
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Facturación Electrónica</span>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                                factura.fe_status === 'FINISHED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : factura.fe_status
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-200 text-slate-600'
                            }`}>
                                {factura.fe_status || 'No emitida'}
                            </span>
                            {factura.fe_legal_status && (
                                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-blue-100 text-blue-800">
                                    {factura.fe_legal_status}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                            <div>Proveedor: <span className="font-bold text-slate-900">{factura.fe_provider || 'Alanube no enviado'}</span></div>
                            <div>ID documento: <span className="font-bold text-slate-900">{factura.fe_document_id || 'Pendiente'}</span></div>
                            <div>CUFE: <span className="font-bold text-slate-900">{factura.fe_cufe || 'Pendiente'}</span></div>
                            <div>Última sincronización: <span className="font-bold text-slate-900">{factura.fe_last_sync_at ? new Date(factura.fe_last_sync_at).toLocaleString('es-PA') : 'Nunca'}</span></div>
                        </div>
                        {factura.fe_error_message && (
                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {factura.fe_error_message}
                            </div>
                        )}
                        {factura.fe_public_url && (
                            <a href={factura.fe_public_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-black text-blue-700 hover:text-blue-900">
                                Ver documento público
                            </a>
                        )}
                    </div>

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

                    <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-4">Cliente</h2>
                            <p className="font-bold text-slate-900">{factura.cliente?.razon_social || 'N/A'}</p>
                            <p className="text-slate-600">RUC: {factura.cliente?.identificacion || 'N/A'}</p>
                            <p className="text-slate-600">Email: {factura.cliente?.email || 'N/A'}</p>
                            <p className="text-slate-600">Teléfono: {factura.cliente?.telefono || 'N/A'}</p>
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

            <CrearNotaCreditoModal
                isOpen={modalNCOpen}
                onClose={() => setModalNCOpen(false)}
                facturaId={factura.id}
                onSuccess={handleNotaCreditoCreada}
            />
            <CrearNotaDebitoModal
                isOpen={modalNDOpen}
                onClose={() => setModalNDOpen(false)}
                facturaId={factura.id}
                onSuccess={handleNotaDebitoCreada}
            />
        </AuthenticatedLayout>
    );
}

