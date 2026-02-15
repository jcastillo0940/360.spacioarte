import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ auth, contacto, movimientos, saldo_total, resumen, saldo_anterior, filtros }) {
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    };

    const handleFilter = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        router.get(route('finanzas.estado-cuenta', contacto.id), {
            fecha_desde: data.get('fecha_desde'),
            fecha_hasta: data.get('fecha_hasta'),
        }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout 
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Estado de Cuenta</h2>}
        >
            <Head title={`Estado de Cuenta - ${contacto.razon_social}`} />
            
            <div className="max-w-5xl mx-auto py-8 px-4">
                
                {/* FILTROS */}
                <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Desde</label>
                            <input 
                                type="date" 
                                name="fecha_desde" 
                                defaultValue={filtros?.desde} 
                                className="w-full rounded-lg border-slate-200 text-sm focus:ring-blue-500" 
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Hasta</label>
                            <input 
                                type="date" 
                                name="fecha_hasta" 
                                defaultValue={filtros?.hasta} 
                                className="w-full rounded-lg border-slate-200 text-sm focus:ring-blue-500" 
                            />
                        </div>
                        <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition">
                            Filtrar Periodo
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
                    
                    {/* ENCABEZADO */}
                    <div className="bg-slate-900 text-white p-8 print:bg-slate-900 print:!text-white" style={{ WebkitPrintColorAdjust: 'exact' }}>
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Estado de Cuenta</h1>
                                <p className="text-blue-400 text-xl font-bold">{contacto.razon_social}</p>
                                <p className="text-slate-400 text-sm mt-1 font-mono uppercase">
                                    ID: {contacto.identificacion} {contacto.dv ? `DV: ${contacto.dv}` : ''}
                                </p>
                            </div>
                            
                            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/10 text-right">
                                <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Saldo al Corte</div>
                                <div className={`text-5xl font-black ${saldo_total <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(saldo_total)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RESUMEN */}
                    <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 print:bg-white">
                        <div className="p-4 text-center border-r border-slate-200">
                            <span className="block text-[10px] font-black text-slate-400 uppercase">Total por Cobrar</span>
                            <span className="text-lg font-bold text-slate-700">{formatCurrency(resumen.por_cobrar)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-[10px] font-black text-slate-400 uppercase">Total por Pagar</span>
                            <span className="text-lg font-bold text-slate-700">{formatCurrency(resumen.por_pagar)}</span>
                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 border-b border-slate-300">
                                    <th className="px-6 py-4 text-left font-black uppercase text-[10px]">Fecha</th>
                                    <th className="px-6 py-4 text-left font-black uppercase text-[10px]">Concepto</th>
                                    <th className="px-6 py-4 text-right font-black uppercase text-[10px]">Débito (+)</th>
                                    <th className="px-6 py-4 text-right font-black uppercase text-[10px]">Crédito (-)</th>
                                    <th className="px-6 py-4 text-right font-black uppercase text-[10px] bg-slate-200/50">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-slate-50/80 italic">
                                    <td className="px-6 py-4 text-slate-400">{filtros?.desde}</td>
                                    <td className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px]">Saldo Anterior</td>
                                    <td className="px-6 py-4 text-right">-</td>
                                    <td className="px-6 py-4 text-right">-</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-600">{formatCurrency(saldo_anterior)}</td>
                                </tr>
                                {movimientos.map((mov, idx) => (
                                    <tr key={idx} className={`print:break-inside-avoid ${mov.descripcion === 'Nota de Crédito' ? 'bg-rose-50/50' : ''}`}>
                                        <td className="px-6 py-4 text-slate-500">{mov.fecha}</td>
                                        <td className="px-6 py-4">
                                            <div className={`font-bold ${mov.descripcion === 'Nota de Crédito' ? 'text-rose-700' : 'text-slate-800'}`}>
                                                {mov.descripcion}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-400">Ref: {mov.referencia}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {mov.debito > 0 ? formatCurrency(mov.debito) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                                            {mov.credito > 0 ? formatCurrency(mov.credito) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold bg-slate-50/30">
                                            {formatCurrency(mov.saldo_acumulado)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ACCIONES (No se imprimen) */}
                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center no-print">
                        <button 
                            onClick={() => window.history.back()} 
                            className="text-slate-500 font-bold hover:text-slate-800 transition flex items-center gap-2 text-sm"
                        >
                            Volver
                        </button>
                        
                        <div className="flex gap-3">
                            <a 
                                href={route('finanzas.estado-cuenta.pdf', {
                                    contacto: contacto.id,
                                    fecha_desde: filtros.desde,
                                    fecha_hasta: filtros.hasta
                                })}
                                target="_blank"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                PDF Oficial
                            </a>

                            <button 
                                onClick={() => window.print()} 
                                className="px-6 py-3 bg-slate-900 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Imprimir
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold italic">
                        ERP System - Reporte de Cartera - {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}