import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [impuestos, setImpuestos] = useState([]);
    const [terminos, setTerminos] = useState([]);
    const [activeTab, setActiveTab] = useState('taxes');

    const taxForm = useForm({
        nombre: '',
        tasa: '',
        codigo_dgi: '',
        es_exento: false
    });

    const termForm = useForm({
        nombre: '',
        dias_vencimiento: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/configuracion/parametros')
            .then(res => res.json())
            .then(data => {
                setImpuestos(data.impuestos);
                setTerminos(data.terminos_pago);
            });
    };

    const submitTax = (e) => {
        e.preventDefault();
        taxForm.post('/configuracion/parametros/impuestos', {
            onSuccess: () => {
                taxForm.reset();
                loadData();
            }
        });
    };

    const submitTerm = (e) => {
        e.preventDefault();
        termForm.post('/configuracion/parametros/terminos-pago', {
            onSuccess: () => {
                termForm.reset();
                loadData();
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Parametrización" />
            
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Parametrización del Sistema</h1>
                    <p className="text-slate-600 mt-2">Impuestos y términos de pago</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('taxes')}
                        className={`px-6 py-3 rounded-t-lg font-bold transition flex items-center gap-2 ${
                            activeTab === 'taxes'
                                ? 'bg-white text-blue-600 border-b-4 border-blue-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Impuestos
                    </button>
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`px-6 py-3 rounded-t-lg font-bold transition flex items-center gap-2 ${
                            activeTab === 'terms'
                                ? 'bg-white text-blue-600 border-b-4 border-blue-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Términos de Pago
                    </button>
                </div>

                {/* Impuestos Tab */}
                {activeTab === 'taxes' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <form onSubmit={submitTax} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Nuevo Impuesto</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre</label>
                                    <input 
                                        type="text"
                                        value={taxForm.data.nombre}
                                        onChange={e => taxForm.setData('nombre', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="ITBMS"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tasa (%)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={taxForm.data.tasa}
                                        onChange={e => taxForm.setData('tasa', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Código DGI</label>
                                    <input 
                                        type="text"
                                        value={taxForm.data.codigo_dgi}
                                        onChange={e => taxForm.setData('codigo_dgi', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <label className="flex items-center gap-2">
                                    <input 
                                        type="checkbox"
                                        checked={taxForm.data.es_exento}
                                        onChange={e => taxForm.setData('es_exento', e.target.checked)}
                                        className="rounded border-slate-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Exento</span>
                                </label>
                                <button 
                                    type="submit"
                                    disabled={taxForm.processing}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    Agregar
                                </button>
                            </div>
                        </form>

                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Nombre</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Tasa</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Código DGI</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {impuestos.map(tax => (
                                        <tr key={tax.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{tax.nombre}</td>
                                            <td className="px-6 py-4 text-right text-blue-600 font-bold">{tax.tasa}%</td>
                                            <td className="px-6 py-4 text-slate-600">{tax.codigo_dgi || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    tax.es_exento 
                                                        ? 'bg-yellow-100 text-yellow-700' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {tax.es_exento ? 'Exento' : 'Activo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Términos de Pago Tab */}
                {activeTab === 'terms' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <form onSubmit={submitTerm} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Nuevo Término</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre</label>
                                    <input 
                                        type="text"
                                        value={termForm.data.nombre}
                                        onChange={e => termForm.setData('nombre', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="30 días"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Días de Vencimiento</label>
                                    <input 
                                        type="number"
                                        value={termForm.data.dias_vencimiento}
                                        onChange={e => termForm.setData('dias_vencimiento', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={termForm.processing}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    Agregar
                                </button>
                            </div>
                        </form>

                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Término</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Días</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {terminos.map(term => (
                                        <tr key={term.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{term.nombre}</td>
                                            <td className="px-6 py-4 text-right text-blue-600 font-bold">{term.dias_vencimiento}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    Activo
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}