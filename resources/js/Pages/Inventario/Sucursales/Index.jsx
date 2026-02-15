import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [sucursales, setSucursales] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        contacto_id: '',
        codigo: '',
        nombre: '',
        direccion: '',
        telefono: '',
        encargado: '',
        email: '',
        latitud: '',
        longitud: '',
        notas: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([
            fetch('/api/inventario/sucursales').then(res => res.json()),
            fetch('/api/inventario/contactos').then(res => res.json())
        ]).then(([sucursalesData, contactosData]) => {
            setSucursales(sucursalesData || []);
            setClientes((contactosData.contactos || []).filter(c => c.es_cliente));
        }).catch(error => {
            console.error('Error loading data:', error);
            setSucursales([]);
            setClientes([]);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/inventario/sucursales/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    loadData();
                }
            });
        } else {
            post('/inventario/sucursales', {
                onSuccess: () => {
                    reset();
                    loadData();
                }
            });
        }
    };

    const handleEdit = (sucursal) => {
        setData(sucursal);
        setEditingId(sucursal.id);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Sucursales" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Gestión de Sucursales
                    </h1>
                    <p className="text-slate-600 mt-2">Puntos de venta y entrega de clientes</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cliente</label>
                                <select 
                                    value={data.contacto_id}
                                    onChange={e => setData('contacto_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                    disabled={editingId}
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.id} value={cliente.id}>
                                            {cliente.razon_social}
                                        </option>
                                    ))}
                                </select>
                                {errors.contacto_id && <span className="text-red-500 text-xs">{errors.contacto_id}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Código</label>
                                <input 
                                    type="text"
                                    value={data.codigo}
                                    onChange={e => setData('codigo', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                                    placeholder="SUC-001"
                                    required
                                />
                                {errors.codigo && <span className="text-red-500 text-xs">{errors.codigo}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre Sucursal</label>
                                <input 
                                    type="text"
                                    value={data.nombre}
                                    onChange={e => setData('nombre', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    placeholder="Sucursal Centro"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Dirección</label>
                                <textarea 
                                    value={data.direccion || ''}
                                    onChange={e => setData('direccion', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Teléfono</label>
                                    <input 
                                        type="text"
                                        value={data.telefono || ''}
                                        onChange={e => setData('telefono', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label>
                                    <input 
                                        type="email"
                                        value={data.email || ''}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Encargado</label>
                                <input 
                                    type="text"
                                    value={data.encargado || ''}
                                    onChange={e => setData('encargado', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Latitud</label>
                                    <input 
                                        type="number"
                                        step="0.00000001"
                                        value={data.latitud || ''}
                                        onChange={e => setData('latitud', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="9.0000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Longitud</label>
                                    <input 
                                        type="number"
                                        step="0.00000001"
                                        value={data.longitud || ''}
                                        onChange={e => setData('longitud', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="-79.0000000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Notas</label>
                                <textarea 
                                    value={data.notas || ''}
                                    onChange={e => setData('notas', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
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
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Código</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Sucursal</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Cliente</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Encargado</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sucursales.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <p className="text-lg font-bold">No hay sucursales registradas</p>
                                                <p className="text-sm mt-2">Comienza agregando la primera sucursal de un cliente</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sucursales.map(sucursal => (
                                            <tr key={sucursal.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-slate-900">{sucursal.codigo}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{sucursal.nombre}</div>
                                                    <div className="text-sm text-slate-500">{sucursal.direccion}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-900">{sucursal.contacto?.razon_social}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-900">{sucursal.encargado || '-'}</div>
                                                    <div className="text-sm text-slate-500">{sucursal.telefono || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        sucursal.activo 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {sucursal.activo ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleEdit(sucursal)}
                                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-bold text-sm inline-flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}