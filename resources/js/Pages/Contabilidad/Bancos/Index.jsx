import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [bancos, setBancos] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        nombre_banco: '',
        numero_cuenta: '',
        tipo_cuenta: 'Ahorros',
        moneda: 'USD',
        saldo_inicial: 0,
        account_id: ''
    });

    const transferForm = useForm({
        from_id: '',
        to_id: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/contabilidad/bancos')
            .then(res => res.json())
            .then(data => {
                setBancos(data.bancos);
                setAccounts(data.accounts);
                if (data.accounts.length > 0) {
                    setData('account_id', data.accounts[0].id);
                }
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/contabilidad/bancos', {
            onSuccess: () => {
                reset();
                loadData();
            }
        });
    };

    const handleTransfer = (e) => {
        e.preventDefault();
        transferForm.post('/contabilidad/bancos/transferir', {
            onSuccess: () => {
                transferForm.reset();
                setShowTransferModal(false);
                loadData();
            }
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Bancos" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Tesorería y Bancos
                            </h1>
                            <p className="text-slate-600 mt-2">Control de cuentas bancarias y movimientos</p>
                        </div>
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Transferir
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Nueva Cuenta</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre del Banco</label>
                                <input 
                                    type="text"
                                    value={data.nombre_banco}
                                    onChange={e => setData('nombre_banco', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    placeholder="Banco General"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Número de Cuenta</label>
                                <input 
                                    type="text"
                                    value={data.numero_cuenta}
                                    onChange={e => setData('numero_cuenta', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo de Cuenta</label>
                                <select 
                                    value={data.tipo_cuenta}
                                    onChange={e => setData('tipo_cuenta', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="Ahorros">Ahorros</option>
                                    <option value="Corriente">Corriente</option>
                                    <option value="Caja Chica">Caja Chica</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cuenta Contable</label>
                                <select 
                                    value={data.account_id}
                                    onChange={e => setData('account_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.codigo} - {acc.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Moneda</label>
                                    <select 
                                        value={data.moneda}
                                        onChange={e => setData('moneda', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="PAB">PAB</option>
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
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Registrar Cuenta
                            </button>
                        </div>
                    </form>

                    {/* Listado de Bancos */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bancos.length === 0 ? (
                            <div className="md:col-span-2 bg-white p-12 rounded-lg shadow-sm border border-slate-200 text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <p className="text-lg font-bold text-slate-900">No hay cuentas bancarias</p>
                                <p className="text-sm text-slate-500 mt-2">Registra tu primera cuenta bancaria</p>
                            </div>
                        ) : (
                            bancos.map(banco => (
                                <div key={banco.id} className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg shadow-lg text-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold">{banco.nombre_banco}</h3>
                                            <p className="text-sm text-slate-300">{banco.tipo_cuenta}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-500 rounded text-xs font-bold">
                                            {banco.moneda}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <p className="text-xs text-slate-400 mb-1">Número de Cuenta</p>
                                        <p className="font-mono text-sm">{banco.numero_cuenta}</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-700">
                                        <p className="text-xs text-slate-400 mb-1">Saldo Disponible</p>
                                        <p className="text-3xl font-black">
                                            {formatCurrency(banco.saldo_actual)}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition">
                                            Ver Movimientos
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Transferencia */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Transferencia entre Cuentas</h3>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Desde Cuenta</label>
                                <select 
                                    value={transferForm.data.from_id}
                                    onChange={e => transferForm.setData('from_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {bancos.map(banco => (
                                        <option key={banco.id} value={banco.id}>
                                            {banco.nombre_banco} - {formatCurrency(banco.saldo_actual)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Hacia Cuenta</label>
                                <select 
                                    value={transferForm.data.to_id}
                                    onChange={e => transferForm.setData('to_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {bancos.filter(b => b.id != transferForm.data.from_id).map(banco => (
                                        <option key={banco.id} value={banco.id}>
                                            {banco.nombre_banco}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Monto</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={transferForm.data.monto}
                                    onChange={e => transferForm.setData('monto', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={transferForm.processing}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    Transferir
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}