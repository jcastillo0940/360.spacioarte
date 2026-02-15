import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        nombre: '',
        apellido: '',
        cedula: '',
        email: '',
        telefono: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        tipo_contrato: 'Indefinido',
        salario_base: '',
        puesto_id: null,
        banco_nombre: '',
        banco_cuenta: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/rrhh/empleados')
            .then(res => res.json())
            .then(data => {
                setEmpleados(data);
                setLoading(false);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/rrhh/empleados/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    loadData();
                }
            });
        } else {
            post('/rrhh/empleados', {
                onSuccess: () => {
                    reset();
                    loadData();
                }
            });
        }
    };

    const handleEdit = (empleado) => {
        setData(empleado);
        setEditingId(empleado.id);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Personal" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Gestión de Personal
                    </h1>
                    <p className="text-slate-600 mt-2">Administración de empleados y colaboradores</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Total Empleados</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{empleados.length}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Activos</div>
                        <div className="text-3xl font-black text-green-600 mt-2">
                            {empleados.filter(e => e.activo).length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Permanentes</div>
                        <div className="text-3xl font-black text-blue-600 mt-2">
                            {empleados.filter(e => e.tipo_contrato === 'Indefinido').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                        <div className="text-sm font-bold text-slate-500 uppercase">Nómina Mensual</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">
                            {formatCurrency(empleados.reduce((sum, e) => sum + parseFloat(e.salario_base || 0), 0))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre</label>
                                    <input 
                                        type="text"
                                        value={data.nombre}
                                        onChange={e => setData('nombre', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Apellido</label>
                                    <input 
                                        type="text"
                                        value={data.apellido}
                                        onChange={e => setData('apellido', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cédula</label>
                                <input 
                                    type="text"
                                    value={data.cedula}
                                    onChange={e => setData('cedula', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    placeholder="X-XXX-XXXX"
                                    required
                                />
                                {errors.cedula && <span className="text-red-500 text-xs">{errors.cedula}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label>
                                <input 
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo de Contrato</label>
                                <select 
                                    value={data.tipo_contrato}
                                    onChange={e => setData('tipo_contrato', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="Indefinido">Indefinido</option>
                                    <option value="Definido">Definido</option>
                                    <option value="Servicios Profesionales">Servicios Profesionales</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Salario Base</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={data.salario_base}
                                        onChange={e => setData('salario_base', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Ingreso</label>
                                    <input 
                                        type="date"
                                        value={data.fecha_ingreso}
                                        onChange={e => setData('fecha_ingreso', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
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
                    <div className="xl:col-span-3 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-slate-600 mt-4">Cargando empleados...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Empleado</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Cédula</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase">Contrato</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold uppercase">Salario</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                            <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {empleados.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-lg font-bold">No hay empleados registrados</p>
                                                    <p className="text-sm mt-2">Comienza agregando tu primer empleado</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            empleados.map(emp => (
                                                <tr key={emp.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{emp.nombre} {emp.apellido}</div>
                                                        <div className="text-sm text-slate-500">Ingreso: {new Date(emp.fecha_ingreso).toLocaleDateString('es-PA')}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-slate-900">{emp.cedula}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            emp.tipo_contrato === 'Servicios Profesionales' 
                                                                ? 'bg-orange-100 text-orange-700' 
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {emp.tipo_contrato}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-bold text-blue-600">
                                                            {formatCurrency(emp.salario_base)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`w-3 h-3 rounded-full inline-block ${
                                                            emp.activo ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleEdit(emp)}
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
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}