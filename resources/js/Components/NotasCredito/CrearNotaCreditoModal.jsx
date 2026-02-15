import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle, Package, DollarSign, CheckCircle } from 'lucide-react';

export default function CrearNotaCreditoModal({ 
    isOpen, 
    onClose, 
    facturaId, 
    onSuccess 
}) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [factura, setFactura] = useState(null);
    const [cantidadesDevueltas, setCantidadesDevueltas] = useState({});
    
    const [formData, setFormData] = useState({
        tipo_nota: 'devolucion',
        motivo: '',
        items: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && facturaId) {
            fetchDatosFactura();
        }
    }, [isOpen, facturaId]);

    const fetchDatosFactura = async () => {
        setLoadingData(true);
        try {
            const response = await fetch(`/api/ventas/facturas/${facturaId}/datos-nc`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Verificar que los datos sean válidos
            if (!data.factura || !data.factura.detalles) {
                throw new Error('Los datos de la factura están incompletos');
            }
            
            setFactura(data.factura);
            setCantidadesDevueltas(data.cantidades_devueltas || {});
            
            // Inicializar items con cantidad 0
            const initialItems = data.factura.detalles.map(detalle => ({
                item_id: detalle.item.id,
                item_nombre: detalle.item.nombre,
                item_codigo: detalle.item.codigo,
                cantidad_facturada: parseFloat(detalle.cantidad),
                cantidad_devuelta: parseFloat(data.cantidades_devueltas[detalle.item.id] || 0),
                cantidad: 0,
                precio_unitario: parseFloat(detalle.precio_unitario),
                devolver_stock: true,
                tipo_item: detalle.item.tipo
            }));
            
            setFormData(prev => ({
                ...prev,
                items: initialItems
            }));
        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert(`Error al cargar los datos de la factura: ${error.message}`);
            onClose(); // Cerrar el modal si hay error
        } finally {
            setLoadingData(false);
        }
    };

    const handleTipoNotaChange = (tipo) => {
        setFormData(prev => {
            const updatedItems = prev.items.map(item => ({
                ...item,
                devolver_stock: tipo === 'devolucion' // Auto-ajustar según tipo
            }));
            
            return {
                ...prev,
                tipo_nota: tipo,
                items: updatedItems
            };
        });
    };

    const handleItemCantidadChange = (index, value) => {
        const newValue = parseFloat(value) || 0;
        const item = formData.items[index];
        const maxDisponible = item.cantidad_facturada - item.cantidad_devuelta;
        
        if (newValue > maxDisponible) {
            setErrors(prev => ({
                ...prev,
                [`item_${index}`]: `Máximo disponible: ${maxDisponible.toFixed(2)}`
            }));
            return;
        }
        
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`item_${index}`];
            return newErrors;
        });
        
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, cantidad: newValue } : item
            )
        }));
    };

    const handleDevolverStockChange = (index, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, devolver_stock: value } : item
            )
        }));
    };

    const calcularSubtotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (item.cantidad * item.precio_unitario);
        }, 0);
    };

    const calcularITBMS = () => {
        // Simplificado - deberías obtener la tasa real del item
        return calcularSubtotal() * 0.07;
    };

    const calcularTotal = () => {
        return calcularSubtotal() + calcularITBMS();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        const itemsConCantidad = formData.items.filter(item => item.cantidad > 0);
        
        if (itemsConCantidad.length === 0) {
            alert('Debe seleccionar al menos un producto con cantidad mayor a 0');
            return;
        }
        
        if (!formData.motivo.trim()) {
            alert('Debe ingresar un motivo para la nota de crédito');
            return;
        }
        
        setLoading(true);
        
        try {
            const payload = {
                factura_venta_id: facturaId,
                tipo_nota: formData.tipo_nota,
                motivo: formData.motivo,
                items: itemsConCantidad.map(item => ({
                    item_id: item.item_id,
                    cantidad: item.cantidad,
                    devolver_stock: item.devolver_stock
                }))
            };
            
            const response = await fetch('/ventas/notas-credito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                alert('Nota de crédito creada exitosamente');
                onSuccess && onSuccess(data);
                onClose();
            } else {
                const error = await response.json();
                alert(error.message || 'Error al crear la nota de crédito');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear la nota de crédito');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Crear Nota de Crédito
                        </h2>
                        {factura && (
                            <p className="text-sm text-gray-600 mt-1">
                                Factura: {factura.numero_factura} - Cliente: {factura.cliente?.razon_social}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {loadingData ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Tipo de Nota */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Tipo de Nota de Crédito *
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleTipoNotaChange('devolucion')}
                                        className={`p-4 rounded-lg border-2 transition ${
                                            formData.tipo_nota === 'devolucion'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <Package className={`w-8 h-8 mx-auto mb-2 ${
                                            formData.tipo_nota === 'devolucion' ? 'text-blue-600' : 'text-gray-400'
                                        }`} />
                                        <p className="font-semibold text-sm">Devolución</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Producto regresa al inventario
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTipoNotaChange('merma')}
                                        className={`p-4 rounded-lg border-2 transition ${
                                            formData.tipo_nota === 'merma'
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${
                                            formData.tipo_nota === 'merma' ? 'text-red-600' : 'text-gray-400'
                                        }`} />
                                        <p className="font-semibold text-sm">Merma</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Producto dañado/perdido
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTipoNotaChange('descuento')}
                                        className={`p-4 rounded-lg border-2 transition ${
                                            formData.tipo_nota === 'descuento'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
                                            formData.tipo_nota === 'descuento' ? 'text-green-600' : 'text-gray-400'
                                        }`} />
                                        <p className="font-semibold text-sm">Descuento</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Ajuste de precio
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo de la Nota de Crédito *
                                </label>
                                <textarea
                                    value={formData.motivo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ej: Cliente devuelve productos por defecto de fábrica"
                                    required
                                />
                            </div>

                            {/* Productos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Productos a Incluir en la NC
                                </label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Producto
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Facturado
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Ya Devuelto
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Disponible
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Cantidad NC
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Devolver Stock
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Subtotal
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {formData.items.map((item, index) => {
                                                    const disponible = item.cantidad_facturada - item.cantidad_devuelta;
                                                    return (
                                                        <tr key={index} className={item.cantidad > 0 ? 'bg-blue-50' : ''}>
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {item.item_nombre}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {item.item_codigo}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-sm text-gray-900">
                                                                {item.cantidad_facturada.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                                {item.cantidad_devuelta.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                                                                {disponible.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max={disponible}
                                                                    value={item.cantidad}
                                                                    onChange={(e) => handleItemCantidadChange(index, e.target.value)}
                                                                    className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                                {errors[`item_${index}`] && (
                                                                    <p className="text-xs text-red-600 mt-1">
                                                                        {errors[`item_${index}`]}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {item.tipo_item === 'Inventariable' ? (
                                                                    <label className="inline-flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.devolver_stock}
                                                                            onChange={(e) => handleDevolverStockChange(index, e.target.checked)}
                                                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                                        />
                                                                    </label>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                                ${(item.cantidad * item.precio_unitario).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la NC</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">${calcularSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">ITBMS:</span>
                                        <span className="font-medium">${calcularITBMS().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                                        <span>Total:</span>
                                        <span className="text-indigo-600">${calcularTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || calcularTotal() === 0}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Procesando...' : 'Crear Nota de Crédito'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}