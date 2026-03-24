import React, { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle, Layers, Package2, Printer, Rows3, Scissors, Sparkles } from 'lucide-react';
import { buildNestingPlan, formatMaterialDimensions, isOrderCompatibleWithMaterial } from '@/Services/NestingPlanner';

const formatNumber = (value, decimals = 2) => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) return '0';
    return parsed.toFixed(decimals).replace(/\.?0+$/, '');
};

const getArtworkSize = (orden) => {
    const ancho = parseFloat(orden?.producto?.ancho_imprimible || 0);
    const largo = parseFloat(orden?.producto?.largo_imprimible || 0);

    if (!ancho || !largo) return 'Sin medida';

    return `${formatNumber(ancho)} x ${formatNumber(largo)} cm`;
};

const PreviewCanvas = ({ preview }) => {
    if (!preview) return null;

    const maxWidth = 540;
    const maxHeight = 360;
    const scale = Math.min(maxWidth / Math.max(preview.width || 1, 1), maxHeight / Math.max(preview.height || 1, 1));
    const canvasWidth = Math.max(220, Math.round((preview.width || 1) * scale));
    const canvasHeight = Math.max(140, Math.round((preview.height || 1) * scale));

    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                        {preview.mode === 'rollo' ? 'Vista del rollo' : 'Vista del pliego'}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        Base visual {formatNumber(preview.width)} x {formatNumber(preview.height)} cm
                    </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-2 text-right shadow-sm ring-1 ring-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Piezas visibles</p>
                    <p className="text-xl font-black text-slate-900">{preview.placements.length}</p>
                </div>
            </div>

            <div className="flex justify-center overflow-auto rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div
                    className="relative overflow-hidden rounded-xl border-4 border-slate-300 bg-slate-100"
                    style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
                >
                    {preview.placements.map((placement, index) => (
                        <div
                            key={`${placement.orderId}-${index}`}
                            className="absolute flex items-center justify-center overflow-hidden rounded-md border text-[10px] font-black uppercase shadow-sm"
                            style={{
                                left: `${placement.x * scale}px`,
                                top: `${placement.y * scale}px`,
                                width: `${Math.max(28, placement.width * scale)}px`,
                                height: `${Math.max(24, placement.height * scale)}px`,
                                backgroundColor: placement.color.fill,
                                borderColor: placement.color.stroke,
                                color: placement.color.text,
                            }}
                            title={`${placement.label}${placement.rotated ? ' (rotado)' : ''}`}
                        >
                            <span className="truncate px-1">{placement.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function Index({ pendientes, pliegos, papeles }) {
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [pliegoToImprimir, setPliegoToImprimir] = useState(null);

    useEffect(() => {
        const channel = window.Echo.channel('orders');
        channel.listen('OrderStateChanged', () => {
            router.reload({ only: ['pendientes', 'pliegos'] });
        });

        return () => channel.stopListening('OrderStateChanged');
    }, []);

    const { data, setData, post, processing, reset } = useForm({
        item_id: '',
        ordenes: [],
    });

    const {
        data: materialData,
        setData: setMaterialData,
        post: postMaterial,
        processing: processingMaterial,
        reset: resetMaterial,
    } = useForm({
        material_id: '',
        cantidad_utilizada: '',
    });

    const selectedMaterial = papeles.find((papel) => String(papel.id) === String(data.item_id));
    const selectedOrders = pendientes.filter((orden) => seleccionadas.includes(orden.id));
    const nestingPlan = buildNestingPlan(selectedOrders, selectedMaterial);

    const incompatibleSelection = selectedMaterial
        ? selectedOrders.some((orden) => !isOrderCompatibleWithMaterial(orden, selectedMaterial))
        : false;

    const canCreatePliego = Boolean(
        data.item_id &&
        seleccionadas.length > 0 &&
        !processing &&
        !incompatibleSelection &&
        nestingPlan.errors.length === 0
    );

    const calcularCantidadPliego = (pliego) => {
        const total = (pliego?.items || []).reduce((acumulado, orden) => {
            const cantidadCalculada = parseFloat(orden.cantidad_material_calculada || orden.pliegos || 0);
            return acumulado + (Number.isFinite(cantidadCalculada) ? cantidadCalculada : 0);
        }, 0);

        return total > 0 ? total.toFixed(4).replace(/\.?0+$/, '') : '';
    };

    const toggleSeleccion = (orden) => {
        if (selectedMaterial && !isOrderCompatibleWithMaterial(orden, selectedMaterial)) {
            return;
        }

        const nuevas = seleccionadas.includes(orden.id)
            ? seleccionadas.filter((id) => id !== orden.id)
            : [...seleccionadas, orden.id];

        setSeleccionadas(nuevas);
        setData('ordenes', nuevas);
    };

    const handleMaterialChange = (value) => {
        setData('item_id', value);

        if (!value) {
            return;
        }

        const material = papeles.find((papel) => String(papel.id) === String(value));
        if (!material) {
            return;
        }

        const compatibles = seleccionadas.filter((ordenId) => {
            const orden = pendientes.find((pendiente) => pendiente.id === ordenId);
            return orden ? isOrderCompatibleWithMaterial(orden, material) : false;
        });

        if (compatibles.length !== seleccionadas.length) {
            setSeleccionadas(compatibles);
            setData('ordenes', compatibles);
        }
    };

    const handleCrearPliego = (e) => {
        e.preventDefault();
        post(route('produccion.pliegos.store'), {
            onSuccess: () => {
                setSeleccionadas([]);
                reset();
            },
        });
    };

    const handleImprimir = (pliego) => {
        setPliegoToImprimir(pliego);
        setMaterialData({
            material_id: pliego.item_id ? String(pliego.item_id) : '',
            cantidad_utilizada: calcularCantidadPliego(pliego),
        });
        setShowMaterialModal(true);
    };

    const handleSubmitMaterial = (e) => {
        e.preventDefault();
        postMaterial(route('produccion.pliegos.imprimir', pliegoToImprimir.id), {
            onSuccess: () => {
                setShowMaterialModal(false);
                resetMaterial();
                setPliegoToImprimir(null);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pliegos y Nesting Visual" />

            <div className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
                <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-8 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Produccion visual</p>
                            <h1 className="text-3xl font-black text-slate-950">Planificador de pliegos y soportes</h1>
                            <p className="text-sm leading-7 text-slate-600">
                                Selecciona varios trabajos del mismo material y el sistema te mostrara cuantas piezas caben
                                por pliego o por rollo, como se distribuyen visualmente y cuanto soporte estimado debes consumir.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Trabajos en cola</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{pendientes.length}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Seleccionados</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{seleccionadas.length}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Soporte</p>
                                <p className="mt-1 text-sm font-black text-slate-900">
                                    {selectedMaterial ? formatMaterialDimensions(selectedMaterial) : 'Sin seleccionar'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
                    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Paso 1</p>
                                <h2 className="mt-1 flex items-center gap-2 text-lg font-black text-slate-900">
                                    <Layers size={18} />
                                    Trabajos listos para nesting
                                </h2>
                            </div>
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                {pendientes.length} pendientes
                            </span>
                        </div>

                        <div className="space-y-3 p-5">
                            {pendientes.map((orden) => {
                                const compatible = selectedMaterial ? isOrderCompatibleWithMaterial(orden, selectedMaterial) : true;
                                const isSelected = seleccionadas.includes(orden.id);

                                return (
                                    <button
                                        key={orden.id}
                                        type="button"
                                        onClick={() => toggleSeleccion(orden)}
                                        disabled={!compatible}
                                        className={`w-full rounded-2xl border p-4 text-left transition ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : compatible
                                                    ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    : 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex gap-4">
                                                <div className={`mt-1 h-5 w-5 rounded-md border-2 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                                    {isSelected && <CheckCircle size={16} className="text-white" />}
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                                                            {orden.venta?.numero_orden || `OT-${orden.id}`}
                                                        </p>
                                                        <h3 className="text-base font-black uppercase text-slate-900">
                                                            {orden.producto?.nombre || 'Producto sin nombre'}
                                                        </h3>
                                                        <p className="text-sm text-slate-600">{orden.venta?.cliente?.razon_social}</p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                                                        <span className="rounded-full bg-slate-100 px-3 py-1">
                                                            Cantidad: {formatNumber(orden.cantidad, 0)}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-3 py-1">
                                                            Arte: {getArtworkSize(orden)}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-3 py-1">
                                                            Soporte pedido: {orden.materia_usada?.nombre || orden.materia_prima?.nombre || 'Por definir'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start gap-2 lg:items-end">
                                                <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
                                                    compatible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {compatible ? 'Compatible' : 'No compatible'}
                                                </span>
                                                <p className="max-w-xs text-xs text-slate-500">
                                                    {compatible
                                                        ? 'Puedes mezclar este trabajo en el pliego actual.'
                                                        : 'Cambia el soporte o deja este trabajo fuera del pliego.'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {!pendientes.length && (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                                    No hay ordenes pendientes de nesting.
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Paso 2</p>
                            <h2 className="mt-2 flex items-center gap-2 text-xl font-black text-slate-950">
                                <Package2 size={20} />
                                Soporte y creacion del pliego
                            </h2>

                            <form onSubmit={handleCrearPliego} className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                        Papel, vinilo o soporte
                                    </label>
                                    <select
                                        className="w-full rounded-2xl border-slate-200 bg-white font-bold text-slate-900"
                                        value={data.item_id}
                                        onChange={(e) => handleMaterialChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecciona el soporte...</option>
                                        {papeles.map((papel) => (
                                            <option key={papel.id} value={papel.id}>
                                                {papel.nombre} - {formatMaterialDimensions(papel)} - Stock {formatNumber(papel.stock_actual, 2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedMaterial && (
                                    <div className="rounded-2xl bg-cyan-50 p-4 ring-1 ring-cyan-100">
                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">Soporte activo</p>
                                        <p className="mt-1 text-lg font-black text-cyan-950">{selectedMaterial.nombre}</p>
                                        <p className="mt-1 text-sm font-bold text-cyan-800">{formatMaterialDimensions(selectedMaterial)}</p>
                                        <p className="mt-1 text-xs text-cyan-700">
                                            Stock actual: {formatNumber(selectedMaterial.stock_actual, 2)} {selectedMaterial.unidad_medida || 'UND'}
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Trabajos elegidos</p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">{seleccionadas.length}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                                            {selectedMaterial?.es_rollo ? 'Largo estimado' : 'Pliegos estimados'}
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">
                                            {selectedMaterial?.es_rollo
                                                ? formatNumber(nestingPlan.summary?.totalMaterial || 0)
                                                : formatNumber(nestingPlan.summary?.totalPliegos || 0, 0)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    disabled={!canCreatePliego}
                                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Crear pliego
                                </button>
                            </form>
                        </section>
                        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
                                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
                                    <Printer size={16} />
                                    Ultimos pliegos
                                </h2>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {pliegos.map((pliego) => (
                                    <div key={pliego.id} className="space-y-3 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">PLG-{pliego.id}</p>
                                                <p className="font-black text-slate-900">{pliego.materia_prima?.nombre}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                                                pliego.estado === 'Impreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {pliego.estado}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-slate-600">
                                            <p>Trabajos: {pliego.items?.length || 0}</p>
                                            <p>Material usado: {formatNumber(pliego.cantidad_material || 0)} {pliego.materia_prima?.unidad_medida || 'UND'}</p>
                                        </div>

                                        {pliego.estado === 'Pendiente' && (
                                            <button
                                                type="button"
                                                onClick={() => handleImprimir(pliego)}
                                                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-700"
                                            >
                                                Marcar como impreso
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {!pliegos.length && (
                                    <div className="p-6 text-center text-sm font-bold text-slate-500">
                                        Todavia no hay pliegos recientes.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Paso 3</p>
                            <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-950">
                                <Sparkles size={22} />
                                Nesting visual del pliego
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                                Esta vista previa le dice al disenador y al impresor como cabe el arte en el soporte actual.
                                Si seleccionas varios trabajos compatibles, el preview intentara combinarlos en el mismo pliego o rollo.
                            </p>
                        </div>

                        {nestingPlan.summary && (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Piezas totales</p>
                                    <p className="mt-1 text-xl font-black text-slate-900">{nestingPlan.summary.totalPiezas}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                        {selectedMaterial?.es_rollo ? 'Largo total' : 'Pliegos'}
                                    </p>
                                    <p className="mt-1 text-xl font-black text-slate-900">
                                        {selectedMaterial?.es_rollo
                                            ? `${formatNumber(nestingPlan.summary.totalMaterial || 0)} cm`
                                            : nestingPlan.summary.totalPliegos}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                        {selectedMaterial?.es_rollo ? 'Piezas visibles' : 'Piezas en primer pliego'}
                                    </p>
                                    <p className="mt-1 text-xl font-black text-slate-900">
                                        {selectedMaterial?.es_rollo
                                            ? nestingPlan.summary.piezasEnVista || 0
                                            : nestingPlan.summary.piezasEnPrimerPliego || 0}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
                        <div className="space-y-4">
                            {nestingPlan.errors.length > 0 && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                                    {nestingPlan.errors.map((error) => (
                                        <p key={error}>{error}</p>
                                    ))}
                                </div>
                            )}

                            {nestingPlan.preview ? (
                                <PreviewCanvas preview={nestingPlan.preview} />
                            ) : (
                                <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                    <div className="max-w-md space-y-3">
                                        <Rows3 size={34} className="mx-auto text-slate-400" />
                                        <h3 className="text-lg font-black text-slate-900">Todavia no hay preview</h3>
                                        <p className="text-sm leading-7 text-slate-600">
                                            Elige un soporte y uno o varios trabajos para ver como quedarian distribuidos en el pliego o en el rollo.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                                    <Scissors size={16} />
                                    Rendimiento por trabajo
                                </h3>

                                <div className="mt-4 space-y-3">
                                    {nestingPlan.jobs.map((job) => (
                                        <div key={job.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{job.label}</p>
                                                    <p className="text-xs text-slate-500">{getArtworkSize(job.job)}</p>
                                                </div>
                                                <span
                                                    className="inline-flex h-4 w-4 rounded-full"
                                                    style={{ backgroundColor: job.color.fill }}
                                                />
                                            </div>

                                            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                                                <span className="rounded-xl bg-slate-50 px-3 py-2">Cantidad: {job.quantity}</span>
                                                <span className="rounded-xl bg-slate-50 px-3 py-2">
                                                    {selectedMaterial?.es_rollo
                                                        ? `Piezas por fila: ${job.orientation?.capacity || 0}`
                                                        : `Piezas por pliego: ${job.orientation?.capacity || 0}`}
                                                </span>
                                                <span className="rounded-xl bg-slate-50 px-3 py-2">
                                                    Orientacion: {job.orientation?.rotated ? 'Rotada' : 'Normal'}
                                                </span>
                                                <span className="rounded-xl bg-slate-50 px-3 py-2">
                                                    Paso real: {formatNumber(job.orientation?.pieceWidth || 0)} x {formatNumber(job.orientation?.pieceHeight || 0)} cm
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {!nestingPlan.jobs.length && (
                                        <div className="rounded-2xl bg-white p-5 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
                                            Aun no hay trabajos seleccionados.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {nestingPlan.preview?.usedByJob && (
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                                        Piezas que entran en la vista actual
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {nestingPlan.jobs
                                            .filter((job) => nestingPlan.preview.usedByJob[job.id])
                                            .map((job) => (
                                                <div key={job.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                                                    <span>{job.label}</span>
                                                    <span>{nestingPlan.preview.usedByJob[job.id]} pzs</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {showMaterialModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-black text-slate-900">Registrar material consumido</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Confirma cuanto soporte se uso realmente al imprimir este pliego.
                        </p>

                        <form onSubmit={handleSubmitMaterial} className="mt-5 space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    Material
                                </label>
                                <select
                                    className="w-full rounded-2xl border-slate-200 font-bold"
                                    value={materialData.material_id}
                                    onChange={(e) => setMaterialData('material_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione material...</option>
                                    {papeles.map((papel) => (
                                        <option key={papel.id} value={papel.id}>
                                            {papel.nombre} - Stock {formatNumber(papel.stock_actual, 2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    Cantidad utilizada
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="w-full rounded-2xl border-slate-200 font-bold"
                                    value={materialData.cantidad_utilizada}
                                    onChange={(e) => setMaterialData('cantidad_utilizada', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMaterialModal(false);
                                        resetMaterial();
                                        setPliegoToImprimir(null);
                                    }}
                                    className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={processingMaterial}
                                    className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
