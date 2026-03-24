import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Truck,
    Search,
    ChevronRight,
    PackageCheck,
    Calendar,
    ShoppingBag,
    History,
    ScanLine,
} from 'lucide-react';

export default function Index({ ordenes = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrdenes = ordenes.filter((orden) =>
        (orden.numero_orden?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (orden.proveedor?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Enviada':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Confirmada':
                return 'bg-violet-100 text-violet-700 border-violet-200';
            case 'Recibida Parcial':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Recepción de Compras" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full -mr-48 -mt-48 z-0 opacity-40"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-300">
                            <Truck size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Recepción de Compras</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.15em] mt-1">
                                Órdenes pendientes de ingreso a inventario
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-3">
                        <Link
                            href={route('compras.recepciones.historial')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition"
                        >
                            <History size={16} />
                            Historial
                        </Link>
                        <Link
                            href={route('compras.ordenes.index')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition"
                        >
                            <ShoppingBag size={16} />
                            Órdenes de compra
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por número de orden o proveedor..."
                            className="w-full bg-slate-50 border-transparent rounded-xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-slate-900 transition-all border outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredOrdenes.length === 0 ? (
                        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-6 shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                <PackageCheck size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">No hay órdenes pendientes de recepción</h2>
                                <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">
                                    Cuando una orden esté lista para ingreso aparecerá aquí
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredOrdenes.map((orden) => (
                            <div
                                key={orden.id}
                                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 group overflow-hidden"
                            >
                                <div className="p-6 sm:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
                                            <span className="text-[10px] font-black opacity-60 uppercase">OC</span>
                                            <span className="text-lg font-black">{orden.id}</span>
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                                <span className="font-black text-slate-900 text-xl tracking-tighter uppercase">
                                                    {orden.proveedor?.razon_social || 'Proveedor no definido'}
                                                </span>
                                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(orden.estado)}`}>
                                                    {orden.estado}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1 font-black text-amber-600">
                                                    <ShoppingBag size={12} />
                                                    {orden.numero_orden}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    Entrega: {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <span>
                                                    Recibido: {Number(orden.total_recibido || 0).toFixed(2)} / {Number(orden.total_ordenado || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="hidden lg:block min-w-[180px]">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                <span>Progreso</span>
                                                <span>{Number(orden.porcentaje_recibido || 0).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all"
                                                    style={{ width: `${Math.min(Number(orden.porcentaje_recibido || 0), 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Link
                                            href={route('compras.recepciones.recibir', orden.id)}
                                            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 transition"
                                        >
                                            <ScanLine size={16} />
                                            Recibir
                                            <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
