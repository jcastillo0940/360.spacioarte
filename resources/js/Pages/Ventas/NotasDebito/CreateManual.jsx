import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react';

export default function CreateManual({ auth }) {
    const [loading, setLoading] = useState(false);
    const [contactos, setContactos] = useState([]);
    const [items, setItems] = useState([]);
    const [searchContacto, setSearchContacto] = useState('');
    const [formData, setFormData] = useState({
        es_manual: true,
        factura_manual_ref: '',
        fecha_factura_original: '',
        contacto_id: '',
        tipo_nota: 'ajuste',
        motivo: '',
        items: [],
    });

    useEffect(() => {
        fetch('/api/inventario/contactos', { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then((res) => res.json())
            .then((data) => setContactos(Array.isArray(data.contactos) ? data.contactos : []))
            .catch(() => setContactos([]));

        fetch('/api/inventario/items', { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then((res) => res.json())
            .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
            .catch(() => setItems([]));
    }, []);

    const addItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, { item_id: '', cantidad: 1, precio_unitario: 0 }] }));
    const removeItem = (index) => setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    const updateItem = (index, field, value) => setFormData((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

    const handleItemSelect = (index, itemId) => {
        const selectedItem = items.find((item) => item.id === parseInt(itemId, 10));
        updateItem(index, 'item_id', itemId);
        if (selectedItem) {
            updateItem(index, 'precio_unitario', selectedItem.precio_venta || 0);
        }
    };

    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)), 0);
    const itbms = formData.items.reduce((sum, item) => {
        const selectedItem = items.find((row) => row.id === parseInt(item.item_id, 10));
        const rate = parseFloat(selectedItem?.tax?.tasa || 0);
        return sum + ((parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)) * rate / 100);
    }, 0);
    const total = subtotal + itbms;

    const filteredContactos = contactos.filter((contacto) => (`${contacto.razon_social || ''} ${contacto.identificacion || ''}`).toLowerCase().includes(searchContacto.toLowerCase()));

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.contacto_id || !formData.factura_manual_ref || !formData.fecha_factura_original || !formData.motivo.trim() || formData.items.length === 0) {
            alert('Completa todos los campos obligatorios y agrega al menos un item.');
            return;
        }

        setLoading(true);
        router.post('/ventas/notas-debito', formData, {
            preserveScroll: true,
            onSuccess: () => alert('Nota de debito manual creada exitosamente.'),
            onError: (errors) => alert(Object.values(errors)[0] || 'No se pudo crear la nota de debito.'),
            onFinish: () => setLoading(false),
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Crear Nota de Debito Manual" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.visit('/ventas/notas-debito')} className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-6 h-6" /></button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Nota de Debito Manual</h1>
                            <p className="text-gray-600 mt-1">Para cargos adicionales sobre facturas manuales o externas.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Numero de factura referenciada *</label>
                                <input value={formData.factura_manual_ref} onChange={(e) => setFormData((prev) => ({ ...prev, factura_manual_ref: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de factura original *</label>
                                <input type="date" value={formData.fecha_factura_original} onChange={(e) => setFormData((prev) => ({ ...prev, fecha_factura_original: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input value={searchContacto} onChange={(e) => setSearchContacto(e.target.value)} placeholder="Buscar cliente por nombre o RUC..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" />
                                {searchContacto && filteredContactos.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                        {filteredContactos.map((contacto) => (
                                            <button key={contacto.id} type="button" onClick={() => { setFormData((prev) => ({ ...prev, contacto_id: contacto.id })); setSearchContacto(`${contacto.razon_social} - ${contacto.identificacion}`); }} className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-0">
                                                <div className="font-semibold text-gray-900">{contacto.razon_social}</div>
                                                <div className="text-sm text-gray-500">RUC: {contacto.identificacion}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                                <button type="button" onClick={addItem} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-5 h-5 mr-2" />Agregar item</button>
                            </div>
                            <div className="space-y-4">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Item *</label>
                                            <select value={item.item_id} onChange={(e) => handleItemSelect(index, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                                                <option value="">Seleccionar...</option>
                                                {items.map((row) => <option key={row.id} value={row.id}>{row.codigo} - {row.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad *</label>
                                            <input type="number" step="0.01" min="0.01" value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Precio unit. *</label>
                                            <input type="number" step="0.01" min="0" value={item.precio_unitario} onChange={(e) => updateItem(index, 'precio_unitario', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                                        </div>
                                        <div className="flex items-end"><button type="button" onClick={() => removeItem(index)} className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 className="w-5 h-5 mx-auto" /></button></div>
                                    </div>
                                ))}
                                {formData.items.length === 0 && <div className="text-center text-gray-500 py-8">Agrega al menos un item para la nota de debito.</div>}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">ITBMS</span><span className="font-medium">${itbms.toFixed(2)}</span></div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300"><span>Total</span><span className="text-amber-600">${total.toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => router.visit('/ventas/notas-debito')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Cancelar</button>
                            <button type="submit" disabled={loading || formData.items.length === 0} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">{loading ? 'Creando...' : 'Crear Nota de Debito Manual'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
