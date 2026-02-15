import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db'; 
import { SyncService } from '../../Services/SyncService';
import MapaRuta from '@/Components/PWA/MapaRuta';
import BottomNav from '@/Components/PWA/BottomNav';

export default function RutaEntrega({ auth }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'mapa'
    const [currentLocation, setCurrentLocation] = useState(null);
    
    // Consultas Reactivas a la BD Local
    const clientes = useLiveQuery(() => db.clientes.toArray());
    const ordenesPendientes = useLiveQuery(() => db.ordenes_pendientes.count());
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Obtener ubicación GPS actual al cargar
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCurrentLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => console.error("Error GPS:", err),
                { enableHighAccuracy: true }
            );
        }

        // Listener para evento desde el Mapa (Botón "Ir a Visita")
        const handleMapAction = (e) => {
            handleCheckIn(e.detail);
        };
        window.addEventListener('iniciar-visita-mapa', handleMapAction);

        // Intentar sincronización inicial silenciosa
        handleSync();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('iniciar-visita-mapa', handleMapAction);
        };
    }, []);

    const handleSync = async () => {
        if (!navigator.onLine) return;
        setSyncing(true);
        await SyncService.pushData(); 
        await SyncService.pullData(); 
        setSyncing(false);
    };

    const handleCheckIn = (cliente) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                await SyncService.registrarVisita(
                    cliente.id, 
                    position.coords.latitude, 
                    position.coords.longitude, 
                    "Check-in visita"
                );
                // Redirigir a venta tras check-in
                router.visit(route('pwa.venta.create', { cliente_id: cliente.id }));
            });
        } else {
            alert("Geolocalización no disponible");
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Ruta Móvil</h2>}
        >
            <Head title="Venta en Ruta" />

            {/* Contenedor Principal: Altura completa menos header, con padding inferior para el menú */}
            <div className="flex flex-col h-[calc(100vh-65px)] pb-16">
                
                {/* 1. Barra Superior de Control */}
                <div className="bg-white p-2 shadow z-10">
                    {/* Status Sync */}
                    <div className={`p-2 mb-2 rounded text-white text-center text-xs flex justify-between items-center ${isOnline ? 'bg-green-600' : 'bg-gray-600'}`}>
                        <span>{isOnline ? '🟢 Online' : '⚫ Offline'}</span>
                        <span className="font-bold">Pend: {ordenesPendientes || 0}</span>
                        <button 
                            onClick={handleSync} 
                            disabled={syncing || !isOnline}
                            className="bg-white text-black px-2 py-1 rounded text-xs disabled:opacity-50"
                        >
                            {syncing ? '...' : 'Sync'}
                        </button>
                    </div>

                    {/* Toggle Lista / Mapa */}
                    <div className="flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            onClick={() => setViewMode('lista')}
                            className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg ${
                                viewMode === 'lista' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            📋 Lista
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('mapa')}
                            disabled={!isOnline} // Mapa requiere internet para cargar tiles
                            className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg ${
                                viewMode === 'mapa' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400'
                            }`}
                        >
                            🗺️ Mapa
                        </button>
                    </div>
                </div>

                {/* 2. Área de Contenido */}
                <div className="flex-1 overflow-hidden relative bg-gray-100">
                    
                    {/* MODO LISTA */}
                    {viewMode === 'lista' && (
                        <div className="h-full overflow-y-auto p-4 space-y-4">
                            {clientes?.map(cliente => (
                                <div key={cliente.id} className="bg-white p-4 shadow rounded-lg border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{cliente.nombre_fiscal}</h3>
                                            <p className="text-sm text-gray-500">{cliente.direccion}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => router.visit(route('pwa.venta.create', { cliente_id: cliente.id }))}
                                                className="bg-green-600 text-white px-3 py-2 rounded text-xs shadow"
                                            >
                                                🛒 Vender
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!clientes || clientes.length === 0) && (
                                <p className="text-center text-gray-500 mt-10">Sin datos de ruta.</p>
                            )}
                        </div>
                    )}

                    {/* MODO MAPA */}
                    {viewMode === 'mapa' && (
                        <div className="h-full w-full">
                            {isOnline ? (
                                <MapaRuta 
                                    clientes={clientes || []} 
                                    currentLocation={currentLocation}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 flex-col">
                                    <p className="text-4xl mb-2">📡</p>
                                    <p>El mapa requiere conexión a internet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Navegación Inferior */}
            <BottomNav active="ruta" />
        </AuthenticatedLayout>
    );
}