import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Search, 
    Eye, 
    XCircle,
    Calendar,
    User,
    DollarSign,
    TrendingUp,
    TrendingDown,
    FileText
} from 'lucide-react';

export default function Index({ auth }) {
    const [operaciones, setOperaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterEstado, setFilterEstado] = useState('all');

    useEffect(() => {
        fetchOperaciones();
    }, []);

    const fetchOperaciones = async () => {
        try {
            const response = await fetch('/api/finanzas/factoring', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            setOperaciones(data.data || data);
        } catch (error) {
            console.error('Error al cargar operaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async (operacionId) => {
        if (!confirm('¿Está seguro de anular esta operación? Esta acción reversará todos los cambios.')) {
            return;
        }

        try {
            const response = await fetch(`/finanzas/factoring/${operacionId}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
            });

            if (response.ok) {
                alert('Operación anulada exitosamente');
                fetchOperaciones();
            } else {
                const error = await response.json();
                alert(error.message || 'Error al anular la operación');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al anular la operación');
        }
    };

    const getTipoBadge = (tipo) => {
        return tipo === 'compra' ? (
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Descuento Compra
            </span>
        ) : (
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                <TrendingDown className="w-3 h-3 mr-1" />
                Cargo Venta
            </span>
        );
    };

    const getEstadoBadge = (estado) => {
        return estado === 'Activa' ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Activa
            </span>
        ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Anulada
            </span>
        );
    };

    const filteredOperaciones = operaciones.filter(op => {
        const matchesSearch = 
            op.numero_operacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.entidad_financiera?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesTipo = filterTipo === 'all' || op.tipo === filterTipo;
        const matchesEstado = filterEstado === 'all' || op.estado === filterEstado;

        return matchesSearch && matchesTipo && matchesEstado;
    });

    const totalIngresos = operaciones
        .filter(op => op.tipo === 'compra' && op.estado === 'Activa')
        .reduce((sum, op) => sum + parseFloat(op.monto_descuento || 0), 0);

    const totalGastos = operaciones
        .filter(op => op.tipo === 'venta' && op.estado === 'Activa')
        .reduce((sum, op) => sum + parseFloat(op.monto_descuento || 0), 0);

    if (loading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Operaciones de Factoring" />
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

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Operaciones de Factoring" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Operaciones de Factoring</h1>
                                <p className="text-gray-600 mt-1">
                                    Gestión de descuentos por pronto pago y cargos financieros
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/finanzas/factoring/compra/crear"
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Factoring Compra
                                </Link>
                                <Link
                                    href="/finanzas/factoring/venta/crear"
                                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                                >
                                    <TrendingDown className="w-5 h-5 mr-2" />
                                    Factoring Venta
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por número u entidad..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <select
                                    value={filterTipo}
                                    onChange={(e) => setFilterTipo(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los tipos</option>
                                    <option value="compra">Factoring Compra</option>
                                    <option value="venta">Factoring Venta</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    value={filterEstado}
                                    onChange={(e) => setFilterEstado(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los estados</option>
                                    <option value="Activa">Activas</option>
                                    <option value="Anulada">Anuladas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Operaciones</p>
                                    <p className="text-2xl font-bold text-gray-900">{operaciones.length}</p>
                                </div>
                                <FileText className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Ingresos Financieros</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${totalIngresos.toFixed(2)}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Gastos Financieros</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        ${totalGastos.toFixed(2)}
                                    </p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {filteredOperaciones.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No se encontraron operaciones</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Operación
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tipo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Monto Factura
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                % / Descuento
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Monto Neto
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredOperaciones.map((op) => (
                                            <tr key={op.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {op.numero_operacion}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {op.entidad_financiera || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getTipoBadge(op.tipo)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        {new Date(op.fecha_operacion).toLocaleDateString('es-PA')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ${parseFloat(op.monto_factura).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {parseFloat(op.porcentaje).toFixed(2)}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ${parseFloat(op.monto_descuento).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm font-semibold text-indigo-600">
                                                        <DollarSign className="w-4 h-4 mr-1" />
                                                        {parseFloat(op.monto_neto).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getEstadoBadge(op.estado)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/finanzas/factoring/${op.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900 transition"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </Link>
                                                        {op.estado === 'Activa' && (
                                                            <button
                                                                onClick={() => handleAnular(op.id)}
                                                                className="text-red-600 hover:text-red-900 transition"
                                                                title="Anular operación"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}