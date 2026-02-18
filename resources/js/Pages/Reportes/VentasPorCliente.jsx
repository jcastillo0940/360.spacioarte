import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';

export default function VentasPorCliente({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.ventas.clientes'), newFilters, { preserveState: true });
    };

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

    return (
        <AuthenticatedLayout>
            <Head title="Ventas por Cliente" />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Ranking de Ventas por Cliente</h1>
                    <p className="text-slate-600 mt-2">Seguimiento de los clientes con mayor volumen transaccional.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Identificación</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">N° Facturas</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Monto Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm font-black text-slate-900">{item.cliente}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-400">{item.identificacion}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-600 text-center">{item.total_facturas}</td>
                                    <td className="px-6 py-4 text-sm font-black text-blue-600 text-right">{format(item.total_ventas)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
