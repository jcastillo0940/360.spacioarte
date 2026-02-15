import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios'; // Importante: Usamos axios para manejar CSRF automáticamente
import { 
    ArrowLeft, 
    Search,
    TrendingDown,
    Calculator,
    AlertTriangle,
    CheckSquare,
    Square,
    FileMinus
} from 'lucide-react';

export default function CreateVenta({ auth }) {
    const [loading, setLoading] = useState(false);
    const [loadingFacturas, setLoadingFacturas] = useState(true);
    const [loadingNotasCredito, setLoadingNotasCredito] = useState(true);
    const [facturas, setFacturas] = useState([]);
    const [notasCredito, setNotasCredito] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [searchFactura, setSearchFactura] = useState('');
    const [searchNC, setSearchNC] = useState('');
    const [selectedFacturasIds, setSelectedFacturasIds] = useState([]);
    const [selectedNCIds, setSelectedNCIds] = useState([]);

    const [formData, setFormData] = useState({
        tipo: 'venta',
        fecha_operacion: new Date().toISOString().split('T')[0],
        porcentaje: 5.0,
        bank_account_id: '',
        entidad_financiera: '',
        numero_operacion_externa: '',
        notas: ''
    });

    useEffect(() => {
        fetchFacturas();
        fetchNotasCredito();
        fetchBancos();
    }, []);

    // Helper para obtener datos con axios
    const fetchData = async (url, setter, loader) => {
        try {
            const response = await axios.get(url);
            setter(Array.isArray(response.data) ? response.data : (response.data.data || []));
        } catch (error) {
            console.error(`Error cargando datos de ${url}:`, error);
            setter([]);
        } finally {
            if (loader) loader(false);
        }
    };

    const fetchFacturas = () => fetchData('/finanzas/factoring/facturas-venta-pendientes', setFacturas, setLoadingFacturas);
    const fetchNotasCredito = () => fetchData('/finanzas/factoring/notas-credito-pendientes', setNotasCredito, setLoadingNotasCredito);
    const fetchBancos = async () => {
        try {
            const response = await axios.get('/api/contabilidad/bancos');
            setBancos(Array.isArray(response.data) ? response.data : (response.data.bancos || []));
        } catch (error) {
            console.error('Error al cargar bancos:', error);
            setBancos([]);
        }
    };

    const toggleFactura = (facturaId) => {
        setSelectedFacturasIds(prev => prev.includes(facturaId) ? prev.filter(id => id !== facturaId) : [...prev, facturaId]);
    };

    const toggleNC = (ncId) => {
        setSelectedNCIds(prev => prev.includes(ncId) ? prev.filter(id => id !== ncId) : [...prev, ncId]);
    };

    const toggleAllFacturas = () => {
        setSelectedFacturasIds(selectedFacturasIds.length === filteredFacturas.length ? [] : filteredFacturas.map(f => f.id));
    };

    const toggleAllNC = () => {
        setSelectedNCIds(selectedNCIds.length === filteredNotasCredito.length ? [] : filteredNotasCredito.map(nc => nc.id));
    };

    const calcularMontos = () => {
        const selectedFacturas = facturas.filter(f => selectedFacturasIds.includes(f.id));
        const selectedNC = notasCredito.filter(nc => selectedNCIds.includes(nc.id));
        
        const montoFacturas = selectedFacturas.reduce((sum, f) => sum + parseFloat(f.monto_factorable || f.saldo_pendiente), 0);
        const montoNC = selectedNC.reduce((sum, nc) => sum + parseFloat(nc.monto || nc.total || 0), 0);

        const montoTotal = montoFacturas - montoNC;
        const cargoTotal = montoTotal * (formData.porcentaje / 100);
        const montoNeto = montoTotal - cargoTotal;

        return { 
            montoFacturas, montoNC, montoTotal, cargoTotal, montoNeto,
            cantidadFacturas: selectedFacturas.length,
            cantidadNC: selectedNC.length
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedFacturasIds.length === 0 && selectedNCIds.length === 0) {
            alert('Debe seleccionar al menos una factura o nota de crédito');
            return;
        }
        if (!formData.bank_account_id) return alert('Debe seleccionar una cuenta bancaria');
        if (!formData.entidad_financiera.trim()) return alert('Debe ingresar la entidad financiera');

        setLoading(true);

        try {
            // USO DE AXIOS: Maneja automáticamente el XSRF-TOKEN cookie para evitar error 419
            const response = await axios.post('/finanzas/factoring', {
                ...formData,
                facturas_ids: selectedFacturasIds,
                notas_credito_ids: selectedNCIds
            });

            if (response.status === 200 || response.status === 201) {
                const totalDocs = selectedFacturasIds.length + selectedNCIds.length;
                alert(`Operación registrada exitosamente (${totalDocs} documentos)`);
                router.visit('/finanzas/factoring');
            }
        } catch (error) {
            console.error('Error al registrar:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Error de conexión o servidor';
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredFacturas = facturas.filter(f => 
        f.numero_factura?.toLowerCase().includes(searchFactura.toLowerCase()) ||
        f.cliente?.razon_social?.toLowerCase().includes(searchFactura.toLowerCase())
    );

    const filteredNotasCredito = notasCredito.filter(nc => 
        nc.numero_nota?.toLowerCase().includes(searchNC.toLowerCase()) ||
        nc.cliente?.razon_social?.toLowerCase().includes(searchNC.toLowerCase())
    );

    const { montoFacturas, montoNC, montoTotal, cargoTotal, montoNeto, cantidadFacturas, cantidadNC } = calcularMontos();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Factoring de Venta - Cargo Financiero" />

            <div className="py-12">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button onClick={() => router.visit('/finanzas/factoring')} className="text-gray-600 hover:text-gray-900 transition">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <TrendingDown className="w-8 h-8 text-orange-600" />
                                    <h1 className="text-3xl font-bold text-gray-900">Factoring de Venta</h1>
                                </div>
                                <p className="text-gray-600 mt-1">Adelanto de cobro con cargo financiero (Selección múltiple agrupada)</p>
                            </div>
                        </div>

                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <h3 className="text-sm font-semibold text-orange-900">Operación con Costo Financiero</h3>
                                    <p className="text-sm text-orange-800 mt-1">
                                        Esta operación generará un gasto financiero. El banco cobrará un porcentaje por adelantar el cobro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Selección de Facturas */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Seleccionar Facturas de Venta</h2>
                                <span className="text-sm text-gray-600">{selectedFacturasIds.length} de {filteredFacturas.length} seleccionadas</span>
                            </div>

                            {loadingFacturas ? (
                                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                            ) : (
                                <>
                                    <div className="flex gap-4 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                                            <input type="text" placeholder="Buscar factura o cliente..." value={searchFactura} onChange={(e) => setSearchFactura(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                        </div>
                                        <button type="button" onClick={toggleAllFacturas} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap">
                                            {selectedFacturasIds.length === filteredFacturas.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                        {filteredFacturas.length === 0 ? <div className="text-center py-8 text-gray-500">No hay facturas pendientes</div> : filteredFacturas.map(factura => {
                                            const isSelected = selectedFacturasIds.includes(factura.id);
                                            return (
                                                <button key={factura.id} type="button" onClick={() => toggleFactura(factura.id)} className={`w-full p-4 text-left hover:bg-orange-50 transition border-b border-gray-100 ${isSelected ? 'bg-orange-100 border-l-4 border-l-orange-600' : ''}`}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1">{isSelected ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5 text-gray-400" />}</div>
                                                        <div className="flex-1 flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{factura.numero_factura}</div>
                                                                <div className="text-sm text-gray-600 mt-1">{factura.cliente?.razon_social}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-gray-900">${parseFloat(factura.saldo_pendiente).toFixed(2)}</div>
                                                                <div className="text-xs text-gray-500">Saldo pendiente</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Selección de Notas de Crédito */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2"><FileMinus className="w-5 h-5 text-red-600" /><h2 className="text-xl font-semibold text-gray-900">Seleccionar Notas de Crédito</h2></div>
                                <span className="text-sm text-gray-600">{selectedNCIds.length} de {filteredNotasCredito.length} seleccionadas</span>
                            </div>
                            {loadingNotasCredito ? (
                                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                            ) : (
                                <>
                                    <div className="flex gap-4 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                                            <input type="text" placeholder="Buscar nota o cliente..." value={searchNC} onChange={(e) => setSearchNC(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                                        </div>
                                        <button type="button" onClick={toggleAllNC} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap">
                                            {selectedNCIds.length === filteredNotasCredito.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                        {filteredNotasCredito.length === 0 ? <div className="text-center py-8 text-gray-500">No hay notas de crédito pendientes</div> : filteredNotasCredito.map(nc => {
                                            const isSelected = selectedNCIds.includes(nc.id);
                                            return (
                                                <button key={nc.id} type="button" onClick={() => toggleNC(nc.id)} className={`w-full p-4 text-left hover:bg-red-50 transition border-b border-gray-100 ${isSelected ? 'bg-red-100 border-l-4 border-l-red-600' : ''}`}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1">{isSelected ? <CheckSquare className="w-5 h-5 text-red-600" /> : <Square className="w-5 h-5 text-gray-400" />}</div>
                                                        <div className="flex-1 flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-gray-900 flex items-center gap-2"><FileMinus className="w-4 h-4 text-red-600" />{nc.numero_nota}</div>
                                                                <div className="text-sm text-gray-600 mt-1">{nc.cliente?.razon_social}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-red-700">-${parseFloat(nc.monto || nc.total).toFixed(2)}</div>
                                                                <div className="text-xs text-gray-500">Resta del total</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Detalles Financieros y Botones */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Operación</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Operación *</label>
                                    <input type="date" value={formData.fecha_operacion} onChange={(e) => setFormData(prev => ({ ...prev, fecha_operacion: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Porcentaje de Cargo (%) *</label>
                                    <input type="number" step="0.01" min="0" max="100" value={formData.porcentaje} onChange={(e) => setFormData(prev => ({ ...prev, porcentaje: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta Bancaria *</label>
                                    <select value={formData.bank_account_id} onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required>
                                        <option value="">Seleccionar banco...</option>
                                        {bancos.map(b => <option key={b.id} value={b.id}>{b.nombre_banco} - {b.numero_cuenta}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Entidad Financiera *</label>
                                    <input type="text" value={formData.entidad_financiera} onChange={(e) => setFormData(prev => ({ ...prev, entidad_financiera: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Ej: Banco General" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">No. Operación Externa</label>
                                    <input type="text" value={formData.numero_operacion_externa} onChange={(e) => setFormData(prev => ({ ...prev, numero_operacion_externa: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Ej: FACT-001" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                                    <textarea value={formData.notas} onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Observaciones..." />
                                </div>
                            </div>
                        </div>

                        {(selectedFacturasIds.length > 0 || selectedNCIds.length > 0) && (
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm p-6 border-2 border-orange-200">
                                <div className="flex items-center gap-2 mb-4"><Calculator className="w-6 h-6 text-orange-700" /><h3 className="text-lg font-semibold text-orange-900">Resumen</h3></div>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Facturas</p><p className="text-2xl font-bold text-green-700">+${montoFacturas.toFixed(2)}</p></div>
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Notas Crédito</p><p className="text-2xl font-bold text-red-700">-${montoNC.toFixed(2)}</p></div>
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Monto Base</p><p className="text-2xl font-bold text-gray-900">${montoTotal.toFixed(2)}</p></div>
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Cargo ({formData.porcentaje}%)</p><p className="text-2xl font-bold text-orange-600">-${cargoTotal.toFixed(2)}</p></div>
                                    <div className="bg-white rounded-lg p-4 border-2 border-orange-500"><p className="text-sm text-gray-600">A Recibir</p><p className="text-2xl font-bold text-orange-700">${montoNeto.toFixed(2)}</p></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => router.visit('/finanzas/factoring')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition" disabled={loading}>Cancelar</button>
                            <button type="submit" disabled={loading || (selectedFacturasIds.length === 0 && selectedNCIds.length === 0)} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
                                {loading ? 'Procesando...' : <><TrendingDown className="w-5 h-5" />Registrar Operación</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}