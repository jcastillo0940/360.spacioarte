import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Edit({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        contacto_id: '',
        fecha_pedido: '',
        fecha_entrega: '',
        estado: '',
        items: [],
    });

    const [total, setTotal] = useState(0);

    useEffect(() => {
        Promise.all([
            fetch(`/api/compras/ordenes/${ordenId}`).then(res => res.json()),
            fetch('/api/compras/ordenes/datos').then(res => res.json())
        ]).then(([ordenData, datosData]) => {
            setOrden(ordenData);
            setProveedores(datosData.proveedores || []);
            setProductos(datosData.productos || []);
            setProductosFiltrados(datosData.productos || []);
            
            // Cargar datos de la orden
            setData({
                contacto_id: ordenData.contacto_id,
                fecha_pedido: ordenData.fecha_emision,
                fecha_entrega: ordenData.fecha_entrega || '',
                estado: ordenData.estado,
                items: ordenData.detalles?.map(d => ({
                    item_id: d.item_id,
                    nombre: d.item?.nombre,
                    cantidad: d.cantidad,
                    costo_unitario: d.costo_unitario
                })) || []
            });
            
            setLoading(false);
        }).catch(error => {
            console.error('Error loading data:', error);
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
        put(`/compras/ordenes/${ordenId}`);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Editando..." />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
                        Editar Orden de Compra
                    </h1>
                    <p className="text-slate-600 mt-2 font-mono text-lg">{orden?.numero_orden}</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4">Información General</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Proveedor *</label>
                                <select 
                                    value={data.contacto_id} 
                                    onChange={e => setData('contacto_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                >
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Pedido *</label>
                                <input 
                                    type="date"
                                    value={data.fecha_pedido}
                                    onChange={e => setData('fecha_pedido', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Entrega *</label>
                                <input 
                                    type="date"
                                    value={data.fecha_entrega}
                                    onChange={e => setData('fecha_entrega', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Estado *</label>
                                <select 
                                    value={data.estado} 
                                    onChange={e => setData('estado', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    required
                                >
                                    <option value="Borrador">Borrador</option>
                                    <option value="Confirmada">Confirmada</option>
                                    <option value="Recibida Parcial">Recibida Parcial</option>
                                    <option value="Recibida Total">Recibida Total</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
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
                                        placeholder="Buscar..."
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
                                                    className="w-full text-left p-3 hover:bg-green-50 border-b"
                                                >
                                                    <div className="font-bold">{p.nombre}</div>
                                                    <div className="text-xs text-slate-500">{p.codigo}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabla Items */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold mb-4">Items ({data.items.length})</h2>
                                {data.items.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No hay productos</p>
                                ) : (
                                    <table className="w-full">
                                        <thead className="border-b-2">
                                            <tr>
                                                <th className="pb-3 text-left text-xs font-bold uppercase">Producto</th>
                                                <th className="pb-3 text-center text-xs font-bold uppercase">Cant.</th>
                                                <th className="pb-3 text-right text-xs font-bold uppercase">Costo</th>
                                                <th className="pb-3 text-right text-xs font-bold uppercase">Total</th>
                                                <th className="pb-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {data.items.map(item => (
                                                <tr key={item.item_id}>
                                                    <td className="py-3">{item.nombre}</td>
                                                    <td className="py-3">
                                                        <input 
                                                            type="number" 
                                                            className="w-20 mx-auto text-center px-2 py-2 border rounded-lg" 
                                                            value={item.cantidad} 
                                                            onChange={e => actualizarItem(item.item_id, 'cantidad', e.target.value)} 
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            className="w-24 ml-auto text-right px-2 py-2 border rounded-lg" 
                                                            value={item.costo_unitario} 
                                                            onChange={e => actualizarItem(item.item_id, 'costo_unitario', e.target.value)} 
                                                        />
                                                    </td>
                                                    <td className="py-3 text-right font-bold">${(item.cantidad * item.costo_unitario).toFixed(2)}</td>
                                                    <td className="py-3 text-center">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => eliminarItem(item.item_id)} 
                                                            className="text-red-500"
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
                            <h2 className="text-lg font-bold mb-6">Total</h2>
                            <div className="flex justify-between text-2xl font-black border-t border-green-700 pt-4">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <button 
                                type="submit" 
                                disabled={processing || data.items.length === 0}
                                className="w-full bg-green-600 text-white mt-6 py-4 rounded-lg font-bold hover:bg-green-500 transition disabled:bg-slate-600"
                            >
                                {processing ? 'Guardando...' : 'Actualizar Orden'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}