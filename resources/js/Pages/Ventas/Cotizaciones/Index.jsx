import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [orderModal, setOrderModal] = useState({
        open: false,
        cotizacion: null,
        sucursales: [],
        sucursal_id: '',
        loading: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        fetch('/api/ventas/cotizaciones')
            .then((res) => res.json())
            .then((data) => {
                setCotizaciones(data || []);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error loading cotizaciones:', error);
                setCotizaciones([]);
                setLoading(false);
            });
    };

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value || 0);

    const getEstadoBadge = (estado) => {
        const badges = {
            Borrador: 'bg-slate-100 text-slate-700 border-slate-200',
            Emitido: 'bg-blue-100 text-blue-700 border-blue-200',
            Aprobado: 'bg-purple-100 text-purple-700 border-purple-200',
            Convertido: 'bg-green-100 text-green-700 border-green-200',
            Cancelado: 'bg-red-100 text-red-700 border-red-200',
        };

        return `${badges[estado] || badges.Borrador} border font-black`;
    };

    const stats = {
        total: cotizaciones.length,
        pendientes: cotizaciones.filter((c) => !['Convertido', 'Cancelado'].includes(c.estado)).length,
        valorTotal: cotizaciones.reduce((sum, c) => sum + parseFloat(c.total || 0), 0),
    };

    const openConvertOrderModal = async (cotizacion) => {
        setOrderModal({
            open: true,
            cotizacion,
            sucursales: [],
            sucursal_id: '',
            loading: true,
        });

        try {
            const response = await fetch(`/api/inventario/sucursales/contacto/${cotizacion.contacto_id}`);
            const sucursales = await response.json();

            setOrderModal({
                open: true,
                cotizacion,
                sucursales: sucursales || [],
                sucursal_id: sucursales?.[0]?.id ? String(sucursales[0].id) : '',
                loading: false,
            });
        } catch (error) {
            console.error('Error loading sucursales:', error);
            setOrderModal({
                open: true,
                cotizacion,
                sucursales: [],
                sucursal_id: '',
                loading: false,
            });
        }
    };

    const closeOrderModal = () => {
        setOrderModal({
            open: false,
            cotizacion: null,
            sucursales: [],
            sucursal_id: '',
            loading: false,
        });
    };

    const convertToOrder = () => {
        if (!orderModal.cotizacion) {
            return;
        }

        setProcessingId(`orden-${orderModal.cotizacion.id}`);
        router.post(route('cotizaciones.convertir-orden', orderModal.cotizacion.id), {
            sucursal_id: orderModal.sucursal_id || null,
        }, {
            onFinish: () => setProcessingId(null),
        });
    };

    const convertToInvoice = (cotizacion) => {
        setProcessingId(`factura-${cotizacion.id}`);
        router.post(route('cotizaciones.convertir-factura', cotizacion.id), {}, {
            onFinish: () => setProcessingId(null),
        });
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="mx-auto max-w-7xl p-12 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-4 font-bold text-slate-600">Cargando cotizaciones...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Cotizaciones" />

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900">
                            <svg className="h-8 w-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Cotizaciones
                        </h1>
                        <p className="mt-2 font-medium text-slate-600">Gestion de presupuestos comerciales para clientes</p>
                    </div>
                    <Link href={route('cotizaciones.create')} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Cotizacion
                    </Link>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cotizaciones</div>
                        <div className="mt-1 text-3xl font-black text-slate-900">{stats.total}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 border-l-4 border-l-orange-500 bg-white p-6 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-orange-500">Activas / Pendientes</div>
                        <div className="mt-1 text-3xl font-black text-slate-900">{stats.pendientes}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 border-l-4 border-l-slate-900 bg-white p-6 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Valor Global</div>
                        <div className="mt-1 text-3xl font-black text-slate-900">{formatCurrency(stats.valorTotal)}</div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-xs font-bold uppercase text-white">
                            <tr>
                                <th className="px-6 py-4">Doc #</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4 text-right">Monto Total</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {cotizaciones.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center font-medium text-slate-400">
                                        No se encontraron cotizaciones.
                                    </td>
                                </tr>
                            ) : (
                                cotizaciones.map((cotizacion) => {
                                    const bloqueada = ['Convertido', 'Cancelado'].includes(cotizacion.estado);

                                    return (
                                        <tr key={cotizacion.id} className="transition-colors hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{cotizacion.numero_cotizacion}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{cotizacion.cliente?.razon_social || cotizacion.cliente?.nombre}</div>
                                                <div className="text-xs text-slate-400">{cotizacion.vendedor?.name || 'Sin vendedor'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{new Date(cotizacion.fecha_emision).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(cotizacion.total)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter border-0 ${getEstadoBadge(cotizacion.estado)}`}>
                                                    {cotizacion.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {!bloqueada && (
                                                        <Link
                                                            href={route('cotizaciones.edit', cotizacion.id)}
                                                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-amber-600"
                                                        >
                                                            Editar
                                                        </Link>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openConvertOrderModal(cotizacion)}
                                                        disabled={bloqueada || processingId !== null}
                                                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-700 disabled:opacity-40"
                                                    >
                                                        {processingId === `orden-${cotizacion.id}` ? 'Procesando...' : 'A Orden'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => convertToInvoice(cotizacion)}
                                                        disabled={bloqueada || processingId !== null}
                                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-700 disabled:opacity-40"
                                                    >
                                                        {processingId === `factura-${cotizacion.id}` ? 'Procesando...' : 'A Factura'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {orderModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Convertir a Orden</h2>
                                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {orderModal.cotizacion?.numero_cotizacion}
                                </p>
                            </div>
                            <button type="button" onClick={closeOrderModal} className="text-2xl leading-none text-slate-400 hover:text-slate-700">
                                ×
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            {orderModal.loading ? (
                                <div className="py-8 text-center font-bold text-slate-500">Cargando sucursales...</div>
                            ) : orderModal.sucursales.length === 0 ? (
                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
                                        Este cliente no tiene sucursales activas. El sistema creara una sucursal principal automaticamente al convertir la cotizacion a orden.
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={closeOrderModal} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={convertToOrder}
                                            disabled={processingId !== null}
                                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                                        >
                                            {processingId === `orden-${orderModal.cotizacion?.id}` ? 'Convirtiendo...' : 'Continuar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-2 block text-xs font-black uppercase text-slate-500">Sucursal de la orden</label>
                                        <select
                                            value={orderModal.sucursal_id}
                                            onChange={(e) => setOrderModal((prev) => ({ ...prev, sucursal_id: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            {orderModal.sucursales.map((sucursal) => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={closeOrderModal} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={convertToOrder}
                                            disabled={processingId !== null}
                                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                                        >
                                            {processingId === `orden-${orderModal.cotizacion?.id}` ? 'Convirtiendo...' : 'Confirmar'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
