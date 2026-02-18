import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ShoppingBag,
    Plus,
    Search,
    Filter,
    ChevronRight,
    FileText,
    Printer,
    Trash2,
    Edit,
    CheckCircle,
    ArrowRight,
    ClipboardList,
    Clock,
    AlertCircle
} from 'lucide-react';

export default function Index() {
    const { auth } = usePage().props;
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/compras/ordenes')
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

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar esta orden de compra?')) {
            router.delete(route('compras.ordenes.destroy', id), {
                onSuccess: () => loadData()
            });
        }
    };

    const handleConvertir = (id) => {
        if (confirm('¿Generar factura de compra desde esta orden?')) {
            router.post(route('compras.facturas.convertir', id));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Borrador': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'Confirmada': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'Recibida Total': return 'bg-green-100 text-green-600 border-green-200';
            case 'Recibida Parcial': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'Cancelada': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const filteredOrdenes = ordenes.filter(o =>
        (o.numero_orden?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.proveedor?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const stats = {
        total: ordenes.length,
        pendientes: ordenes.filter(o => o.estado === 'Confirmada').length,
        recibidas: ordenes.filter(o => o.estado === 'Recibida Total').length,
        valorTotal: ordenes.reduce((acc, o) => acc + parseFloat(o.total || 0), 0)
    };

    return (
        <AuthenticatedLayout>
            <Head title="Órdenes de Compra" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-50 rounded-full -mr-48 -mt-48 z-0 opacity-40"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-300">
                            <ShoppingBag size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Órdenes de Compra</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.15em] mt-1">Abastecimiento y Proveeduría</p>
                        </div>
                    </div>
                    <Link
                        href={route('compras.ordenes.crear')}
                        className="relative z-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl"
                    >
                        <Plus size={20} /> Nuevo Pedido
                    </Link>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pedidos</div>
                        <div className="text-3xl font-black text-slate-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Confirmadas</div>
                        <div className="text-3xl font-black text-orange-600">{stats.pendientes}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Recibidas</div>
                        <div className="text-3xl font-black text-green-600">{stats.recibidas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Inversión Total</div>
                        <div className="text-2xl font-black text-blue-600">{formatCurrency(stats.valorTotal)}</div>
                    </div>
                </div>

                {/* Filters & Content */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por número de orden o proveedor..."
                                className="w-full bg-slate-50 border-transparent rounded-xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-slate-900 transition-all border outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 transition"><Filter size={20} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando órdenes...</p>
                            </div>
                        ) : filteredOrdenes.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-6 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                    <ShoppingBag size={48} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Sin registros</h2>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">No se encontraron órdenes que coincidan con la búsqueda</p>
                                </div>
                            </div>
                        ) : (
                            filteredOrdenes.map(orden => (
                                <div key={orden.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300 group overflow-hidden">
                                    <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 h-full">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
                                                <span className="text-[10px] font-black opacity-60 uppercase">OC</span>
                                                <span className="text-lg font-black">{orden.id}</span>
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <span className="font-black text-slate-900 text-xl tracking-tighter uppercase">{orden.proveedor?.razon_social || 'Desconocido'}</span>
                                                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(orden.estado)}`}>
                                                        {orden.estado}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><FileText size={12} /> {orden.numero_orden}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(orden.fecha_emision).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-8">
                                            <div className="text-center lg:text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orden</div>
                                                <div className="text-2xl font-black text-green-600">{formatCurrency(orden.total)}</div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('compras.ordenes.show', orden.id)}
                                                    className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-slate-900 hover:border-slate-900 transition"
                                                    title="Ver Detalle"
                                                >
                                                    <ChevronRight size={20} />
                                                </Link>

                                                <a
                                                    href={route('compras.ordenes.pdf', orden.id)}
                                                    target="_blank"
                                                    className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-red-600 hover:border-red-600 transition"
                                                    title="Imprimir PDF"
                                                >
                                                    <Printer size={20} />
                                                </a>

                                                {orden.estado === 'Confirmada' && (
                                                    <button
                                                        onClick={() => handleConvertir(orden.id)}
                                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2"
                                                    >
                                                        <ArrowRight size={16} /> Facturar
                                                    </button>
                                                )}

                                                {orden.estado === 'Borrador' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('compras.ordenes.edit', orden.id)}
                                                            className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-blue-600 hover:border-blue-600 transition"
                                                        >
                                                            <Edit size={20} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(orden.id)}
                                                            className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-red-600 hover:border-red-600 transition"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {orden.requisicion_id && (
                                        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <AlertCircle size={12} /> Generada desde Requisición #{orden.requisicion_id}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}