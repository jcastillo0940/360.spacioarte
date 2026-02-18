import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ClipboardList,
    Plus,
    Send,
    CheckCircle,
    PackageCheck,
    Clock,
    FileText,
    Trash2,
    Edit,
    AlertCircle,
    ShoppingBag,
    ChevronDown,
    Search,
    Truck
} from 'lucide-react';

export default function Index({ requisiciones, consumibles }) {
    const { auth } = usePage().props;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        items: [],
        notas: '',
        enviar: false
    });

    const addItem = () => {
        setData('items', [...data.items, { item_id: '', item_unit_id: '', cantidad: 1, notas: '' }]);
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;

        // Reset unit if item changes
        if (field === 'item_id') {
            newItems[index]['item_unit_id'] = '';
        }

        setData('items', newItems);
    };

    const handleSubmit = (enviarInmediato = false) => {
        data.enviar = enviarInmediato;
        if (editingId) {
            put(route('produccion.requisiciones.update', editingId), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    setEditingId(null);
                    reset();
                }
            });
        } else {
            post(route('produccion.requisiciones.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (req) => {
        setData({
            items: req.items.map(i => ({
                item_id: i.item_id,
                item_unit_id: i.item_unit_id || '',
                cantidad: i.cantidad_solicitada,
                notas: i.notas || ''
            })),
            notas: req.notas_solicitante || '',
            enviar: false
        });
        setEditingId(req.id);
        setIsFormOpen(true);
    };

    const handleApprove = (id) => {
        post(route('produccion.requisiciones.aprobar', id));
    };

    const handleDeliver = (id) => {
        if (confirm('¿Confirmar entrega de estos insumos? El stock se descontará automáticamente.')) {
            post(route('produccion.requisiciones.entregar', id));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Borrador': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'Pendiente': return 'bg-orange-100 text-orange-600 border-orange-200 animate-pulse';
            case 'Aprobada': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'Entregado': return 'bg-green-100 text-green-600 border-green-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Borrador': return <Clock size={14} />;
            case 'Pendiente': return <Send size={14} />;
            case 'Aprobada': return <CheckCircle size={14} />;
            case 'Entregado': return <PackageCheck size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const filteredRequisiciones = requisiciones.filter(r =>
        r.solicitante.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toString().includes(searchTerm)
    );

    const userRoles = Array.isArray(auth.user?.roles)
        ? auth.user.roles
        : Object.values(auth.user?.roles || {});

    const isJefeBodega = userRoles.some(role => {
        const roleName = typeof role === 'string' ? role : role.name;
        return roleName === 'Jefe de Bodega' || roleName === 'Administrador Total';
    });

    return (
        <AuthenticatedLayout>
            <Head title="Requisiciones de Suministros" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-48 -mt-48 z-0 opacity-40"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-300">
                            <ClipboardList size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Suministros de Planta</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Gestión de Requisiciones e Insumos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { reset(); setEditingId(null); setIsFormOpen(true); }}
                        className="relative z-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
                    >
                        <Plus size={20} /> Solicitar Material
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Sidebar / Stats */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar folio o solicitante..."
                                    className="w-full bg-slate-50 border-transparent rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-slate-900 transition-all border outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resumen de Estados</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-orange-700 uppercase">Por Aprobar</span>
                                        <span className="bg-white px-3 py-1 rounded-xl text-orange-600 font-black shadow-sm ring-1 ring-orange-200">
                                            {requisiciones.filter(r => r.estado === 'Pendiente').length}
                                        </span>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-blue-700 uppercase">Listos p/ Entrega</span>
                                        <span className="bg-white px-3 py-1 rounded-xl text-blue-600 font-black shadow-sm ring-1 ring-blue-200">
                                            {requisiciones.filter(r => r.estado === 'Aprobada').length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Insumo Finder */}
                        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-sm font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                                <Truck size={18} className="text-blue-400" /> Catálogo de Insumos
                            </h3>
                            <div className="space-y-3">
                                {consumibles.slice(0, 4).map(item => (
                                    <div key={item.id} className="bg-white/5 p-3 rounded-2xl flex justify-between items-center group-hover:bg-white/10 transition">
                                        <div>
                                            <div className="text-[11px] font-black leading-tight">{item.nombre}</div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase">{item.tipo}</div>
                                        </div>
                                        <div className={`text-xs font-black ${item.stock_actual <= item.stock_minimo ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                                            {parseFloat(item.stock_actual).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="xl:col-span-3 space-y-6">
                        {filteredRequisiciones.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-6 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300 shadow-inner">
                                    <ClipboardList size={48} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Sin solicitudes activas</h2>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">Las requisiciones de planta aparecerán aquí</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {filteredRequisiciones.map(req => (
                                    <div key={req.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group overflow-hidden">
                                        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-50 group-hover:bg-blue-50/30 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition duration-300">
                                                    #{req.id.toString().padStart(4, '0')}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-black text-slate-900 text-lg uppercase tracking-tighter">{req.solicitante.name}</span>
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${getStatusStyle(req.estado)}`}>
                                                            {getStatusIcon(req.estado)} {req.estado}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock size={12} /> {new Date(req.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {req.estado === 'Borrador' && req.user_id === auth.user.id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(req)}
                                                            className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-blue-600 hover:border-blue-600 transition"
                                                            title="Editar Borrador"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => destroy(route('produccion.requisiciones.destroy', req.id))}
                                                            className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-red-600 hover:border-red-600 transition"
                                                            title="Eliminar Borrador"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {req.estado === 'Pendiente' && isJefeBodega && (
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={16} /> Aprobar Requisición
                                                    </button>
                                                )}

                                                {req.estado === 'Aprobada' && isJefeBodega && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDeliver(req.id)}
                                                            className="px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 shadow-lg shadow-green-200 transition flex items-center gap-2"
                                                        >
                                                            <PackageCheck size={16} /> Entregar Material
                                                        </button>
                                                        <button
                                                            onClick={() => router.post(route('compras.ordenes.crear_desde_requisicion', req.id))}
                                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 shadow-lg transition flex items-center gap-2"
                                                        >
                                                            <ShoppingBag size={16} /> Generar OC (Faltante)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6 sm:p-8 bg-slate-50/50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {req.items.map((item, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition hover:shadow-md">
                                                        <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black text-slate-900 text-xs truncate uppercase tracking-tighter">{item.producto.nombre}</div>
                                                            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mt-1">
                                                                Cant: <span className="text-blue-600">{item.cantidad_solicitada} {item.unit?.nombre || item.producto.unidad_medida}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {req.notas_solicitante && (
                                                <div className="mt-6 flex gap-3 p-4 bg-white rounded-2xl border border-slate-100 italic text-slate-500 text-xs shadow-inner">
                                                    <AlertCircle size={16} className="text-slate-300 flex-shrink-0" />
                                                    "{req.notas_solicitante}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500 rounded-2xl text-white">
                                    <ClipboardList size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter">
                                        {editingId ? 'Editar Requisición' : 'Solicitar Insumos'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Módulo de Suministros de Producción</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setIsFormOpen(false); reset(); setEditingId(null); }}
                                className="text-slate-400 hover:text-white transition"
                            >
                                <svg size={32} className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Truck size={14} /> Selección de Materiales
                                    </h3>
                                    <button
                                        onClick={addItem}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Agregar Ítem
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {data.items.length === 0 ? (
                                        <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                            <PackageCheck size={40} className="text-slate-300 mx-auto mb-4" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No ha seleccionado ningún insumo</p>
                                        </div>
                                    ) : (
                                        data.items.map((item, index) => {
                                            const selectedConsumible = consumibles.find(c => c.id == item.item_id);
                                            return (
                                                <div key={index} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-6 relative group animate-in slide-in-from-top-4 duration-300">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition duration-300"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className="flex-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Insumo Requerido</label>
                                                        <select
                                                            value={item.item_id}
                                                            onChange={e => updateItem(index, 'item_id', e.target.value)}
                                                            className="w-full bg-white border-transparent rounded-2xl px-5 py-3 font-bold text-slate-800 shadow-sm transition"
                                                        >
                                                            <option value="">Seleccione...</option>
                                                            {consumibles.map(c => (
                                                                <option key={c.id} value={c.id}>{c.nombre} (Stock: {parseFloat(c.stock_actual)})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-full md:w-32 text-center">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Cant.</label>
                                                        <input
                                                            type="number" step="0.01"
                                                            value={item.cantidad}
                                                            onChange={e => updateItem(index, 'cantidad', e.target.value)}
                                                            className="w-full bg-white border-transparent rounded-2xl px-5 py-3 font-black text-blue-600 text-center shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-48">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">U. Empaque</label>
                                                        <select
                                                            value={item.item_unit_id}
                                                            onChange={e => updateItem(index, 'item_unit_id', e.target.value)}
                                                            className="w-full bg-white border-transparent rounded-2xl px-5 py-3 font-bold text-slate-800 shadow-sm"
                                                            disabled={!selectedConsumible?.units?.length}
                                                        >
                                                            <option value="">Und. Base ({selectedConsumible?.unidad_medida || 'UND'})</option>
                                                            {selectedConsumible?.units?.map(u => (
                                                                <option key={u.id} value={u.id}>{u.nombre} (x{u.factor_conversion})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 px-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Notas / Justificación</label>
                                <textarea
                                    value={data.notas}
                                    onChange={e => setData('notas', e.target.value)}
                                    rows="3"
                                    className="w-full bg-slate-50 border-slate-100 rounded-[2rem] px-6 py-4 font-bold text-slate-700 outline-none focus:ring-slate-900 transition"
                                    placeholder="Indique para qué trabajo o proceso requiere estos materiales..."
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={processing || data.items.length === 0}
                                className="flex-1 bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-lg"
                            >
                                <Clock size={20} /> Guardar Borrador
                            </button>
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={processing || data.items.length === 0}
                                className="flex-1 bg-slate-900 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:border-blue-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                                <Send size={20} /> Enviar a Bodega
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </AuthenticatedLayout>
    );
}