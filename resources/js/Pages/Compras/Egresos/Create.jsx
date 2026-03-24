import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
    const { url } = usePage();
    const [facturas, setFacturas] = useState([]);
    const [bancos, setBancos] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        factura_compra_id: '',
        bank_account_id: '',
        monto_pagado: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'Transferencia',
        referencia: '',
        notas: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const facturaId = params.get('factura');

        if (facturaId) {
            setData('factura_compra_id', facturaId);
        }
    }, [url]);

    const loadData = () => {
        fetch('/api/compras/egresos/datos')
            .then(res => res.json())
            .then(data => {
                setFacturas(data.facturas);
                setBancos(data.bancos);
            });
    };

    const facturaSeleccionada = facturas.find(f => f.id == data.factura_compra_id);
    const saldoSeleccionado = Number(facturaSeleccionada?.saldo_pendiente || 0);
    const bancoSeleccionado = bancos.find(b => b.id == data.bank_account_id);

    const submit = (e) => {
        e.preventDefault();
        post(route('compras.pagos.store'));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Registrar Egreso" />
            
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Nuevo Egreso / Pago a Proveedor
                    </h1>
                    <p className="text-slate-600 mt-2">Registrar pago de cuentas por pagar</p>
                </div>

                <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Factura de Compra Pendiente</label>
                        <select 
                            value={data.factura_compra_id}
                            onChange={e => setData('factura_compra_id', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                            required
                        >
                            <option value="">-- Seleccione una factura --</option>
                            {facturas.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.numero_factura_proveedor} - {f.proveedor.razon_social} (Saldo: {formatCurrency(f.saldo_pendiente)})
                                </option>
                            ))}
                        </select>
                        {errors.factura_compra_id && <span className="text-red-500 text-xs">{errors.factura_compra_id}</span>}
                    </div>

                    {facturaSeleccionada && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 flex justify-between items-center">
                            <div>
                                <div className="text-orange-700 font-bold">Saldo a Pagar:</div>
                                <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">
                                    {facturaSeleccionada.proveedor?.razon_social}
                                </div>
                            </div>
                            <span className="text-2xl font-black text-orange-800">{formatCurrency(facturaSeleccionada.saldo_pendiente)}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Pagar desde:</label>
                            <select 
                                value={data.bank_account_id}
                                onChange={e => setData('bank_account_id', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                required
                            >
                                <option value="">-- Seleccione Banco --</option>
                                {bancos.map(b => (
                                    <option key={b.id} value={b.id}>{b.nombre_banco} (***{b.numero_cuenta.slice(-4)})</option>
                                ))}
                            </select>
                            {bancoSeleccionado && (
                                <div className="mt-2 text-xs font-bold text-slate-500">
                                    Saldo disponible: {formatCurrency(bancoSeleccionado.saldo_actual)}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Monto a Pagar ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={data.monto_pagado}
                                onChange={e => setData('monto_pagado', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                max={saldoSeleccionado || undefined}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Método de Pago</label>
                            <select 
                                value={data.metodo_pago}
                                onChange={e => setData('metodo_pago', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                            >
                                <option value="Transferencia">Transferencia</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="ACH">ACH</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Referencia / # Transacción</label>
                            <input 
                                type="text"
                                value={data.referencia}
                                onChange={e => setData('referencia', e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                placeholder="CHK-8829"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Notas</label>
                        <textarea 
                            value={data.notas}
                            onChange={e => setData('notas', e.target.value)}
                            rows="2"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={
                            processing ||
                            !data.factura_compra_id ||
                            Number(data.monto_pagado || 0) <= 0 ||
                            Number(data.monto_pagado || 0) > saldoSeleccionado ||
                            Number(data.monto_pagado || 0) > Number(bancoSeleccionado?.saldo_actual || Infinity)
                        }
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-slate-400 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {processing ? 'Procesando...' : 'Confirmar Pago'}
                    </button>
                    {facturaSeleccionada && Number(data.monto_pagado || 0) > saldoSeleccionado && (
                        <div className="text-sm font-bold text-red-600">
                            El monto a pagar no puede exceder el saldo pendiente de la factura.
                        </div>
                    )}
                    {bancoSeleccionado && Number(data.monto_pagado || 0) > Number(bancoSeleccionado.saldo_actual || 0) && (
                        <div className="text-sm font-bold text-red-600">
                            El monto a pagar no puede exceder el saldo disponible en la cuenta bancaria seleccionada.
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
