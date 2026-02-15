import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%' // Se ajustará al contenedor padre
};

// Coordenadas por defecto (Ej: Centro de la ciudad o almacén)
const defaultCenter = {
    lat: 8.9824, 
    lng: -79.5199 
};

export default function MapaRuta({ clientes, currentLocation }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (!isLoaded) return <div className="p-4 text-center">Cargando Mapa...</div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentLocation || defaultCenter}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                disableDefaultUI: true, // Interfaz limpia para móvil
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false
            }}
        >
            {/* Marcador: Ubicación Actual del Vendedor */}
            {currentLocation && (
                <Marker
                    position={currentLocation}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    }}
                    title="Tu ubicación"
                />
            )}

            {/* Marcadores: Clientes en la ruta */}
            {clientes.map(cliente => {
                // Validar que el cliente tenga coordenadas
                if (!cliente.latitud || !cliente.longitud) return null;
                
                const position = { 
                    lat: parseFloat(cliente.latitud), 
                    lng: parseFloat(cliente.longitud) 
                };

                return (
                    <Marker
                        key={cliente.id}
                        position={position}
                        onClick={() => setSelectedClient(cliente)}
                        // Diferenciar color si ya fue visitado (lógica opcional)
                        label={{
                            text: (cliente.orden_visita || "").toString(),
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold"
                        }}
                    />
                );
            })}

            {/* InfoWindow al hacer click en un cliente */}
            {selectedClient && (
                <InfoWindow
                    position={{ 
                        lat: parseFloat(selectedClient.latitud), 
                        lng: parseFloat(selectedClient.longitud) 
                    }}
                    onCloseClick={() => setSelectedClient(null)}
                >
                    <div className="p-2 min-w-[150px]">
                        <h3 className="font-bold text-sm text-gray-900">{selectedClient.nombre_fiscal}</h3>
                        <p className="text-xs text-gray-500">{selectedClient.direccion}</p>
                        <button 
                            className="mt-2 w-full bg-blue-600 text-white text-xs py-1 rounded shadow"
                            onClick={() => {
                                // Evento personalizado para iniciar acción desde el mapa
                                window.dispatchEvent(new CustomEvent('iniciar-visita-mapa', { detail: selectedClient }));
                            }}
                        >
                            Ir a Visita
                        </button>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}