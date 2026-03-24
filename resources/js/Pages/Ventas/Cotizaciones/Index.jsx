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
            .then(res => res.json())
            .then(data => {
                setCotizaciones(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading cotizaciones:', error);
                setCotizaciones([]);
                setLoading(false);
            });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value || 0);
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            Borrador: 'bg-slate-100 text-slate-700 border-slate-200',
            Emitido: 'bg-blue-100 text-blue-700 border-blue-200',
            Aprobado: 'bg-purple-100 text-purple-700 border-purple-200',
            Convertido: 'bg-green-100 text-green-700 border-green-200',
            Cancelado: 'bg-red-100 text-red-700 border-red-200',
        };

        return (badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200') + ' border font-black';
    };

    const stats = {
        total: cotizaciones.length,
        pendientes: cotizaciones.filter(c => !['Convertido', 'Cancelado'].includes(c.estado)).length,
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
        if (!orderModal.cotizacion || !orderModal.sucursal_id) {
            return;
        }

        setProcessingId(`orden-${orderModal.cotizacion.id}`);
        router.post(route('cotizaciones.convertir-orden', orderModal.cotizacion.id), {
            sucursal_id: orderModal.sucursal_id,
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
                <div className="max-w-7xl mx-auto p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4 font-bold">Cargando cotizaciones...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Cotizaciones" />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Cotizaciones
                        </h1>
                        <p className="text-slate-600 mt-2 font-medium">Gestión de presupuestos comerciales para clientes</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={route('cotizaciones.create')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Cotización
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cotizaciones</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                        <div className="text-xs font-bold text-orange-500 uppercase tracking-wider">Activas / Pendientes</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{stats.pendientes}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-900">
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Valor Global</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(stats.valorTotal)}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
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
                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">
                                        No se encontraron cotizaciones.
                                    </td>
                                </tr>
                            ) : (
                                cotizaciones.map((cotizacion) => {
                                    const bloqueada = ['Convertido', 'Cancelado'].includes(cotizacion.estado);

                                    return (
                                        <tr key={cotizacion.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{cotizacion.numero_cotizacion}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{cotizacion.cliente?.razon_social || cotizacion.cliente?.nombre}</div>
                                                <div className="text-xs text-slate-400">{cotizacion.vendedor?.name || 'Sin vendedor'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{new Date(cotizacion.fecha_emision).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(cotizacion.total)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border-0 ${getEstadoBadge(cotizacion.estado)}`}>
                                                    {cotizacion.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openConvertOrderModal(cotizacion)}
                                                        disabled={bloqueada || processingId !== null}
                                                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-40"
                                                    >
                                                        {processingId === `orden-${cotizacion.id}` ? 'Procesando...' : 'A Orden'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => convertToInvoice(cotizacion)}
                                                        disabled={bloqueada || processingId !== null}
                                                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition disabled:opacity-40"
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
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Convertir a Orden</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                                    {orderModal.cotizacion?.numero_cotizacion}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeOrderModal}
                                className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {orderModal.loading ? (
                                <div className="text-center py-8 text-slate-500 font-bold">Cargando sucursales...</div>
                            ) : orderModal.sucursales.length === 0 ? (
                                <div className="space-y-3">
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                                        Este cliente no tiene sucursales activas. Para convertir la cotización a orden primero debes crear una sucursal en inventario.
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={closeOrderModal}
                                            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                                            Sucursal de la orden
                                        </label>
                                        <select
                                            value={orderModal.sucursal_id}
                                            onChange={(e) => setOrderModal(prev => ({ ...prev, sucursal_id: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            {orderModal.sucursales.map((sucursal) => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeOrderModal}
                                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={convertToOrder}
                                            disabled={!orderModal.sucursal_id || processingId !== null}
                                            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-50"
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
