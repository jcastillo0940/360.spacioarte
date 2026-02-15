import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ auth, recepcion }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detalle de Recepción: {recepcion.numero_recepcion}
                    </h2>
                    <Link
                        href={route('compras.recepciones.historial')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        ← Volver al Historial
                    </Link>
                </div>
            }
        >
            <Head title={`Recepción ${recepcion.numero_recepcion}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Información General */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Información de la Recepción</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Número de Recepción</p>
                                        <p className="font-semibold text-gray-900">{recepcion.numero_recepcion}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Fecha y Hora</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(recepcion.fecha_recepcion).toLocaleString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Tipo de Recepción</p>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                            recepcion.tipo === 'completa' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {recepcion.tipo === 'completa' ? 'Completa' : 'Parcial'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Recibido por</p>
                                        <p className="font-semibold text-gray-900">{recepcion.usuario.name}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Orden de Compra</p>
                                        <Link
                                            href={route('compras.ordenes.show', recepcion.orden_compra.id)}
                                            className="font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            {recepcion.orden_compra.numero_orden}
                                        </Link>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Proveedor</p>
                                        <p className="font-semibold text-gray-900">
                                            {recepcion.orden_compra.proveedor.razon_social}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Recibido</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ${recepcion.total_recibido.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Cantidad de Items</p>
                                        <p className="font-semibold text-gray-900">
                                            {recepcion.cantidad_total_items} unidades
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {recepcion.observaciones && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Observaciones:</p>
                                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                                    {recepcion.observaciones}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Detalle de Productos */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Productos Recibidos</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ordenado</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recibido</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recepcion.detalles.map((detalle) => (
                                        <tr key={detalle.id}>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                                {detalle.item.codigo}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {detalle.item.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                {detalle.cantidad_ordenada}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                {detalle.cantidad_recibida}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                {detalle.porcentaje_recibido}%
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                ${detalle.costo_unitario.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                                ${detalle.subtotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="6" className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                            TOTAL:
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                                            ${recepcion.total_recibido.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Resumen de Recepción</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Total de Items</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {recepcion.detalles.length}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Unidades Totales</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {recepcion.cantidad_total_items}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${recepcion.total_recibido.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex justify-between items-center">
                        <Link
                            href={route('compras.recepciones.historial')}
                            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
                        >
                            ← Volver al Historial
                        </Link>
                        <Link
                            href={route('compras.ordenes.show', recepcion.orden_compra.id)}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            Ver Orden de Compra
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
