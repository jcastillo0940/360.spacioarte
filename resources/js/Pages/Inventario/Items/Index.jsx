import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Package,
    Plus,
    Edit,
    Search,
    Filter,
    Scale,
    AlertCircle,
    ChevronRight,
    TrendingDown,
    Layers,
    Beaker
} from 'lucide-react';

export default function Index({ items = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const stats = {
        total: items.length,
        stockBajo: items.filter(i => parseFloat(i.stock_actual) <= parseFloat(i.stock_minimo) && i.tipo !== 'Servicio').length,
        productos: items.filter(i => i.tipo === 'Producto Terminado').length,
        insumos: items.filter(i => i.tipo === 'Materia Prima' || i.es_insumo).length
    };

    return (
        <AuthenticatedLayout>
            <Head title="Inventario Maestro" />

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header Premium Section */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 rounded-full -mr-[250px] -mt-[250px] z-0 opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl shadow-slate-200 rotate-3 transition-transform hover:rotate-0 duration-500">
                                <Package size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Inventario Maestro</h1>
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em] mt-2 ml-1">Catálogo Centralizado v2.0</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                        <div className="bg-slate-50 p-2 rounded-[2rem] flex gap-2 border border-slate-200">
                            <div className="px-6 py-3 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Items Totales</span>
                                <span className="text-2xl font-black text-slate-900 leading-tight">{stats.total}</span>
                            </div>
                            <div className="px-6 py-3 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center min-w-[110px]">
                                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">Stock Bajo</span>
                                <span className="text-2xl font-black text-orange-600 leading-tight flex items-center gap-2">
                                    {stats.stockBajo}
                                    {stats.stockBajo > 0 && <TrendingDown size={18} className="animate-bounce" />}
                                </span>
                            </div>
                        </div>

                        <Link
                            href={route('items.crear')}
                            className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:scale-105 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1"
                        >
                            <Plus size={20} /> Registrar Artículo
                        </Link>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-lg flex items-center gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por código, nombre completo o categoría..."
                            className="flex-1 bg-transparent border-none text-lg font-bold text-slate-800 focus:ring-0 placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition">
                            <Filter size={14} /> Filtros
                        </button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden relative">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Producto e Identidad</th>
                                    <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Configuración Técnica</th>
                                    <th className="px-8 py-8 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Stock Actual</th>
                                    <th className="px-8 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Valorización</th>
                                    <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-32 text-center">
                                            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                                                <Search size={64} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Sin coincidencias</h3>
                                            <p className="text-slate-400 font-bold uppercase text-xs mt-3 tracking-widest">No encontramos artículos para "{searchTerm}"</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[1.5rem] flex items-center justify-center text-slate-400 font-black text-2xl group-hover:scale-110 group-hover:rotate-3 transition duration-500 shadow-sm border border-slate-200">
                                                        {item.nombre.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-xl text-slate-900 leading-none mb-1.5 group-hover:text-blue-600 transition-colors">{item.nombre}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">ID: {item.codigo}</span>
                                                            {item.categoria && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.categoria}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${item.tipo === 'Producto Terminado' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                                            item.tipo === 'Materia Prima' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                                                item.tipo === 'Servicio' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {item.tipo}
                                                    </span>
                                                    {item.requires_recipe && (
                                                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-200 flex items-center gap-1.5">
                                                            <Layers size={10} /> Receta / BOM
                                                        </span>
                                                    )}
                                                    {item.es_insumo && (
                                                        <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-orange-200">Uso Interno</span>
                                                    )}
                                                </div>
                                                <div className="mt-3 flex gap-4">
                                                    {item.units?.length > 0 && (
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                                            <Scale size={12} className="text-slate-300" /> {item.units.length} Presentaciones
                                                        </div>
                                                    )}
                                                    {item.ingredientes?.length > 0 && (
                                                        <div className="text-[9px] font-bold text-purple-400 uppercase flex items-center gap-1.5">
                                                            <Beaker size={12} className="text-purple-300" /> {item.ingredientes.length} Componentes
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="flex flex-col items-center">
                                                    <div className={`text-3xl font-black leading-none tracking-tighter ${parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo) && item.tipo !== 'Servicio'
                                                            ? 'text-red-500 animate-pulse'
                                                            : 'text-slate-900'
                                                        }`}>
                                                        {parseFloat(item.stock_actual).toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 ml-1">{item.unidad_medida}</div>
                                                    {parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo) && item.tipo !== 'Servicio' && (
                                                        <div className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] mt-3 flex items-center gap-1.5 border border-red-100">
                                                            <AlertCircle size={10} /> Stock Crítico
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 text-right">
                                                <div className="text-2xl font-black text-blue-600 leading-none mb-1.5">
                                                    {formatCurrency(item.precio_venta)}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Costo ref: {formatCurrency(item.costo_promedio)}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <Link
                                                        href={route('items.edit', item.id)}
                                                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white hover:scale-110 transition duration-500 shadow-sm border border-slate-100 group/btn"
                                                    >
                                                        <Edit size={22} className="group-hover/btn:rotate-12 transition-transform" />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Estás seguro de eliminar este artículo?')) {
                                                                router.delete(route('items.destroy', item.id));
                                                            }
                                                        }}
                                                        className="p-4 bg-white text-slate-200 rounded-2xl hover:bg-red-50 hover:text-red-500 transition duration-500 border border-slate-100"
                                                    >
                                                        <Plus size={22} className="rotate-45" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Background Detail */}
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-50 rounded-full -mr-48 -mb-48 opacity-20 -z-10"></div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f8fafc;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </AuthenticatedLayout>
    );
}
