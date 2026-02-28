import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Edit({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [formData, setFormData] = useState({
        contacto_id: '',
        vendedor_id: '',
        fecha_emision: '',
        fecha_entrega: '',
        estado: '',
        items: [],
    });

    const [subtotal, setSubtotal] = useState(0);
    const [impuesto, setImpuesto] = useState(0);
    const [total, setTotal] = useState(0);

    // Función para formatear fecha YYYY-MM-DD
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        console.log('Cargando datos para orden:', ordenId);
        
        Promise.all([
            fetch(`/api/ventas/ordenes/${ordenId}`).then(res => res.json()),
            fetch('/api/ventas/ordenes/datos').then(res => res.json())
        ]).then(([ordenData, datosData]) => {
            console.log('✅ Orden recibida:', ordenData);
            console.log('✅ Datos auxiliares:', datosData);
            
            setOrden(ordenData);
            setClientes(datosData.clientes || []);
            setVendedores(datosData.vendedores || []);
            setProductos(datosData.productos || []);
            setProductosFiltrados(datosData.productos || []);
            
            // Preparar datos del formulario
            const datosIniciales = {
                contacto_id: String(ordenData.contacto_id || ''),
                vendedor_id: ordenData.vendedor_id ? String(ordenData.vendedor_id) : '',
                fecha_emision: formatDateForInput(ordenData.fecha_emision),
                fecha_entrega: formatDateForInput(ordenData.fecha_entrega),
                estado: ordenData.estado || '',
                items: ordenData.detalles?.map(d => ({
                    item_id: d.item_id,
                    nombre: d.item?.nombre || 'Producto',
                    cantidad: parseFloat(d.cantidad),
                    precio_unitario: parseFloat(d.precio_unitario)
                })) || []
            };
            
            console.log('✅ Datos a cargar en formulario:', datosIniciales);
            setFormData(datosIniciales);
            setLoading(false);
            
        }).catch(error => {
            console.error('❌ Error loading data:', error);
            setLoading(false);
        });
    }, [ordenId]);

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.length === 0) {
            setProductosFiltrados(productos);
            setShowDropdown(false);
        } else {
            const filtered = productos.filter(p => 
                p.nombre.toLowerCase().includes(term.toLowerCase()) ||
                p.codigo.toLowerCase().includes(term.toLowerCase())
            );
            setProductosFiltrados(filtered);
            setShowDropdown(true);
        }
    };

    const agregarItem = (producto) => {
        const existe = formData.items.find(i => i.item_id === producto.id);
        if (existe) {
            const nuevosItems = formData.items.map(item => 
                item.item_id === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1 } 
                    : item
            );
            setFormData({...formData, items: nuevosItems});
        } else {
            const nuevoItem = {
                item_id: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precio_unitario: producto.precio_venta || 0,
            };
            setFormData({...formData, items: [...formData.items, nuevoItem]});
        }
        
        setSearchTerm('');
        setShowDropdown(false);
    };

    const eliminarItem = (id) => {
        setFormData({...formData, items: formData.items.filter(i => i.item_id !== id)});
    };

    const actualizarItem = (id, campo, valor) => {
        const nuevosItems = formData.items.map(item => 
            item.item_id === id ? { ...item, [campo]: parseFloat(valor) || 0 } : item
        );
        setFormData({...formData, items: nuevosItems});
    };

    const updateField = (field, value) => {
        setFormData({...formData, [field]: value});
    };

    useEffect(() => {
        const sub = formData.items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
        const imp = sub * 0.07; // 7% ITBMS
        const tot = sub + imp;
        
        setSubtotal(sub);
        setImpuesto(imp);
        setTotal(tot);
    }, [formData.items]);

    const submit = (e) => {
        e.preventDefault();
        console.log('📤 Enviando datos:', formData);
        
        router.put(`/ventas/ordenes/${ordenId}`, formData, {
            onSuccess: () => {
                router.visit('/ventas/ordenes');
            },
            onError: (errors) => {
                console.error('❌ Errores:', errors);
            }
        });
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Editando..." />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando orden...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Editar ${orden?.numero_orden}`} />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Orden de Venta
                    </h1>
                    <p className="text-slate-600 mt-2 font-mono text-lg">{orden?.numero_orden}</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4">Información General</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cliente *</label>
                                <select 
                                    value={formData.contacto_id} 
                                    onChange={e => updateField('contacto_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Valor actual: {formData.contacto_id}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Vendedor</label>
                                <select 
                                    value={formData.vendedor_id} 
                                    onChange={e => updateField('vendedor_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="">Sin asignar</option>
                                    {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Valor actual: {formData.vendedor_id || 'ninguno'}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Emisión *</label>
                                <input 
                                    type="date"
                                    value={formData.fecha_emision}
                                    onChange={e => updateField('fecha_emision', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Valor: {formData.fecha_emision}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Entrega</label>
                                <input 
                                    type="date"
                                    value={formData.fecha_entrega}
                                    onChange={e => updateField('fecha_entrega', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                                <p className="text-xs text-slate-400 mt-1">Valor: {formData.fecha_entrega}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Estado *</label>
                                <select 
                                    value={formData.estado} 
                                    onChange={e => updateField('estado', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Borrador">Borrador</option>
                                    <option value="Confirmada">Confirmada</option>
                                    <option value="Facturada">Facturada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Valor actual: {formData.estado}</p>
                            </div>
                        </div>
                    </div>

                    {/* Buscador y tabla de items */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Buscador */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Buscar Producto</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Buscar por nombre o código..."
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300"
                                        autoComplete="off"
                                    />
                                    
                                    {showDropdown && productosFiltrados.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {productosFiltrados.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => agregarItem(p)}
                                                    className="w-full text-left p-3 hover:bg-blue-50 border-b transition"
                                                >
                                                    <div className="font-bold">{p.nombre}</div>
                                                    <div className="text-xs text-slate-500">{p.codigo} • ${p.precio_venta}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabla Items */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold mb-4">Items ({formData.items.length})</h2>
                                {formData.items.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No hay productos agregados</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b-2">
                                                <tr>
                                                    <th className="pb-3 text-left text-xs font-bold uppercase">Producto</th>
                                                    <th className="pb-3 text-center text-xs font-bold uppercase">Cant.</th>
                                                    <th className="pb-3 text-right text-xs font-bold uppercase">Precio</th>
                                                    <th className="pb-3 text-right text-xs font-bold uppercase">Total</th>
                                                    <th className="pb-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {formData.items.map(item => (
                                                    <tr key={item.item_id}>
                                                        <td className="py-3 font-medium">{item.nombre}</td>
                                                        <td className="py-3">
                                                            <input 
                                                                type="number" 
                                                                className="w-20 mx-auto text-center px-2 py-2 border rounded-lg" 
                                                                value={item.cantidad} 
                                                                onChange={e => actualizarItem(item.item_id, 'cantidad', e.target.value)} 
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </td>
                                                        <td className="py-3">
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                className="w-28 ml-auto text-right px-2 py-2 border rounded-lg" 
                                                                value={item.precio_unitario} 
                                                                onChange={e => actualizarItem(item.item_id, 'precio_unitario', e.target.value)} 
                                                                min="0"
                                                            />
                                                        </td>
                                                        <td className="py-3 text-right font-bold text-blue-600">
                                                            ${(item.cantidad * item.precio_unitario).toFixed(2)}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => eliminarItem(item.item_id)} 
                                                                className="text-red-500 hover:text-red-700 transition"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-blue-800 text-white p-6 rounded-lg shadow-lg h-fit sticky top-6">
                            <h2 className="text-lg font-bold mb-6">Resumen</h2>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>ITBMS (7%):</span>
                                    <span className="font-bold">${impuesto.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-2xl font-black border-t border-blue-700 pt-4">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <button 
                                type="submit" 
                                disabled={formData.items.length === 0}
                                className="w-full bg-blue-600 text-white mt-6 py-4 rounded-lg font-bold hover:bg-blue-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                Actualizar Orden
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}