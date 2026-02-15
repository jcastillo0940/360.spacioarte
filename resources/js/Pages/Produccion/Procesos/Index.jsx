import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Plus, Save, Activity, DollarSign, BarChart3 } from 'lucide-react';

export default function Index({ procesos }) {
    const { data, setData, post, put, processing, reset } = useForm({
        nombre: '',
        tipo_maquina: '',
        costo_operativo_promedio: 0,
        capacidad_diaria: 0,
        activo: true
    });

    const [editando, setEditando] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        if (editando) {
            put(route('produccion.procesos.update', editando), {
                onSuccess: () => { setEditando(null); reset(); }
            });
        } else {
            post(route('produccion.procesos.store'), {
                onSuccess: () => reset()
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Centros de Trabajo" />
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* FORMULARIO DE CONFIGURACIÓN */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase">
                                <Settings size={20} className="text-blue-600"/> 
                                {editando ? 'Editar Máquina' : 'Nueva Máquina'}
                            </h2>
                            
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Centro de Trabajo</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-slate-200 rounded-xl font-medium"
                                        placeholder="Ej: Prensa de Tazas #1"
                                        value={data.nombre}
                                        onChange={e => setData('nombre', e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Tecnología</label>
                                    <select 
                                        className="w-full border-slate-200 rounded-xl font-bold"
                                        value={data.tipo_maquina}
                                        onChange={e => setData('tipo_maquina', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione tipo...</option>
                                        <option value="Sublimación">Sublimación</option>
                                        <option value="Grabado Láser">Grabado Láser</option>
                                        <option value="DTF / Textil">DTF / Textil</option>
                                        <option value="Plotter de Corte">Plotter de Corte</option>
                                        <option value="Impresión Gran Formato">Impresión Gran Formato</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                                            <DollarSign size={10}/> Costo Operativo
                                        </label>
                                        <input 
                                            type="number" step="0.0001"
                                            className="w-full border-slate-200 rounded-xl font-bold"
                                            value={data.costo_operativo_promedio}
                                            onChange={e => setData('costo_operativo_promedio', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1 text-blue-600">
                                            <BarChart3 size={10}/> Capacidad Día
                                        </label>
                                        <input 
                                            type="number"
                                            className="w-full border-blue-200 bg-blue-50 rounded-xl font-black text-blue-700"
                                            value={data.capacidad_diaria}
                                            onChange={e => setData('capacidad_diaria', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={processing}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Save size={18}/> {editando ? 'ACTUALIZAR CONFIGURACIÓN' : 'REGISTRAR MÁQUINA'}
                                </button>
                                {editando && (
                                    <button type="button" onClick={() => { setEditando(null); reset(); }} className="w-full text-xs font-bold text-slate-400 uppercase">Cancelar Edición</button>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* LISTADO DE MÁQUINAS ACTIVAS */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase">Centro de Trabajo</th>
                                        <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase">Capacidad</th>
                                        <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase">Costo Op.</th>
                                        <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {procesos.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-black text-slate-800 uppercase">{p.nombre}</div>
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{p.tipo_maquina}</div>
                                            </td>
                                            <td className="p-4 text-center font-black text-slate-600">
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{p.capacidad_diaria} uds/día</span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-500">
                                                ${p.costo_operativo_promedio}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => {
                                                        setEditando(p.id);
                                                        setData({
                                                            nombre: p.nombre,
                                                            tipo_maquina: p.tipo_maquina,
                                                            costo_operativo_promedio: p.costo_operativo_promedio,
                                                            capacidad_diaria: p.capacidad_diaria,
                                                            activo: !!p.activo
                                                        });
                                                    }}
                                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                                                >
                                                    <Plus size={16} className="rotate-45" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}