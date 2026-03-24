import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';

export default function Create() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        contacto_id: '',
        vendedor_id: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        notas_internas: '',
        terminos_condiciones: 'Precios sujetos a cambios sin previo aviso. Validez de esta cotización: 15 días.'
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

                if (data.vendedor_asignado_id) {
                    setData('vendedor_id', data.vendedor_asignado_id);
                }

                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading data:', error);
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
                precio_unitario: producto.precio_venta,
                tasa_itbms: producto.tax?.tasa || 0,
            };
            setData('items', [...data.items, nuevoItem]);
        }
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
        post(route('cotizaciones.store'));
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title="Nueva Cotización" />
                <div className="max-w-7xl mx-auto p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">Cargando módulos...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Cotización" />
            <div className="max-w-7xl mx-auto pb-10">
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Crear Cotización
                    </h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Información del Prospecto / Cliente
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cliente *</label>
                                <select
                                    value={data.contacto_id}
                                    onChange={e => setData('contacto_id', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Fecha Emisión</label>
                                <input
                                    type="date"
                                    value={data.fecha_emision}
                                    onChange={e => setData('fecha_emision', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Válida Hasta</label>
                                <input
                                    type="date"
                                    value={data.fecha_vencimiento}
                                    onChange={e => setData('fecha_vencimiento', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Buscar Producto / Servicio</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => handleSearch(e.target.value)}
                                        onFocus={() => searchTerm && setShowDropdown(true)}
                                        placeholder="Buscar..."
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition"
                                        autoComplete="off"
                                    />
                                    {showDropdown && productosFiltrados.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {productosFiltrados.map(p => (
                                                <button key={p.id} type="button" onClick={() => agregarItem(p)} className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 transition">
                                                    <div className="font-bold text-slate-900">{p.nombre}</div>
                                                    <div className="text-xs text-blue-600 font-bold">${p.precio_venta}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-lg font-bold mb-4">Items en la Cotización ({data.items.length})</h2>
                                {data.items.length === 0 ? (
                                    <p className="text-center py-8 text-slate-400 font-bold">Sin elementos añadidos</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="pb-3 text-slate-500">Producto</th>
                                                    <th className="pb-3 text-slate-500 text-center">Cant.</th>
                                                    <th className="pb-3 text-slate-500 text-right">Precio</th>
                                                    <th className="pb-3 text-slate-500 text-right">Monto</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.items.map(item => (
                                                    <tr key={item.item_id}>
                                                        <td className="py-3 font-medium text-slate-900">{item.nombre}</td>
                                                        <td className="py-3 text-center">
                                                            <input type="number" className="w-20 px-2 py-1 border rounded text-center" value={item.cantidad} onChange={e => actualizarCantidad(item.item_id, e.target.value)} min="1" step="0.01"/>
                                                        </td>
                                                        <td className="py-3 text-right">${item.precio_unitario}</td>
                                                        <td className="py-3 text-right font-bold">${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                                                        <td className="py-3 text-right">
                                                            <button type="button" onClick={() => eliminarItem(item.item_id)} className="text-red-500 hover:text-red-700">✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Términos y Condiciones / Observaciones para el cliente</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500"
                                    rows="3"
                                    value={data.terminos_condiciones}
                                    onChange={e => setData('terminos_condiciones', e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-lg h-fit sticky top-6">
                            <h2 className="text-lg font-bold mb-6 text-blue-400">Total a Cotizar</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Subtotal:</span>
                                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">ITBMS:</span>
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
                                className="w-full bg-blue-600 text-white mt-8 py-4 rounded-xl font-black hover:bg-blue-500 transition disabled:bg-slate-700"
                            >
                                {processing ? 'Guardando...' : 'Crear Cotización'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
