import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';

export default function VentasPorItem({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.ventas.items'), newFilters, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ventas por Ítem" />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Ventas por Ítem</h1>
                    <p className="text-slate-600 mt-2">Detalle de productos y servicios más vendidos en el periodo.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Código</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Producto / Servicio</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Cantidad</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Total Ventas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-500">{item.codigo}</td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-900">{item.nombre}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">
                                        {new Intl.NumberFormat('en-US').format(item.cantidad_total)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-blue-600 text-right">
                                        ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(item.total_ventas)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-black text-slate-900">
                            <tr>
                                <td colSpan="2" className="px-6 py-4 text-right text-xs uppercase tracking-widest">Totales</td>
                                <td className="px-6 py-4 text-right">
                                    {new Intl.NumberFormat('en-US').format(reportData.reduce((acc, i) => acc + parseFloat(i.cantidad_total), 0))}
                                </td>
                                <td className="px-6 py-4 text-right text-blue-600 text-lg">
                                    ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(reportData.reduce((acc, i) => acc + parseFloat(i.total_ventas), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
