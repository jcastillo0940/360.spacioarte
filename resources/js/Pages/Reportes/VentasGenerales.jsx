import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';

export default function VentasGenerales({ reportData, filtros }) {
    const [data, setData] = useState(reportData);

    const handleFilter = (newFilters) => {
        router.get(route('reportes.ventas.generales'), newFilters, {
            preserveState: true,
            replace: true,
            onSuccess: (page) => setData(page.props.reportData)
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reporte de Ventas Generales" />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Ventas Generales</h1>
                    <p className="text-slate-600 mt-2">Listado detallado de facturación en el periodo seleccionado.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Factura</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Subtotal</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">ITBMS</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map(factura => (
                                <tr key={factura.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{factura.fecha_emision}</td>
                                    <td className="px-6 py-4 text-sm text-blue-600 font-black">{factura.numero_factura}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 font-bold">{factura.cliente?.razon_social}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${factura.estado === 'Abierta' ? 'bg-blue-100 text-blue-700' :
                                                factura.estado === 'Pagada' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {factura.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900 font-bold text-right">
                                        ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(factura.subtotal)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium text-right">
                                        ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(factura.itbms_total)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900 font-black text-right">
                                        ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(factura.total)}
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                                        No se encontraron ventas en este periodo
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-right uppercase tracking-widest text-xs">Totales del Periodo</td>
                                <td className="px-6 py-4 text-right">
                                    ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(data.reduce((acc, f) => acc + parseFloat(f.subtotal), 0))}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500">
                                    ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(data.reduce((acc, f) => acc + parseFloat(f.itbms_total), 0))}
                                </td>
                                <td className="px-6 py-4 text-right text-blue-600 text-lg">
                                    ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(data.reduce((acc, f) => acc + parseFloat(f.total), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
