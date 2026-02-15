import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EstadoResultados() {
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        cargarReporte();
    }, []);

    const cargarReporte = () => {
        setLoading(true);
        fetch(`/api/reportes/estado-resultados?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
            .then(res => res.json())
            .then(data => {
                setReporte(data);
                setLoading(false);
            });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Estado de Resultados" />
            
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 print:hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Estado de Resultados
                            </h1>
                            <p className="text-slate-600 mt-2">Reporte de ingresos y gastos (P&L)</p>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6 print:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Inicio</label>
                            <input 
                                type="date"
                                value={fechaInicio}
                                onChange={e => setFechaInicio(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Fin</label>
                            <input 
                                type="date"
                                value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>
                        <button
                            onClick={cargarReporte}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Actualizar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Generando reporte...</p>
                    </div>
                ) : reporte ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-6 text-center">
                            <h2 className="text-2xl font-black uppercase tracking-wider">Estado de Resultados</h2>
                            <p className="text-sm mt-2 text-slate-300">
                                Del {new Date(fechaInicio).toLocaleDateString('es-PA')} al {new Date(fechaFin).toLocaleDateString('es-PA')}
                            </p>
                        </div>

                        <div className="p-8">
                            {/* Ingresos */}
                            <div className="mb-8">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b-2 border-blue-600">
                                    Ingresos Operacionales
                                </h3>
                                <div className="space-y-2">
                                    {reporte.ingresos?.map((ing, idx) => (
                                        <div key={idx} className="flex justify-between py-2 px-4 hover:bg-slate-50 rounded">
                                            <span className="text-slate-700">{ing.nombre}</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(ing.monto)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between py-3 px-4 mt-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                    <span className="font-bold text-blue-900 uppercase text-sm">Total Ingresos</span>
                                    <span className="font-black text-xl text-blue-900">{formatCurrency(reporte.total_ingresos)}</span>
                                </div>
                            </div>

                            {/* Costo de Ventas */}
                            <div className="mb-8">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b-2 border-orange-600">
                                    Costo de Ventas
                                </h3>
                                <div className="space-y-2">
                                    {reporte.costos?.map((cost, idx) => (
                                        <div key={idx} className="flex justify-between py-2 px-4 hover:bg-slate-50 rounded">
                                            <span className="text-slate-700">{cost.nombre}</span>
                                            <span className="font-bold text-red-600">({formatCurrency(cost.monto)})</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between py-3 px-4 mt-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                                    <span className="font-bold text-orange-900 uppercase text-sm">Total Costo de Ventas</span>
                                    <span className="font-black text-xl text-red-600">({formatCurrency(reporte.total_costos)})</span>
                                </div>
                            </div>

                            {/* Utilidad Bruta */}
                            <div className="mb-8 py-4 px-4 bg-green-100 rounded-lg border-2 border-green-400">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-lg text-green-900 uppercase">Utilidad Bruta</span>
                                    <span className="font-black text-2xl text-green-800">{formatCurrency(reporte.utilidad_bruta)}</span>
                                </div>
                            </div>

                            {/* Gastos Operacionales */}
                            <div className="mb-8">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-4 pb-2 border-b-2 border-purple-600">
                                    Gastos Operacionales
                                </h3>
                                <div className="space-y-2">
                                    {reporte.gastos?.map((gasto, idx) => (
                                        <div key={idx} className="flex justify-between py-2 px-4 hover:bg-slate-50 rounded">
                                            <span className="text-slate-700">{gasto.nombre}</span>
                                            <span className="font-bold text-red-600">({formatCurrency(gasto.monto)})</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between py-3 px-4 mt-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                                    <span className="font-bold text-purple-900 uppercase text-sm">Total Gastos</span>
                                    <span className="font-black text-xl text-red-600">({formatCurrency(reporte.total_gastos)})</span>
                                </div>
                            </div>

                            {/* Utilidad Neta */}
                            <div className="py-6 px-6 bg-slate-900 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-2xl text-white uppercase tracking-wider">Utilidad Neta</span>
                                    <span className={`font-black text-4xl ${
                                        reporte.utilidad_neta >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {formatCurrency(reporte.utilidad_neta)}
                                    </span>
                                </div>
                            </div>

                            {/* Margen */}
                            <div className="mt-6 grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-xs font-bold uppercase text-blue-600 mb-1">Margen Bruto</div>
                                    <div className="text-2xl font-black text-blue-900">
                                        {reporte.total_ingresos > 0 
                                            ? ((reporte.utilidad_bruta / reporte.total_ingresos) * 100).toFixed(1)
                                            : 0}%
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <div className="text-xs font-bold uppercase text-purple-600 mb-1">Margen Operacional</div>
                                    <div className="text-2xl font-black text-purple-900">
                                        {reporte.total_ingresos > 0 
                                            ? (((reporte.utilidad_bruta - reporte.total_gastos) / reporte.total_ingresos) * 100).toFixed(1)
                                            : 0}%
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-xs font-bold uppercase text-green-600 mb-1">Margen Neto</div>
                                    <div className="text-2xl font-black text-green-900">
                                        {reporte.total_ingresos > 0 
                                            ? ((reporte.utilidad_neta / reporte.total_ingresos) * 100).toFixed(1)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}