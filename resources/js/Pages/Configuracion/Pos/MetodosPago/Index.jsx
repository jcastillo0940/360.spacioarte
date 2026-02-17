import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import {
    Plus, Trash2, Edit2, CheckCircle2, XCircle,
    CreditCard, Banknote, Landmark, Smartphone,
    Save, X, ShieldCheck
} from 'lucide-react';

export default function Index({ auth, metodos, cuentas }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        nombre: '',
        tipo: 'Efectivo',
        bank_account_id: '',
        activo: true,
        requiere_referencia: false
    });

    const openCreate = () => {
        setEditing(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (metodo) => {
        setEditing(metodo);
        setData({
            nombre: metodo.nombre,
            tipo: metodo.tipo,
            bank_account_id: metodo.bank_account_id || '',
            activo: !!metodo.activo,
            requiere_referencia: !!metodo.requiere_referencia
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('config.pos.metodos.update', editing.id), {
                onSuccess: () => { setShowModal(false); reset(); }
            });
        } else {
            post(route('config.pos.metodos.store'), {
                onSuccess: () => { setShowModal(false); reset(); }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('¿Eliminar este método de pago?')) {
            destroy(route('config.pos.metodos.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Configuración Métodos de Pago POS" />

            <div className="py-12 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">MÉTODOS DE PAGO</h2>
                            <p className="text-slate-500 font-medium">Configura cómo tus clientes pagan en el punto de venta.</p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl active:scale-95"
                        >
                            <Plus size={18} /> Nuevo Método
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metodos.map(metodo => (
                            <div key={metodo.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-10 -mt-10 opacity-20 ${metodo.activo ? 'bg-green-400' : 'bg-red-400'}`} />

                                <div className="flex justify-between items-start relative z-10 mb-6">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                        {metodo.tipo === 'Efectivo' && <Banknote size={24} />}
                                        {metodo.tipo === 'Tarjeta' && <CreditCard size={24} />}
                                        {metodo.tipo === 'Transferencia' && <Landmark size={24} />}
                                        {metodo.tipo === 'Electronico' && <Smartphone size={24} />}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(metodo)} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(metodo.id)} className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl hover:bg-white hover:shadow-md transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{metodo.nombre}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{metodo.tipo}</p>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 py-2 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Landmark size={14} className="text-slate-400" />
                                        <span className="text-[11px] font-bold text-slate-600 truncate italic">
                                            {metodo.cuenta_bancaria ? metodo.cuenta_bancaria.nombre : 'Sin cuenta vinculada'}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 border ${metodo.activo ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                            {metodo.activo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{metodo.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                                        </div>
                                        {metodo.requiere_referencia && (
                                            <div className="flex-1 py-2 px-4 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl flex items-center justify-center gap-2">
                                                <ShieldCheck size={12} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">REF. REQ.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {metodos.length === 0 && (
                        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100">
                            <Banknote size={80} className="mx-auto text-slate-100 mb-6" strokeWidth={1} />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No hay métodos configurados</h3>
                            <button onClick={openCreate} className="mt-6 text-slate-900 font-bold underline decoration-2 underline-offset-8">Crear el primero ahora</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
                        <form onSubmit={handleSubmit}>
                            <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-[60px] rounded-full -mr-10 -mt-10" />
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic">{editing ? 'EDITAR MÉTODO' : 'NUEVO MÉTODO'}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80 mt-1">Configuración del terminal POS</p>
                                    </div>
                                    <button type="button" onClick={() => setShowModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={24} /></button>
                                </div>
                            </div>

                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Visual</label>
                                    <input
                                        type="text"
                                        value={data.nombre}
                                        onChange={e => setData('nombre', e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-slate-100 transition-all"
                                        placeholder="Ej: Yappy, Tarjeta Visa, Efectivo Caja 1..."
                                        required
                                    />
                                    {errors.nombre && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.nombre}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Pago</label>
                                        <select
                                            value={data.tipo}
                                            onChange={e => setData('tipo', e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-slate-100 transition-all appearance-none"
                                        >
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Tarjeta">Tarjeta (Electrónico)</option>
                                            <option value="Transferencia">Transferencia Bancaria</option>
                                            <option value="Electronico">Monedero (Yappy/Nequi)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular a Cuenta</label>
                                        <select
                                            value={data.bank_account_id}
                                            onChange={e => setData('bank_account_id', e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-slate-100 transition-all appearance-none"
                                        >
                                            <option value="">Seleccionar cuenta...</option>
                                            {cuentas.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setData('activo', !data.activo)}
                                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${data.activo ? 'bg-green-50 border-green-200 text-green-700 shadow-lg shadow-green-100' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                    >
                                        <CheckCircle2 size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{data.activo ? 'Método Activo' : 'Método Inactivo'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('requiere_referencia', !data.requiere_referencia)}
                                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${data.requiere_referencia ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-lg shadow-purple-100' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                    >
                                        <ShieldCheck size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pedir Referencia</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white border border-slate-200 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <Save size={16} /> {editing ? 'Actualizar' : 'Guardar Método'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
