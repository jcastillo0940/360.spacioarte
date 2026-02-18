import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

export default function IngresosGastos({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.admin.ingresos-gastos'), newFilters, { preserveState: true });
    };

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

    return (
        <AuthenticatedLayout>
            <Head title="Ingresos vs Gastos" />

            <div className="max-w-5xl mx-auto py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black text-slate-900">Ingresos vs Gastos Operativos</h1>
                    <p className="text-slate-600 mt-2">Visión global del flujo operativo del negocio.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Ingresos</p>
                        <p className="text-3xl font-black text-slate-900">{format(reportData.ingresos)}</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                            <TrendingDown size={24} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Gastos (Compras)</p>
                        <p className="text-3xl font-black text-slate-900">{format(reportData.gastos)}</p>
                    </div>

                    <div className={`p-8 rounded-[2rem] border shadow-lg ${reportData.balance >= 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white'}`}>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                            <Scale size={24} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Resultado Operativo</p>
                        <p className="text-3xl font-black">{format(reportData.balance)}</p>
                    </div>
                </div>

                <div className="mt-12 bg-slate-50 p-10 rounded-3xl border border-slate-100">
                    <h3 className="font-black text-slate-900 mb-4">Nota Informativa</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Este reporte resume el total facturado en ventas vs el total de facturas de compra recibidas.
                        No incluye movimientos de tesorería puros (transferencias entre bancos) ni ajustes contables de depreciación.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
