import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { ArrowDownCircle, ArrowUpCircle, Landmark, Wallet } from 'lucide-react';

export default function FlujoCaja({ reportData, filtros }) {
    const movimientos = reportData || [];

    const handleFilter = (newFilters) => {
        router.get(route('reportes.financieros.caja'), newFilters, { preserveState: true });
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    const ingresos = movimientos
        .filter((movimiento) => movimiento.tipo === 'Ingreso')
        .reduce((acc, movimiento) => acc + Number(movimiento.monto || 0), 0);

    const egresos = movimientos
        .filter((movimiento) => movimiento.tipo === 'Egreso')
        .reduce((acc, movimiento) => acc + Number(movimiento.monto || 0), 0);

    const neto = ingresos - egresos;

    return (
        <AuthenticatedLayout>
            <Head title="Flujo de Caja" />

            <div className="max-w-7xl mx-auto py-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Flujo de Caja</h1>
                    <p className="text-slate-600 mt-2">
                        Movimientos bancarios del periodo para revisar liquidez, ingresos, egresos y tesoreria.
                    </p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                            <ArrowDownCircle size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ingresos</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(ingresos)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                            <ArrowUpCircle size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Egresos</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(egresos)}</p>
                    </div>

                    <div className={`p-6 rounded-[2rem] border shadow-sm ${neto >= 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white'}`}>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                            <Wallet size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Neto del Periodo</p>
                        <p className="text-2xl font-black">{formatCurrency(neto)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900">Movimientos Bancarios</h2>
                        <p className="text-sm text-slate-500 mt-1">Cada registro proviene del libro de bancos del sistema.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Banco</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Referencia</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Descripcion</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movimientos.map((movimiento) => (
                                    <tr key={movimiento.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm text-slate-500">{movimiento.fecha}</td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                                                <Landmark size={14} className="text-slate-400" />
                                                {movimiento.banco}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase ${movimiento.tipo === 'Ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {movimiento.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-blue-600">{movimiento.referencia || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{movimiento.descripcion}</td>
                                        <td className={`px-6 py-4 text-sm text-right font-black ${movimiento.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                            {movimiento.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(movimiento.monto)}
                                        </td>
                                    </tr>
                                ))}
                                {movimientos.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">
                                            No hay movimientos bancarios en el periodo seleccionado
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
