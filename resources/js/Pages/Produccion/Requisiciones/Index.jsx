import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ShoppingCart, CheckCircle, Clock, Package, Send, User } from 'lucide-react';

export default function Index({ requisiciones, consumibles }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, reset } = useForm({
        items: [],
        notas: ''
    });

    const agregarItem = (item) => {
        const existe = data.items.find(i => i.item_id === item.id);
        if (!existe) {
            setData('items', [...data.items, { item_id: item.id, nombre: item.nombre, cantidad: 1 }]);
        }
    };

    const handleSolicitar = (e) => {
        e.preventDefault();
        post(route('produccion.requisiciones.store'), { onSuccess: () => reset() });
    };

    const handleEntregar = (id) => {
        if (confirm('¿Confirmar entrega física de los insumos? Se descontarán de bodega.')) {
            post(route('produccion.requisiciones.entregar', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Requisiciones de Insumos" />
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* PANEL DE SOLICITUD (Solo Operadores) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                                <ShoppingCart className="text-blue-600"/> Solicitar Insumos
                            </h2>
                            <div className="grid grid-cols-1 gap-2 mb-6">
                                {consumibles.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => agregarItem(c)}
                                        className="text-left p-3 border rounded-xl hover:bg-blue-50 font-bold text-xs uppercase"
                                    >
                                        + {c.nombre}
                                    </button>
                                ))}
                            </div>

                            {data.items.length > 0 && (
                                <form onSubmit={handleSolicitar} className="space-y-4 border-t pt-4">
                                    {data.items.map((it, idx) => (
                                        <div key={it.item_id} className="flex justify-between items-center gap-2">
                                            <span className="text-xs font-bold flex-1">{it.nombre}</span>
                                            <input 
                                                type="number" 
                                                className="w-20 border-slate-200 rounded-lg text-xs"
                                                value={it.cantidad}
                                                onChange={e => {
                                                    const nuevos = [...data.items];
                                                    nuevos[idx].cantidad = e.target.value;
                                                    setData('items', nuevos);
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <textarea 
                                        placeholder="Notas adicionales..." 
                                        className="w-full border-slate-200 rounded-xl text-xs"
                                        onChange={e => setData('notas', e.target.value)}
                                    />
                                    <button disabled={processing} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
                                        <Send size={16}/> ENVIAR A BODEGA
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* LISTADO DE REQUISICIONES (Historial y Aprobaciones) */}
                    <div className="lg:col-span-2 space-y-4">
                        {requisiciones.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900">REQUISICIÓN #{req.id}</span>
                                        <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase ${
                                            req.estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>{req.estado}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                                        <User size={12}/> Solicitado por: {req.solicitante?.name}
                                    </div>
                                    <ul className="bg-slate-50 p-3 rounded-xl space-y-1">
                                        {req.items.map(it => (
                                            <li key={it.id} className="text-xs font-black text-slate-700">
                                                • {it.cantidad_solicitada} x {it.producto?.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* BOTÓN DE ACCIÓN (Solo Jefe de Bodega) */}
                                {req.estado === 'Pendiente' && (auth.roles.includes('Jefe de Bodega') || auth.roles.includes('Administrador Total')) && (
                                    <div className="flex items-center">
                                        <button 
                                            onClick={() => handleEntregar(req.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-green-100"
                                        >
                                            <CheckCircle size={20}/> ENTREGAR MATERIAL
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}