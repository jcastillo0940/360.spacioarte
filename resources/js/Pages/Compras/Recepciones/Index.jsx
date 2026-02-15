import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ auth, ordenes }) {
    const [busqueda, setBusqueda] = useState('');

    const ordenesFiltradas = ordenes.filter(orden => 
        orden.numero_orden.toLowerCase().includes(busqueda.toLowerCase()) ||
        orden.proveedor.razon_social.toLowerCase().includes(busqueda.toLowerCase())
    );

    const getEstadoColor = (estado) => {
        const colores = {
            'Enviada': 'bg-blue-100 text-blue-800',
            'Confirmada': 'bg-green-100 text-green-800',
            'Recibida Parcial': 'bg-yellow-100 text-yellow-800',
            'Recibida Total': 'bg-gray-100 text-gray-800'
        };
        return colores[estado] || 'bg-gray-100 text-gray-800';
    };

    const getProgresoColor = (porcentaje) => {
        const p = Number(porcentaje || 0);
        if (p === 0) return 'bg-red-500';
        if (p < 50) return 'bg-orange-500';
        if (p < 100) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Recepción de Órdenes de Compra
                    </h2>
                    <Link
                        href={route('compras.recepciones.historial')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        Ver Historial
                    </Link>
                </div>
            }
        >
            <Head title="Recepción de Órdenes" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Buscador */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por número de orden o proveedor..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Lista de Órdenes */}
                    {ordenesFiltradas.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes pendientes</h3>
                            <p className="text-gray-500">No se encontraron órdenes de compra pendientes de recepción.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ordenesFiltradas.map((orden) => (
                                <div key={orden.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {orden.numero_orden}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(orden.estado)}`}>
                                                        {orden.estado}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-1">
                                                    <span className="font-medium">Proveedor:</span> {orden.proveedor?.razon_social || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Fecha de entrega: {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-ES') : 'Sin fecha'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {/* SOLUCIÓN AL ERROR .toFixed(): Aseguramos que sea un número */}
                                                    ${Number(orden.total || 0).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {orden.detalles?.length || 0} {orden.detalles?.length === 1 ? 'producto' : 'productos'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Barra de progreso */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Progreso de recepción
                                                </span>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {Number(orden.porcentaje_recibido || 0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all ${getProgresoColor(orden.porcentaje_recibido)}`}
                                                    style={{ width: `${Number(orden.porcentaje_recibido || 0)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>Recibido: {Number(orden.total_recibido || 0)}</span>
                                                <span>Total: {Number(orden.total_ordenado || 0)}</span>
                                            </div>
                                        </div>

                                        {/* Botón de acción */}
                                        <div className="flex justify-end">
                                            <Link
                                                href={route('compras.recepciones.recibir', orden.id)}
                                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                                Recibir Mercancía
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}