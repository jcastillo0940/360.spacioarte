import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function EstadoResultados({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.financieros.resultados'), newFilters, {
            preserveState: true,
            onSuccess: (page) => { }
        });
    };

    const format = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <AuthenticatedLayout>
            <Head title="Estado de Resultados" />

            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Estado de Resultados</h1>
                    <p className="text-slate-600 mt-2">Resumen de ingresos, costos y gastos del periodo.</p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                {/* Resumen Superior */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Ingresos Totales</p>
                        <p className="text-2xl font-black text-green-600">{format(reportData.ingresos)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Costos y Gastos</p>
                        <p className="text-2xl font-black text-red-600">{format(reportData.costos + reportData.gastos)}</p>
                    </div>
                    <div className={`p-6 rounded-2xl border shadow-sm ${reportData.utilidad_neta >= 0 ? 'bg-blue-600 border-blue-700 text-white' : 'bg-red-600 border-red-700 text-white'}`}>
                        <p className="text-xs font-black uppercase opacity-80 tracking-widest mb-1">Utilidad Neta</p>
                        <p className="text-2xl font-black">{format(reportData.utilidad_neta)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* INGRESOS */}
                        <div>
                            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Ingresos Operativos</h3>
                                <div className="text-green-600"><TrendingUp size={20} /></div>
                            </div>
                            <div className="space-y-3">
                                {reportData.detalles.filter(d => d.tipo === 'Ingreso').map(item => (
                                    <div key={item.codigo} className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-medium">{item.codigo} - {item.nombre}</span>
                                        <span className="font-bold text-slate-900">{format(item.saldo * -1)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2 border-t border-slate-50 mt-4">
                                    <span className="text-xs font-black uppercase text-slate-400">Total Ingresos</span>
                                    <span className="font-black text-green-600">{format(reportData.ingresos)}</span>
                                </div>
                            </div>
                        </div>

                        {/* COSTOS */}
                        <div>
                            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Costos de Ventas</h3>
                                <div className="text-orange-500"><TrendingDown size={20} /></div>
                            </div>
                            <div className="space-y-3">
                                {reportData.detalles.filter(d => d.tipo === 'Costo').map(item => (
                                    <div key={item.codigo} className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-medium">{item.codigo} - {item.nombre}</span>
                                        <span className="font-bold text-slate-900">{format(item.saldo)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2 border-t border-slate-50 mt-4 bg-slate-50 p-3 rounded-xl">
                                    <span className="text-xs font-black uppercase text-slate-900">Utilidad Bruta</span>
                                    <span className="font-black text-slate-900 text-lg">{format(reportData.utilidad_bruta)}</span>
                                </div>
                            </div>
                        </div>

                        {/* GASTOS */}
                        <div>
                            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2 mb-4">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Gastos Administrativos</h3>
                                <div className="text-red-500"><Minus size={20} /></div>
                            </div>
                            <div className="space-y-3">
                                {reportData.detalles.filter(d => d.tipo === 'Gasto').map(item => (
                                    <div key={item.codigo} className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-medium">{item.codigo} - {item.nombre}</span>
                                        <span className="font-bold text-slate-900">{format(item.saldo)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2 border-t border-slate-50 mt-4">
                                    <span className="text-xs font-black uppercase text-slate-400">Total Gastos</span>
                                    <span className="font-black text-red-600">{format(reportData.gastos)}</span>
                                </div>
                            </div>
                        </div>

                        {/* RESULTADO FINAL */}
                        <div className="pt-6 border-t-4 border-slate-900 mt-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Utilidad del Periodo</h2>
                                <p className={`text-3xl font-black ${reportData.utilidad_neta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {format(reportData.utilidad_neta)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
