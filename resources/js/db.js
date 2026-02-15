import Dexie from 'dexie';

export const db = new Dexie('HPOS_PWA_DB');

db.version(1).stores({
    config: 'key, value', // Configuración de usuario, tokens, ultima sync
    clientes: 'id, nombre_fiscal, orden_ruta', // Clientes asignados
    catalogo: 'id, codigo, nombre', // Productos globales
    inventario: 'item_id, cantidad', // Inventario del camión
    
    // Transacciones pendientes de sync
    ordenes_pendientes: 'uuid, cliente_id, timestamp, [sincronizado]',
    visitas_pendientes: 'uuid, cliente_id, timestamp, [sincronizado]',
});