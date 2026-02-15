import React, { useState } from 'react';
import { FileX } from 'lucide-react';
import CrearNotaCreditoModal from './CrearNotaCreditoModal';

/**
 * Componente para integrar en la vista de Facturas
 * Agregar este botón en Ventas/Facturas/Show.jsx
 */
export default function BotonCrearNotaCredito({ factura, onNotaCreditoCreada }) {
    const [modalOpen, setModalOpen] = useState(false);

    // Validar si se puede crear NC
    const puedeCrearNC = factura.saldo_pendiente > 0 && factura.estado !== 'Anulada';

    if (!puedeCrearNC) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
                <FileX className="w-5 h-5 mr-2" />
                Crear Nota de Crédito
            </button>

            <CrearNotaCreditoModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                facturaId={factura.id}
                onSuccess={onNotaCreditoCreada}
            />
        </>
    );
}

/**
 * EJEMPLO DE USO EN Show.jsx de Facturas:
 * 
 * import BotonCrearNotaCredito from '@/Components/NotasCredito/BotonCrearNotaCredito';
 * 
 * // Dentro del componente:
 * const handleNotaCreditoCreada = (notaCredito) => {
 *     // Recargar la factura o hacer lo que necesites
 *     console.log('NC creada:', notaCredito);
 *     // Podrías usar router.reload() o fetchFactura()
 * };
 * 
 * // En el JSX, donde quieras el botón (típicamente cerca de acciones):
 * <BotonCrearNotaCredito 
 *     factura={factura} 
 *     onNotaCreditoCreada={handleNotaCreditoCreada}
 * />
 */