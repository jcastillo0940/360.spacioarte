import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Truck,
    Plus,
    Search,
    Filter,
    ChevronRight,
    FileText,
    PackageCheck,
    Calendar,
    User,
    CheckCircle2,
    ArrowRight,
    ShoppingBag,
    Tag
} from 'lucide-react';

export default function Index({ recepciones }) {
    const { auth } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecepciones = recepciones.filter(r =>
        (r.numero_recepcion?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.contacto?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.orden_compra?.numero_orden?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pendiente': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'Procesado': return 'bg-green-100 text-green-600 border-green-200';
            case 'Facturado': return 'bg-blue-100 text-blue-600 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ingresos de Mercancía" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full -mr-48 -mt-48 z-0 opacity-40"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-300">
                            <Truck size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Bodega / Ingresos</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.15em] mt-1">Recepción de Materiales e Insumos</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por número de ingreso, proveedor o pedido..."
                                className="w-full bg-slate-50 border-transparent rounded-xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-slate-900 transition-all border outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredRecepciones.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-6 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                    <PackageCheck size={48} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">No hay ingresos registrados</h2>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">Los ingresos de bodega realizados aparecerán aquí</p>
                                </div>
                                <div className="flex justify-center gap-4 mt-6">
                                    <Link href={route('compras.ordenes.index')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition">Ver Órdenes Pendientes</Link>
                                    <Link href={route('compras.facturas.index')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition">Ver Facturas Pendientes</Link>
                                </div>
                            </div>
                        ) : (
                            filteredRecepciones.map(recep => (
                                <div key={recep.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 group overflow-hidden">
                                    <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
                                                <span className="text-[10px] font-black opacity-60 uppercase">REC</span>
                                                <span className="text-lg font-black">{recep.id}</span>
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <span className="font-black text-slate-900 text-xl tracking-tighter uppercase">{recep.contacto?.razon_social || 'Desconocido'}</span>
                                                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(recep.estado)}`}>
                                                        {recep.estado}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1 font-black text-amber-600"><Tag size={12} /> {recep.numero_recepcion}</span>
                                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(recep.fecha_recepcion).toLocaleDateString()}</span>
                                                    {recep.orden_compra && (
                                                        <span className="flex items-center gap-1"><ShoppingBag size={12} /> OC: {recep.orden_compra.numero_orden}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="hidden sm:block text-right mr-4">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registrado por</div>
                                                <div className="text-xs font-bold text-slate-700">Sistema Automático</div>
                                            </div>
                                            <button
                                                className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-slate-900 hover:border-slate-900 transition"
                                                title="Ver Detalle"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {recep.factura_compra_id && (
                                                <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                                    <CheckCircle2 size={12} /> Vinculado a Factura #{recep.factura_compra_id}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                            Stock actualizado en inventario automáticamente
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}