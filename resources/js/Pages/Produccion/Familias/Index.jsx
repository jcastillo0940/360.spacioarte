import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Boxes, Plus, Save, Settings2, Trash2 } from 'lucide-react';

const tiposConsumo = [
    { value: 'pliego_fijo', label: 'Pliego fijo' },
    { value: 'rollo_lineal', label: 'Rollo lineal' },
    { value: 'unidad_completa', label: 'Unidad completa' },
    { value: 'directo_sin_nesting', label: 'Directo sin nesting' },
];

export default function Index({ familias = [] }) {
    const [editando, setEditando] = useState(null);
    const { data, setData, post, put, delete: destroy, processing, reset } = useForm({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo_consumo_material: 'pliego_fijo',
        requiere_material_base: true,
        requiere_soporte_impresion: true,
        requiere_nesting: true,
        requiere_receta: true,
        segundos_estandar_unidad: 0,
        activo: true,
    });

    const submit = (e) => {
        e.preventDefault();

        if (editando) {
            put(route('produccion.familias.update', editando), {
                onSuccess: () => {
                    setEditando(null);
                    reset();
                },
            });
            return;
        }

        post(route('produccion.familias.store'), {
            onSuccess: () => reset(),
        });
    };

    const cargar = (familia) => {
        setEditando(familia.id);
        setData({
            codigo: familia.codigo,
            nombre: familia.nombre,
            descripcion: familia.descripcion || '',
            tipo_consumo_material: familia.tipo_consumo_material,
            requiere_material_base: !!familia.requiere_material_base,
            requiere_soporte_impresion: !!familia.requiere_soporte_impresion,
            requiere_nesting: !!familia.requiere_nesting,
            requiere_receta: !!familia.requiere_receta,
            segundos_estandar_unidad: familia.segundos_estandar_unidad || 0,
            activo: !!familia.activo,
        });
    };

    const eliminar = (familia) => {
        if (!confirm(`Deseas eliminar o desactivar la familia "${familia.nombre}"?`)) return;

        destroy(route('produccion.familias.destroy', familia.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (editando === familia.id) {
                    setEditando(null);
                    reset();
                }
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Familias Productivas" />

            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-8 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Ingenieria de produccion</p>
                            <h1 className="mt-2 text-3xl font-black text-slate-950">Familias productivas</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                                Define reglas maestras por tipo de producto: sublimacion, DTF, vinil, corte o cualquier
                                otra familia. Luego cada producto hereda una estructura mas clara para receta, soporte y nesting.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Familias</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{familias.length}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Activas</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{familias.filter((f) => f.activo).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 flex items-center gap-2 font-black uppercase text-slate-800">
                                <Settings2 size={20} className="text-blue-600" />
                                {editando ? 'Editar familia' : 'Nueva familia'}
                            </h2>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Codigo</label>
                                        <input
                                            type="text"
                                            value={data.codigo}
                                            onChange={(e) => setData('codigo', e.target.value.toUpperCase())}
                                            className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                            placeholder="SUBL"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Seg / unidad</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.segundos_estandar_unidad}
                                            onChange={(e) => setData('segundos_estandar_unidad', e.target.value)}
                                            className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Nombre</label>
                                    <input
                                        type="text"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                        placeholder="Sublimacion Textil"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Tipo de consumo</label>
                                    <select
                                        value={data.tipo_consumo_material}
                                        onChange={(e) => setData('tipo_consumo_material', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                    >
                                        {tiposConsumo.map((tipo) => (
                                            <option key={tipo.value} value={tipo.value}>
                                                {tipo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Descripcion</label>
                                    <textarea
                                        value={data.descripcion}
                                        onChange={(e) => setData('descripcion', e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border-slate-200 text-sm font-medium"
                                        placeholder="Ej: usa producto base, soporte de impresion y nesting por pliego."
                                    />
                                </div>

                                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                    {[
                                        ['requiere_material_base', 'Requiere producto base o bruto'],
                                        ['requiere_soporte_impresion', 'Requiere soporte de impresion'],
                                        ['requiere_nesting', 'Requiere nesting o plan de acomodo'],
                                        ['requiere_receta', 'Requiere receta / BOM'],
                                        ['activo', 'Familia activa'],
                                    ].map(([field, label]) => (
                                        <label key={field} className="flex items-center gap-3 text-xs font-black uppercase text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={!!data[field]}
                                                onChange={(e) => setData(field, e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {editando ? <Save size={18} /> : <Plus size={18} />}
                                    {editando ? 'Guardar cambios' : 'Crear familia'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                                    <Boxes size={18} />
                                    Catalogo de familias
                                </h2>
                                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                                    {familias.length} registros
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {familias.map((familia) => (
                                    <div key={familia.id} className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-xl bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                                    {familia.codigo}
                                                </span>
                                                <span className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                                                    familia.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {familia.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                                <span className="rounded-xl bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                                                    {tiposConsumo.find((tipo) => tipo.value === familia.tipo_consumo_material)?.label || familia.tipo_consumo_material}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-black text-slate-950">{familia.nombre}</h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">{familia.descripcion || 'Sin descripcion.'}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                                                {familia.requiere_material_base && <span className="rounded-full bg-slate-100 px-3 py-1">Material base</span>}
                                                {familia.requiere_soporte_impresion && <span className="rounded-full bg-slate-100 px-3 py-1">Soporte</span>}
                                                {familia.requiere_nesting && <span className="rounded-full bg-slate-100 px-3 py-1">Nesting</span>}
                                                {familia.requiere_receta && <span className="rounded-full bg-slate-100 px-3 py-1">Receta</span>}
                                                <span className="rounded-full bg-slate-100 px-3 py-1">{familia.items_count || 0} productos</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => cargar(familia)}
                                                className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-600"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => eliminar(familia)}
                                                className="rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <Trash2 size={14} />
                                                    Eliminar
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!familias.length && (
                                    <div className="p-10 text-center text-sm font-bold text-slate-500">
                                        Todavia no hay familias productivas configuradas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
