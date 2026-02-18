import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';

export default function RentabilidadItems({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.ventas.rentabilidad'), newFilters, { preserveState: true });
    };

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

    return (
        <AuthenticatedLayout>
            <Head title="Rentabilidad por Ítem" />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Rentabilidad por Ítem</h1>
                    <p className="text-slate-600 mt-2">Cruce de ingresos vs Costo Promedio Ponderado para determinar utilidades reales.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Producto</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Cant Vendida</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Venta Total</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Costo Prom</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Costo Total</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Utilidad</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Margen %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900">{item.nombre}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{item.codigo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">{item.cantidad}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{format(item.venta_total)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-400 text-right">{format(item.costo_promedio)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">{format(item.costo_total)}</td>
                                        <td className={`px-6 py-4 text-sm font-black text-right ${item.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {format(item.utilidad)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.margen > 30 ? 'bg-green-100 text-green-700' :
                                                    item.margen > 10 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {item.margen.toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white font-black">
                                <tr>
                                    <td className="px-6 py-6 uppercase tracking-widest text-xs">Consolidado Total</td>
                                    <td className="px-6 py-6 text-right">
                                        {reportData.reduce((acc, i) => acc + parseFloat(i.cantidad), 0)}
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        {format(reportData.reduce((acc, i) => acc + parseFloat(i.venta_total), 0))}
                                    </td>
                                    <td className="px-6 py-6"></td>
                                    <td className="px-6 py-6 text-right opacity-60">
                                        {format(reportData.reduce((acc, i) => acc + parseFloat(i.costo_total), 0))}
                                    </td>
                                    <td className="px-6 py-6 text-right text-green-400 text-xl">
                                        {format(reportData.reduce((acc, i) => acc + parseFloat(i.utilidad), 0))}
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        {(reportData.reduce((acc, i) => acc + i.utilidad, 0) / reportData.reduce((acc, i) => acc + i.venta_total, 1) * 100).toFixed(2)}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
