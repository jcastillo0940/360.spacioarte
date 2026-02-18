import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [settings, setSettings] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const { data, setData, post, processing } = useForm({
        razon_social: '',
        ruc: '',
        dv: '',
        direccion: '',
        telefono: '',
        email: '',
        itbms_porcentaje: 7,
        factura_serie: 'FAC',
        factura_inicio: 1,
        cta_inventario_id: '',
        cta_recepcion_transitoria_id: '',
        cta_itbms_id: '',
        cta_itbms_compras_id: '',
        cta_cxp_id: '',
        logo: null
    });

    useEffect(() => {
        // Cargar Configuración
        fetch(route('api.settings.index'))
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setData(prev => ({ ...prev, ...data }));
            });

        // Cargar Cuentas Contables
        fetch('/api/contabilidad/cuentas?flat=1')
            .then(res => res.json())
            .then(data => {
                setAccounts(data || []);
            });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.update'), {
            onSuccess: () => alert('Configuración actualizada')
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configuración del Sistema" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Configuración General</h1>
                    <p className="text-slate-600 mt-2">Datos fiscales y parámetros del sistema</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {/* Información Fiscal */}
                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Información Fiscal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Razón Social</label>
                                    <input
                                        type="text"
                                        value={data.razon_social}
                                        onChange={e => setData('razon_social', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="Empresa S.A."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">RUC</label>
                                    <input
                                        type="text"
                                        value={data.ruc}
                                        onChange={e => setData('ruc', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">DV</label>
                                    <input
                                        type="text"
                                        maxLength="2"
                                        value={data.dv}
                                        onChange={e => setData('dv', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Datos de Contacto
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Teléfono</label>
                                    <input
                                        type="text"
                                        value={data.telefono}
                                        onChange={e => setData('telefono', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
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
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Dirección</label>
                                    <textarea
                                        value={data.direccion}
                                        onChange={e => setData('direccion', e.target.value)}
                                        rows="2"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Facturación */}
                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Parámetros de Facturación
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Serie</label>
                                    <input
                                        type="text"
                                        value={data.factura_serie}
                                        onChange={e => setData('factura_serie', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Correlativo Inicial</label>
                                    <input
                                        type="number"
                                        value={data.factura_inicio}
                                        onChange={e => setData('factura_inicio', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ITBMS (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.itbms_porcentaje}
                                        onChange={e => setData('itbms_porcentaje', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Configuración Contable */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Enlace de Cuentas Contables
                            </h2>
                            <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                                Configura las cuentas necesarias para que el sistema genere los asientos contables automáticos en compras y recepciones.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta de Inventario</label>
                                    <select
                                        value={data.cta_inventario_id || ''}
                                        onChange={e => setData('cta_inventario_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta Puente (Recepción)</label>
                                    <select
                                        value={data.cta_recepcion_transitoria_id || ''}
                                        onChange={e => setData('cta_recepcion_transitoria_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta ITBMS por Pagar (Ventas)</label>
                                    <select
                                        value={data.cta_itbms_id || ''}
                                        onChange={e => setData('cta_itbms_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta ITBMS por Cobrar (Compras)</label>
                                    <select
                                        value={data.cta_itbms_compras_id || ''}
                                        onChange={e => setData('cta_itbms_compras_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta por Pagar (CXP)</label>
                                    <select
                                        value={data.cta_cxp_id || ''}
                                        onChange={e => setData('cta_cxp_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-8 py-4 flex justify-end gap-4 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {processing ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}