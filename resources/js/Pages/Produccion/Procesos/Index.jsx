import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BarChart3, DollarSign, Plus, Save, Settings } from 'lucide-react';

export default function Index({ procesos }) {
    const { data, setData, post, put, delete: destroy, processing, reset } = useForm({
        nombre: '',
        tipo_maquina: '',
        categoria_tecnologia: '',
        ancho_maximo_cm: '',
        largo_maximo_cm: '',
        tiempo_setup_minutos: 0,
        tiempo_estimado_por_unidad: 0,
        permite_nesting: true,
        margen_seguridad_cm: 1.0,
        costo_operativo_promedio: 0,
        capacidad_diaria: 0,
        activo: true,
    });

    const [editando, setEditando] = useState(null);

    const submit = (e) => {
        e.preventDefault();

        if (editando) {
            put(route('produccion.procesos.update', editando), {
                onSuccess: () => {
                    setEditando(null);
                    reset();
                },
            });
            return;
        }

        post(route('produccion.procesos.store'), {
            onSuccess: () => reset(),
        });
    };

    const cargarProceso = (proceso) => {
        setEditando(proceso.id);
        setData({
            nombre: proceso.nombre,
            tipo_maquina: proceso.tipo_maquina,
            categoria_tecnologia: proceso.categoria_tecnologia || '',
            ancho_maximo_cm: proceso.ancho_maximo_cm || '',
            largo_maximo_cm: proceso.largo_maximo_cm || '',
            tiempo_setup_minutos: proceso.tiempo_setup_minutos || 0,
            tiempo_estimado_por_unidad: proceso.tiempo_estimado_por_unidad || 0,
            permite_nesting: !!proceso.permite_nesting,
            margen_seguridad_cm: proceso.margen_seguridad_cm || 1,
            costo_operativo_promedio: proceso.costo_operativo_promedio || 0,
            capacidad_diaria: proceso.capacidad_diaria || 0,
            activo: !!proceso.activo,
        });
    };

    const eliminarProceso = (proceso) => {
        if (!confirm(`Deseas eliminar o desactivar la maquina "${proceso.nombre}"?`)) {
            return;
        }

        destroy(route('produccion.procesos.destroy', proceso.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (editando === proceso.id) {
                    setEditando(null);
                    reset();
                }
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Centros de Trabajo" />

            <div className="mx-auto max-w-7xl p-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 flex items-center gap-2 text-slate-800 font-black uppercase">
                                <Settings size={20} className="text-blue-600" />
                                {editando ? 'Editar Maquina' : 'Nueva Maquina'}
                            </h2>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border-slate-200 text-sm font-medium"
                                        placeholder="Ej: Impresora DTF 01"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Tecnologia</label>
                                        <select
                                            className="w-full rounded-xl border-slate-200 text-xs font-bold"
                                            value={data.categoria_tecnologia}
                                            onChange={(e) => setData('categoria_tecnologia', e.target.value)}
                                            required
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="Sublimacion Plotter">Sublimacion Plotter</option>
                                            <option value="Sublimacion Inyeccion">Sublimacion Inyeccion</option>
                                            <option value="Impresion Laser">Impresion Laser</option>
                                            <option value="Plotter de Corte">Plotter de Corte</option>
                                            <option value="UV">UV</option>
                                            <option value="Ecosolvente">Ecosolvente</option>
                                            <option value="Latex">Latex</option>
                                            <option value="Serigrafia">Serigrafia</option>
                                            <option value="Offset">Offset</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Tipo de maquina</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border-slate-200 text-xs font-bold"
                                            placeholder="Ej: DTF / Textil"
                                            value={data.tipo_maquina}
                                            onChange={(e) => setData('tipo_maquina', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                                    <h4 className="border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Parametros de pliego / nesting
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500">Ancho max (cm)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full rounded-lg border-slate-200 text-xs font-bold"
                                                value={data.ancho_maximo_cm}
                                                onChange={(e) => setData('ancho_maximo_cm', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500">Largo max (cm)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full rounded-lg border-slate-200 text-xs font-bold"
                                                value={data.largo_maximo_cm}
                                                onChange={(e) => setData('largo_maximo_cm', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={data.permite_nesting}
                                            onChange={(e) => setData('permite_nesting', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-[10px] font-black uppercase text-slate-700">
                                            Permite nesting / optimizacion
                                        </span>
                                    </label>

                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold text-slate-500">Margen de seguridad (cm)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-1/2 rounded-lg border-slate-200 text-xs font-bold"
                                            value={data.margen_seguridad_cm}
                                            onChange={(e) => setData('margen_seguridad_cm', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                                    <h4 className="border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Tiempos y costos
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500">Setup (min)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full rounded-lg border-slate-200 text-xs font-bold"
                                                value={data.tiempo_setup_minutos}
                                                onChange={(e) => setData('tiempo_setup_minutos', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500">Tiempo por unidad (seg)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full rounded-lg border-slate-200 text-xs font-bold"
                                                value={data.tiempo_estimado_por_unidad}
                                                onChange={(e) => setData('tiempo_estimado_por_unidad', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500">
                                                <DollarSign size={10} /> Costo operativo
                                            </label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                className="w-full rounded-xl border-slate-200 text-xs font-bold"
                                                value={data.costo_operativo_promedio}
                                                onChange={(e) => setData('costo_operativo_promedio', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-blue-600">
                                                <BarChart3 size={10} /> Capacidad dia
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full rounded-xl border-blue-200 bg-blue-50 text-xs font-black text-blue-700"
                                                value={data.capacidad_diaria}
                                                onChange={(e) => setData('capacidad_diaria', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={data.activo}
                                            onChange={(e) => setData('activo', e.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="block text-[11px] font-black uppercase text-slate-700">Maquina activa</span>
                                            <span className="mt-1 block text-xs text-slate-500">
                                                Desactiva esta opcion si la impresora, plancha o equipo esta en reparacion o fuera de servicio.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-black text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
                                >
                                    <Save size={18} />
                                    {editando ? 'ACTUALIZAR CONFIGURACION' : 'REGISTRAR MAQUINA'}
                                </button>

                                {editando && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditando(null);
                                            reset();
                                        }}
                                        className="w-full text-xs font-bold uppercase text-slate-400"
                                    >
                                        Cancelar edicion
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50">
                                    <tr>
                                        <th className="p-4 text-left text-[10px] font-black uppercase text-slate-400">Centro de trabajo</th>
                                        <th className="p-4 text-center text-[10px] font-black uppercase text-slate-400">Dimensiones / Nesting</th>
                                        <th className="p-4 text-center text-[10px] font-black uppercase text-slate-400">Capacidad</th>
                                        <th className="p-4 text-center text-[10px] font-black uppercase text-slate-400">Estado</th>
                                        <th className="p-4 text-center text-[10px] font-black uppercase text-slate-400">Accion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {procesos.map((proceso) => (
                                        <tr key={proceso.id} className="transition-colors hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-black uppercase text-slate-800">{proceso.nombre}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-tighter text-blue-600">
                                                    {proceso.categoria_tecnologia} • {proceso.tipo_maquina}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {proceso.ancho_maximo_cm ? (
                                                    <div className="text-[10px] font-bold text-slate-500">
                                                        {proceso.ancho_maximo_cm} x {proceso.largo_maximo_cm} cm
                                                        {proceso.permite_nesting && (
                                                            <span className="block font-black text-green-600">
                                                                Nesting activo (margen: {proceso.margen_seguridad_cm} cm)
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] italic text-slate-400">S/N</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center font-black text-slate-600">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                                                    {proceso.capacidad_diaria} uds/dia
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${proceso.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {proceso.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => cargarProceso(proceso)}
                                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                                        title="Editar maquina"
                                                    >
                                                        <Plus size={16} className="rotate-45" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarProceso(proceso)}
                                                        className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                                                        title="Eliminar o desactivar maquina"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
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
