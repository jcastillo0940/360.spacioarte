import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [cuentas, setCuentas] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    const { data, setData, post, processing, reset, errors } = useForm({
        codigo: '',
        nombre: '',
        tipo: 'Activo',
        parent_id: '',
        permite_movimiento: true,
        saldo_inicial: 0,
        descripcion: ''
    });

    useEffect(() => {
        loadCuentas();
    }, []);

    const loadCuentas = () => {
        fetch('/api/contabilidad/cuentas')
            .then(res => res.json())
            .then(setCuentas);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/contabilidad/cuentas', {
            onSuccess: () => {
                reset();
                loadCuentas();
            }
        });
    };

    const toggleNode = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const renderCuentaTree = (cuenta, level = 0) => {
        const hasChildren = cuenta.children && cuenta.children.length > 0;
        const isExpanded = expandedNodes.has(cuenta.id);
        const paddingLeft = level * 32;

        return (
            <React.Fragment key={cuenta.id}>
                <tr className="hover:bg-slate-50 transition border-b border-slate-100">
                    <td className="px-6 py-3" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                        <div className="flex items-center gap-2">
                            {hasChildren && (
                                <button
                                    onClick={() => toggleNode(cuenta.id)}
                                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded transition"
                                >
                                    <svg className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                            {!hasChildren && <div className="w-5" />}
                            <span className="font-mono font-bold text-slate-900">{cuenta.codigo}</span>
                        </div>
                    </td>
                    <td className="px-6 py-3">
                        <span className="font-medium text-slate-900">{cuenta.nombre}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            cuenta.tipo === 'Activo' ? 'bg-blue-100 text-blue-700' :
                            cuenta.tipo === 'Pasivo' ? 'bg-red-100 text-red-700' :
                            cuenta.tipo === 'Patrimonio' ? 'bg-purple-100 text-purple-700' :
                            cuenta.tipo === 'Ingreso' ? 'bg-green-100 text-green-700' :
                            cuenta.tipo === 'Costo' ? 'bg-orange-100 text-orange-700' :
                            cuenta.tipo === 'Gasto' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                            {cuenta.tipo}
                        </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                        {cuenta.permite_movimiento ? (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                Sí
                            </span>
                        ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                No
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-900 font-bold">
                        ${new Intl.NumberFormat('en-US').format(cuenta.saldo_inicial || 0)}
                    </td>
                </tr>
                {hasChildren && isExpanded && cuenta.children.map(child => renderCuentaTree(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Catálogo de Cuentas" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Plan de Cuentas Contable
                    </h1>
                    <p className="text-slate-600 mt-2">Catálogo estructurado de cuentas</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Nueva Cuenta</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Código</label>
                                <input 
                                    type="text"
                                    value={data.codigo}
                                    onChange={e => setData('codigo', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                                    placeholder="1.1.01"
                                    required
                                />
                                {errors.codigo && <span className="text-red-500 text-xs">{errors.codigo}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre de la Cuenta</label>
                                <input 
                                    type="text"
                                    value={data.nombre}
                                    onChange={e => setData('nombre', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo</label>
                                <select 
                                    value={data.tipo}
                                    onChange={e => setData('tipo', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Pasivo">Pasivo</option>
                                    <option value="Patrimonio">Patrimonio</option>
                                    <option value="Ingreso">Ingreso</option>
                                    <option value="Costo">Costo</option>
                                    <option value="Gasto">Gasto</option>
                                    <option value="Orden">Orden</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cuenta Padre (Opcional)</label>
                                <select 
                                    value={data.parent_id}
                                    onChange={e => setData('parent_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="">Sin padre (Cuenta principal)</option>
                                    {cuentas.map(cuenta => (
                                        <option key={cuenta.id} value={cuenta.id}>
                                            {cuenta.codigo} - {cuenta.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Saldo Inicial</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={data.saldo_inicial}
                                    onChange={e => setData('saldo_inicial', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input 
                                        type="checkbox"
                                        checked={data.permite_movimiento}
                                        onChange={e => setData('permite_movimiento', e.target.checked)}
                                        className="rounded border-slate-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Permite movimiento directo</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Descripción</label>
                                <textarea 
                                    value={data.descripcion}
                                    onChange={e => setData('descripcion', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Crear Cuenta
                            </button>
                        </div>
                    </form>

                    {/* Árbol de Cuentas */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Estructura Contable</h3>
                            <button
                                onClick={() => setExpandedNodes(new Set(cuentas.map(c => c.id)))}
                                className="px-3 py-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                            >
                                Expandir todo
                            </button>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Código</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Nombre</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Tipo</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Movimiento</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuentas.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-lg font-bold">No hay cuentas registradas</p>
                                                <p className="text-sm mt-2">Comienza creando tu catálogo de cuentas</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        cuentas.map(cuenta => renderCuentaTree(cuenta))
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