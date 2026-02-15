import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, 
    FileText, 
    User, 
    Calendar,
    DollarSign,
    Package,
    CheckCircle,
    XCircle,
    AlertCircle,
    Printer
} from 'lucide-react';

export default function Show({ auth, notaId }) {
    const [nota, setNota] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNota();
    }, [notaId]);

    const fetchNota = async () => {
        try {
            const response = await fetch(`/api/ventas/notas-credito/${notaId}`);
            const data = await response.json();
            setNota(data);
        } catch (error) {
            console.error('Error al cargar nota de crédito:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTipoInfo = (tipo) => {
        const tipos = {
            devolucion: {
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                icon: Package,
                label: 'Devolución de Producto',
                descripcion: 'El cliente devolvió el producto físicamente'
            },
            merma: {
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                icon: AlertCircle,
                label: 'Merma / Producto Dañado',
                descripcion: 'Producto no regresó al inventario'
            },
            descuento: {
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                icon: DollarSign,
                label: 'Descuento / Ajuste de Precio',
                descripcion: 'Ajuste sin movimiento físico de inventario'
            }
        };
        return tipos[tipo] || tipos.devolucion;
    };

    if (loading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Detalle Nota de Crédito" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!nota) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Nota de Crédito no encontrada" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nota de Crédito no encontrada</h2>
                            <Link href="/ventas/notas-credito" className="text-indigo-600 hover:underline">
                                Volver al listado
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const tipoInfo = getTipoInfo(nota.tipo_nota);
    const TipoIcon = tipoInfo.icon;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Nota de Crédito ${nota.numero_nota}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/ventas/notas-credito"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al listado
                        </Link>
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Nota de Crédito {nota.numero_nota}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Factura de referencia: {nota.factura?.numero_factura}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    Imprimir
                                </button>
                                {nota.estado === 'Activa' && (
                                    <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Activa
                                    </span>
                                )}
                                {nota.estado === 'Anulada' && (
                                    <span className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Anulada
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Información Principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tipo de Nota */}
                            <div className={`${tipoInfo.bgColor} rounded-lg p-6`}>
                                <div className="flex items-start">
                                    <TipoIcon className={`w-8 h-8 ${tipoInfo.color} mr-4`} />
                                    <div>
                                        <h3 className={`text-lg font-bold ${tipoInfo.color}`}>
                                            {tipoInfo.label}
                                        </h3>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {tipoInfo.descripcion}
                                        </p>
                                        <div className="mt-3 p-3 bg-white rounded-lg">
                                            <p className="text-sm font-medium text-gray-900">Motivo:</p>
                                            <p className="text-sm text-gray-700 mt-1">{nota.motivo}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalles de Items */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Productos Incluidos
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Producto
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Cantidad
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Precio Unit.
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Inventario
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {nota.detalles?.map((detalle, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {detalle.item?.nombre}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {detalle.item?.codigo}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                                                        {parseFloat(detalle.cantidad).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                        ${parseFloat(detalle.precio_unitario).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {detalle.devuelto_stock ? (
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Devuelto
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                No devuelto
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                        ${parseFloat(detalle.total_item).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Información del Cliente */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-gray-600" />
                                    Cliente
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Razón Social</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {nota.factura?.cliente?.razon_social}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">RUC/Identificación</p>
                                        <p className="text-sm text-gray-900">
                                            {nota.factura?.cliente?.identificacion}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Información de Fechas */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                                    Fechas
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Fecha de Emisión</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(nota.fecha).toLocaleDateString('es-PA', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Hora</p>
                                        <p className="text-sm text-gray-900">
                                            {new Date(nota.fecha).toLocaleTimeString('es-PA')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Totales */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
                                    Resumen Financiero
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Subtotal</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            ${parseFloat(nota.subtotal).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">ITBMS</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            ${parseFloat(nota.itbms_total).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between">
                                            <span className="text-base font-bold text-gray-900">Total</span>
                                            <span className="text-base font-bold text-indigo-600">
                                                ${parseFloat(nota.total).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Información de la Factura Original */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                                    Factura Original
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Número</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {nota.factura?.numero_factura}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/ventas/facturas/${nota.factura?.id}`}
                                        className="block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                                    >
                                        Ver Factura Original
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}