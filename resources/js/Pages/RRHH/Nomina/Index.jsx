import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [nominas, setNominas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/rrhh/nomina')
            .then(res => res.json())
            .then(data => {
                setNominas(data);
                setLoading(false);
            });
    }, []);

    const getEstadoBadge = (estado) => {
        const badges = {
            'Borrador': 'bg-slate-100 text-slate-700',
            'Procesada': 'bg-blue-100 text-blue-700',
            'Pagada': 'bg-green-100 text-green-700',
        };
        return badges[estado] || 'bg-slate-100 text-slate-700';
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nómina" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Gestión de Nómina
                            </h1>
                            <p className="text-slate-600 mt-2">Procesamiento de planillas y pagos</p>
                        </div>
                        <Link
                            href={route('rrhh.nomina.create')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Procesar Nueva Nómina
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-slate-600 mt-4">Cargando nóminas...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Período</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Fecha Inicio</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Fecha Fin</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Total Bruto</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Deducciones</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Total Neto</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Estado</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {nominas.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p className="text-lg font-bold">No hay nóminas procesadas</p>
                                                <p className="text-sm mt-2">Procesa tu primera nómina quincenal</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        nominas.map((nomina) => (
                                            <tr key={nomina.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900">{nomina.periodo_nombre}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {new Date(nomina.fecha_inicio).toLocaleDateString('es-PA')}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {new Date(nomina.fecha_fin).toLocaleDateString('es-PA')}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-900 font-bold">
                                                    {formatCurrency(nomina.total_ingresos)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-red-600 font-bold">
                                                    {formatCurrency(nomina.total_deducciones)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-green-600 font-bold">
                                                    {formatCurrency(nomina.total_neto)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(nomina.estado)}`}>
                                                        {nomina.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-bold text-sm inline-flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Ver Detalles
                                                        </button>
                                                        <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-bold text-sm inline-flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}