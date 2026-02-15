import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [vendedores, setVendedores] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, reset } = useForm({
        nombre_completo: '',
        identificacion: '',
        telefono: '',
        email: '',
        zona_venta: '',
        porcentaje_comision: '',
        meta_mensual: ''
    });

    useEffect(() => {
        loadVendedores();
    }, []);

    const loadVendedores = () => {
        fetch('/api/configuracion/vendedores')
            .then(res => res.json())
            .then(setVendedores);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/configuracion/vendedores/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    loadVendedores();
                }
            });
        } else {
            post('/configuracion/vendedores', {
                onSuccess: () => {
                    reset();
                    loadVendedores();
                }
            });
        }
    };

    const handleEdit = (vendedor) => {
        setData(vendedor);
        setEditingId(vendedor.id);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Vendedores" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Gestión de Vendedores
                    </h1>
                    <p className="text-slate-600 mt-2">Equipo de ventas y comisiones</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            {editingId ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre Completo</label>
                                <input 
                                    type="text"
                                    value={data.nombre_completo}
                                    onChange={e => setData('nombre_completo', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Identificación</label>
                                <input 
                                    type="text"
                                    value={data.identificacion}
                                    onChange={e => setData('identificacion', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label>
                                <input 
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Zona de Venta</label>
                                <input 
                                    type="text"
                                    value={data.zona_venta}
                                    onChange={e => setData('zona_venta', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    placeholder="Ciudad de Panamá"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Comisión (%)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={data.porcentaje_comision}
                                        onChange={e => setData('porcentaje_comision', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Meta Mensual</label>
                                    <input 
                                        type="number"
                                        value={data.meta_mensual}
                                        onChange={e => setData('meta_mensual', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    {editingId ? 'Actualizar' : 'Guardar'}
                                </button>
                                {editingId && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            reset();
                                            setEditingId(null);
                                        }}
                                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Listado */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Vendedor</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Zona</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Comisión</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Meta</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {vendedores.map(vendedor => (
                                        <tr key={vendedor.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{vendedor.nombre_completo}</div>
                                                <div className="text-sm text-slate-500">{vendedor.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{vendedor.zona_venta || '-'}</td>
                                            <td className="px-6 py-4 text-right text-blue-600 font-bold">{vendedor.porcentaje_comision}%</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                ${new Intl.NumberFormat('en-US').format(vendedor.meta_mensual)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleEdit(vendedor)}
                                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-bold text-sm inline-flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar
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