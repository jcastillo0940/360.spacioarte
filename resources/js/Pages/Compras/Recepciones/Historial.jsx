import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Historial({ auth, recepciones }) {
    const [filtroFecha, setFiltroFecha] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');

    const recepcionesFiltradas = recepciones.data.filter(recepcion => {
        const cumpleFecha = !filtroFecha || new Date(recepcion.fecha_recepcion).toLocaleDateString('es-ES').includes(filtroFecha);
        const cumpleTipo = !filtroTipo || recepcion.tipo === filtroTipo;
        return cumpleFecha && cumpleTipo;
    });

    const getTipoColor = (tipo) => {
        return tipo === 'completa' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800';
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Historial de Recepciones
                    </h2>
                    <Link
                        href={route('compras.recepciones.index')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        ← Volver a Recepciones
                    </Link>
                </div>
            }
        >
            <Head title="Historial de Recepciones" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filtros */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filtrar por Fecha
                                </label>
                                <input
                                    type="text"
                                    value={filtroFecha}
                                    onChange={(e) => setFiltroFecha(e.target.value)}
                                    placeholder="dd/mm/aaaa"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filtrar por Tipo
                                </label>
                                <select
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="parcial">Parcial</option>
                                    <option value="completa">Completa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Recepciones */}
                    {recepcionesFiltradas.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recepciones</h3>
                            <p className="text-gray-500">No se encontraron recepciones con los filtros aplicados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recepcionesFiltradas.map((recepcion) => (
                                <div key={recepcion.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {recepcion.numero_recepcion}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(recepcion.tipo)}`}>
                                                        {recepcion.tipo === 'completa' ? 'Completa' : 'Parcial'}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Orden:</span> {recepcion.orden_compra.numero_orden}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Proveedor:</span> {recepcion.orden_compra.proveedor.razon_social}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium">Recibido por:</span> {recepcion.usuario.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(recepcion.fecha_recepcion).toLocaleString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 mb-1">Items recibidos</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {recepcion.cantidad_total_items}
                                                </p>
                                                <p className="text-lg text-gray-600 mt-2">
                                                    ${recepcion.total_recibido.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Detalle de Items */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Recibidos:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {recepcion.detalles.map((detalle) => (
                                                    <div key={detalle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm text-gray-900">{detalle.item.nombre}</p>
                                                            <p className="text-xs text-gray-500">Código: {detalle.item.codigo}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900">
                                                                {detalle.cantidad_recibida} / {detalle.cantidad_ordenada}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                ${(detalle.cantidad_recibida * detalle.costo_unitario).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Observaciones */}
                                        {recepcion.observaciones && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                                                <p className="text-sm text-gray-600">{recepcion.observaciones}</p>
                                            </div>
                                        )}

                                        {/* Botón Ver Detalle */}
                                        <div className="mt-4 flex justify-end">
                                            <Link
                                                href={route('compras.recepciones.show', recepcion.id)}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                            >
                                                Ver Detalle Completo
                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {recepciones.links && recepciones.links.length > 3 && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex items-center gap-2">
                                {recepciones.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-100'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
