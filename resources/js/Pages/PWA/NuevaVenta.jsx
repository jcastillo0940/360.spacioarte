import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { SyncService } from '../../Services/SyncService';

export default function NuevaVenta({ auth, cliente_id }) {
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState([]);
    const [procesando, setProcesando] = useState(false);

    // Consultas a BD Local
    const cliente = useLiveQuery(() => db.clientes.get(parseInt(cliente_id)), [cliente_id]);
    const catalogo = useLiveQuery(() => db.catalogo.toArray());
    const inventario = useLiveQuery(() => db.inventario.toArray());

    // Filtrado de productos
    const productosFiltrados = useMemo(() => {
        if (!catalogo) return [];
        return catalogo.filter(p => 
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
            p.codigo.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [catalogo, busqueda]);

    // Lógica del Carrito
    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                return prev.map(item => 
                    item.id === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1 } 
                    : item
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    const cambiarCantidad = (id, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.id === id) {
                const nuevaCantidad = Math.max(0, item.cantidad + delta);
                return { ...item, cantidad: nuevaCantidad };
            }
            return item;
        }).filter(item => item.cantidad > 0));
    };

    const totalVenta = useMemo(() => {
        return carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    }, [carrito]);

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;
        setProcesando(true);
        
        try {
            // Guardar en Dexie (Cola de salida)
            await SyncService.crearOrdenOffline(
                parseInt(cliente_id),
                carrito.map(i => ({ id: i.id, cantidad: i.cantidad, precio: i.precio })),
                totalVenta,
                'preventa' // Cambiar a 'autoventa' si detecta inventario asociado
            );

            alert('✅ Pedido guardado localmente. Se sincronizará cuando haya conexión.');
            router.visit('/pwa/ruta-entrega');
        } catch (error) {
            console.error(error);
            alert('❌ Error al guardar pedido');
        } finally {
            setProcesando(false);
        }
    };

    if (!cliente) return <div className="p-4 text-center">Cargando cliente...</div>;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <button onClick={() => router.visit('/pwa/ruta-entrega')} className="text-sm bg-gray-200 px-2 py-1 rounded">⬅ Volver</button>
                    <h2 className="font-semibold text-lg text-gray-800 leading-tight truncate ml-2">
                        Venta: {cliente.nombre_fiscal}
                    </h2>
                </div>
            }
        >
            <Head title="Nueva Venta" />

            <div className="flex flex-col h-[calc(100vh-140px)]">
                {/* Buscador */}
                <div className="p-4 bg-white shadow z-10">
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar producto..." 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {/* Lista de Productos (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50 pb-24">
                    <div className="grid grid-cols-1 gap-2">
                        {productosFiltrados.map(prod => {
                            const enCarrito = carrito.find(c => c.id === prod.id);
                            const stockItem = inventario?.find(i => i.item_id === prod.id);
                            
                            return (
                                <div key={prod.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">{prod.nombre}</div>
                                        <div className="text-xs text-gray-500">Cod: {prod.codigo}</div>
                                        <div className="text-blue-600 font-bold">${parseFloat(prod.precio).toFixed(2)}</div>
                                        {stockItem && <div className="text-xs text-green-600">Stock Camión: {stockItem.cantidad}</div>}
                                    </div>

                                    {enCarrito ? (
                                        <div className="flex items-center gap-2 bg-blue-50 p-1 rounded">
                                            <button onClick={() => cambiarCantidad(prod.id, -1)} className="w-8 h-8 bg-blue-200 rounded text-blue-800 font-bold">-</button>
                                            <span className="font-bold w-6 text-center">{enCarrito.cantidad}</span>
                                            <button onClick={() => cambiarCantidad(prod.id, 1)} className="w-8 h-8 bg-blue-600 rounded text-white font-bold">+</button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => agregarAlCarrito(prod)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded border border-gray-300"
                                        >
                                            Agregar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {productosFiltrados.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">No se encontraron productos.</div>
                        )}
                    </div>
                </div>

                {/* Resumen Carrito (Fixed Bottom) */}
                {carrito.length > 0 && (
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg p-4 z-20">
                        <div className="max-w-md mx-auto">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600">{carrito.length} Ítems</span>
                                <span className="text-2xl font-bold text-gray-900">${totalVenta.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={finalizarVenta}
                                disabled={procesando}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-50"
                            >
                                {procesando ? 'Guardando...' : 'FINALIZAR PEDIDO'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}