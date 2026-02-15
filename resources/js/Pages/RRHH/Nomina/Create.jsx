import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        periodo_nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('nomina.procesar'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Procesar Nómina" />
            
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Cierre de Planilla
                    </h1>
                    <p className="text-slate-600 mt-2">Generación masiva de pagos quincenales</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre del Período</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 1ra Quincena de Marzo 2026"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                value={data.periodo_nombre}
                                onChange={e => setData('periodo_nombre', e.target.value)}
                                required
                            />
                            {errors.periodo_nombre && <p className="text-red-500 text-xs mt-1">{errors.periodo_nombre}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Inicio</label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    value={data.fecha_inicio}
                                    onChange={e => setData('fecha_inicio', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Fin</label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    value={data.fecha_fin}
                                    onChange={e => setData('fecha_fin', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-blue-800 font-bold mb-2">Recordatorio Legal</h3>
                                    <p className="text-blue-700 text-sm">
                                        Este proceso calculará automáticamente el 9.75% de Seguro Social y 1.25% de Seguro Educativo para empleados permanentes.
                                        Los empleados bajo Servicios Profesionales tendrán retención de ISR según corresponda.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={processing}
                            className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 shadow-lg disabled:bg-slate-400 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {processing ? 'Ejecutando Cálculos...' : 'Procesar Planilla Ahora'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}