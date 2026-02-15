import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [ordenes, setOrdenes] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para Consolidación
    const [selectedIds, setSelectedIds] = useState([]);
    const [showConsolidateModal, setShowConsolidateModal] = useState(false);
    const [proveedorId, setProveedorId] = useState('');

    useEffect(() => {
        loadData();
        loadProveedores();
    }, []);

    const loadData = () => {
        fetch('/api/ventas/ordenes')
            .then(res => res.json())
            .then(data => {
                setOrdenes(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading ordenes:', error);
                setOrdenes([]);
                setLoading(false);
            });
    };

    const loadProveedores = () => {
        fetch('/api/inventario/contactos')
            .then(res => res.json())
            .then(data => {
                const provs = Array.isArray(data) ? data.filter(c => c.es_proveedor) : [];
                setProveedores(provs);
            });
    };

    const handleConvertirFactura = (id) => {
        if (confirm('¿Convertir esta orden en factura de venta? Se actualizará el inventario y se registrará la venta.')) {
            router.post(`/ventas/facturas/convertir/${id}`, {}, {
                onSuccess: () => loadData()
            });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConsolidar = () => {
        if (!proveedorId) return alert("Seleccione un proveedor");
        router.post(route('compras.consolidar.store'), {
            venta_ids: selectedIds,
            contacto_id: proveedorId
        }, {
            onSuccess: () => {
                setShowConsolidateModal(false);
                setSelectedIds([]);
                loadData();
            }
        });
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'Borrador': 'bg-slate-100 text-slate-700',
            'Confirmada': 'bg-blue-100 text-blue-700',
            'Facturada': 'bg-green-100 text-green-700',
            'Cancelada': 'bg-red-100 text-red-700',
        };
        return badges[estado] || 'bg-slate-100 text-slate-700';
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    };

    const stats = {
        total: ordenes.length,
        confirmadas: ordenes.filter(o => o.estado === 'Confirmada').length,
        facturadas: ordenes.filter(o => o.estado === 'Facturada').length,
        valorTotal: ordenes.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="max-w-7xl mx-auto p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4 font-bold">Cargando órdenes...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Órdenes de Venta" />
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Órdenes de Venta
                        </h1>
                        <p className="text-slate-600 mt-2 font-medium">Gestión de pedidos y consolidación de compras</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={() => setShowConsolidateModal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Consolidar ({selectedIds.length})
                            </button>
                        )}
                        <Link href={route('ordenes.create')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Nueva Orden
                        </Link>
                    </div>
                </div>

                {/* Tarjetas de Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pedidos</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                        <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Confirmadas</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{stats.confirmadas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
                        <div className="text-xs font-bold text-green-500 uppercase tracking-wider">Facturadas</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{stats.facturadas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-900">
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Valor Global</div>
                        <div className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(stats.valorTotal)}</div>
                    </div>
                </div>

                {/* Tabla de Datos */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const aptas = ordenes.filter(o => o.estado !== 'Facturada').map(o => o.id);
                                                setSelectedIds(aptas);
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4">Orden #</th>
                                <th className="px-6 py-4">Cliente / RUC</th>
                                <th className="px-6 py-4 text-right">Monto Total</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {ordenes.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No se encontraron registros.</td></tr>
                            ) : (
                                ordenes.map((orden) => (
                                    <tr key={orden.id} className={`${selectedIds.includes(orden.id) ? 'bg-blue-50' : (orden.estado === 'Facturada' ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50')} transition-colors`}>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(orden.id)}
                                                disabled={orden.estado === 'Facturada'}
                                                onChange={() => toggleSelect(orden.id)}
                                                className={`rounded border-slate-300 focus:ring-blue-500 ${orden.estado === 'Facturada' ? 'cursor-not-allowed' : 'text-blue-600 cursor-pointer'}`}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{orden.numero_orden}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{orden.cliente?.razon_social}</div>
                                            <div className="text-xs text-slate-500">{orden.cliente?.identificacion}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(orden.total)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getEstadoBadge(orden.estado)}`}>
                                                {orden.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <Link href={route('ordenes.show', orden.id)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition shadow-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                </Link>
                                                {orden.estado === 'Confirmada' && (
                                                    <button onClick={() => handleConvertirFactura(orden.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-700 hover:text-white transition shadow-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                                    </button>
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

            {/* Modal de Proveedor */}
            {showConsolidateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Consolidar Compras</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-6">Selecciona el proveedor al cual se le enviará esta orden unificada.</p>
                        
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Proveedor del Pedido</label>
                        <select 
                            className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            value={proveedorId}
                            onChange={(e) => setProveedorId(e.target.value)}
                        >
                            <option value="">Buscar en contactos...</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social || p.nombre}</option>)}
                        </select>
                        
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowConsolidateModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition">Ignorar</button>
                            <button onClick={handleConsolidar} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Procesar Ahora</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}