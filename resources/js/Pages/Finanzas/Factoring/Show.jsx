import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, 
    FileText, 
    Calendar, 
    DollarSign, 
    Building2, 
    TrendingDown, 
    TrendingUp,
    FileMinus
} from 'lucide-react';

export default function Show({ auth, operacion }) {
    const esCargo = operacion.tipo === 'venta';

    // Helper para formatear moneda
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(parseFloat(amount || 0));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Operación ${operacion.numero_operacion}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.visit('/finanzas/factoring')}
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {operacion.numero_operacion}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    {esCargo ? 'Factoring de Venta (Agrupado)' : 'Factoring de Compra (Agrupado)'}
                                </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-semibold ${
                            operacion.estado === 'Activa' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {operacion.estado}
                        </div>
                    </div>

                    {/* Información Principal */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-500" />
                            Información General
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Fecha</label>
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(operacion.fecha_operacion).toLocaleDateString('es-PA')}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Entidad Financiera</label>
                                <p className="font-medium text-gray-900">
                                    {operacion.entidad_financiera || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Cuenta Bancaria</label>
                                <p className="font-medium text-gray-900 text-sm">
                                    {operacion.cuenta_bancaria?.nombre_banco}
                                    <br/>
                                    <span className="text-gray-500">{operacion.cuenta_bancaria?.numero_cuenta}</span>
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Ref. Externa</label>
                                <p className="font-medium text-gray-900">
                                    {operacion.numero_operacion_externa || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Totales Financieros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-400">
                            <p className="text-sm text-gray-500 mb-1">Monto Documentos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatMoney(operacion.monto_factura)}
                            </p>
                        </div>
                        <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${esCargo ? 'border-orange-500' : 'border-green-500'}`}>
                            <p className="text-sm text-gray-500 mb-1">
                                {esCargo ? 'Costo Financiero' : 'Descuento Obtenido'} ({parseFloat(operacion.porcentaje)}%)
                            </p>
                            <p className={`text-2xl font-bold ${esCargo ? 'text-orange-600' : 'text-green-600'}`}>
                                {esCargo ? '-' : '+'}{formatMoney(operacion.monto_descuento)}
                            </p>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-lg shadow-sm text-white">
                            <p className="text-sm text-gray-400 mb-1">Total {esCargo ? 'Recibido' : 'Pagado'}</p>
                            <p className="text-2xl font-bold">
                                {formatMoney(operacion.monto_neto)}
                            </p>
                        </div>
                    </div>

                    {/* DETALLE DE DOCUMENTOS (NUEVO) */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-medium text-gray-900">Documentos Agrupados</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tercero</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Emisión</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Original</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Mapeo de facturas de compra */}
                                    {operacion.documentos?.filter(d => d.factura_compra_id).map((doc, index) => (
                                        <tr key={`fc-${index}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 text-green-500 mr-2" />
                                                    <span className="font-medium text-gray-900">
                                                        {doc.factura_compra?.numero_factura_proveedor}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.factura_compra?.proveedor?.razon_social}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.factura_compra?.fecha_emision}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {formatMoney(doc.factura_compra?.total)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Mapeo de facturas de venta */}
                                    {operacion.documentos?.filter(d => d.factura_venta_id).map((doc, index) => (
                                        <tr key={`fv-${index}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 text-orange-500 mr-2" />
                                                    <span className="font-medium text-gray-900">
                                                        {doc.factura_venta?.numero_factura}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.factura_venta?.cliente?.razon_social}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.factura_venta?.fecha_emision}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {formatMoney(doc.factura_venta?.total)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Mapeo de Notas de Crédito */}
                                    {operacion.documentos?.filter(d => d.nota_credito_id).map((doc, index) => (
                                        <tr key={`nc-${index}`} className="bg-red-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileMinus className="w-4 h-4 text-red-500 mr-2" />
                                                    <span className="font-medium text-gray-900">
                                                        {doc.nota_credito?.numero_nota}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.nota_credito?.cliente?.razon_social}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.nota_credito?.fecha}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 text-right font-medium">
                                                -{formatMoney(doc.nota_credito?.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notas adicionales */}
                    {operacion.notas && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Notas internas:</h4>
                            <p className="text-sm text-yellow-700">{operacion.notas}</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}