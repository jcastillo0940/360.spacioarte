import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Search, 
    FileText, 
    Eye, 
    XCircle,
    Filter,
    Calendar,
    User,
    DollarSign,
    AlertCircle
} from 'lucide-react';

export default function Index({ auth }) {
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterEstado, setFilterEstado] = useState('all');

    useEffect(() => {
        fetchNotas();
    }, []);

    const fetchNotas = async () => {
        try {
            const response = await fetch('/api/ventas/notas-credito');
            const data = await response.json();
            setNotas(data.data || data);
        } catch (error) {
            console.error('Error al cargar notas de crédito:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async (notaId) => {
        if (!confirm('¿Está seguro de anular esta nota de crédito? Esta acción reversará todos los cambios.')) {
            return;
        }

        try {
            const response = await fetch(`/ventas/notas-credito/${notaId}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
            });

            if (response.ok) {
                alert('Nota de crédito anulada exitosamente');
                fetchNotas();
            } else {
                const error = await response.json();
                alert(error.message || 'Error al anular la nota de crédito');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al anular la nota de crédito');
        }
    };

    const getTipoBadge = (tipo) => {
        const badges = {
            devolucion: { color: 'bg-blue-100 text-blue-800', label: 'Devolución' },
            merma: { color: 'bg-red-100 text-red-800', label: 'Merma' },
            descuento: { color: 'bg-green-100 text-green-800', label: 'Descuento' }
        };
        const badge = badges[tipo] || badges.devolucion;
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const getEstadoBadge = (estado) => {
        return estado === 'Activa' ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Activa
            </span>
        ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Anulada
            </span>
        );
    };

    const filteredNotas = notas.filter(nota => {
        const matchesSearch = 
            nota.numero_nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nota.factura?.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nota.factura?.cliente?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesTipo = filterTipo === 'all' || nota.tipo_nota === filterTipo;
        const matchesEstado = filterEstado === 'all' || nota.estado === filterEstado;

        return matchesSearch && matchesTipo && matchesEstado;
    });

    if (loading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Notas de Crédito" />
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
            <Head title="Notas de Crédito" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex gap-3">
                                <Link
                                    href="/ventas/notas-credito/crear-manual"
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    NC Manual
                                </Link>
                                <Link
                                    href="/ventas/facturas"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    Desde Factura
                                </Link>
                    </div>

                    {/* Filtros y Búsqueda */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Búsqueda */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por número, factura o cliente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Filtro por Tipo */}
                            <div>
                                <select
                                    value={filterTipo}
                                    onChange={(e) => setFilterTipo(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los tipos</option>
                                    <option value="devolucion">Devolución</option>
                                    <option value="merma">Merma</option>
                                    <option value="descuento">Descuento</option>
                                </select>
                            </div>

                            {/* Filtro por Estado */}
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

                    {/* Estadísticas Rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Notas</p>
                                    <p className="text-2xl font-bold text-gray-900">{notas.length}</p>
                                </div>
                                <FileText className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Devoluciones</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {notas.filter(n => n.tipo_nota === 'devolucion').length}
                                    </p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Mermas</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {notas.filter(n => n.tipo_nota === 'merma').length}
                                    </p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Monto</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${notas.reduce((sum, n) => sum + parseFloat(n.total || 0), 0).toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Notas */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {filteredNotas.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No se encontraron notas de crédito</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Número NC
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Factura
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cliente
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredNotas.map((nota) => (
                                            <tr key={nota.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {nota.numero_nota}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {nota.factura?.numero_factura || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-900">
                                                            {nota.factura?.cliente?.razon_social || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getTipoBadge(nota.tipo_nota)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        {new Date(nota.fecha).toLocaleDateString('es-PA')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm font-semibold text-gray-900">
                                                        <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                                                        {parseFloat(nota.total).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getEstadoBadge(nota.estado)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/ventas/notas-credito/${nota.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900 transition"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </Link>
                                                        {nota.estado === 'Activa' && (
                                                            <button
                                                                onClick={() => handleAnular(nota.id)}
                                                                className="text-red-600 hover:text-red-900 transition"
                                                                title="Anular nota de crédito"
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