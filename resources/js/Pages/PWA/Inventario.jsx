import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import BottomNav from '@/Components/PWA/BottomNav';

export default function Inventario({ auth }) {
    const [busqueda, setBusqueda] = useState('');

    // Consulta reactiva a Dexie (Local DB)
    const inventario = useLiveQuery(() => db.inventario.toArray());

    const itemsFiltrados = inventario?.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.codigo.toLowerCase().includes(busqueda.toLowerCase())
    );

    const valorTotal = itemsFiltrados?.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) || 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Mi Inventario</h2>}
        >
            <Head title="Inventario a Bordo" />

            <div className="flex flex-col h-[calc(100vh-65px)] pb-16"> {/* Padding bottom para el Nav */}
                
                {/* Buscador y Resumen */}
                <div className="bg-white p-4 shadow z-10 sticky top-0">
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar producto..." 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-3"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <div className="flex justify-between text-sm text-gray-600 bg-gray-100 p-2 rounded">
                        <span>Items: <strong>{itemsFiltrados?.length || 0}</strong></span>
                        <span>Valor: <strong>${valorTotal.toFixed(2)}</strong></span>
                    </div>
                </div>

                {/* Lista de Productos */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                    {itemsFiltrados?.map(item => (
                        <div key={item.item_id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center border-l-4 border-blue-400">
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-gray-900 truncate">{item.nombre}</h3>
                                <p className="text-xs text-gray-500">COD: {item.codigo}</p>
                                <p className="text-blue-600 font-bold mt-1">${parseFloat(item.precio).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-2xl font-bold ${item.cantidad < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                                    {item.cantidad}
                                </span>
                                <span className="text-xs text-gray-400">unidades</span>
                            </div>
                        </div>
                    ))}

                    {(!itemsFiltrados || itemsFiltrados.length === 0) && (
                        <div className="text-center py-10">
                            <p className="text-gray-400 text-5xl mb-2">📦</p>
                            <p className="text-gray-500">No hay inventario cargado o no coincide con la búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>

            <BottomNav active="inventario" />
        </AuthenticatedLayout>
    );
}