import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [asientos, setAsientos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/contabilidad/libro-diario')
            .then(res => res.json())
            .then(data => {
                setAsientos(data);
                setLoading(false);
            });
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Libro Diario" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Libro Diario General
                    </h1>
                    <p className="text-slate-600 mt-2">Registro cronológico de operaciones contables</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando asientos...</p>
                    </div>
                ) : asientos.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-lg font-bold text-slate-900">No hay asientos contables</p>
                        <p className="text-sm text-slate-500 mt-2">Los asientos se generan automáticamente con las operaciones del sistema</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {asientos.map((asiento) => (
                            <div key={asiento.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                {/* Cabecera */}
                                <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <span className="text-xs font-bold uppercase text-slate-400">Asiento</span>
                                            <p className="font-mono font-bold">#{asiento.id}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-700"></div>
                                        <div>
                                            <span className="text-xs font-bold uppercase text-slate-400">Referencia</span>
                                            <p className="font-mono">{asiento.referencia}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold uppercase text-slate-400">Fecha</span>
                                        <p className="font-bold">{new Date(asiento.fecha).toLocaleDateString('es-PA')}</p>
                                    </div>
                                </div>

                                {/* Concepto */}
                                <div className="p-4 bg-blue-50 border-b border-slate-200">
                                    <p className="text-sm font-medium text-slate-700">
                                        <span className="text-xs font-bold uppercase text-slate-500 mr-2">Concepto:</span>
                                        {asiento.concepto}
                                    </p>
                                </div>

                                {/* Detalles */}
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-600">Cuenta</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">Débito</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold uppercase text-slate-600">Crédito</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {asiento.detalles.map((det) => (
                                            <tr key={det.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-sm font-bold text-slate-900">{det.cuenta.codigo}</div>
                                                    <div className="text-sm text-slate-600">{det.cuenta.nombre}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {det.debito > 0 ? (
                                                        <span className="font-bold text-blue-600">{formatCurrency(det.debito)}</span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {det.credito > 0 ? (
                                                        <span className="font-bold text-red-600">{formatCurrency(det.credito)}</span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white font-bold">
                                        <tr>
                                            <td className="px-6 py-3 text-right uppercase text-xs">Totales:</td>
                                            <td className="px-6 py-3 text-right">{formatCurrency(asiento.total_debito)}</td>
                                            <td className="px-6 py-3 text-right">{formatCurrency(asiento.total_credito)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}