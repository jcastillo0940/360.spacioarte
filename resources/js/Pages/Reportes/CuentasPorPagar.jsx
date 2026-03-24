import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AlertTriangle, CreditCard } from 'lucide-react';

export default function CuentasPorPagar({ reportData }) {
    const facturas = reportData || [];

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    const isOverdue = (date) => new Date(date) < new Date();

    const resumen = {
        abiertas: facturas.length,
        vencidas: facturas.filter((factura) => isOverdue(factura.fecha_vencimiento)).length,
        saldo: facturas.reduce((acc, factura) => acc + Number(factura.saldo_pendiente || 0), 0),
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cuentas por Pagar" />

            <div className="max-w-7xl mx-auto py-8 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Cuentas por Pagar</h1>
                        <p className="text-slate-600 mt-2">
                            Seguimiento de saldos abiertos, vencimientos y obligaciones pendientes con proveedores.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facturas Abiertas</p>
                            <p className="text-2xl font-black text-slate-900">{resumen.abiertas}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Vencidas</p>
                            <p className="text-2xl font-black text-red-600">{resumen.vencidas}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo Total</p>
                            <p className="text-2xl font-black text-blue-600">{formatCurrency(resumen.saldo)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Factura</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Proveedor</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Emision</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Vencimiento</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Total</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Saldo</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Accion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {facturas.map((factura) => (
                                <tr key={factura.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-black text-blue-600">{factura.numero_factura_proveedor}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            {factura.estado}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">{factura.proveedor?.razon_social}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">{factura.proveedor?.identificacion}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{factura.fecha_emision}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-1 text-sm font-bold ${isOverdue(factura.fecha_vencimiento) ? 'text-red-600' : 'text-slate-600'}`}>
                                            {isOverdue(factura.fecha_vencimiento) && <AlertTriangle size={12} />}
                                            {factura.fecha_vencimiento}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-slate-500 font-medium">{formatCurrency(factura.total)}</td>
                                    <td className="px-6 py-4 text-sm text-right font-black text-slate-900">{formatCurrency(factura.saldo_pendiente)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            href={route('compras.facturas.show', factura.id)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition"
                                        >
                                            <CreditCard size={14} />
                                            Ver Factura
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {facturas.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                                        No hay cuentas por pagar abiertas
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
