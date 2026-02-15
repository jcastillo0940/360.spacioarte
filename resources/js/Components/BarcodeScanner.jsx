import React, { useState, useRef, useEffect } from 'react';

/**
 * Componente de Escáner de Código de Barras
 * Optimizado para uso en dispositivos móviles y escáneres físicos
 */
export default function BarcodeScanner({ onScan, disabled = false, ordenId }) {
    const [codigo, setCodigo] = useState('');
    const [scanning, setScanning] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const inputRef = useRef(null);
    const scanTimeout = useRef(null);

    // Mantener el foco en el input
    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled, mensaje]);

    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (scanTimeout.current) {
                clearTimeout(scanTimeout.current);
            }
        };
    }, []);

    const handleScan = async () => {
        if (!codigo.trim() || scanning) return;

        setScanning(true);
        setMensaje('🔍 Buscando...');

        try {
            const response = await fetch(route('api.compras.recepciones.buscar-codigo'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    codigo: codigo.trim(),
                    orden_id: ordenId
                })
            });

            const data = await response.json();

            if (data.success) {
                setMensaje(`✓ ${data.item.nombre}`);
                onScan(data.item, data.detalle_orden);
                
                // Reproducir sonido de éxito (opcional)
                playSuccessSound();
            } else {
                setMensaje('✗ Producto no encontrado');
                playErrorSound();
            }
        } catch (error) {
            console.error('Error:', error);
            setMensaje('✗ Error de conexión');
            playErrorSound();
        } finally {
            setCodigo('');
            setScanning(false);
            
            // Limpiar mensaje después de 2 segundos
            if (scanTimeout.current) {
                clearTimeout(scanTimeout.current);
            }
            scanTimeout.current = setTimeout(() => {
                setMensaje('');
            }, 2000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleScan();
        }
    };

    const playSuccessSound = () => {
        // Sonido de éxito
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA==');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    };

    const playErrorSound = () => {
        // Sonido de error
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSAwMV6vn77FgGgc+lNjyy3cmBSp+zPDaizsIGGS46+qeUQ==');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    };

    return (
        <div className="space-y-3">
            {/* Input de Escaneo */}
            <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escanea o escribe el código..."
                    disabled={disabled || scanning}
                    className="w-full pl-14 pr-4 py-4 text-lg text-gray-900 bg-white rounded-lg shadow-lg focus:ring-4 focus:ring-white focus:ring-opacity-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
                {scanning && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {/* Botón de Búsqueda Manual */}
            <button
                onClick={handleScan}
                disabled={disabled || scanning || !codigo.trim()}
                className="w-full py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
                {scanning ? 'Buscando...' : 'Buscar Producto'}
            </button>

            {/* Mensaje de Resultado */}
            {mensaje && (
                <div className={`p-4 rounded-lg text-center font-medium text-white shadow-lg transition-all ${
                    mensaje.includes('✓') 
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-red-500'
                }`}>
                    {mensaje}
                </div>
            )}

            {/* Instrucciones */}
            <div className="text-white text-sm text-center opacity-90">
                <p>💡 Tip: El escáner de código de barras funcionará automáticamente</p>
                <p className="text-xs mt-1">O escribe el código y presiona Enter</p>
            </div>
        </div>
    );
}
