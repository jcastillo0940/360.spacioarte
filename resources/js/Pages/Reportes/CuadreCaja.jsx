import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { Wallet, Banknote, CreditCard, ArrowRightLeft, Scale } from 'lucide-react';

export default function CuadreCaja({ reportData, filtros }) {
    const sesiones = reportData?.sesiones || [];
    const resumen = reportData?.resumen || {};

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

    const handleFilter = (newFilters) => {
        router.get(route('reportes.financieros.cuadre-caja'), newFilters, { preserveState: true });
    };

    const exportReport = (type) => {
        router.get(route('reportes.financieros.cuadre-caja'), { ...filtros, export: type });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cuadre de Caja" />

            <div className="max-w-7xl mx-auto py-8 space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Cuadre de Caja</h1>
                        <p className="text-slate-600 mt-2">
                            Resumen por sesion de caja con apertura, cobros, movimientos, esperado, real y diferencia.
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

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                    <Card icon={<Wallet size={24} />} label="Apertura" value={formatCurrency(resumen.total_apertura)} />
                    <Card icon={<Banknote size={24} />} label="Efectivo" value={formatCurrency(resumen.total_efectivo)} />
                    <Card icon={<CreditCard size={24} />} label="Tarjeta" value={formatCurrency(resumen.total_tarjeta)} />
                    <Card icon={<ArrowRightLeft size={24} />} label="Transferencias" value={formatCurrency(resumen.total_transferencia)} />
                    <Card
                        icon={<Scale size={24} />}
                        label="Diferencia"
                        value={formatCurrency(resumen.total_diferencia)}
                        accent={Number(resumen.total_diferencia || 0) === 0 ? 'slate' : Number(resumen.total_diferencia || 0) > 0 ? 'emerald' : 'red'}
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Sesiones de Caja</h2>
                            <p className="text-sm text-slate-500 mt-1">Detalle consolidado de cada apertura y cierre del periodo.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Caja</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Cajero</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Apertura</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Cierre</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Esperado</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Real</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sesiones.map((sesion) => (
                                    <tr key={sesion.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{sesion.caja}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{sesion.cajero}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{sesion.fecha_apertura || 'N/D'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{sesion.fecha_cierre || 'Abierta'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                sesion.estado === 'Cerrada'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {sesion.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-slate-900">{formatCurrency(sesion.esperado)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-slate-900">{formatCurrency(sesion.real)}</td>
                                        <td className={`px-6 py-4 text-sm text-right font-black ${
                                            Number(sesion.diferencia) === 0 ? 'text-slate-900' : Number(sesion.diferencia) > 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(sesion.diferencia)}
                                        </td>
                                    </tr>
                                ))}
                                {sesiones.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-bold">
                                            No hay sesiones de caja en el periodo seleccionado
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
        emerald: 'bg-emerald-600 border-emerald-700 text-white',
        red: 'bg-red-600 border-red-700 text-white',
    };

    return (
        <div className={`p-6 rounded-[2rem] border shadow-sm ${styles[accent]}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                accent === 'slate' ? 'bg-slate-100 text-slate-700' : 'bg-white/15 text-white'
            }`}>
                {icon}
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                accent === 'slate' ? 'text-slate-400' : 'text-white/80'
            }`}>
                {label}
            </p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}
