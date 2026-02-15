import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [contactos, setContactos] = useState([]);
    const [terminos, setTerminos] = useState([]);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        razon_social: '',
        tipo_identificacion: 'RUC',
        identificacion: '',
        dv: '',
        direccion: '',
        telefono: '',
        email: '',
        es_cliente: true,
        es_proveedor: false,
        payment_term_id: '',
        limite_credito: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/inventario/contactos')
            .then(res => res.json())
            .then(data => {
                setContactos(data.contactos || []);
                setTerminos(data.terminos_pago || []);
                if ((data.terminos_pago || []).length > 0 && !editingId) {
                    setData('payment_term_id', data.terminos_pago[0].id);
                }
            })
            .catch(error => {
                console.error('Error loading contactos:', error);
                setContactos([]);
                setTerminos([]);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/inventario/contactos/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    loadData();
                }
            });
        } else {
            post('/inventario/contactos', {
                onSuccess: () => {
                    reset();
                    loadData();
                }
            });
        }
    };

    const handleEdit = (contacto) => {
        setData(contacto);
        setEditingId(contacto.id);
    };

    const filteredContactos = contactos.filter(c => 
        c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
        c.identificacion.includes(search)
    );

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Contactos" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Directorio de Contactos
                    </h1>
                    <p className="text-slate-600 mt-2">Clientes y proveedores</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            {editingId ? 'Editar Contacto' : 'Nuevo Contacto'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Razón Social / Nombre</label>
                                <input 
                                    type="text"
                                    value={data.razon_social}
                                    onChange={e => setData('razon_social', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                                {errors.razon_social && <span className="text-red-500 text-xs">{errors.razon_social}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo Identificación</label>
                                <select 
                                    value={data.tipo_identificacion}
                                    onChange={e => setData('tipo_identificacion', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="RUC">RUC</option>
                                    <option value="Cedula">Cédula</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                                        {data.tipo_identificacion === 'RUC' ? 'RUC' : data.tipo_identificacion}
                                    </label>
                                    <input 
                                        type="text"
                                        value={data.identificacion}
                                        onChange={e => setData('identificacion', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                                {data.tipo_identificacion === 'RUC' && (
                                    <div className="w-20">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">DV</label>
                                        <input 
                                            type="text"
                                            maxLength="2"
                                            value={data.dv || ''}
                                            onChange={e => setData('dv', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-center"
                                        />
                                    </div>
                                )}
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
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Dirección</label>
                                <textarea 
                                    value={data.direccion || ''}
                                    onChange={e => setData('direccion', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-4">Clasificación</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input 
                                            type="checkbox"
                                            checked={data.es_cliente}
                                            onChange={e => setData('es_cliente', e.target.checked)}
                                            className="rounded border-slate-300"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Es Cliente</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input 
                                            type="checkbox"
                                            checked={data.es_proveedor}
                                            onChange={e => setData('es_proveedor', e.target.checked)}
                                            className="rounded border-slate-300"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Es Proveedor</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Términos de Pago</label>
                                <select 
                                    value={data.payment_term_id}
                                    onChange={e => setData('payment_term_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    {terminos.length === 0 && <option value="">Cargando términos...</option>}
                                    {terminos.map(term => (
                                        <option key={term.id} value={term.id}>
                                            {term.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Límite de Crédito</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={data.limite_credito}
                                    onChange={e => setData('limite_credito', e.target.value)}
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
                    <div className="xl:col-span-3 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                            <input 
                                type="text"
                                placeholder="Buscar por nombre o identificación..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Razón Social</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Identificación</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Contacto</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold uppercase">Tipo</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredContactos.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-lg font-bold">No hay contactos registrados</p>
                                                    <p className="text-sm mt-2">Comienza agregando tu primer cliente o proveedor</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredContactos.map(contacto => (
                                                <tr key={contacto.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{contacto.razon_social}</div>
                                                        <div className="text-sm text-slate-500">{contacto.payment_term?.nombre}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-slate-900">
                                                            {contacto.identificacion}
                                                            {contacto.dv && `-${contacto.dv}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-slate-600">{contacto.email || '-'}</div>
                                                        <div className="text-sm text-slate-500">{contacto.telefono || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-1 justify-center">
                                                            {contacto.es_cliente && (
                                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                    Cliente
                                                                </span>
                                                            )}
                                                            {contacto.es_proveedor && (
                                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                                    Proveedor
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleEdit(contacto)}
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
            </div>
        </AuthenticatedLayout>
    );
}