import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { ShieldCheck, TrendingUp, TrendingDown, Landmark } from 'lucide-react';

export default function Impuestos({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.contables.impuestos'), newFilters, { preserveState: true });
    };

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

    return (
        <AuthenticatedLayout>
            <Head title="Reporte de Impuestos" />

            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Impuestos y Retenciones</h1>
                    <p className="text-slate-600 mt-2">Resumen fiscal de ITBMS generado en ventas vs acreditable por compras.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                {/* Resumen Fiscal */}
                <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Neto ITBMS a Declarar</p>
                        <h2 className="text-5xl font-black">{format(reportData.neto_pagar)}</h2>
                        <div className="mt-6 flex items-center gap-4 text-sm font-bold opacity-80">
                            <Landmark size={18} />
                            <span>Periodo Fiscal: {filtros.fecha_inicio} al {filtros.fecha_fin}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ITBMS VENTAS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Débito Fiscal (Ventas)</h3>
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Base Imponible</span>
                                <span className="font-bold text-slate-900">{format(reportData.ventas?.base)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-900 font-black">ITBMS Total</span>
                                <span className="font-black text-green-600 underline decoration-2">{format(reportData.ventas?.impuesto)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ITBMS COMPRAS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Crédito Fiscal (Compras)</h3>
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Base Imponible</span>
                                <span className="font-bold text-slate-900">{format(reportData.compras?.base)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-900 font-black">ITBMS Total</span>
                                <span className="font-black text-red-600 underline decoration-2">{format(reportData.compras?.impuesto)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
