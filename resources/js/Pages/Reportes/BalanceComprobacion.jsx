import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { Scale, BookOpen, ArrowDownUp, Landmark } from 'lucide-react';

export default function BalanceComprobacion({ reportData, filtros }) {
    const cuentas = reportData?.cuentas || [];
    const resumen = reportData?.resumen || {};

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

    const handleFilter = (newFilters) => {
        router.get(route('reportes.contabilidad.balance-comprobacion'), newFilters, { preserveState: true });
    };

    const exportReport = (type) => {
        router.get(route('reportes.contabilidad.balance-comprobacion'), { ...filtros, export: type });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Balance de Comprobación" />

            <div className="max-w-7xl mx-auto py-8 space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Balance de Comprobación</h1>
                        <p className="text-slate-600 mt-2">
                            Saldos iniciales, movimientos del periodo y saldo final por cuenta contable.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => exportReport('pdf')}
                            className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest"
                        >
                            Exportar PDF
                        </button>
                        <button
                            onClick={() => exportReport('csv')}
                            className="px-5 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-black uppercase tracking-widest"
                        >
                            Exportar CSV
                        </button>
                    </div>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Card icon={<BookOpen size={24} />} label="Saldo Inicial" value={formatCurrency(resumen.saldo_inicial)} />
                    <Card icon={<ArrowDownUp size={24} />} label="Débitos Periodo" value={formatCurrency(resumen.debitos_periodo)} />
                    <Card icon={<Landmark size={24} />} label="Créditos Periodo" value={formatCurrency(resumen.creditos_periodo)} />
                    <Card icon={<Scale size={24} />} label="Saldo Final" value={formatCurrency(resumen.saldo_final)} accent="slate" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900">Cuentas Contables</h2>
                        <p className="text-sm text-slate-500 mt-1">Vista consolidada para validación del mayor y cierres contables.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Código</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Cuenta</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Saldo Inicial</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Débitos</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Créditos</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Saldo Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cuentas.map((cuenta) => (
                                    <tr key={cuenta.codigo} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm font-black text-blue-700">{cuenta.codigo}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{cuenta.nombre}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{cuenta.tipo}</td>
                                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-900">{formatCurrency(cuenta.saldo_inicial)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-mono text-emerald-600">{formatCurrency(cuenta.debitos_periodo)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-mono text-red-600">{formatCurrency(cuenta.creditos_periodo)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-black font-mono text-slate-900">{formatCurrency(cuenta.saldo_final)}</td>
                                    </tr>
                                ))}
                                {cuentas.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                                            No hay movimientos contables en el periodo seleccionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Card({ icon, label, value, accent = 'slate' }) {
    const styles = {
        slate: 'bg-white border-slate-200 text-slate-900',
    };

    return (
        <div className={`p-6 rounded-[2rem] border shadow-sm ${styles[accent]}`}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-slate-100 text-slate-700">
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">
                {label}
            </p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}
