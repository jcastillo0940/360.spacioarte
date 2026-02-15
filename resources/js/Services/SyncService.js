import { db } from '../db';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const SyncService = {
    // 1. Descargar datos del servidor
    async pullData() {
        try {
            const response = await axios.get('/pwa/sync/initial');
            const { ruta, inventario_vehiculo, catalogo } = response.data.data;

            await db.transaction('rw', db.clientes, db.inventario, db.catalogo, async () => {
                // Limpiar y repoblar
                await db.clientes.clear();
                await db.inventario.clear();
                await db.catalogo.clear();

                if (ruta && ruta.clientes) {
                    await db.clientes.bulkPut(ruta.clientes);
                }
                
                if (inventario_vehiculo) {
                    await db.inventario.bulkPut(inventario_vehiculo);
                }

                if (catalogo) {
                    await db.catalogo.bulkPut(catalogo);
                }
            });
            
            console.log('Datos descargados correctamente');
            return true;
        } catch (error) {
            console.error('Error en pullData', error);
            return false;
        }
    },

    // 2. Subir datos pendientes
    async pushData() {
        try {
            const ordenes = await db.ordenes_pendientes.where('sincronizado').equals(0).toArray();
            const visitas = await db.visitas_pendientes.where('sincronizado').equals(0).toArray();

            if (ordenes.length === 0 && visitas.length === 0) return;

            const payload = {
                ordenes: ordenes,
                visitas: visitas
            };

            const response = await axios.post('/pwa/sync/upload', payload);

            if (response.data.status === 'success') {
                await db.transaction('rw', db.ordenes_pendientes, db.visitas_pendientes, async () => {
                    // Marcar como sincronizados o eliminar
                    const syncedOrdenes = response.data.synced.ordenes;
                    const syncedVisitas = response.data.synced.visitas;

                    // Aquí simplificamos eliminando los locales ya subidos
                    // En producción, podrías actualizarlos a estado 'synced'
                    if(syncedOrdenes) {
                        const uuids = syncedOrdenes.map(o => o.uuid);
                        await db.ordenes_pendientes.where('uuid').anyOf(uuids).delete();
                    }
                    if(syncedVisitas) {
                        const uuids = syncedVisitas.map(v => v.uuid);
                        await db.visitas_pendientes.where('uuid').anyOf(uuids).delete();
                    }
                });
                console.log('Sincronización de subida completada');
            }
        } catch (error) {
            console.error('Error en pushData', error);
        }
    },

    // Helper para crear Orden Offline
    async crearOrdenOffline(clienteId, items, total, tipo = 'preventa') {
        const orden = {
            uuid: uuidv4(),
            cliente_id: clienteId,
            items: items, // [{id, cantidad, precio}]
            total: total,
            tipo: tipo,
            timestamp: Date.now(),
            sincronizado: 0
        };
        await db.ordenes_pendientes.add(orden);
        
        // Si es autoventa, descontar inventario local visualmente
        if (tipo === 'autoventa') {
             items.forEach(async (item) => {
                 const invItem = await db.inventario.get(item.id);
                 if (invItem) {
                     await db.inventario.update(item.id, { cantidad: invItem.cantidad - item.cantidad });
                 }
             });
        }
    },
    
    // Helper para registrar Visita
    async registrarVisita(clienteId, lat, lng, notas) {
         const visita = {
            uuid: uuidv4(),
            cliente_id: clienteId,
            lat: lat,
            lng: lng,
            notas: notas,
            timestamp: Date.now(),
            sincronizado: 0
        };
        await db.visitas_pendientes.add(visita);
    }
};