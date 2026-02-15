import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios'; // Axios importado
import { 
    ArrowLeft, 
    Search,
    TrendingUp,
    Calculator,
    CheckSquare,
    Square
} from 'lucide-react';

export default function CreateCompra({ auth }) {
    const [loading, setLoading] = useState(false);
    const [loadingFacturas, setLoadingFacturas] = useState(true);
    const [facturas, setFacturas] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [searchFactura, setSearchFactura] = useState('');
    const [selectedFacturasIds, setSelectedFacturasIds] = useState([]);

    const [formData, setFormData] = useState({
        tipo: 'compra',
        fecha_operacion: new Date().toISOString().split('T')[0],
        porcentaje: 4.0,
        bank_account_id: '',
        entidad_financiera: '',
        numero_operacion_externa: '',
        notas: ''
    });

    useEffect(() => {
        fetchFacturas();
        fetchBancos();
    }, []);

    const fetchFacturas = async () => {
        try {
            const response = await axios.get('/finanzas/factoring/facturas-compra-pendientes');
            setFacturas(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
            setFacturas([]);
        } finally {
            setLoadingFacturas(false);
        }
    };

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

    const toggleAll = () => {
        setSelectedFacturasIds(selectedFacturasIds.length === filteredFacturas.length ? [] : filteredFacturas.map(f => f.id));
    };

    const calcularMontos = () => {
        const selectedFacturas = facturas.filter(f => selectedFacturasIds.includes(f.id));
        const montoTotal = selectedFacturas.reduce((sum, f) => sum + parseFloat(f.saldo_pendiente), 0);
        const descuentoTotal = montoTotal * (formData.porcentaje / 100);
        const montoNeto = montoTotal - descuentoTotal;

        return { montoTotal, descuentoTotal, montoNeto, cantidadFacturas: selectedFacturas.length };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedFacturasIds.length === 0) return alert('Debe seleccionar al menos una factura');
        if (!formData.bank_account_id) return alert('Debe seleccionar una cuenta bancaria');

        setLoading(true);

        try {
            // USO DE AXIOS: Soluciona el error 419 CSRF Token Mismatch
            const response = await axios.post('/finanzas/factoring', {
                ...formData,
                facturas_ids: selectedFacturasIds
            });

            if (response.status === 200 || response.status === 201) {
                alert(`Operación registrada exitosamente (${selectedFacturasIds.length} facturas)`);
                router.visit('/finanzas/factoring');
            }
        } catch (error) {
            console.error('Error:', error);
            const msg = error.response?.data?.error || 'Error de conexión';
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredFacturas = facturas.filter(f => 
        f.numero_factura_proveedor?.toLowerCase().includes(searchFactura.toLowerCase()) ||
        f.proveedor?.razon_social?.toLowerCase().includes(searchFactura.toLowerCase())
    );

    const { montoTotal, descuentoTotal, montoNeto, cantidadFacturas } = calcularMontos();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Factoring de Compra - Descuento Proveedor" />

            <div className="py-12">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button onClick={() => router.visit('/finanzas/factoring')} className="text-gray-600 hover:text-gray-900 transition">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                    <h1 className="text-3xl font-bold text-gray-900">Factoring de Compra</h1>
                                </div>
                                <p className="text-gray-600 mt-1">Descuento por pronto pago a proveedor (Selección múltiple agrupada)</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Seleccionar Facturas</h2>
                                <span className="text-sm text-gray-600">{selectedFacturasIds.length} de {filteredFacturas.length} seleccionadas</span>
                            </div>

                            {loadingFacturas ? (
                                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                            ) : (
                                <>
                                    <div className="flex gap-4 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                                            <input type="text" placeholder="Buscar..." value={searchFactura} onChange={(e) => setSearchFactura(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        </div>
                                        <button type="button" onClick={toggleAll} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap">
                                            {selectedFacturasIds.length === filteredFacturas.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                        {filteredFacturas.length === 0 ? <div className="text-center py-8 text-gray-500">No hay facturas</div> : filteredFacturas.map(factura => {
                                            const isSelected = selectedFacturasIds.includes(factura.id);
                                            return (
                                                <button key={factura.id} type="button" onClick={() => toggleFactura(factura.id)} className={`w-full p-4 text-left hover:bg-green-50 transition border-b border-gray-100 ${isSelected ? 'bg-green-100 border-l-4 border-l-green-600' : ''}`}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1">{isSelected ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-400" />}</div>
                                                        <div className="flex-1 flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{factura.numero_factura_proveedor}</div>
                                                                <div className="text-sm text-gray-600 mt-1">{factura.proveedor?.razon_social}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-gray-900">${parseFloat(factura.saldo_pendiente).toFixed(2)}</div>
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

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label><input type="date" value={formData.fecha_operacion} onChange={(e) => setFormData(prev => ({ ...prev, fecha_operacion: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-2">Descuento (%) *</label><input type="number" step="0.01" value={formData.porcentaje} onChange={(e) => setFormData(prev => ({ ...prev, porcentaje: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-2">Banco Pago *</label><select value={formData.bank_account_id} onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required><option value="">Seleccionar...</option>{bancos.map(b => <option key={b.id} value={b.id}>{b.nombre_banco} - {b.numero_cuenta}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-2">Entidad Financiera</label><input type="text" value={formData.entidad_financiera} onChange={(e) => setFormData(prev => ({ ...prev, entidad_financiera: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Notas</label><textarea value={formData.notas} onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" /></div>
                            </div>
                        </div>

                        {selectedFacturasIds.length > 0 && (
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-4"><Calculator className="w-6 h-6 text-green-700" /><h3 className="text-lg font-semibold text-green-900">Resumen</h3></div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Facturas</p><p className="text-2xl font-bold text-gray-900">{cantidadFacturas}</p></div>
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold text-gray-900">${montoTotal.toFixed(2)}</p></div>
                                    <div className="bg-white rounded-lg p-4"><p className="text-sm text-gray-600">Descuento</p><p className="text-2xl font-bold text-green-600">${descuentoTotal.toFixed(2)}</p></div>
                                    <div className="bg-white rounded-lg p-4 border-2 border-green-500"><p className="text-sm text-gray-600">A Pagar</p><p className="text-2xl font-bold text-green-700">${montoNeto.toFixed(2)}</p></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => router.visit('/finanzas/factoring')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition" disabled={loading}>Cancelar</button>
                            <button type="submit" disabled={loading || selectedFacturasIds.length === 0} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                                {loading ? 'Procesando...' : <><TrendingUp className="w-5 h-5" />Registrar Operación</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}