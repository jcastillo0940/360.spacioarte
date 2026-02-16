import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Settings, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function Index({ config }) {
    const [formData, setFormData] = useState({
        max_intentos_diseno: config.max_intentos_diseno || 3,
        diseno_precio_primera_hora: config.diseno_precio_primera_hora || 50,
        diseno_precio_hora_adicional: config.diseno_precio_hora_adicional || 35,
        diseno_revisiones_gratuitas: config.diseno_revisiones_gratuitas || 3,
        diseno_cobro_automatico: config.diseno_cobro_automatico ?? true
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await axios.post('/configuracion/diseno/actualizar', formData);
            setMessage('Configuración actualizada correctamente');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error al actualizar: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configuración de Diseño" />

            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-900">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                            Configuración de <span className="text-blue-500">Diseño</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-1">
                            Parámetros de Facturación y Revisiones
                        </p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl ${message.includes('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        <p className="font-bold text-sm">{message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Revisiones Gratuitas */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="text-green-500" size={24} />
                            <h2 className="text-xl font-black text-white uppercase">Revisiones Gratuitas</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Número de Revisiones Gratuitas
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.diseno_revisiones_gratuitas}
                                    onChange={(e) => setFormData({ ...formData, diseno_revisiones_gratuitas: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-600 mt-2">Revisiones sin costo para el cliente</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Límite Máximo de Intentos
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.max_intentos_diseno}
                                    onChange={(e) => setFormData({ ...formData, max_intentos_diseno: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-600 mt-2">Total de revisiones permitidas (gratuitas + pagadas)</p>
                            </div>
                        </div>
                    </div>

                    {/* Tarifas */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign className="text-blue-500" size={24} />
                            <h2 className="text-xl font-black text-white uppercase">Tarifas de Cobro</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Precio Primera Hora ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.diseno_precio_primera_hora}
                                    onChange={(e) => setFormData({ ...formData, diseno_precio_primera_hora: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-600 mt-2">Se cobra completa aunque se usen minutos</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Precio Horas Adicionales ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.diseno_precio_hora_adicional}
                                    onChange={(e) => setFormData({ ...formData, diseno_precio_hora_adicional: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-600 mt-2">Tarifa por cada hora después de la primera</p>
                            </div>
                        </div>
                    </div>

                    {/* Automatización */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="text-amber-500" size={24} />
                            <h2 className="text-xl font-black text-white uppercase">Automatización</h2>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.diseno_cobro_automatico}
                                onChange={(e) => setFormData({ ...formData, diseno_cobro_automatico: e.target.checked })}
                                className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-white font-bold">Activar cobro automático después de revisiones gratuitas</span>
                                <p className="text-xs text-slate-600">El sistema comenzará a contabilizar tiempo automáticamente</p>
                            </div>
                        </label>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                    >
                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </button>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
