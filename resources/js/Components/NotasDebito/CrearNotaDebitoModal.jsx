import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function CrearNotaDebitoModal({ isOpen, onClose, facturaId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [factura, setFactura] = useState(null);
    const [formData, setFormData] = useState({
        tipo_nota: 'ajuste',
        motivo: '',
        items: [],
    });

    useEffect(() => {
        if (!isOpen || !facturaId) {
            return;
        }

        setLoadingData(true);
        fetch(`/api/ventas/facturas/${facturaId}/datos-nd`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.factura?.detalles) {
                    throw new Error('No se pudo cargar la factura.');
                }

                setFactura(data.factura);
                setFormData((prev) => ({
                    ...prev,
                    items: data.factura.detalles.map((detalle) => ({
                        item_id: detalle.item.id,
                        item_nombre: detalle.item.nombre,
                        item_codigo: detalle.item.codigo,
                        cantidad: 0,
                        cantidad_facturada: parseFloat(detalle.cantidad || 0),
                        precio_unitario: parseFloat(detalle.precio_unitario || 0),
                    })),
                }));
            })
            .catch((error) => {
                alert(error.message || 'No se pudo cargar la factura.');
                onClose();
            })
            .finally(() => setLoadingData(false));
    }, [isOpen, facturaId, onClose]);

    if (!isOpen) {
        return null;
    }

    const updateItem = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
        }));
    };

    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)), 0);
    const itbms = formData.items.reduce((sum, item) => {
        const detalle = factura?.detalles?.find((row) => row.item_id === item.item_id);
        const rate = parseFloat(detalle?.porcentaje_itbms || detalle?.item?.tax?.tasa || 0);
        return sum + ((parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)) * rate / 100);
    }, 0);
    const total = subtotal + itbms;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedItems = formData.items.filter((item) => parseFloat(item.cantidad || 0) > 0);

        if (!formData.motivo.trim() || selectedItems.length === 0) {
            alert('Debes ingresar un motivo y al menos una linea con cantidad mayor a 0.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/ventas/notas-debito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    es_manual: false,
                    factura_venta_id: facturaId,
                    tipo_nota: formData.tipo_nota,
                    motivo: formData.motivo,
                    items: selectedItems.map((item) => ({
                        item_id: item.item_id,
                        cantidad: parseFloat(item.cantidad || 0),
                        precio_unitario: parseFloat(item.precio_unitario || 0),
                    })),
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo crear la nota de debito.');
            }

            onSuccess && onSuccess(payload);
            onClose();
        } catch (error) {
            alert(error.message || 'No se pudo crear la nota de debito.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Crear Nota de Debito</h2>
                        {factura && <p className="text-sm text-gray-600 mt-1">Factura: {factura.numero_factura} - Cliente: {factura.cliente?.razon_social}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                {loadingData ? (
                    <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de nota *</label>
                                    <select value={formData.tipo_nota} onChange={(e) => setFormData((prev) => ({ ...prev, tipo_nota: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                        <option value="ajuste">Ajuste</option>
                                        <option value="recargo">Recargo</option>
                                        <option value="interes">Interes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo *</label>
                                    <input value={formData.motivo} onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facturado</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad ND</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formData.items.map((item, index) => (
                                                <tr key={item.item_id} className={parseFloat(item.cantidad || 0) > 0 ? 'bg-amber-50' : ''}>
                                                    <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-900">{item.item_nombre}</p><p className="text-xs text-gray-500">{item.item_codigo}</p></div></td>
                                                    <td className="px-4 py-3 text-center text-sm text-gray-900">{item.cantidad_facturada.toFixed(2)}</td>
                                                    <td className="px-4 py-3"><input type="number" step="0.01" min="0" value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)} className="w-24 px-2 py-1 text-center border border-gray-300 rounded" /></td>
                                                    <td className="px-4 py-3 text-right"><input type="number" step="0.01" min="0" value={item.precio_unitario} onChange={(e) => updateItem(index, 'precio_unitario', e.target.value)} className="w-28 px-2 py-1 text-right border border-gray-300 rounded" /></td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${(parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-600">ITBMS</span><span className="font-medium">${itbms.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300"><span>Total</span><span className="text-amber-600">${total.toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100" disabled={loading}>Cancelar</button>
                            <button type="submit" disabled={loading || total <= 0} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">{loading ? 'Procesando...' : 'Crear Nota de Debito'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
