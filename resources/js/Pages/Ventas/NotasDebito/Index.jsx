import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Calendar, DollarSign, Eye, FileText, Search, XCircle } from 'lucide-react';

export default function Index({ auth }) {
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterEstado, setFilterEstado] = useState('all');

    useEffect(() => {
        fetch('/api/ventas/notas-debito')
            .then((res) => res.json())
            .then((data) => setNotas(data.data || data || []))
            .catch(() => setNotas([]))
            .finally(() => setLoading(false));
    }, []);

    const handleAnular = async (notaId) => {
        if (!confirm('Esta accion anulara la nota de debito y reversara el saldo aplicado.')) {
            return;
        }

        const response = await fetch(`/ventas/notas-debito/${notaId}/anular`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
            },
        });

        if (response.ok) {
            window.location.reload();
            return;
        }

        const error = await response.json().catch(() => ({}));
        alert(error.message || 'No se pudo anular la nota de debito.');
    };

    const filteredNotas = notas.filter((nota) => {
        const cliente = nota.factura?.cliente?.razon_social || nota.cliente?.razon_social || '';
        const factura = nota.factura?.numero_factura || nota.factura_manual_ref || '';
        const matchesSearch = [nota.numero_nota, cliente, factura]
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesTipo = filterTipo === 'all' || nota.tipo_nota === filterTipo;
        const matchesEstado = filterEstado === 'all' || nota.estado === filterEstado;
        return matchesSearch && matchesTipo && matchesEstado;
    });

    const totalMonto = filteredNotas.reduce((sum, nota) => sum + parseFloat(nota.total || 0), 0);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Notas de Debito" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex gap-3">
                        <Link href="/ventas/notas-debito/crear-manual" className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                            <FileText className="w-5 h-5 mr-2" />
                            ND Manual
                        </Link>
                        <Link href="/ventas/facturas" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            <FileText className="w-5 h-5 mr-2" />
                            Desde Factura
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por numero, factura o cliente..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="all">Todos los tipos</option>
                                <option value="recargo">Recargo</option>
                                <option value="interes">Interes</option>
                                <option value="ajuste">Ajuste</option>
                            </select>
                            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="all">Todos los estados</option>
                                <option value="Activa">Activas</option>
                                <option value="Anulada">Anuladas</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="text-sm text-gray-600">Total notas</div><div className="text-2xl font-bold">{filteredNotas.length}</div></div>
                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="text-sm text-gray-600">Recargos</div><div className="text-2xl font-bold text-amber-600">{filteredNotas.filter((n) => n.tipo_nota === 'recargo').length}</div></div>
                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="text-sm text-gray-600">Intereses</div><div className="text-2xl font-bold text-red-600">{filteredNotas.filter((n) => n.tipo_nota === 'interes').length}</div></div>
                        <div className="bg-white rounded-lg shadow-sm p-4"><div className="text-sm text-gray-600">Monto total</div><div className="text-2xl font-bold text-green-600">${totalMonto.toFixed(2)}</div></div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="py-12 text-center text-gray-500">Cargando notas de debito...</div>
                        ) : filteredNotas.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">No se encontraron notas de debito.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FE</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredNotas.map((nota) => (
                                            <tr key={nota.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{nota.numero_nota}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{nota.factura?.numero_factura || nota.factura_manual_ref || 'Manual'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{nota.factura?.cliente?.razon_social || nota.cliente?.razon_social || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 uppercase">{nota.tipo_nota}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 inline-flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(nota.fecha).toLocaleDateString('es-PA')}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 inline-flex items-center gap-1"><DollarSign className="w-4 h-4 text-green-600" />{parseFloat(nota.total || 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${nota.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>{nota.estado}</span></td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${nota.fe_status === 'FINISHED' ? 'bg-emerald-100 text-emerald-800' : nota.fe_status ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{nota.fe_status || 'No emitida'}</span>
                                                        {nota.fe_legal_status && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{nota.fe_legal_status}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/ventas/notas-debito/${nota.id}`} className="text-indigo-600 hover:text-indigo-900"><Eye className="w-5 h-5" /></Link>
                                                        {nota.estado === 'Activa' && !nota.es_electronica_emitida && <button onClick={() => handleAnular(nota.id)} className="text-red-600 hover:text-red-900"><XCircle className="w-5 h-5" /></button>}
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

