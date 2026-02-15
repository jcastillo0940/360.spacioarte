import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        contacto_id: '',
        fecha_pedido: new Date().toISOString().split('T')[0],
        fecha_entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
    });

    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/compras/ordenes/datos')
            .then(res => res.json())
            .then(data => {
                setProveedores(data.proveedores || []);
                setProductos(data.productos || []);
                setProductosFiltrados(data.productos || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading data:', error);
                setProveedores([]);
                setProductos([]);
                setProductosFiltrados([]);
                setLoading(false);
            });
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.length === 0) {
            setProductosFiltrados(productos);
            setShowDropdown(false);
        } else {
            const filtered = productos.filter(p => 
                p.nombre.toLowerCase().includes(term.toLowerCase()) ||
                p.codigo.toLowerCase().includes(term.toLowerCase()) ||
                (p.categoria && p.categoria.toLowerCase().includes(term.toLowerCase()))
            );
            setProductosFiltrados(filtered);
            setShowDropdown(true);
        }
    };

    const agregarItem = (producto) => {
        const existe = data.items.find(i => i.item_id === producto.id);
        if (existe) {
            const nuevosItems = data.items.map(item => 
                item.item_id === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1 } 
                    : item
            );
            setData('items', nuevosItems);
        } else {
            const nuevoItem = {
                item_id: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                costo_unitario: producto.costo_promedio || 0,
            };
            setData('items', [...data.items, nuevoItem]);
        }
        
        setSearchTerm('');
        setShowDropdown(false);
    };

    const eliminarItem = (id) => {
        setData('items', data.items.filter(i => i.item_id !== id));
    };

    const actualizarItem = (id, campo, valor) => {
        const nuevosItems = data.items.map(item => 
            item.item_id === id ? { ...item, [campo]: parseFloat(valor) || 0 } : item
        );
        setData('items', nuevosItems);
    };

    useEffect(() => {
        const t = data.items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
        setTotal(t);
    }, [data.items]);

    const submit = (e) => {
        e.preventDefault();
        post(route('compras.ordenes.store'));
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Nueva Orden de Compra" />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando datos...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Orden de Compra" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Nueva Orden de Compra
                    </h1>
                    <p className="text-slate-600 mt-2">Pedido de mercancía a proveedores</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Proveedor y Fechas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Proveedor *</label>
                                <select 
                                    value={data.contacto_id} 
                                    onChange={e => setData('contacto_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                >
                                    <option value="">Seleccione un proveedor</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                                </select>
                                {errors.contacto_id && <span className="text-red-500 text-xs">{errors.contacto_id}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Pedido</label>
                                <input 
                                    type="date"
                                    value={data.fecha_pedido}
                                    onChange={e => setData('fecha_pedido', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Entrega Estimada</label>
                                <input 
                                    type="date"
                                    value={data.fecha_entrega}
                                    onChange={e => setData('fecha_entrega', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Buscador + Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Buscador Live */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Buscar Producto
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => handleSearch(e.target.value)}
                                        onFocus={() => searchTerm && setShowDropdown(true)}
                                        placeholder="Buscar por nombre, código o categoría..."
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                        autoComplete="off"
                                    />
                                    
                                    {showDropdown && productosFiltrados.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {productosFiltrados.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => agregarItem(p)}
                                                    className="w-full text-left p-3 hover:bg-green-50 border-b border-slate-100 last:border-0 transition"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-bold text-slate-900">{p.nombre}</div>
                                                            <div className="text-xs text-slate-500 mt-1">
                                                                <span className="font-mono">{p.codigo}</span>
                                                                {p.categoria && <span className="ml-2">• {p.categoria}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-xs text-slate-500">Stock: {p.stock_actual || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {showDropdown && searchTerm && productosFiltrados.length === 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-4 text-center text-slate-500">
                                            No se encontraron productos
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabla Items */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Items a Comprar ({data.items.length})
                                </h2>

                                {data.items.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <p className="font-bold">No hay productos añadidos</p>
                                        <p className="text-sm mt-1">Usa el buscador para agregar productos</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="border-b-2 border-slate-200">
                                            <tr>
                                                <th className="pb-3 text-left text-xs font-bold uppercase text-slate-600">Producto</th>
                                                <th className="pb-3 text-center text-xs font-bold uppercase text-slate-600">Cant.</th>
                                                <th className="pb-3 text-right text-xs font-bold uppercase text-slate-600">Costo Unit.</th>
                                                <th className="pb-3 text-right text-xs font-bold uppercase text-slate-600">Total</th>
                                                <th className="pb-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.items.map(item => (
                                                <tr key={item.item_id}>
                                                    <td className="py-3 font-medium text-slate-900">{item.nombre}</td>
                                                    <td className="py-3">
                                                        <input 
                                                            type="number" 
                                                            className="w-20 mx-auto text-center px-2 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                                                            value={item.cantidad} 
                                                            onChange={e => actualizarItem(item.item_id, 'cantidad', e.target.value)} 
                                                            min="0.01"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            className="w-24 ml-auto text-right px-2 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                                                            value={item.costo_unitario} 
                                                            onChange={e => actualizarItem(item.item_id, 'costo_unitario', e.target.value)} 
                                                        />
                                                    </td>
                                                    <td className="py-3 text-right font-bold text-slate-900">${(item.cantidad * item.costo_unitario).toFixed(2)}</td>
                                                    <td className="py-3 text-center">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => eliminarItem(item.item_id)} 
                                                            className="text-red-500 hover:text-red-700 p-1"
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
                                )}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-green-800 text-white p-6 rounded-lg shadow-lg h-fit sticky top-6">
                            <h2 className="text-lg font-bold mb-6">Resumen</h2>
                            <div className="flex justify-between text-2xl font-black border-t border-green-700 pt-4">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <button 
                                type="submit" 
                                disabled={processing || data.items.length === 0 || !data.contacto_id}
                                className="w-full bg-green-600 text-white mt-6 py-4 rounded-lg font-bold hover:bg-green-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {processing ? 'Procesando...' : 'Generar Orden de Compra'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
