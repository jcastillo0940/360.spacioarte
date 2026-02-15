import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ auth, facturas = [], bancos = [] }) {
    // Formulario de Inertia - Sincronizado con CobroController@store
    const { data, setData, post, processing, errors } = useForm({
        facturas_ids: [],     
        bank_account_id: '',
        monto_total: 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'Transferencia',
        referencia: '',
    });

    // Lógica optimizada para seleccionar/deseleccionar facturas
    const toggleFactura = (id, saldo) => {
        let nuevosIds = data.facturas_ids.includes(id)
            ? data.facturas_ids.filter(fid => fid !== id)
            : [...data.facturas_ids, id];
        
        // Recalcular el monto total basado en la selección actual
        const nuevoMonto = facturas
            .filter(f => nuevosIds.includes(f.id))
            .reduce((sum, f) => sum + parseFloat(f.saldo_pendiente), 0);

        setData(d => ({
            ...d,
            facturas_ids: nuevosIds,
            monto_total: nuevoMonto.toFixed(2)
        }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(value || 0);
    };

    const submit = (e) => {
        e.preventDefault();
        // El controlador espera 'facturas_ids' como array
        post(route('cobros.store'));
    };

    return (
        <AuthenticatedLayout 
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Registrar Recibo de Pago</h2>}
        >
            <Head title="Nuevo Cobro" />

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">
                    
                    {/* SECCIÓN 1: Selección de Facturas */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase text-sm tracking-wider">1. Seleccione facturas pendientes</h3>
                            <span className="bg-blue-500 px-3 py-1 rounded-full text-xs font-black">
                                {data.facturas_ids.length} Seleccionadas
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sel.</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Factura</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Saldo Pendiente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {facturas.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-10 text-center text-slate-500 italic">
                                                No hay facturas con saldo pendiente actualmente.
                                            </td>
                                        </tr>
                                    ) : (
                                        facturas.map(f => (
                                            <tr 
                                                key={f.id} 
                                                className={`transition cursor-pointer ${data.facturas_ids.includes(f.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                                onClick={() => toggleFactura(f.id, f.saldo_pendiente)}
                                            >
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
                                                        onChange={() => toggleFactura(f.id, f.saldo_pendiente)}
                                                        checked={data.facturas_ids.includes(f.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-slate-900">{f.numero_factura}</td>
                                                <td className="px-6 py-4 text-slate-700">{f.cliente?.razon_social}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(f.saldo_pendiente)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECCIÓN 2: Resumen y Datos del Pago */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Total Visual Card */}
                        <div className="bg-blue-600 rounded-lg p-6 shadow-md text-white md:col-span-1 flex flex-col justify-center">
                            <div className="text-sm font-bold uppercase opacity-80">Monto Total a Recibir</div>
                            <div className="text-4xl font-black mt-2">{formatCurrency(data.monto_total)}</div>
                            <div className="text-xs mt-2 italic text-blue-100">
                                Liquidación total de {data.facturas_ids.length} documento(s)
                            </div>
                        </div>

                        {/* Formulario de Pago */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 md:col-span-2 grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-1">Banco de Destino</label>
                                <select 
                                    className="w-full border-slate-200 rounded-lg focus:ring-blue-500"
                                    value={data.bank_account_id}
                                    onChange={e => setData('bank_account_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Seleccionar Banco --</option>
                                    {bancos.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.nombre_banco} (Saldo: {formatCurrency(b.saldo_actual)})
                                        </option>
                                    ))}
                                </select>
                                {errors.bank_account_id && <p className="text-red-500 text-xs mt-1 font-bold">{errors.bank_account_id}</p>}
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-1">Método de Pago</label>
                                <select 
                                    className="w-full border-slate-200 rounded-lg focus:ring-blue-500"
                                    value={data.metodo_pago}
                                    onChange={e => setData('metodo_pago', e.target.value)}
                                >
                                    <option value="Transferencia">Transferencia / ACH</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-1">Referencia / # Documento</label>
                                <input 
                                    type="text" 
                                    className="w-full border-slate-200 rounded-lg focus:ring-blue-500"
                                    value={data.referencia}
                                    onChange={e => setData('referencia', e.target.value)}
                                    placeholder="Ej: CHQ-505 o ACH-9921"
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-1">Fecha de Recibo</label>
                                <input 
                                    type="date" 
                                    className="w-full border-slate-200 rounded-lg focus:ring-blue-500"
                                    value={data.fecha_pago}
                                    onChange={e => setData('fecha_pago', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={processing || data.facturas_ids.length === 0}
                        className="w-full bg-slate-900 text-white py-4 rounded-lg font-black text-lg hover:bg-slate-800 transition shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {processing ? 'Registrando Movimiento...' : `Confirmar Cobro de ${formatCurrency(data.monto_total)}`}
                    </button>
                    {errors.monto_total && <p className="text-red-600 text-center font-bold">{errors.monto_total}</p>}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}