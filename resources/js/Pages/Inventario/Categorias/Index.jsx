import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ categories = [] }) {
    const [editing, setEditing] = useState(null);
    const { data, setData, post, processing, reset, errors } = useForm({
        nombre: '',
        descripcion: '',
    });

    const saveCategory = (e) => {
        e.preventDefault();

        if (editing) {
            router.put(route('inventario.categorias.update', editing.id), {
                nombre: data.nombre,
                descripcion: data.descripcion,
                activo: editing.activo,
            }, {
                onSuccess: () => {
                    reset();
                    setEditing(null);
                },
            });
            return;
        }

        post(route('inventario.categorias.store'), {
            onSuccess: () => reset(),
        });
    };

    const startEdit = (category) => {
        setEditing(category);
        setData({
            nombre: category.nombre || '',
            descripcion: category.descripcion || '',
        });
    };

    const cancelEdit = () => {
        setEditing(null);
        reset();
    };

    const toggleActive = (category) => {
        router.put(route('inventario.categorias.update', category.id), {
            nombre: category.nombre,
            descripcion: category.descripcion,
            activo: !category.activo,
        });
    };

    const destroyCategory = (category) => {
        if (!window.confirm(`¿Deseas eliminar la categoría "${category.nombre}"?`)) {
            return;
        }

        router.delete(route('inventario.categorias.destroy', category.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Categorías de Productos" />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Categorías de Productos</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Administra el catálogo para que los productos se clasifiquen con un dropdown claro y consistente.
                        </p>
                    </div>
                    <Link
                        href={route('items.index')}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                        Volver a productos
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900">
                            {editing ? 'Editar categoría' : 'Nueva categoría'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Usa nombres cortos y consistentes: por ejemplo, `Sublimación`, `DTF`, `Promocionales`.
                        </p>

                        <form onSubmit={saveCategory} className="mt-5 space-y-4">
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-800"
                                    required
                                />
                                {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</label>
                                <textarea
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    className="h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {editing ? 'Guardar cambios' : 'Crear categoría'}
                                </button>

                                {editing && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900">Catálogo actual</h2>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="pb-3">Nombre</th>
                                        <th className="pb-3">Descripción</th>
                                        <th className="pb-3">Estado</th>
                                        <th className="pb-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {categories.map((category) => (
                                        <tr key={category.id}>
                                            <td className="py-4 font-black text-slate-900">{category.nombre}</td>
                                            <td className="py-4 text-sm text-slate-500">{category.descripcion || 'Sin descripción'}</td>
                                            <td className="py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(category)}
                                                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                                        category.activo
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}
                                                >
                                                    {category.activo ? 'Activa' : 'Inactiva'}
                                                </button>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(category)}
                                                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => destroyCategory(category)}
                                                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                                                    >
                                                        Eliminar
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
