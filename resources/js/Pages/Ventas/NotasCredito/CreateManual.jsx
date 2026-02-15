import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, 
    Plus, 
    Trash2, 
    Search,
    AlertCircle,
    Package,
    DollarSign,
    FileText,
    XCircle
} from 'lucide-react';

export default function CreateManual({ auth }) {
    const [loading, setLoading] = useState(false);
    const [contactos, setContactos] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [items, setItems] = useState([]);
    const [searchContacto, setSearchContacto] = useState('');
    const [searchItem, setSearchItem] = useState('');

    const [formData, setFormData] = useState({
        es_manual: true,
        factura_manual_ref: '',
        fecha_factura_original: '',
        contacto_id: '',
        sucursal_id: '',
        tipo_nota: 'devolucion',
        motivo: '',
        es_merma: false,
        items: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchContactos();
        fetchItems();
    }, []);

    const fetchContactos = async () => {
        try {
            const response = await fetch('/api/inventario/contactos', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            setContactos(Array.isArray(data.contactos) ? data.contactos : []);
        } catch (error) {
            console.error('Error al cargar contactos:', error);
            setContactos([]);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/inventario/items', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (error) {
            console.error('Error al cargar items:', error);
            setItems([]);
        }
    };

    const fetchSucursales = async (contactoId) => {
        if (!contactoId) {
            setSucursales([]);
            return;
        }
        try {
            const response = await fetch(`/api/inventario/sucursales/contacto/${contactoId}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            setSucursales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
            setSucursales([]);
        }
    };

    const handleTipoNotaChange = (tipo) => {
        setFormData(prev => ({
            ...prev,
            tipo_nota: tipo,
            es_merma: tipo === 'merma'
        }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                item_id: '',
                cantidad: 0,
                precio_unitario: 0,
                devolver_stock: true
            }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleItemSelect = (index, itemId) => {
        const selectedItem = items.find(i => i.id === parseInt(itemId));
        if (selectedItem) {
            updateItem(index, 'item_id', itemId);
            updateItem(index, 'precio_unitario', selectedItem.precio_venta);
        }
    };

    const calcularSubtotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0));
        }, 0);
    };

    const calcularITBMS = () => {
        return formData.items.reduce((sum, item) => {
            const selectedItem = items.find(i => i.id === parseInt(item.item_id));
            const tasa = selectedItem?.tax?.tasa || 0;
            const subtotalItem = parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0);
            return sum + (subtotalItem * (tasa / 100));
        }, 0);
    };

    const calcularTotal = () => {
        return calcularSubtotal() + calcularITBMS();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!formData.factura_manual_ref.trim()) {
            alert('Debe ingresar el número de factura manual');
            return;
        }

        if (!formData.contacto_id) {
            alert('Debe seleccionar un cliente');
            return;
        }

        if (formData.items.length === 0) {
            alert('Debe agregar al menos un producto');
            return;
        }

        if (sucursales.length > 0 && !formData.sucursal_id) {
            alert('Debe seleccionar una sucursal');
            return;
        }

        if (!formData.motivo.trim()) {
            alert('Debe ingresar un motivo');
            return;
        }

        setLoading(true);
        setErrors({});

        // SOLUCIÓN: Usar router.post de Inertia en lugar de fetch
        router.post('/ventas/notas-credito', formData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                alert('Nota de crédito manual creada exitosamente');
            },
            onError: (errors) => {
                console.error('Errores de validación:', errors);
                setErrors(errors);
                
                const primerError = Object.values(errors)[0];
                if (primerError) {
                    alert(Array.isArray(primerError) ? primerError[0] : primerError);
                }
            },
            onFinish: () => {
                setLoading(false);
            }
        });
    };

    const filteredContactos = Array.isArray(contactos) ? contactos.filter(c => 
        c.razon_social?.toLowerCase().includes(searchContacto.toLowerCase()) ||
        c.identificacion?.toLowerCase().includes(searchContacto.toLowerCase())
    ) : [];

    const filteredItems = Array.isArray(items) ? items.filter(i => 
        i.nombre?.toLowerCase().includes(searchItem.toLowerCase()) ||
        i.codigo?.toLowerCase().includes(searchItem.toLowerCase())
    ) : [];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Crear Nota de Crédito Manual" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.visit('/ventas/notas-credito')}
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Nota de Crédito Manual
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Para facturas físicas o manuales ya pagadas
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información de la Factura Manual */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Referencia de Factura Manual
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Número de Factura Manual *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.factura_manual_ref}
                                        onChange={(e) => setFormData(prev => ({ ...prev, factura_manual_ref: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Ej: FAC-2024-001234"
                                        required
                                    />
                                    {errors.factura_manual_ref && (
                                        <p className="text-red-500 text-xs mt-1">{errors.factura_manual_ref}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de Factura Original *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.fecha_factura_original}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_factura_original: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                    {errors.fecha_factura_original && (
                                        <p className="text-red-500 text-xs mt-1">{errors.fecha_factura_original}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        
                        {/* Cliente */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cliente *</h2>
                            
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Escriba para buscar cliente por nombre o RUC..."
                                    value={searchContacto}
                                    onChange={(e) => setSearchContacto(e.target.value)}
                                    onFocus={() => setSearchContacto('')}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                                />
                                
                                {/* Dropdown con resultados */}
                                {searchContacto && filteredContactos.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                        {filteredContactos.map(contacto => (
                                            <button
                                                key={contacto.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, contacto_id: contacto.id, sucursal_id: '' }));
                                                    setSearchContacto(`${contacto.razon_social} - ${contacto.identificacion}`);
                                                    fetchSucursales(contacto.id);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition border-b border-gray-100 last:border-0"
                                            >
                                                <div className="font-semibold text-gray-900">{contacto.razon_social}</div>
                                                <div className="text-sm text-gray-500">
                                                    {contacto.tipo} - RUC: {contacto.identificacion}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Cliente seleccionado */}
                                {formData.contacto_id && !searchContacto.includes('-') && (
                                    <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-indigo-900">
                                                    {contactos.find(c => c.id === parseInt(formData.contacto_id))?.razon_social}
                                                </div>
                                                <div className="text-sm text-indigo-700">
                                                    RUC: {contactos.find(c => c.id === parseInt(formData.contacto_id))?.identificacion}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, contacto_id: '', sucursal_id: '' }));
                                                    setSearchContacto('');
                                                    setSucursales([]);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <XCircle className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Selector de Sucursal */}
                                {formData.contacto_id && sucursales.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sucursal del Cliente *
                                        </label>
                                        <select
                                            value={formData.sucursal_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, sucursal_id: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required={sucursales.length > 0}
                                        >
                                            <option value="">Seleccione una sucursal...</option>
                                            {sucursales.map(sucursal => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre} - {sucursal.direccion}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2">
                                            📊 Esto permite rastrear qué sucursales generan más devoluciones
                                        </p>
                                        {errors.sucursal_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.sucursal_id}</p>
                                        )}
                                    </div>
                                )}
                                {errors.contacto_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.contacto_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Tipo de NC */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Tipo de Nota de Crédito *
                            </h2>
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
                                    <p className="text-xs text-gray-600 mt-1">Producto regresa</p>
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
                                    <p className="text-xs text-gray-600 mt-1">Producto dañado</p>
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
                                    <p className="text-xs text-gray-600 mt-1">Ajuste precio</p>
                                </button>
                            </div>
                        </div>

                        {/* Motivo */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
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
                            {errors.motivo && (
                                <p className="text-red-500 text-xs mt-1">{errors.motivo}</p>
                            )}
                        </div>

                        {/* Items */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Agregar Producto
                                </button>
                            </div>

                            {formData.items.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No hay productos agregados</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Producto *
                                                    </label>
                                                    <select
                                                        value={item.item_id}
                                                        onChange={(e) => handleItemSelect(index, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                        required
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {items.map(i => (
                                                            <option key={i.id} value={i.id}>
                                                                {i.codigo} - {i.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Cantidad *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        value={item.cantidad}
                                                        onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Precio Unit. *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.precio_unitario}
                                                        onChange={(e) => updateItem(index, 'precio_unitario', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                                    >
                                                        <Trash2 className="w-5 h-5 mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.devolver_stock}
                                                        onChange={(e) => updateItem(index, 'devolver_stock', e.target.checked)}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Devolver al inventario
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors.items && (
                                <p className="text-red-500 text-xs mt-2">{errors.items}</p>
                            )}
                        </div>

                        {/* Resumen */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
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

                        {/* Botones */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit('/ventas/notas-credito')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || formData.items.length === 0}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : 'Crear Nota de Crédito Manual'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}