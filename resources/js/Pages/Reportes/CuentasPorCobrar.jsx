import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileText, Clock, AlertTriangle } from 'lucide-react';

export default function CuentasPorCobrar({ reportData }) {
    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

    const isOverdue = (date) => {
        return new Date(date) < new Date();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cuentas por Cobrar" />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Cuentas por Cobrar</h1>
                        <p className="text-slate-600 mt-2">Seguimiento de cartera y facturas pendientes de cobro.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Total Cartera</p>
                            <p className="text-2xl font-black text-blue-600">
                                {format(reportData.reduce((acc, f) => acc + parseFloat(f.saldo_pendiente), 0))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Factura</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Emisión</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Vencimiento</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Total</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Saldo</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.map((factura) => (
                                <tr key={factura.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm font-black text-blue-600">{factura.numero_factura}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{factura.cliente?.razon_social}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">{factura.cliente?.ruc}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{factura.fecha_emision}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`text-sm font-bold ${isOverdue(factura.fecha_vencimiento) ? 'text-red-500' : 'text-slate-600'}`}>
                                            {factura.fecha_vencimiento}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-400 text-right">{format(factura.total)}</td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{format(factura.saldo_pendiente)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {isOverdue(factura.fecha_vencimiento) ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase">
                                                <AlertTriangle size={10} /> Vencida
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                                                Al Día
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                                        No hay facturas pendientes de cobro
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
