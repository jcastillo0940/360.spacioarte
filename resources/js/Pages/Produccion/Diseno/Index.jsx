import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Palette, Clock, Upload, MessageSquare
} from 'lucide-react';

export default function Index({ ordenes }) {
    React.useEffect(() => {
        const channel = window.Echo.channel('orders');
        channel.listen('OrderStateChanged', (e) => {
            console.log('Orden actualizada:', e);
            router.reload({ only: ['ordenes'] });
        });

        return () => {
            channel.stopListening('OrderStateChanged');
        };
    }, []);

    // Agrupar órdenes por estado
    const pendientes = ordenes.filter(o => o.estado === 'Pendiente' || o.estado === 'Borrador');
    const enDiseno = ordenes.filter(o => o.estado === 'Diseño');

    return (
        <AuthenticatedLayout>
            <Head title="Estudio de Diseño" />

            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Palette className="text-purple-600" size={32} />
                            ESTUDIO CREATIVO
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Gestión de flujo de trabajo de diseño y pre-prensa</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold flex flex-col items-center">
                            <span className="text-xs uppercase tracking-wider opacity-70">En Proceso</span>
                            <span className="text-2xl">{enDiseno.length}</span>
                        </div>
                        <div className="bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-bold flex flex-col items-center">
                            <span className="text-xs uppercase tracking-wider opacity-70">Pendientes</span>
                            <span className="text-2xl">{pendientes.length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* COLUMNA 1: PENDIENTES */}
                    <div className="space-y-4">
                        <h2 className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} /> Cola de Espera ({pendientes.length})
                        </h2>

                        {pendientes.length === 0 && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
                                No hay órdenes pendientes
                            </div>
                        )}

                        {pendientes.map(orden => (
                            <div key={orden.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                                {orden.numero_orden}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{orden.vendedor?.nombre}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{orden.cliente?.razon_social}</h3>
                                    </div>
                                    <Link
                                        href={route('produccion.diseno.show', orden.id)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-2 shadow-lg shadow-purple-200 transition-all hover:scale-105 text-xs font-black uppercase"
                                    >
                                        Ver Detalles
                                    </Link>
                                </div>

                                <div className="pl-3 space-y-3">
                                    {orden.detalles.map(d => (
                                        <div key={d.id} className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                                            <span>{d.item.nombre}</span>
                                            <span className="font-bold">x{d.cantidad}</span>
                                        </div>
                                    ))}

                                    {orden.detalle_diseno && (
                                        <div className="text-xs text-slate-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">
                                            <MessageSquare size={12} className="inline mr-1" />
                                            "{orden.detalle_diseno}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* COLUMNA 2: EN PROCESO */}
                    <div className="space-y-4">
                        <h2 className="text-purple-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <Palette size={16} /> En Mesa de Diseño ({enDiseno.length})
                        </h2>

                        {enDiseno.length === 0 && (
                            <div className="bg-purple-50/50 border-2 border-dashed border-purple-100 rounded-xl p-8 text-center text-purple-400 font-medium">
                                No hay trabajos activos. ¡Toma uno de la cola!
                            </div>
                        )}

                        {enDiseno.map(orden => (
                            <div key={orden.id} className="bg-white p-5 rounded-2xl shadow-lg shadow-purple-50 border border-purple-100 hover:border-purple-300 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div>
                                        <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded uppercase mb-2 inline-block">
                                            {orden.numero_orden}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-xl">{orden.cliente?.razon_social}</h3>
                                        <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-2 py-1 rounded">
                                            Entrega: {orden.fecha_entrega}
                                        </p>
                                    </div>

                                    {/* Estado del Diseño Específico */}
                                    {orden.estado_diseno === 'Enviado' ? (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Clock size={12} /> Enviado al Cliente
                                        </span>
                                    ) : (
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Palette size={12} /> Trabajando
                                        </span>
                                    )}
                                </div>

                                <div className="pl-3 space-y-4">
                                    {/* Botón Principal de Acción */}
                                    <Link
                                        href={route('produccion.diseno.show', orden.id)}
                                        className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <Upload size={18} /> Procesar Diseño
                                    </Link>

                                    {orden.diseno_intentos > 0 && (
                                        <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                                            Versión actual: v{orden.diseno_intentos}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
