import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ cotizacion = null, isEditing = false }) {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const { data, setData, post, put, processing } = useForm({
        contacto_id: cotizacion?.contacto_id || '',
        vendedor_id: cotizacion?.vendedor_id || '',
        fecha_emision: cotizacion?.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_vencimiento: cotizacion?.fecha_vencimiento || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        descuento_tipo: cotizacion?.descuento_tipo || '',
        descuento_valor: cotizacion?.descuento_valor || 0,
        items: cotizacion?.items || [],
        notas_internas: cotizacion?.notas_internas || '',
        terminos_condiciones: cotizacion?.terminos_condiciones || 'Precios sujetos a cambios sin previo aviso. Validez de esta cotizacion: 15 dias.',
    });

    const [subtotal, setSubtotal] = useState(0);
    const [descuentoTotal, setDescuentoTotal] = useState(0);
    const [itbms, setItbms] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/ventas/ordenes/datos')
            .then((res) => res.json())
            .then((payload) => {
                setClientes(payload.clientes || []);
                setProductos(payload.productos || []);
                setProductosFiltrados(payload.productos || []);
                setVendedores(payload.vendedores || []);

                if (!isEditing && payload.vendedor_asignado_id) {
                    setData('vendedor_id', payload.vendedor_asignado_id);
                }

                setLoading(false);
            })
            .catch((error) => {
                console.error('Error loading data:', error);
                setLoading(false);
            });
    };

    const handleSearch = (term) => {
        setSearchTerm(term);

        if (!term.length) {
            setProductosFiltrados(productos);
            setShowDropdown(false);
            return;
        }

        const filtered = productos.filter((producto) =>
            producto.nombre.toLowerCase().includes(term.toLowerCase()) ||
            producto.codigo.toLowerCase().includes(term.toLowerCase()) ||
            (producto.categoria && producto.categoria.toLowerCase().includes(term.toLowerCase()))
        );

        setProductosFiltrados(filtered);
        setShowDropdown(true);
    };

    const agregarItem = (producto) => {
        const existe = data.items.find((item) => Number(item.item_id) === Number(producto.id));

        if (existe) {
            setData('items', data.items.map((item) => (
                Number(item.item_id) === Number(producto.id)
                    ? { ...item, cantidad: Number(item.cantidad) + 1 }
                    : item
            )));
        } else {
            setData('items', [
                ...data.items,
                {
                    item_id: producto.id,
                    nombre: producto.nombre,
                    cantidad: 1,
                    precio_unitario: Number(producto.precio_venta || 0),
                    tasa_itbms: Number(producto.tax?.tasa || 0),
                },
            ]);
        }

        setSearchTerm('');
        setShowDropdown(false);
    };

    const eliminarItem = (itemId) => {
        setData('items', data.items.filter((item) => Number(item.item_id) !== Number(itemId)));
    };

    const actualizarItem = (itemId, campo, valor) => {
        setData('items', data.items.map((item) => (
            Number(item.item_id) === Number(itemId)
                ? { ...item, [campo]: campo === 'nombre' ? valor : (parseFloat(valor) || 0) }
                : item
        )));
    };

    useEffect(() => {
        let nextSubtotal = 0;

        data.items.forEach((item) => {
            nextSubtotal += Number(item.cantidad || 0) * Number(item.precio_unitario || 0);
        });

        let nextDescuento = 0;
        if (data.descuento_tipo === 'porcentaje') {
            nextDescuento = nextSubtotal * (Number(data.descuento_valor || 0) / 100);
        } else if (data.descuento_tipo === 'monto_fijo') {
            nextDescuento = Math.min(nextSubtotal, Number(data.descuento_valor || 0));
        }

        const factorDescuento = nextSubtotal > 0 ? (nextDescuento / nextSubtotal) : 0;

        let nextItbms = 0;
        data.items.forEach((item) => {
            const itemSubtotal = Number(item.cantidad || 0) * Number(item.precio_unitario || 0);
            const subtotalConDescuento = Math.max(0, itemSubtotal - (itemSubtotal * factorDescuento));
            nextItbms += subtotalConDescuento * (Number(item.tasa_itbms || 0) / 100);
        });

        setSubtotal(nextSubtotal);
        setDescuentoTotal(nextDescuento);
        setItbms(nextItbms);
        setTotal(Math.max(0, nextSubtotal - nextDescuento) + nextItbms);
    }, [data.items, data.descuento_tipo, data.descuento_valor]);

    const submit = (e) => {
        e.preventDefault();

        if (isEditing && cotizacion?.id) {
            put(route('cotizaciones.update', cotizacion.id));
            return;
        }

        post(route('cotizaciones.store'));
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <Head title={isEditing ? 'Editar Cotizacion' : 'Nueva Cotizacion'} />
                <div className="mx-auto max-w-7xl p-12 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600">Cargando modulos...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={isEditing ? 'Editar Cotizacion' : 'Nueva Cotizacion'} />

            <div className="mx-auto max-w-7xl pb-10">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900">
                        <svg className="h-8 w-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isEditing ? `Editar Cotizacion ${cotizacion?.numero_cotizacion || ''}` : 'Crear Cotizacion'}
                    </h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                            <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Informacion del cliente
                        </h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Cliente</label>
                                <select
                                    value={data.contacto_id}
                                    onChange={(e) => setData('contacto_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.id} value={cliente.id}>
                                            {cliente.razon_social}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Fecha emision</label>
                                <input
                                    type="date"
                                    value={data.fecha_emision}
                                    onChange={(e) => setData('fecha_emision', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Valida hasta</label>
                                <input
                                    type="date"
                                    value={data.fecha_vencimiento}
                                    onChange={(e) => setData('fecha_vencimiento', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Buscar producto o servicio</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onFocus={() => searchTerm && setShowDropdown(true)}
                                        placeholder="Buscar..."
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500"
                                        autoComplete="off"
                                    />

                                    {showDropdown && productosFiltrados.length > 0 && (
                                        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg">
                                            {productosFiltrados.map((producto) => (
                                                <button
                                                    key={producto.id}
                                                    type="button"
                                                    onClick={() => agregarItem(producto)}
                                                    className="w-full border-b border-slate-100 p-3 text-left transition hover:bg-blue-50"
                                                >
                                                    <div className="font-bold text-slate-900">{producto.nombre}</div>
                                                    <div className="text-xs font-bold text-blue-600">${Number(producto.precio_venta || 0).toFixed(2)}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-bold">Items en la cotizacion ({data.items.length})</h2>

                                {data.items.length === 0 ? (
                                    <p className="py-8 text-center font-bold text-slate-400">Sin elementos agregados</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="pb-3 text-slate-500">Producto</th>
                                                    <th className="pb-3 text-center text-slate-500">Cant.</th>
                                                    <th className="pb-3 text-right text-slate-500">Precio</th>
                                                    <th className="pb-3 text-right text-slate-500">ITBMS %</th>
                                                    <th className="pb-3 text-right text-slate-500">Monto</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.items.map((item) => (
                                                    <tr key={item.item_id}>
                                                        <td className="py-3 font-medium text-slate-900">
                                                            <input
                                                                type="text"
                                                                value={item.nombre}
                                                                onChange={(e) => actualizarItem(item.item_id, 'nombre', e.target.value)}
                                                                className="w-full rounded border border-slate-200 px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                className="w-20 rounded border px-2 py-1 text-center"
                                                                value={item.cantidad}
                                                                onChange={(e) => actualizarItem(item.item_id, 'cantidad', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="w-24 rounded border px-2 py-1 text-right"
                                                                value={item.precio_unitario}
                                                                onChange={(e) => actualizarItem(item.item_id, 'precio_unitario', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                className="w-20 rounded border px-2 py-1 text-right"
                                                                value={item.tasa_itbms}
                                                                onChange={(e) => actualizarItem(item.item_id, 'tasa_itbms', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="py-3 text-right font-bold">
                                                            ${(Number(item.cantidad || 0) * Number(item.precio_unitario || 0)).toFixed(2)}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <button type="button" onClick={() => eliminarItem(item.item_id)} className="text-red-500 hover:text-red-700">
                                                                ×
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Tipo de descuento</label>
                                        <select
                                            value={data.descuento_tipo}
                                            onChange={(e) => setData('descuento_tipo', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500"
                                        >
                                            <option value="">Sin descuento</option>
                                            <option value="porcentaje">Porcentaje</option>
                                            <option value="monto_fijo">Monto fijo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                                            {data.descuento_tipo === 'porcentaje' ? 'Descuento (%)' : 'Descuento ($)'}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.descuento_valor}
                                            onChange={(e) => setData('descuento_valor', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Terminos y condiciones</label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500"
                                    rows="3"
                                    value={data.terminos_condiciones}
                                    onChange={(e) => setData('terminos_condiciones', e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="sticky top-6 h-fit rounded-lg bg-slate-900 p-6 text-white shadow-lg">
                            <h2 className="mb-6 text-lg font-bold text-blue-400">Total a cotizar</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Subtotal:</span>
                                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Descuento:</span>
                                    <span className="font-bold text-amber-300">-${descuentoTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">ITBMS:</span>
                                    <span className="font-bold">${itbms.toFixed(2)}</span>
                                </div>
                                <div className="mt-3 border-t border-slate-700 pt-3">
                                    <div className="flex justify-between text-2xl font-black">
                                        <span>Total:</span>
                                        <span className="text-blue-400">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || data.items.length === 0 || !data.contacto_id}
                                className="mt-8 w-full rounded-xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-500 disabled:bg-slate-700"
                            >
                                {processing ? 'Guardando...' : (isEditing ? 'Actualizar Cotizacion' : 'Crear Cotizacion')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
