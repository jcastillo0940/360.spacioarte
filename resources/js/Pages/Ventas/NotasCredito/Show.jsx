import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    FileText,
    User,
    Calendar,
    DollarSign,
    Package,
    CheckCircle,
    XCircle,
    AlertCircle,
    Printer,
    RefreshCw,
    Send,
} from 'lucide-react';

const TRANSIENT_FE_STATUSES = ['SENT', 'PROCESSED', 'PAC_AUTHORIZED', 'DGI_REQUEST'];

export default function Show({ auth, notaId }) {
    const [nota, setNota] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchNota();
    }, [notaId]);

    const fetchNota = async () => {
        try {
            const response = await fetch(`/api/ventas/notas-credito/${notaId}`);
            const data = await response.json();
            setNota(data);
        } catch (error) {
            console.error('Error al cargar nota de credito:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncNota = async () => {
        if (!nota?.id || syncing) {
            return;
        }

        setSyncing(true);
        try {
            const response = await fetch(`/ventas/notas-credito/${nota.id}/sincronizar-electronica`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({}),
            });

            const payload = await response.json().catch(() => ({}));
            if (payload?.data) {
                setNota(payload.data);
            }
        } finally {
            setSyncing(false);
        }
    };

    const getTipoInfo = (tipo) => {
        const tipos = {
            devolucion: {
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                icon: Package,
                label: 'Devolucion de Producto',
                descripcion: 'El cliente devolvio el producto fisicamente',
            },
            merma: {
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                icon: AlertCircle,
                label: 'Merma / Producto Danado',
                descripcion: 'Producto no regreso al inventario',
            },
            descuento: {
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                icon: DollarSign,
                label: 'Descuento / Ajuste de Precio',
                descripcion: 'Ajuste sin movimiento fisico de inventario',
            },
        };
        return tipos[tipo] || tipos.devolucion;
    };

    const feStatus = String(nota?.fe_status || '').toUpperCase();
    const feLegalStatus = String(nota?.fe_legal_status || '').toUpperCase();
    const feYaEmitida = useMemo(() => Boolean(
        nota?.fe_document_id ||
        nota?.fe_cufe ||
        ['SENT', 'PROCESSED', 'FINISHED', 'DGI_REQUEST'].includes(feStatus) ||
        feLegalStatus.includes('AUTHORIZED')
    ), [nota, feStatus, feLegalStatus]);

    const debeAutoSincronizar = Boolean(
        nota?.fe_document_id &&
        nota?.estado === 'Activa' &&
        !feLegalStatus.includes('AUTHORIZED') &&
        !feLegalStatus.includes('REJECTED') &&
        !feStatus.includes('ERROR') &&
        TRANSIENT_FE_STATUSES.includes(feStatus || feLegalStatus)
    );

    useEffect(() => {
        if (!debeAutoSincronizar) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            syncNota();
        }, 20000);

        return () => window.clearTimeout(timer);
    }, [debeAutoSincronizar, nota?.id, feStatus, feLegalStatus]);

    if (loading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Detalle Nota de Credito" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!nota) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Nota de Credito no encontrada" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nota de Credito no encontrada</h2>
                            <Link href="/ventas/notas-credito" className="text-indigo-600 hover:underline">
                                Volver al listado
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const tipoInfo = getTipoInfo(nota.tipo_nota);
    const TipoIcon = tipoInfo.icon;
    const imprimir = () => window.open(route('ventas.nc.pdf', nota.id), '_blank', 'noopener,noreferrer');

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Nota de Credito ${nota.numero_nota}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/ventas/notas-credito" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al listado
                        </Link>

                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Nota de Credito {nota.numero_nota}</h1>
                                <p className="text-gray-600 mt-1">
                                    Factura de referencia: {nota.factura?.numero_factura || nota.factura_manual_ref || 'Manual'}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <button
                                    onClick={() => !feYaEmitida && router.post(route('ventas.nc.emitir-electronica', nota.id))}
                                    disabled={feYaEmitida}
                                    className={`inline-flex items-center px-4 py-2 rounded-lg transition ${
                                        feYaEmitida ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    <Send className="w-5 h-5 mr-2" />
                                    {feYaEmitida ? 'FE Emitida' : 'Emitir FE'}
                                </button>
                                {nota.fe_document_id && (
                                    <button
                                        onClick={syncNota}
                                        disabled={syncing}
                                        className={`inline-flex items-center px-4 py-2 rounded-lg transition ${
                                            syncing ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-700 text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Consultando...' : 'Consultar FE'}
                                    </button>
                                )}
                                <button
                                    onClick={imprimir}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    Imprimir
                                </button>
                                {nota.estado === 'Activa' && (
                                    <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Activa
                                    </span>
                                )}
                                {nota.estado === 'Anulada' && (
                                    <span className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Anulada
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Facturacion Electronica</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        feStatus === 'FINISHED'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : feStatus
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {nota.fe_status || 'No emitida'}
                                    </span>
                                    {nota.fe_legal_status && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
                                            {nota.fe_legal_status}
                                        </span>
                                    )}
                                    {debeAutoSincronizar && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-800">
                                            Auto sincronizando
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                                    <div>Proveedor: <span className="font-semibold text-gray-900">{nota.fe_provider || 'Alanube no enviado'}</span></div>
                                    <div>ID documento: <span className="font-semibold text-gray-900">{nota.fe_document_id || 'Pendiente'}</span></div>
                                    <div>CUFE: <span className="font-semibold text-gray-900 break-all">{nota.fe_cufe || 'Pendiente'}</span></div>
                                    <div>Ultima sincronizacion: <span className="font-semibold text-gray-900">{nota.fe_last_sync_at ? new Date(nota.fe_last_sync_at).toLocaleString('es-PA') : 'Nunca'}</span></div>
                                </div>
                                {nota.fe_error_message && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                        {nota.fe_error_message}
                                    </div>
                                )}
                                {nota.fe_public_url && (
                                    <a href={nota.fe_public_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-blue-700 hover:text-blue-900">
                                        Ver documento publico
                                    </a>
                                )}
                            </div>

                            <div className={`${tipoInfo.bgColor} rounded-lg p-6`}>
                                <div className="flex items-start">
                                    <TipoIcon className={`w-8 h-8 ${tipoInfo.color} mr-4`} />
                                    <div>
                                        <h3 className={`text-lg font-bold ${tipoInfo.color}`}>{tipoInfo.label}</h3>
                                        <p className="text-sm text-gray-700 mt-1">{tipoInfo.descripcion}</p>
                                        <div className="mt-3 p-3 bg-white rounded-lg">
                                            <p className="text-sm font-medium text-gray-900">Motivo:</p>
                                            <p className="text-sm text-gray-700 mt-1">{nota.motivo}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Productos Incluidos</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Inventario</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {nota.detalles?.map((detalle) => (
                                                <tr key={detalle.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{detalle.item?.nombre}</p>
                                                            <p className="text-xs text-gray-500">{detalle.item?.codigo}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-900">{parseFloat(detalle.cantidad).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        {detalle.devuelto_stock ? (
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Devuelto
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                No devuelto
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                        ${parseFloat(detalle.total_item || detalle.total || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-gray-600" />
                                    Cliente
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Razon Social</p>
                                        <p className="text-sm font-medium text-gray-900">{nota.factura?.cliente?.razon_social || nota.cliente?.razon_social}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">RUC/Identificacion</p>
                                        <p className="text-sm text-gray-900">{nota.factura?.cliente?.identificacion || nota.cliente?.identificacion}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                                    Fechas
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Fecha de emision</p>
                                        <p className="text-sm font-medium text-gray-900">{new Date(nota.fecha || nota.created_at).toLocaleDateString('es-PA')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Hora</p>
                                        <p className="text-sm text-gray-900">{new Date(nota.fecha || nota.created_at).toLocaleTimeString('es-PA')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
                                    Resumen financiero
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between"><span className="text-sm text-gray-600">Subtotal</span><span className="text-sm font-medium text-gray-900">${parseFloat(nota.subtotal || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-600">ITBMS</span><span className="text-sm font-medium text-gray-900">${parseFloat(nota.itbms_total || 0).toFixed(2)}</span></div>
                                    <div className="pt-3 border-t border-gray-200 flex justify-between"><span className="text-base font-bold text-gray-900">Total</span><span className="text-base font-bold text-red-600">${parseFloat(nota.total || 0).toFixed(2)}</span></div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                                    Factura original
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Numero</p>
                                        <p className="text-sm font-medium text-gray-900">{nota.factura?.numero_factura || nota.factura_manual_ref || 'Manual'}</p>
                                    </div>
                                    {nota.factura?.id && (
                                        <Link href={`/ventas/facturas/${nota.factura.id}`} className="block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium">
                                            Ver factura original
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
