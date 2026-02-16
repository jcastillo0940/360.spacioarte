import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';

export default function Create() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [minAnticipo, setMinAnticipo] = useState(50);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showClienteModal, setShowClienteModal] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        contacto_id: '',
        sucursal_id: '',
        vendedor_id: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        imagen_referencia: null,
        monto_abonado: 0,
        metodo_pago_inicial: 'Transferencia'
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
                setPaymentTerms(data.payment_terms || []);
                setMinAnticipo(data.min_anticipo_porcentaje || 50);

                if (data.vendedor_asignado_id) {
                    setData('vendedor_id', data.vendedor_asignado_id);
                }

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

    const calcularNesting = (item, papel, maquina) => {
        if (!item.requires_recipe || !papel || !maquina) return null;

        const anchoPapel = parseFloat(papel.ancho_imprimible || papel.ancho || 0);
        const largoPapel = parseFloat(papel.largo_imprimible || papel.largo || 0);
        const anchoPieza = parseFloat(item.ancho_imprimible || 0);
        const largoPieza = parseFloat(item.largo_imprimible || 0);
        const sangrado = parseFloat(item.sangrado || 0);
        const separacion = parseFloat(item.separacion_piezas || 0);

        if (anchoPapel <= 0 || largoPapel <= 0 || anchoPieza <= 0 || largoPieza <= 0) return null;

        // Nesting horizontal: floor((ancho_papel - sangrado*2) / (ancho_pieza + separacion))
        // El usuario proporcionó: Nesting = ( (ancho_papel - sangrado) / (ancho_pieza + separacion) ) * ( (largo_papel - sangrado) / (largo_pieza + separacion) )
        // Usaremos sangrado simple o doble dependiendo de la convención, pero generalmente es margen.

        const piezasAncho = Math.floor((anchoPapel - (sangrado * 2)) / (anchoPieza + separacion));
        const piezasLargo = Math.floor((largoPapel - (sangrado * 2)) / (largoPieza + separacion));

        let capacidad = piezasAncho * piezasLargo;

        // Si permite rotación, probar la otra orientación
        if (item.permite_rotacion) {
            const piezasAnchoRot = Math.floor((anchoPapel - (sangrado * 2)) / (largoPieza + separacion));
            const piezasLargoRot = Math.floor((largoPapel - (sangrado * 2)) / (anchoPieza + separacion));
            const capacidadRot = piezasAnchoRot * piezasLargoRot;
            if (capacidadRot > capacidad) {
                capacidad = capacidadRot;
            }
        }

        return capacidad > 0 ? capacidad : 0;
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
                // Campos de receta
                requires_recipe: producto.requires_recipe,
                tipo_impresion: producto.tipo_impresion,
                procesos_compatibles: producto.procesos_compatibles || [],
                papeles_compatibles: producto.papeles_compatibles || [],
                ancho_imprimible: producto.ancho_imprimible,
                largo_imprimible: producto.largo_imprimible,
                sangrado: producto.sangrado,
                separacion_piezas: producto.separacion_piezas,
                permite_rotacion: producto.permite_rotacion,
                // Secciones
                proceso_id: producto.procesos_compatibles?.length === 1 ? producto.procesos_compatibles[0].id : '',
                material_id: producto.papeles_compatibles?.length === 1 ? producto.papeles_compatibles[0].id : '',
                pliegos_necesarios: 0,
                capacidad_por_pliego: 0,
                total_piezas_calculadas: 0
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

        // Clonamos items para evitar bucles infinitos si actualizamos el estado dentro del loop
        // Pero mejor usamos una técnica de mapeo
        const nuevosItems = data.items.map(item => {
            const lineaSubtotal = item.cantidad * item.precio_unitario;
            st += lineaSubtotal;
            tax += lineaSubtotal * (item.tasa_itbms / 100);

            if (item.requires_recipe && item.proceso_id && item.material_id) {
                const papel = item.papeles_compatibles.find(p => p.id == item.material_id);
                const maquina = item.procesos_compatibles.find(m => m.id == item.proceso_id);
                const capacidad = calcularNesting(item, papel, maquina);

                if (capacidad !== null) {
                    const pliegos = Math.ceil(item.cantidad / capacidad);
                    return {
                        ...item,
                        capacidad_por_pliego: capacidad,
                        pliegos_necesarios: pliegos,
                        total_piezas_calculadas: item.cantidad
                    };
                }
            }
            return item;
        });

        // Solo actualizar si hay cambios reales en los cálculos de nesting para evitar re-renders infinitos
        const hayCambios = JSON.stringify(nuevosItems) !== JSON.stringify(data.items);
        if (hayCambios) {
            setData('items', nuevosItems);
        }

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
                <div className="mb-8 flex justify-between items-center">
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
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información del Cliente
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowClienteModal(true)}
                                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Nuevo Cliente
                            </button>
                        </div>
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
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social} {c.identificacion ? `(${c.identificacion})` : ''}</option>)}
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

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Imagen de Referencia</label>
                                <input
                                    type="file"
                                    onChange={e => setData('imagen_referencia', e.target.files[0])}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-xs"
                                    accept="image/*"
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
                                                        <td className="py-3">
                                                            <div className="font-medium text-slate-900">{item.nombre}</div>
                                                            {item.requires_recipe && (
                                                                <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                                    <div>
                                                                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Máquina</label>
                                                                        <select
                                                                            className="w-full text-[10px] py-1 px-2 rounded border-slate-200 focus:ring-blue-500"
                                                                            value={item.proceso_id}
                                                                            onChange={e => {
                                                                                const nuevos = data.items.map(it => it.item_id === item.item_id ? { ...it, proceso_id: e.target.value } : it);
                                                                                setData('items', nuevos);
                                                                            }}
                                                                        >
                                                                            <option value="">Seleccionar...</option>
                                                                            {item.procesos_compatibles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Papel / Soporte</label>
                                                                        <select
                                                                            className="w-full text-[10px] py-1 px-2 rounded border-slate-200 focus:ring-blue-500"
                                                                            value={item.material_id}
                                                                            onChange={e => {
                                                                                const nuevos = data.items.map(it => it.item_id === item.item_id ? { ...it, material_id: e.target.value } : it);
                                                                                setData('items', nuevos);
                                                                            }}
                                                                        >
                                                                            <option value="">Seleccionar...</option>
                                                                            {item.papeles_compatibles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    {item.capacidad_por_pliego > 0 && (
                                                                        <div className="col-span-2 flex items-center justify-between mt-1 px-1">
                                                                            <div className="text-[9px] font-bold text-blue-600">
                                                                                Capacidad: {item.capacidad_por_pliego} pzs/pg
                                                                            </div>
                                                                            <div className="text-[9px] font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">
                                                                                TOTAL PLIEGOS: {item.pliegos_necesarios}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
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

                            {/* Pago y Anticipo */}
                            <div className="mt-8 pt-8 border-t border-slate-700 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Gestión de Anticipo ({minAnticipo}%)</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monto Abonado</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={data.monto_abonado}
                                                onChange={e => setData('monto_abonado', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-800 border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white font-black text-xl focus:ring-blue-500 focus:border-blue-500"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        {data.monto_abonado < (total * (minAnticipo / 100)) && total > 0 && (
                                            <p className="text-red-400 text-[10px] font-bold mt-1 animate-pulse">
                                                ⚠ Se requiere un abono mínimo de ${(total * (minAnticipo / 100)).toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Método de Pago</label>
                                        <select
                                            value={data.metodo_pago_inicial}
                                            onChange={e => setData('metodo_pago_inicial', e.target.value)}
                                            className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Transferencia">Transferencia Bancaria</option>
                                            <option value="Yappy">Yappy</option>
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>

                                    <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-blue-300 font-bold uppercase">Saldo Pendiente:</span>
                                            <span className="text-white font-black">${Math.max(0, total - data.monto_abonado).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || data.items.length === 0 || !data.contacto_id || (data.monto_abonado < (total * (minAnticipo / 100)) && total > 0)}
                                className="w-full bg-blue-600 text-white mt-6 py-4 rounded-xl font-black text-base hover:bg-blue-500 transition disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-900/20"
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{processing ? 'Procesando...' : 'Confirmar y Crear Orden'}</span>
                                </div>
                                <span className="text-[9px] uppercase tracking-widest opacity-60">Se generará factura automática</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal Nuevo Cliente */}
            {showClienteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter italic uppercase">Registrar Nuevo Cliente</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crea un contacto sin salir de la orden</p>
                            </div>
                            <button onClick={() => setShowClienteModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <ClienteForm
                            onSuccess={(nuevoCliente) => {
                                setClientes([...clientes, nuevoCliente]);
                                setData('contacto_id', nuevoCliente.id);
                                setShowClienteModal(false);
                            }}
                            paymentTerms={paymentTerms}
                        />
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function ClienteForm({ onSuccess, paymentTerms }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        razon_social: '',
        tipo_identificacion: 'RUC',
        identificacion: '',
        digito_verificador: '',
        requiere_factura_electronica: false,
        direccion: '',
        telefono: '',
        email: '',
        es_cliente: true,
        payment_term_id: paymentTerms[0]?.id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        axios.post('/api/inventario/contactos', data)
            .then(res => {
                onSuccess(res.data);
            })
            .catch(err => {
                console.error(err);
                alert('Error al crear cliente. Verifique los datos.');
            });
    };

    return (
        <form onSubmit={submit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nombre o Razón Social *</label>
                    <input
                        type="text"
                        value={data.razon_social}
                        onChange={e => setData('razon_social', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo Id.</label>
                    <select
                        value={data.tipo_identificacion}
                        onChange={e => setData('tipo_identificacion', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold"
                    >
                        <option value="RUC">RUC</option>
                        <option value="Cedula">Cédula</option>
                        <option value="Pasaporte">Pasaporte</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Identificación *</label>
                        <input
                            type="text"
                            value={data.identificacion}
                            onChange={e => setData('identificacion', e.target.value)}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-blue-500"
                            required
                        />
                    </div>
                    {data.tipo_identificacion === 'RUC' && (
                        <div className="w-20">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">DV</label>
                            <input
                                type="text"
                                value={data.digito_verificador}
                                onChange={e => setData('digito_verificador', e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-center"
                                maxLength="4"
                            />
                        </div>
                    )}
                </div>

                <div className="col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-blue-900 uppercase italic">Facturación Electrónica</h4>
                            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">Habilitar envío automático de comprobantes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={data.requiere_factura_electronica}
                                onChange={e => setData('requiere_factura_electronica', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Teléfono</label>
                    <input
                        type="text"
                        value={data.telefono}
                        onChange={e => setData('telefono', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Dirección</label>
                    <textarea
                        value={data.direccion}
                        onChange={e => setData('direccion', e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-bold h-20"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition shadow-xl"
                >
                    {processing ? 'CREANDO...' : 'GUARDAR CLIENTE'}
                </button>
            </div>
        </form>
    );
}