import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        contacto_id: '',
        sucursal_id: '',
        vendedor_id: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: []
    });

    const [subtotal, setSubtotal] = useState(0);
    const [itbms, setItbms] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/ventas/ordenes/datos')
            .then(res => res.json())
            .then(data => {
                setClientes(data.clientes || []);
                setProductos(data.productos || []);
                setProductosFiltrados(data.productos || []);
                setVendedores(data.vendedores || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading data:', error);
                setClientes([]);
                setProductos([]);
                setProductosFiltrados([]);
                setVendedores([]);
                setLoading(false);
            });
    };

    const loadSucursales = (contactoId) => {
        if (!contactoId) {
            setSucursales([]);
            setData('sucursal_id', '');
            return;
        }
        fetch(`/api/inventario/sucursales/contacto/${contactoId}`)
            .then(res => res.json())
            .then(data => {
                setSucursales(data || []);
                if ((data || []).length > 0) {
                    setData('sucursal_id', data[0].id);
                } else {
                    setData('sucursal_id', '');
                }
            })
            .catch(error => {
                console.error('Error loading sucursales:', error);
                setSucursales([]);
            });
    };

    // Live Search
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
            // Si ya existe, incrementar cantidad
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
                precio_unitario: producto.precio_venta,
                tasa_itbms: producto.tax?.tasa || 0
            };
            setData('items', [...data.items, nuevoItem]);
        }
        
        // Limpiar búsqueda
        setSearchTerm('');
        setShowDropdown(false);
    };

    const eliminarItem = (id) => {
        setData('items', data.items.filter(i => i.item_id !== id));
    };

    const actualizarCantidad = (id, cant) => {
        const nuevosItems = data.items.map(item => 
            item.item_id === id ? { ...item, cantidad: parseFloat(cant) || 0 } : item
        );
        setData('items', nuevosItems);
    };

    useEffect(() => {
        let st = 0;
        let tax = 0;
        data.items.forEach(item => {
            const lineaSubtotal = item.cantidad * item.precio_unitario;
            st += lineaSubtotal;
            tax += lineaSubtotal * (item.tasa_itbms / 100);
        });
        setSubtotal(st);
        setItbms(tax);
        setTotal(st + tax);
    }, [data.items]);

    const submit = (e) => {
        e.preventDefault();
        post(route('ordenes.store'));
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Nueva Orden de Venta" />
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-4">Cargando datos...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Orden de Venta" />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Nueva Orden de Venta
                    </h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Información General
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cliente *</label>
                                <select 
                                    value={data.contacto_id} 
                                    onChange={e => {
                                        setData('contacto_id', e.target.value);
                                        loadSucursales(e.target.value);
                                    }}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                                </select>
                                {errors.contacto_id && <span className="text-red-500 text-xs">{errors.contacto_id}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Sucursal</label>
                                <select 
                                    value={data.sucursal_id} 
                                    onChange={e => setData('sucursal_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    disabled={!data.contacto_id}
                                >
                                    <option value="">Sucursal principal</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Vendedor</label>
                                <select 
                                    value={data.vendedor_id} 
                                    onChange={e => setData('vendedor_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="">Sin vendedor</option>
                                    {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre_completo}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Entrega</label>
                                <input 
                                    type="date"
                                    value={data.fecha_entrega}
                                    onChange={e => setData('fecha_entrega', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Buscador de Productos + Items */}
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
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        autoComplete="off"
                                    />
                                    
                                    {/* Dropdown de resultados */}
                                    {showDropdown && productosFiltrados.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {productosFiltrados.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => agregarItem(p)}
                                                    className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition"
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
                                                            <div className="font-bold text-blue-600">${p.precio_venta}</div>
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

                            {/* Tabla de Items */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Items en la Orden ({data.items.length})
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b-2 border-slate-200">
                                                <tr>
                                                    <th className="pb-3 text-left text-xs font-bold uppercase text-slate-600">Producto</th>
                                                    <th className="pb-3 text-center text-xs font-bold uppercase text-slate-600">Cant.</th>
                                                    <th className="pb-3 text-right text-xs font-bold uppercase text-slate-600">Precio</th>
                                                    <th className="pb-3 text-right text-xs font-bold uppercase text-slate-600">Subtotal</th>
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
                                                                className="w-20 mx-auto text-center px-2 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                                                value={item.cantidad} 
                                                                onChange={e => actualizarCantidad(item.item_id, e.target.value)} 
                                                                min="0.01"
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td className="py-3 text-right text-slate-600">${item.precio_unitario}</td>
                                                        <td className="py-3 text-right font-bold text-slate-900">${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
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
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-lg h-fit sticky top-6">
                            <h2 className="text-lg font-bold mb-6 text-blue-400">Resumen de Orden</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Subtotal:</span>
                                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">ITBMS (7%):</span>
                                    <span className="font-bold">${itbms.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-3 mt-3">
                                    <div className="flex justify-between text-2xl font-black">
                                        <span>Total:</span>
                                        <span className="text-blue-400">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={processing || data.items.length === 0 || !data.contacto_id} 
                                className="w-full bg-blue-600 text-white mt-6 py-4 rounded-lg font-bold hover:bg-blue-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {processing ? 'Procesando...' : 'Guardar Orden de Venta'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}