import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Monitor, Key, ArrowRight } from 'lucide-react';

export default function Apertura({ cajas }) {
    const { data, setData, post, processing, errors } = useForm({
        caja_id: cajas.length > 0 ? cajas[0].id : '',
        monto_apertura: '0.00'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('pos.abrir'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Apertura de Caja" />

            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
                            <Monitor className="text-white" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">CONTROL POS</h1>
                        <p className="text-slate-400 mt-2 font-medium">Inicia tu turno de trabajo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecciona tu Caja</label>
                            <div className="grid grid-cols-1 gap-3">
                                {cajas.map(caja => (
                                    <button
                                        key={caja.id}
                                        type="button"
                                        onClick={() => setData('caja_id', caja.id)}
                                        className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${data.caja_id === caja.id
                                                ? 'border-purple-600 bg-purple-50 shadow-md'
                                                : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.caja_id === caja.id ? 'bg-purple-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                            }`}>
                                            <Key size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black uppercase text-sm ${data.caja_id === caja.id ? 'text-purple-600' : 'text-slate-600'}`}>
                                                {caja.nombre}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">SUCURSAL PRINCIPAL</p>
                                        </div>
                                    </button>
                                ))}
                                {cajas.length === 0 && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center">
                                        No hay cajas configuradas en el sistema.
                                    </div>
                                )}
                            </div>
                            {errors.caja_id && <p className="text-red-500 text-xs mt-2">{errors.caja_id}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Monto Inicial en Efectivo</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.monto_apertura}
                                    onChange={e => setData('monto_apertura', e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-3xl py-6 pl-12 pr-6 text-3xl font-black text-slate-900 focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-slate-200"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            {errors.monto_apertura && <p className="text-red-500 text-xs mt-2">{errors.monto_apertura}</p>}
                        </div>

                        <button
                            disabled={processing || cajas.length === 0}
                            className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {processing ? 'INICIANDO...' : 'ABRIR CAJA Y EMPEZAR'}
                            <ArrowRight size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
