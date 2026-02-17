import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Layers, Printer, Plus, CheckCircle } from 'lucide-react';

export default function Index({ pendientes, pliegos, papeles }) {
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [pliegoToImprimir, setPliegoToImprimir] = useState(null);

    React.useEffect(() => {
        const channel = window.Echo.channel('orders');
        channel.listen('OrderStateChanged', (e) => {
            router.reload({ only: ['pendientes', 'pliegos'] });
        });
        return () => channel.stopListening('OrderStateChanged');
    }, []);

    const { data, setData, post, processing, reset } = useForm({
        item_id: '',
        ordenes: []
    });

    const { data: materialData, setData: setMaterialData, post: postMaterial, processing: processingMaterial, reset: resetMaterial } = useForm({
        material_id: '',
        cantidad_utilizada: ''
    });

    const toggleSeleccion = (id) => {
        const nuevas = seleccionadas.includes(id)
            ? seleccionadas.filter(i => i !== id)
            : [...seleccionadas, id];
        setSeleccionadas(nuevas);
        setData('ordenes', nuevas);
    };

    const handleCrearPliego = (e) => {
        e.preventDefault();
        post(route('produccion.pliegos.store'), {
            onSuccess: () => {
                setSeleccionadas([]);
                reset();
            }
        });
    };

    const handleImprimir = (pliego) => {
        setPliegoToImprimir(pliego);
        setShowMaterialModal(true);
    };

    const handleSubmitMaterial = (e) => {
        e.preventDefault();
        postMaterial(route('produccion.pliegos.imprimir', pliegoToImprimir.id), {
            onSuccess: () => {
                setShowMaterialModal(false);
                resetMaterial();
                setPliegoToImprimir(null);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Pliegos (Nesting)" />
            <div className="max-w-7xl mx-auto p-6 space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* COLUMNA 1: Órdenes Pendientes de Agrupar */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                            <h2 className="font-black text-slate-800 flex items-center gap-2"><Layers size={20} /> ÓRDENES EN COLA DE IMPRESIÓN</h2>
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">{pendientes.length} Pendientes</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="p-4 text-left">Selección</th>
                                        <th className="p-4 text-left">Orden / Cliente</th>
                                        <th className="p-4 text-left">Producto</th>
                                        <th className="p-4 text-center">Cant.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pendientes.map(p => (
                                        <tr key={p.id} className={seleccionadas.includes(p.id) ? 'bg-blue-50' : ''}>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionadas.includes(p.id)}
                                                    onChange={() => toggleSeleccion(p.id)}
                                                    className="rounded border-slate-300 text-blue-600 w-5 h-5"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold">#{p.venta.numero_orden}</div>
                                                <div className="text-slate-400 text-xs">{p.venta.cliente.razon_social}</div>
                                            </td>
                                            <td className="p-4 font-medium uppercase">{p.materia_prima?.nombre}</td>
                                            <td className="p-4 text-center font-bold">{p.cantidad}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COLUMNA 2: Formulario de Creación de Pliego */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100">
                            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg uppercase">
                                <Plus size={24} className="text-blue-600" /> Armar Nuevo Pliego
                            </h3>
                            <form onSubmit={handleCrearPliego} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Papel / Soporte</label>
                                    <select
                                        className="w-full border-slate-200 rounded-xl font-bold"
                                        value={data.item_id}
                                        onChange={e => setData('item_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione material...</option>
                                        {papeles.map(papel => <option key={papel.id} value={papel.id}>{papel.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-blue-700 font-bold text-sm">Órdenes seleccionadas: {seleccionadas.length}</p>
                                </div>
                                <button
                                    disabled={processing || seleccionadas.length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-100 disabled:opacity-50"
                                >
                                    CREAR PLIEGO [NESTING]
                                </button>
                            </form>
                        </div>

                        {/* COLUMNA 3: Pliegos Recientes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                                <h2 className="font-bold flex items-center gap-2"><Printer size={18} /> ÚLTIMOS PLIEGOS</h2>
                            </div>
                            <div className="divide-y">
                                {pliegos.map(pl => (
                                    <div key={pl.id} className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-black text-slate-800">PLIEGO #{pl.id}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${pl.estado === 'Impreso' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>{pl.estado}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{pl.materia_prima?.nombre}</p>
                                        {pl.estado === 'Pendiente' && (
                                            <button
                                                onClick={() => handleImprimir(pl)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 uppercase tracking-tighter"
                                            >
                                                <CheckCircle size={14} /> Marcar como Impreso
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Material */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="font-black text-xl text-slate-900 mb-4">Registrar Material Utilizado</h3>
                        <form onSubmit={handleSubmitMaterial} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Material / Insumo</label>
                                <select
                                    className="w-full border-slate-200 rounded-xl font-bold"
                                    value={materialData.material_id}
                                    onChange={e => setMaterialData('material_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione material...</option>
                                    {papeles.map(papel => (
                                        <option key={papel.id} value={papel.id}>
                                            {papel.nombre} (Stock: {papel.stock_actual})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cantidad Utilizada</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="w-full border-slate-200 rounded-xl font-bold"
                                    value={materialData.cantidad_utilizada}
                                    onChange={e => setMaterialData('cantidad_utilizada', e.target.value)}
                                    required
                                    placeholder="Ej: 10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMaterialModal(false);
                                        resetMaterial();
                                    }}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={processingMaterial}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                                >
                                    {processingMaterial ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}