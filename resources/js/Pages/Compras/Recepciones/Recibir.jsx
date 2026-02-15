import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Recibir({ auth, orden, recepcionesPrevias = [] }) {
    const [itemsRecibidos, setItemsRecibidos] = useState([]);
    const [codigoBusqueda, setCodigoBusqueda] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [tipoRecepcion, setTipoRecepcion] = useState('parcial');
    const [mostrarRecepcionesPrevias, setMostrarRecepcionesPrevias] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [mensajeEscaneo, setMensajeEscaneo] = useState('');
    const inputCodigoRef = useRef(null);

    // Foco automático en el input para el escáner de códigos de barra
    useEffect(() => {
        if (inputCodigoRef.current) {
            inputCodigoRef.current.focus();
        }
    }, [itemsRecibidos]);

    const buscarProductoPorCodigo = async () => {
        if (!codigoBusqueda.trim()) return;

        setCargando(true);
        setMensajeEscaneo('Buscando producto...');

        try {
            const response = await fetch(route('compras.recepciones.buscar-codigo'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    
                },
                body: JSON.stringify({
                    codigo: codigoBusqueda,
                    orden_id: orden.id
                })
            });

            const data = await response.json();

            if (data.success) {
                agregarItemRecibido(data.item, data.detalle_orden);
                setMensajeEscaneo(`✓ ${data.item.nombre} agregado`);
                setTimeout(() => setMensajeEscaneo(''), 2000);
            } else {
                setMensajeEscaneo('✗ Producto no encontrado en esta orden');
                setTimeout(() => setMensajeEscaneo(''), 3000);
            }
        } catch (error) {
            console.error('Error buscando producto:', error);
            setMensajeEscaneo('✗ Error al buscar producto');
            setTimeout(() => setMensajeEscaneo(''), 3000);
        } finally {
            setCodigoBusqueda('');
            setCargando(false);
        }
    };

    const agregarItemRecibido = (item, detalleOrden) => {
        const itemExistente = itemsRecibidos.find(i => i.item_id === item.id);
        
        if (itemExistente) {
            const nuevaCantidad = itemExistente.cantidad_recibida + 1;
            if (nuevaCantidad <= detalleOrden.cantidad_pendiente) {
                setItemsRecibidos(items => 
                    items.map(i => 
                        i.item_id === item.id 
                            ? { ...i, cantidad_recibida: nuevaCantidad }
                            : i
                    )
                );
            } else {
                alert(`No puedes recibir más de ${detalleOrden.cantidad_pendiente} unidades de este producto`);
            }
        } else {
            setItemsRecibidos([...itemsRecibidos, {
                item_id: item.id,
                nombre: item.nombre,
                codigo: item.codigo,
                cantidad_ordenada: detalleOrden.cantidad_ordenada,
                cantidad_pendiente: detalleOrden.cantidad_pendiente,
                cantidad_recibida: 1,
                costo_unitario: Number(detalleOrden.costo_unitario || 0)
            }]);
        }
    };

    const agregarItemManual = (detalle) => {
        if (itemsRecibidos.find(i => i.item_id === detalle.item.id)) return;

        setItemsRecibidos([...itemsRecibidos, {
            item_id: detalle.item.id,
            nombre: detalle.item.nombre,
            codigo: detalle.item.codigo,
            cantidad_ordenada: detalle.cantidad,
            cantidad_pendiente: detalle.cantidad_pendiente,
            cantidad_recibida: 0,
            costo_unitario: Number(detalle.costo_unitario || 0)
        }]);
    };

    const actualizarCantidad = (itemId, nuevaCantidad) => {
        const item = itemsRecibidos.find(i => i.item_id === itemId);
        if (!item) return;

        const cantidadNum = parseFloat(nuevaCantidad) || 0;

        if (cantidadNum < 0) return;
        if (cantidadNum > item.cantidad_pendiente) {
            alert(`No puedes recibir más de ${item.cantidad_pendiente} unidades`);
            return;
        }

        setItemsRecibidos(items =>
            items.map(i =>
                i.item_id === itemId ? { ...i, cantidad_recibida: cantidadNum } : i
            )
        );
    };

    const eliminarItem = (itemId) => {
        setItemsRecibidos(items => items.filter(i => i.item_id !== itemId));
    };

    const calcularTotalRecibido = () => {
        return itemsRecibidos.reduce((sum, item) => {
            return sum + (item.cantidad_recibida * item.costo_unitario);
        }, 0);
    };

    const guardarRecepcion = () => {
        const itemsConCantidad = itemsRecibidos.filter(i => i.cantidad_recibida > 0);

        if (itemsConCantidad.length === 0) {
            alert('Debes agregar al menos un producto con cantidad mayor a 0');
            return;
        }

        if (!confirm(`¿Confirmar recepción ${tipoRecepcion}?`)) return;

        router.post(route('compras.recepciones.store'), {
            orden_compra_id: orden.id,
            tipo_recepcion: tipoRecepcion,
            observaciones: observaciones,
            items: itemsConCantidad.map(i => ({
                item_id: i.item_id,
                cantidad_recibida: i.cantidad_recibida
            }))
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Recibir Orden: {orden.numero_orden}
                    </h2>
                    <button
                        onClick={() => router.visit(route('compras.recepciones.index'))}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        ← Volver
                    </button>
                </div>
            }
        >
            <Head title={`Recibir ${orden.numero_orden}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Info General */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Proveedor</p>
                                <p className="font-semibold text-gray-900">{orden.proveedor?.razon_social || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Entrega</p>
                                <p className="font-semibold text-gray-900">
                                    {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-ES') : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total de la Orden</p>
                                <p className="font-semibold text-gray-900">
                                    ${Number(orden.total || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {recepcionesPrevias.length > 0 && (
                            <button
                                onClick={() => setMostrarRecepcionesPrevias(!mostrarRecepcionesPrevias)}
                                className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {mostrarRecepcionesPrevias ? 'Ocultar' : 'Ver'} recepciones previas ({recepcionesPrevias.length})
                            </button>
                        )}
                    </div>

                    {/* Historial rápido (Condicional) */}
                    {mostrarRecepcionesPrevias && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 animate-fade-in">
                            <h3 className="font-semibold text-gray-900 mb-4">Recepciones Anteriores</h3>
                            <div className="space-y-3">
                                {recepcionesPrevias.map((recepcion) => (
                                    <div key={recepcion.id} className="bg-white rounded p-4 shadow-sm flex justify-between">
                                        <div>
                                            <p className="font-medium">{recepcion.numero_recepcion}</p>
                                            <p className="text-xs text-gray-500">{new Date(recepcion.fecha_recepcion).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{recepcion.cantidad_total_items} items</p>
                                            <p className="text-xs text-gray-400">Por: {recepcion.usuario?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Escáner */}
                    <div className="bg-blue-600 rounded-lg shadow-lg p-6 text-white">
                        <h3 className="text-lg font-semibold mb-4">Escanear Producto</h3>
                        <div className="flex gap-3">
                            <input
                                ref={inputCodigoRef}
                                type="text"
                                value={codigoBusqueda}
                                onChange={(e) => setCodigoBusqueda(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && buscarProductoPorCodigo()}
                                placeholder="Escanea el código de barras..."
                                disabled={cargando}
                                className="flex-1 px-4 py-3 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                            <button
                                onClick={buscarProductoPorCodigo}
                                className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                                disabled={cargando || !codigoBusqueda.trim()}
                            >
                                Buscar
                            </button>
                        </div>
                        {mensajeEscaneo && (
                            <div className={`mt-3 p-2 rounded text-center text-sm font-bold ${mensajeEscaneo.includes('✓') ? 'bg-green-500' : 'bg-red-500'}`}>
                                {mensajeEscaneo}
                            </div>
                        )}
                    </div>

                    {/* Tabla de Productos Originales */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-700">Productos Disponibles en Orden</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ordenado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orden.detalles.map((detalle) => (
                                    <tr key={detalle.id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{detalle.item.nombre}</div>
                                            <div className="text-xs text-gray-500">{detalle.item.codigo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">{detalle.cantidad}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">{detalle.cantidad_pendiente}</td>
                                        <td className="px-6 py-4 text-center">
                                            {detalle.cantidad_pendiente > 0 && !itemsRecibidos.find(i => i.item_id === detalle.item.id) && (
                                                <button
                                                    onClick={() => agregarItemManual(detalle)}
                                                    className="text-blue-600 hover:text-blue-900 text-sm font-bold"
                                                >
                                                    + Añadir
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Resumen de Recepción Actual */}
                    {itemsRecibidos.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md border-t-4 border-green-500 p-6">
                            <h3 className="text-lg font-bold mb-4">Items a Ingresar</h3>
                            <div className="space-y-3">
                                {itemsRecibidos.map((item) => (
                                    <div key={item.item_id} className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="w-full md:w-auto mb-2 md:mb-0">
                                            <p className="font-bold text-gray-800">{item.nombre}</p>
                                            <p className="text-xs text-gray-500">Pendiente: {item.cantidad_pendiente}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={item.cantidad_recibida}
                                                onChange={(e) => actualizarCantidad(item.item_id, e.target.value)}
                                                className="w-24 rounded border-gray-300"
                                                step="0.01"
                                            />
                                            <div className="text-right min-w-[100px]">
                                                <p className="text-sm font-bold text-gray-900">
                                                    ${(item.cantidad_recibida * item.costo_unitario).toFixed(2)}
                                                </p>
                                            </div>
                                            <button onClick={() => eliminarItem(item.item_id)} className="text-red-500 hover:text-red-700">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600">Total recepción:</span>
                                    <span className="text-2xl font-black text-green-600">${calcularTotalRecibido().toFixed(2)}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Tipo de Cierre</label>
                                        <select 
                                            value={tipoRecepcion} 
                                            onChange={(e) => setTipoRecepcion(e.target.value)}
                                            className="w-full rounded border-gray-300"
                                        >
                                            <option value="parcial">Recepción Parcial (Quedan pendientes)</option>
                                            <option value="completa">Recepción Completa (Cerrar orden)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Notas</label>
                                        <input 
                                            type="text" 
                                            value={observaciones} 
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            className="w-full rounded border-gray-300"
                                            placeholder="Opcional..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={guardarRecepcion}
                                    className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg transition-transform active:scale-95"
                                >
                                    PROCESAR ENTRADA DE ALMACÉN
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}