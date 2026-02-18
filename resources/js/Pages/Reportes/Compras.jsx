import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';

export default function Compras({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.admin.compras'), newFilters, { preserveState: true });
    };

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

    return (
        <AuthenticatedLayout>
            <Head title="Reporte de Compras" />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Historial de Compras</h1>
                    <p className="text-slate-600 mt-2">Detalle de facturas de proveedores recibidas en el periodo.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Factura Prov.</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Proveedor</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Subtotal</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">ITBMS</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.fecha_emision}</td>
                                    <td className="px-6 py-4 text-sm font-black text-blue-600">{item.numero_factura_proveedor}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.proveedor?.razon_social}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-400 text-right">{format(item.subtotal)}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-400 text-right">{format(item.itbms_total)}</td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{format(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
