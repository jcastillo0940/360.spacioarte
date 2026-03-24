import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus,
    Edit,
    Trash2,
    ChevronRight,
    Scale,
    Info,
    AlertCircle,
    HardHat,
    Beaker,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';

export default function Form({ item = null, taxes = [], itemCategories = [], procesos = [], familiasProduccion = [], papeles = [], insumos = [] }) {
    const isEditing = !!item;
    const [activeTab, setActiveTab] = useState('basico');
    const soportesDisponibles = papeles.filter((papel) => !papel.requires_recipe && papel.id !== item?.id);
    const materialesBaseDisponibles = insumos.filter((insumo) => insumo.id !== item?.id && !insumo.requires_recipe);

    const { data, setData, post, put, processing, errors } = useForm({
        codigo: item?.codigo || '',
        nombre: item?.nombre || '',
        tipo: item?.tipo || 'Inventariable',
        precio_venta: item?.precio_venta || 0,
        costo_promedio: item?.costo_promedio || 0,
        tax_id: item?.tax_id || (taxes.length > 0 ? taxes[0].id : ''),
        unidad_medida: item?.unidad_medida || 'UND',
        categoria: item?.categoria || '',
        category_id: item?.category_id || '',
        ancho_cm: item?.ancho_cm || '',
        largo_cm: item?.largo_cm || '',
        es_rollo: item?.es_rollo || false,
        margen_seguridad_cm: item?.margen_seguridad_cm || 0.5,
        proceso_id: item?.proceso_id || '',
        item_base_id: item?.item_base_id || '',
        familia_produccion_id: item?.familia_produccion_id || '',
        es_para_nesting: item?.es_para_nesting || false,
        es_insumo: item?.es_insumo || false,
        requires_recipe: item?.requires_recipe || false,
        tipo_impresion: item?.tipo_impresion || '',
        ancho_imprimible: item?.ancho_imprimible || '',
        largo_imprimible: item?.largo_imprimible || '',
        permite_rotacion: item?.permite_rotacion ?? true,
        separacion_piezas: item?.separacion_piezas || 0.50,
        sangrado: item?.sangrado || 0.30,
        procesos_ids: item?.procesos_compatibles?.map(p => p.id) || [],
        papeles_ids: item?.papeles_compatibles?.map(p => p.id) || [],
        units: item?.units || [],
        ingredientes: item?.ingredientes || []
    });

    const esFabricable = !!data.requires_recipe;
    const esSoporte = !!data.es_para_nesting;
    const familiaSeleccionada = familiasProduccion.find((familia) => String(familia.id) === String(data.familia_produccion_id));
    const getFamiliaId = (codigo) => familiasProduccion.find((familia) => familia.codigo === codigo)?.id || '';
    const plantillasFamilia = {
        SUBL: {
            titulo: 'Sublimacion',
            descripcion: 'Usa producto base, soporte de impresion y nesting por pliego o rollo. Ideal para gorras, tazas y textiles sublimados.',
            sugerencia: {
                tipo: 'Producto Terminado',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
            },
        },
        DTF: {
            titulo: 'DTF Textil',
            descripcion: 'Usa prenda base, soporte en rollo y nesting lineal. Ideal para camisetas y textiles.',
            sugerencia: {
                tipo: 'Producto Terminado',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
                unidad_medida: 'UND',
            },
        },
        VINIL: {
            titulo: 'Vinil Impreso',
            descripcion: 'Usa soporte en rollo, nesting lineal y proceso de impresion o corte. Ideal para stickers, rotulos y decoracion.',
            sugerencia: {
                tipo: 'Producto Terminado',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
            },
        },
        LASER: {
            titulo: 'Corte / Laser',
            descripcion: 'Usa material base, puede requerir nesting por lamina y normalmente no usa soporte de impresion.',
            sugerencia: {
                tipo: 'Producto Terminado',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
            },
        },
        PROMO: {
            titulo: 'Promocionales Rigidos',
            descripcion: 'Usa base fisica y arte aplicado. Normalmente no requiere nesting, pero si receta y control de transformacion.',
            sugerencia: {
                tipo: 'Producto Terminado',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
            },
        },
    };
    const plantillaActiva = familiaSeleccionada ? plantillasFamilia[familiaSeleccionada.codigo] : null;
    const resumenRol = esFabricable
        ? 'Producto fabricable'
        : esSoporte
            ? 'Material soporte'
            : data.es_insumo
                ? 'Insumo interno'
                : 'Producto o servicio';
    const recipeChecklist = familiaSeleccionada ? [
        {
            id: 'base',
            label: 'Producto base o bruto',
            done: !familiaSeleccionada.requiere_material_base || !!data.item_base_id,
            help: 'Define la base fisica del producto en la pestana Manufactura.',
        },
        {
            id: 'support',
            label: 'Soporte compatible',
            done: !familiaSeleccionada.requiere_soporte_impresion || data.papeles_ids.length > 0,
            help: 'Agrega papel, vinil, film o transfer compatible.',
        },
        {
            id: 'art',
            label: 'Tamano de arte',
            done: !familiaSeleccionada.requiere_nesting || (!!data.ancho_imprimible && !!data.largo_imprimible),
            help: 'Completa ancho y alto imprimible para nesting y costo real.',
        },
        {
            id: 'bom',
            label: 'Insumos de receta',
            done: !familiaSeleccionada.requiere_receta || data.ingredientes.length > 0 || !!data.item_base_id,
            help: 'Registra tintas, laminados, adhesivos y otros consumos.',
        },
    ] : [];
    const plantillasProducto = [
        {
            id: 'gorra-sublimada',
            nombre: 'Gorra sublimada',
            descripcion: 'Gorra base + papel sublimable + nesting por pliego',
            config: {
                familia_produccion_id: getFamiliaId('SUBL'),
                tipo: 'Producto Terminado',
                categoria: 'Sublimacion Textil',
                unidad_medida: 'UND',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
                ancho_imprimible: 9,
                largo_imprimible: 15,
                separacion_piezas: 0.5,
                sangrado: 0.3,
            },
        },
        {
            id: 'taza-sublimada',
            nombre: 'Taza sublimada',
            descripcion: 'Taza base + arte panoramico + soporte de sublimacion',
            config: {
                familia_produccion_id: getFamiliaId('SUBL'),
                tipo: 'Producto Terminado',
                categoria: 'Sublimacion Rigidos',
                unidad_medida: 'UND',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
                ancho_imprimible: 20,
                largo_imprimible: 9,
                separacion_piezas: 0.5,
                sangrado: 0.3,
            },
        },
        {
            id: 'camisa-dtf',
            nombre: 'Camisa DTF',
            descripcion: 'Prenda base + film DTF en rollo + nesting lineal',
            config: {
                familia_produccion_id: getFamiliaId('DTF'),
                tipo: 'Producto Terminado',
                categoria: 'DTF Textil',
                unidad_medida: 'UND',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
                ancho_imprimible: 28,
                largo_imprimible: 35,
                separacion_piezas: 1,
                sangrado: 0.2,
            },
        },
        {
            id: 'sticker-vinil',
            nombre: 'Sticker / vinil',
            descripcion: 'Soporte en rollo + nesting lineal + corte',
            config: {
                familia_produccion_id: getFamiliaId('VINIL'),
                tipo: 'Producto Terminado',
                categoria: 'Vinil Impreso',
                unidad_medida: 'UND',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
                ancho_imprimible: 5,
                largo_imprimible: 5,
                separacion_piezas: 0.3,
                sangrado: 0.2,
            },
        },
        {
            id: 'llavero-rigido',
            nombre: 'Llavero / promo rigido',
            descripcion: 'Base rigida + arte aplicado + terminacion',
            config: {
                familia_produccion_id: getFamiliaId('PROMO'),
                tipo: 'Producto Terminado',
                categoria: 'Promocionales Rigidos',
                unidad_medida: 'UND',
                requires_recipe: true,
                es_insumo: false,
                es_para_nesting: false,
                ancho_imprimible: 4,
                largo_imprimible: 6,
                separacion_piezas: 0.3,
                sangrado: 0.2,
            },
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('items.update', item.id));
        } else {
            post(route('items.store'));
        }
    };

    const addUnit = () => {
        setData('units', [...data.units, {
            nombre: '',
            factor_conversion: 1,
            costo_compra: 0,
            precio_venta: 0,
            incluye_impuestos: false,
            es_unidad_compra: false
        }]);
    };

    const removeUnit = (index) => {
        const newUnits = [...data.units];
        newUnits.splice(index, 1);
        setData('units', newUnits);
    };

    const updateUnit = (index, field, value) => {
        const newUnits = [...data.units];
        newUnits[index][field] = value;
        setData('units', newUnits);
    };

    const addIngrediente = () => {
        setData('ingredientes', [...data.ingredientes, { insumo_id: '', cantidad: 1, unidad: 'cm²' }]);
    };

    const removeIngrediente = (index) => {
        const newIngredientes = [...data.ingredientes];
        newIngredientes.splice(index, 1);
        setData('ingredientes', newIngredientes);
    };

    const updateIngrediente = (index, field, value) => {
        const newIngredientes = [...data.ingredientes];
        newIngredientes[index][field] = value;
        setData('ingredientes', newIngredientes);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    useEffect(() => {
        if (data.requires_recipe && data.es_para_nesting) {
            setData('es_para_nesting', false);
        }
    }, [data.requires_recipe, data.es_para_nesting, setData]);

    const aplicarPlantillaFamilia = () => {
        if (!plantillaActiva?.sugerencia) return;

        Object.entries(plantillaActiva.sugerencia).forEach(([key, value]) => {
            setData(key, value);
        });
    };

    const quickAddSupport = () => {
        if (!soportesDisponibles.length) return;

        const firstSupportId = soportesDisponibles[0].id;
        if (!data.papeles_ids.includes(firstSupportId)) {
            setData('papeles_ids', [...data.papeles_ids, firstSupportId]);
        }
    };

    const aplicarPlantillaProducto = (template) => {
        Object.entries(template.config).forEach(([key, value]) => {
            setData(key, value);
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEditing ? `Editar: ${item.nombre}` : "Registrar Nuevo Producto"} />

            <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <Link
                                href={route('items.index')}
                                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    {isEditing ? `Modificando detalles de ${item.nombre}` : 'Completa los datos para registrar en el catálogo'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 flex gap-2">
                        {isEditing && (
                            <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Stock Actual</span>
                                <span className="text-xl font-black text-blue-700 leading-tight">{parseFloat(item.stock_actual).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Rol</span>
                            <span className="text-sm font-black text-slate-800 leading-tight">{resumenRol}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Caso 1</div>
                        <h3 className="font-black text-slate-900">Producto fabricable</h3>
                        <p className="text-xs text-slate-500 mt-2">Activa manufactura, define proceso, material base y soportes compatibles.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Caso 2</div>
                        <h3 className="font-black text-slate-900">Material soporte</h3>
                        <p className="text-xs text-slate-500 mt-2">Marca nesting solo si este item es papel, vinilo, transfer o un soporte real de impresion.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Caso 3</div>
                        <h3 className="font-black text-slate-900">Insumo interno</h3>
                        <p className="text-xs text-slate-500 mt-2">Activa uso interno si el item no debe venderse directo y solo se consumira en receta.</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-5">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plantillas rapidas</div>
                            <h3 className="mt-2 text-lg font-black text-slate-900">Productos tipo listos para usar</h3>
                        </div>
                        <div className="text-xs font-bold text-slate-500">Aplica una base sugerida y luego ajusta detalles.</div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {plantillasProducto.map((template) => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => aplicarPlantillaProducto(template)}
                                className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                            >
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Plantilla</div>
                                <h4 className="mt-2 text-sm font-black text-slate-900">{template.nombre}</h4>
                                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{template.descripcion}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-3 space-y-2">
                        <button
                            onClick={() => setActiveTab('basico')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'basico' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                        >
                            <Info size={18} /> Datos Básicos
                        </button>
                        <button
                            onClick={() => setActiveTab('produccion')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'produccion' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                        >
                            <HardHat size={18} /> Manufactura
                        </button>
                        <button
                            onClick={() => setActiveTab('unidades')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'unidades' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                        >
                            <Scale size={18} /> Unidades
                        </button>
                        <button
                            onClick={() => setActiveTab('receta')}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'receta' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                        >
                            <Beaker size={18} /> Receta / BOM
                        </button>

                        <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Estado de Guardado</h4>
                            <div className="flex items-center gap-3 text-slate-400">
                                {processing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-900"></div>
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                <span className="text-[10px] font-bold uppercase">{processing ? 'Procesando cambios...' : 'Listo para guardar'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Form Area */}
                    <div className="lg:col-span-9">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            <div className="p-8 flex-1">
                                {activeTab === 'basico' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código / SKU</label>
                                                <input
                                                    type="text"
                                                    value={data.codigo}
                                                    onChange={e => setData('codigo', e.target.value)}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-slate-900 focus:border-slate-900 transition-all border"
                                                    placeholder="MAT-001"
                                                    required
                                                />
                                                {errors.codigo && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 italic">{errors.codigo}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                                    <Link
                                                        href={route('inventario.categorias.index')}
                                                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800"
                                                    >
                                                        Configurar catálogo
                                                    </Link>
                                                </div>
                                                <select
                                                    value={data.category_id}
                                                    onChange={e => {
                                                        const selectedId = e.target.value;
                                                        const selectedCategory = itemCategories.find((category) => String(category.id) === String(selectedId));
                                                        setData('category_id', selectedId);
                                                        setData('categoria', selectedCategory?.nombre || '');
                                                    }}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-slate-900 focus:border-slate-900 transition-all border"
                                                >
                                                    <option value="">Sin categoría</option>
                                                    {itemCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>{category.nombre}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-500 px-1">
                                                    Las categorías se administran en un catálogo configurable para mantener el inventario ordenado.
                                                </p>
                                                {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial del Producto</label>
                                            <input
                                                type="text"
                                                value={data.nombre}
                                                onChange={e => setData('nombre', e.target.value)}
                                                className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 text-lg"
                                                required
                                                placeholder="Ej. Taza de Cerámica Blanca 11oz"
                                            />
                                        </div>

                                        <div className={`p-5 rounded-[2rem] border ${esFabricable ? 'bg-blue-50 border-blue-200' : esSoporte ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${esFabricable ? 'text-blue-500' : esSoporte ? 'text-emerald-500' : 'text-slate-400'}`}>Resumen</div>
                                            <h3 className={`mt-2 font-black text-lg ${esFabricable ? 'text-blue-900' : esSoporte ? 'text-emerald-900' : 'text-slate-900'}`}>{resumenRol}</h3>
                                            <p className={`text-xs font-bold mt-2 ${esFabricable ? 'text-blue-700' : esSoporte ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                {esFabricable
                                                    ? 'Este item generara ordenes de produccion y necesitara proceso, material base y soportes compatibles.'
                                                    : esSoporte
                                                        ? 'Este item podra usarse como papel o soporte en ventas y pliegos. No debe ser un producto que tambien se fabrica.'
                                                        : 'Este item funcionara como producto simple, servicio o insumo segun la configuracion adicional que elijas.'}
                                            </p>
                                        </div>

                                        {plantillaActiva && (
                                            <div className="rounded-[2rem] border border-cyan-200 bg-cyan-50 p-5">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Plantilla recomendada</div>
                                                        <h3 className="mt-2 text-lg font-black text-cyan-950">{plantillaActiva.titulo}</h3>
                                                        <p className="mt-2 text-xs font-bold leading-6 text-cyan-800">
                                                            {plantillaActiva.descripcion}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={aplicarPlantillaFamilia}
                                                        className="rounded-2xl bg-cyan-700 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-cyan-800"
                                                    >
                                                        Aplicar sugerencia
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`p-6 rounded-3xl border flex items-center gap-4 ${esFabricable ? 'bg-slate-100 border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                            <div className={`p-3 rounded-2xl ${esFabricable ? 'bg-slate-300 text-white' : 'bg-emerald-500 text-white'}`}>
                                                <HardHat size={22} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-black text-sm uppercase ${esFabricable ? 'text-slate-700' : 'text-emerald-900'}`}>Material soporte para nesting</h4>
                                                <p className={`text-xs font-bold mt-1 ${esFabricable ? 'text-slate-500' : 'text-emerald-700'}`}>
                                                    {esFabricable
                                                        ? 'Los productos fabricables no deben marcarse como soporte. Usa los papeles compatibles en la pestana Manufactura.'
                                                        : 'Activalo solo si este item es papel, vinilo, transfer u otro soporte real que se consumira en produccion.'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => !esFabricable && setData('es_para_nesting', !data.es_para_nesting)}
                                                disabled={esFabricable}
                                                className={`w-14 h-8 rounded-full p-1.5 transition-colors ${data.es_para_nesting && !esFabricable ? 'bg-emerald-500' : 'bg-slate-200'} ${esFabricable ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${data.es_para_nesting && !esFabricable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Artículo</label>
                                                <select
                                                    value={data.tipo}
                                                    onChange={e => setData('tipo', e.target.value)}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 border"
                                                >
                                                    <option value="Inventariable">Producto Inventariable</option>
                                                    <option value="Servicio">Servicio / Mano de Obra</option>
                                                    <option value="Materia Prima">Materia Prima / Insumo</option>
                                                    <option value="Producto Terminado">Producto Terminado</option>
                                                    <option value="Consumible">Consumible de Máquina (Tintas, etc)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad de Medida Base</label>
                                                <select
                                                    value={data.unidad_medida}
                                                    onChange={e => setData('unidad_medida', e.target.value)}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 border"
                                                >
                                                    <option value="UND">Unidad (UND)</option>
                                                    <option value="MT">Metros (MT)</option>
                                                    <option value="MT2">Metros Cuadrados (MT2)</option>
                                                    <option value="CM">Centímetros (CM)</option>
                                                    <option value="CM2">Centímetros Cuadrados (CM2)</option>
                                                    <option value="KG">Kilogramos (KG)</option>
                                                    <option value="LT">Litros (LT)</option>
                                                    <option value="OZ">Onzas (OZ)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Precio de Venta</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={data.precio_venta}
                                                        onChange={e => setData('precio_venta', e.target.value)}
                                                        className="w-full bg-white border-transparent rounded-2xl pl-10 pr-4 py-4 text-2xl font-black text-blue-600 focus:ring-blue-500 text-right"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Costo Promedio (Ref)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={data.costo_promedio}
                                                        onChange={e => setData('costo_promedio', e.target.value)}
                                                        className="w-full bg-white border-transparent rounded-2xl pl-10 pr-4 py-4 text-2xl font-black text-slate-600 focus:ring-slate-500 text-right"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${data.es_insumo ? 'bg-orange-500 text-white' : 'bg-orange-200 text-orange-400'}`}>
                                                <AlertCircle size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-sm text-orange-900 uppercase">Artículo de Uso Interno (Insumo)</h4>
                                                <p className="text-xs font-bold text-orange-600 uppercase mt-0.5">Si se activa, el artículo NO aparecerá en el punto de venta</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setData('es_insumo', !data.es_insumo)}
                                                className={`w-14 h-8 rounded-full p-1.5 transition-colors ${data.es_insumo ? 'bg-orange-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${data.es_insumo ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>

                                        <div className={`rounded-[2rem] border p-6 ${esSoporte ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${esSoporte ? 'text-emerald-500' : 'text-slate-400'}`}>Soporte de impresion</div>
                                                    <h4 className={`mt-2 font-black text-lg ${esSoporte ? 'text-emerald-900' : 'text-slate-900'}`}>Papel, vinilo, transfer o material para nesting</h4>
                                                    <p className={`mt-2 text-xs font-bold ${esSoporte ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                        {esSoporte
                                                            ? 'Este item ya esta marcado como soporte. Aqui defines su ancho, largo o si se maneja como rollo.'
                                                            : 'Activa esta opcion solo si este item es un soporte real que se consumira en impresion.'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => !esFabricable && setData('es_para_nesting', !data.es_para_nesting)}
                                                    disabled={esFabricable}
                                                    className={`w-14 h-8 rounded-full p-1.5 transition-colors ${data.es_para_nesting && !esFabricable ? 'bg-emerald-500' : 'bg-slate-200'} ${esFabricable ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${data.es_para_nesting && !esFabricable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            {esSoporte && (
                                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1">Ancho del soporte (cm)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.ancho_cm}
                                                            onChange={e => setData('ancho_cm', e.target.value)}
                                                            className="w-full bg-white border-emerald-100 rounded-2xl px-5 py-4 font-black text-slate-800"
                                                            placeholder="Ej: 50"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1">
                                                            {data.es_rollo ? 'Largo de referencia (cm)' : 'Largo del soporte (cm)'}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.largo_cm}
                                                            onChange={e => setData('largo_cm', e.target.value)}
                                                            className="w-full bg-white border-emerald-100 rounded-2xl px-5 py-4 font-black text-slate-800"
                                                            placeholder={data.es_rollo ? 'Ej: 100' : 'Ej: 70'}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1">Separacion minima (cm)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.margen_seguridad_cm}
                                                            onChange={e => setData('margen_seguridad_cm', e.target.value)}
                                                            className="w-full bg-white border-emerald-100 rounded-2xl px-5 py-4 font-black text-slate-800"
                                                            placeholder="0.50"
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-emerald-100 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.es_rollo}
                                                            onChange={e => setData('es_rollo', e.target.checked)}
                                                            className="w-4 h-4 rounded text-emerald-600 border-emerald-200"
                                                        />
                                                        <span className="text-[10px] font-black uppercase text-emerald-700">Es rollo de largo variable</span>
                                                    </label>
                                                    <div className="md:col-span-2 xl:col-span-4 text-[10px] font-bold uppercase text-emerald-700">
                                                        Si marcas este item como soporte, aqui es donde defines el ancho y largo que te pide el sistema para nesting.
                                                    </div>
                                                    {(errors.ancho_cm || errors.largo_cm || errors.es_para_nesting) && (
                                                        <div className="md:col-span-2 xl:col-span-4 text-red-500 text-[10px] font-bold uppercase">
                                                            {errors.ancho_cm || errors.largo_cm || errors.es_para_nesting}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'produccion' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${data.requires_recipe ? 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-50' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center gap-6 mb-8">
                                                <div className={`p-4 rounded-[1.5rem] transition-colors ${data.requires_recipe ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-300 text-white'}`}>
                                                    <HardHat size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tighter uppercase">Capacidad de Manufactura</h3>
                                                    <p className="font-bold text-slate-500 text-xs uppercase tracking-[0.1em]">Activa esta opción para permitir que el producto entre en las colas de producción</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('requires_recipe', !data.requires_recipe)}
                                                    className={`w-16 h-8 rounded-full p-1.5 transition-all ${data.requires_recipe ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full transition-all ${data.requires_recipe ? 'translate-x-8 shadow-sm' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            {data.requires_recipe && (
                                                <div className="space-y-6 pt-8 border-t border-blue-100">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-[0.2em] ml-1">Proceso Principal</label>
                                                            <select
                                                                value={data.proceso_id}
                                                                onChange={e => setData('proceso_id', e.target.value)}
                                                                className="w-full bg-white border-blue-200 rounded-2xl px-6 py-4 font-bold text-slate-800 text-lg shadow-sm"
                                                            >
                                                                <option value="">Selecciona una maquina principal...</option>
                                                                {procesos.map((proceso) => (
                                                                    <option key={proceso.id} value={proceso.id}>
                                                                        {proceso.nombre}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {errors.proceso_id && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 italic">{errors.proceso_id}</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-[0.2em] ml-1">Material Base Principal</label>
                                                            <select
                                                                value={data.item_base_id}
                                                                onChange={e => setData('item_base_id', e.target.value)}
                                                                className="w-full bg-white border-blue-200 rounded-2xl px-6 py-4 font-bold text-slate-800 text-lg shadow-sm"
                                                            >
                                                                <option value="">Selecciona soporte o materia prima base...</option>
                                                                {materialesBaseDisponibles.map((insumo) => (
                                                                    <option key={insumo.id} value={insumo.id}>
                                                                        {insumo.codigo} - {insumo.nombre}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {errors.item_base_id && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 italic">{errors.item_base_id}</p>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-[0.2em] ml-1">Familia Productiva</label>
                                                        <select
                                                            value={data.familia_produccion_id}
                                                            onChange={e => setData('familia_produccion_id', e.target.value)}
                                                            className="w-full bg-white border-blue-200 rounded-2xl px-6 py-4 font-bold text-slate-800 text-lg shadow-sm"
                                                        >
                                                            <option value="">Selecciona la familia...</option>
                                                            {familiasProduccion.map((familia) => (
                                                                <option key={familia.id} value={familia.id}>
                                                                    {familia.codigo} - {familia.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.familia_produccion_id && <p className="text-red-500 text-[10px] font-bold uppercase ml-1 italic">{errors.familia_produccion_id}</p>}
                                                        {familiaSeleccionada && (
                                                            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">
                                                                {familiaSeleccionada.nombre}: {familiaSeleccionada.tipo_consumo_material.replaceAll('_', ' ')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-[0.2em] ml-1">Centro de Trabajo Principal</label>
                                                        <select
                                                            value={data.tipo_impresion}
                                                            onChange={e => setData('tipo_impresion', e.target.value)}
                                                            className="w-full bg-white border-blue-200 rounded-2xl px-6 py-4 font-bold text-slate-800 text-lg shadow-sm"
                                                        >
                                                            <option value="">Selecciona el proceso base...</option>
                                                            <option value="Sublimación">Sublimación de Productos</option>
                                                            <option value="Láser">Impresión Láser Digital</option>
                                                            <option value="Offset">Offset / Litografía</option>
                                                            <option value="UV">Impresión UV Cama Plana</option>
                                                            <option value="Corte">Corte y Grabado Láser</option>
                                                            <option value="Plotter">Plotter de Gran Formato</option>
                                                        </select>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-[0.2em] ml-1">Ancho Imprimible (cm)</label>
                                                            <input
                                                                type="number" step="0.01"
                                                                value={data.ancho_imprimible}
                                                                onChange={e => setData('ancho_imprimible', e.target.value)}
                                                                className="w-full bg-white border-blue-200 rounded-2xl px-6 py-4 font-black text-slate-800 text-xl"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-[0.2em] ml-1">Alto Imprimible (cm)</label>
                                                            <input
                                                                type="number" step="0.01"
                                                                value={data.largo_imprimible}
                                                                onChange={e => setData('largo_imprimible', e.target.value)}
                                                                className="w-full bg-white border-blue-200 rounded-2xl px-6 py-4 font-black text-slate-800 text-xl"
                                                                placeholder="0.00"
                                                            />
                                                            {errors.ancho_imprimible && <p className="text-red-500 text-[10px] font-bold uppercase mt-2 ml-1 italic">{errors.ancho_imprimible}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="hidden p-6 bg-white rounded-3xl border-2 border-dashed border-blue-200 flex items-center gap-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.es_para_nesting}
                                                            onChange={e => setData('es_para_nesting', e.target.checked)}
                                                            disabled
                                                            className="w-6 h-6 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500"
                                                            id="full_nesting"
                                                        />
                                                        <label htmlFor="full_nesting" className="flex-1 cursor-pointer">
                                                            <span className="font-black text-sm text-blue-900 uppercase block">Optimización por Pliegos (Nesting)</span>
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase">Habilita esta opción si el producto se imprime agrupado en soportes más grandes</span>
                                                        </label>
                                                    </div>
                                                    <div className="hidden px-1 text-[10px] font-bold uppercase text-blue-500">
                                                        Nota: el soporte real se marca en Datos Basicos y aqui solo eliges los soportes compatibles del producto.
                                                    </div>
                                                    <div className="rounded-3xl border border-blue-200 bg-white p-6">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Importante</div>
                                                        <h4 className="mt-2 font-black text-blue-900 uppercase">Manufactura define la maquina, no el arte</h4>
                                                        <p className="mt-2 text-xs font-bold text-blue-700">
                                                            Aqui solo defines proceso, material base y centro de trabajo. La medida de impresion, soportes compatibles y logica de nesting se definen en la pestana Receta / BOM.
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                        <div className="bg-white rounded-3xl border border-blue-100 p-6">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase mb-4 block tracking-[0.2em]">Procesos Compatibles</label>
                                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                                                {procesos.map((proceso) => (
                                                                    <label key={proceso.id} className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-100 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={data.procesos_ids.includes(proceso.id)}
                                                                            onChange={(e) => setData(
                                                                                'procesos_ids',
                                                                                e.target.checked
                                                                                    ? [...data.procesos_ids, proceso.id]
                                                                                    : data.procesos_ids.filter((id) => id !== proceso.id)
                                                                            )}
                                                                            className="w-4 h-4 rounded text-blue-600 border-blue-200"
                                                                        />
                                                                        <span className="text-sm font-bold text-slate-700">{proceso.nombre}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {errors.procesos_ids && <p className="text-red-500 text-[10px] font-bold uppercase mt-3 ml-1 italic">{errors.procesos_ids}</p>}
                                                        </div>
                                                        <div className="bg-white rounded-3xl border border-blue-100 p-6">
                                                            <label className="text-[10px] font-black text-blue-600 uppercase mb-4 block tracking-[0.2em]">Soportes y nesting</label>
                                                            <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-4">
                                                                <p className="text-xs font-bold text-blue-700 uppercase">
                                                                    Esta parte ahora se configura en la pestana Receta / BOM para que el usuario piense primero en el arte, el papel y el consumo.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'unidades' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                                            <div className="flex justify-between items-center mb-8">
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tighter uppercase">Unidades Auxiliares</h3>
                                                    <p className="font-bold text-slate-500 text-xs uppercase tracking-[0.1em]">Configura cajas, paquetes o rollos para compras y ventas</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addUnit}
                                                    className="p-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-slate-700 transition-all shadow-xl shadow-slate-200"
                                                >
                                                    <Plus size={24} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {data.units.length === 0 ? (
                                                    <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                                                        <Scale size={48} className="mx-auto text-slate-200 mb-4" />
                                                        <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No hay unidades de medida alternativas</p>
                                                    </div>
                                                ) : (
                                                    data.units.map((unit, index) => (
                                                        <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative group animate-in zoom-in-95">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeUnit(index)}
                                                                className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                            <div className="space-y-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Presentación (Nombre)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={unit.nombre}
                                                                        onChange={e => updateUnit(index, 'nombre', e.target.value)}
                                                                        className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-800"
                                                                        placeholder="Ej: Caja x 50"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Factor (equiv. {data.unidad_medida})</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number" step="0.0001"
                                                                            value={unit.factor_conversion}
                                                                            onChange={e => updateUnit(index, 'factor_conversion', e.target.value)}
                                                                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-black text-blue-600"
                                                                        />
                                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{data.unidad_medida}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo de Compra</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" step="0.01"
                                                                                value={unit.costo_compra}
                                                                                onChange={e => updateUnit(index, 'costo_compra', e.target.value)}
                                                                                className="w-full bg-slate-100 border-slate-200 rounded-xl px-4 py-3 font-black text-green-600 focus:bg-white"
                                                                                placeholder="0.00"
                                                                            />
                                                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-green-300">$</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio de Venta</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number" step="0.01"
                                                                                value={unit.precio_venta}
                                                                                onChange={e => updateUnit(index, 'precio_venta', e.target.value)}
                                                                                className="w-full bg-slate-100 border-slate-200 rounded-xl px-4 py-3 font-black text-indigo-600 focus:bg-white"
                                                                                placeholder="0.00"
                                                                            />
                                                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-300">$</div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {(unit.costo_compra > 0 || unit.precio_venta > 0) && (
                                                                    <div className="flex justify-between items-center px-2 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                                                            Costo Unit Eq: <span className="text-green-600 ml-1">{formatCurrency(unit.costo_compra / (unit.factor_conversion || 1))}</span>
                                                                        </div>
                                                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                                                            Precio Unit Eq: <span className="text-indigo-600 ml-1">{formatCurrency(unit.precio_venta / (unit.factor_conversion || 1))}</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={unit.es_unidad_compra}
                                                                            onChange={e => updateUnit(index, 'es_unidad_compra', e.target.checked)}
                                                                            className="w-4 h-4 rounded text-blue-600 border-slate-200"
                                                                        />
                                                                        <span className="text-[8px] font-black uppercase text-slate-500">Para Compra</span>
                                                                    </label>
                                                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={unit.incluye_impuestos}
                                                                            onChange={e => updateUnit(index, 'incluye_impuestos', e.target.checked)}
                                                                            className="w-4 h-4 rounded text-slate-600 border-slate-200"
                                                                        />
                                                                        <span className="text-[8px] font-black uppercase text-slate-500">Incluye IVA</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'receta' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-[2.5rem] border-2 border-purple-200 shadow-xl shadow-purple-50">
                                            <div className="flex justify-between items-center mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-lg shadow-purple-200">
                                                        <Beaker size={32} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-xl text-purple-900 tracking-tighter uppercase leading-none">Receta de Manufactura</h3>
                                                        <p className="font-bold text-purple-600 text-xs uppercase tracking-[0.1em] mt-1">Explosión de Materiales - BOM</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addIngrediente}
                                                    className="p-4 bg-purple-600 text-white rounded-[1.5rem] hover:bg-purple-700 transition shadow-xl shadow-purple-200"
                                                >
                                                    <Plus size={24} />
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                {familiaSeleccionada && (
                                                    <div className="rounded-[2rem] border border-purple-200 bg-white/80 p-6">
                                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                            <div>
                                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Checklist industrial</div>
                                                                <h4 className="mt-2 text-lg font-black text-purple-900 uppercase">{familiaSeleccionada.nombre}</h4>
                                                                <p className="mt-2 text-xs font-bold leading-6 text-purple-700">
                                                                    Esta familia espera una receta operativa completa antes de pasar a ventas, nesting y planta.
                                                                </p>
                                                            </div>
                                                            {familiaSeleccionada.requiere_soporte_impresion && (
                                                                <button
                                                                    type="button"
                                                                    onClick={quickAddSupport}
                                                                    className="rounded-2xl bg-purple-700 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-purple-800"
                                                                >
                                                                    Agregar primer soporte
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                                                            {recipeChecklist.map((step) => (
                                                                <div
                                                                    key={step.id}
                                                                    className={`rounded-2xl border px-4 py-4 ${
                                                                        step.done ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <CheckCircle2 size={18} className={step.done ? 'text-emerald-600' : 'text-amber-500'} />
                                                                        <div>
                                                                            <p className="text-sm font-black text-slate-900">{step.label}</p>
                                                                            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-600">{step.help}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-white/80 p-6 rounded-[2rem] border border-purple-100 space-y-6">
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Paso 1 de la receta</div>
                                                        <h4 className="mt-2 font-black text-lg text-purple-900 uppercase">Huella de impresion y soporte</h4>
                                                        <p className="mt-2 text-xs font-bold text-purple-600">
                                                            Aqui defines la medida base del arte y con que papeles o soportes se puede fabricar. El nesting tomara esta informacion para calcular pliegos o largo de rollo.
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-purple-600 uppercase mb-2 block tracking-[0.2em] ml-1">Ancho de impresion (cm)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={data.ancho_imprimible}
                                                                onChange={e => setData('ancho_imprimible', e.target.value)}
                                                                className="w-full bg-purple-50 border-purple-100 rounded-2xl px-6 py-4 font-black text-slate-800 text-xl"
                                                                placeholder="Ej: 6"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-purple-600 uppercase mb-2 block tracking-[0.2em] ml-1">Alto de impresion (cm)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={data.largo_imprimible}
                                                                onChange={e => setData('largo_imprimible', e.target.value)}
                                                                className="w-full bg-purple-50 border-purple-100 rounded-2xl px-6 py-4 font-black text-slate-800 text-xl"
                                                                placeholder="Ej: 12"
                                                            />
                                                            {errors.ancho_imprimible && <p className="text-red-500 text-[10px] font-bold uppercase mt-2 ml-1 italic">{errors.ancho_imprimible}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-purple-600 uppercase mb-2 block tracking-[0.2em] ml-1">Separacion entre piezas (cm)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={data.separacion_piezas}
                                                                onChange={e => setData('separacion_piezas', e.target.value)}
                                                                className="w-full bg-purple-50 border-purple-100 rounded-2xl px-6 py-4 font-black text-slate-800"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-purple-600 uppercase mb-2 block tracking-[0.2em] ml-1">Sangrado (cm)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={data.sangrado}
                                                                onChange={e => setData('sangrado', e.target.value)}
                                                                className="w-full bg-purple-50 border-purple-100 rounded-2xl px-6 py-4 font-black text-slate-800"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.permite_rotacion}
                                                                onChange={e => setData('permite_rotacion', e.target.checked)}
                                                                className="w-4 h-4 rounded text-purple-600 border-purple-200"
                                                            />
                                                            <span className="text-[10px] font-black uppercase text-purple-700">Permitir rotacion en nesting</span>
                                                        </label>
                                                    </div>

                                                    <div className="bg-purple-50 rounded-3xl border border-purple-100 p-6">
                                                        <label className="text-[10px] font-black text-purple-600 uppercase mb-4 block tracking-[0.2em]">Soportes compatibles para esta receta</label>
                                                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                                            {soportesDisponibles.map((papel) => (
                                                                <label key={papel.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-purple-100 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={data.papeles_ids.includes(papel.id)}
                                                                        onChange={(e) => setData(
                                                                            'papeles_ids',
                                                                            e.target.checked
                                                                                ? [...data.papeles_ids, papel.id]
                                                                                : data.papeles_ids.filter((id) => id !== papel.id)
                                                                        )}
                                                                        className="w-4 h-4 rounded text-purple-600 border-purple-200"
                                                                    />
                                                                    <span className="text-sm font-bold text-slate-700">{papel.codigo} - {papel.nombre}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        {errors.papeles_ids && <p className="text-red-500 text-[10px] font-bold uppercase mt-3 ml-1 italic">{errors.papeles_ids}</p>}
                                                    </div>
                                                </div>

                                                {data.ingredientes.length === 0 ? (
                                                    <div className="py-20 text-center bg-white/50 rounded-[2.5rem] border-2 border-dashed border-purple-200 flex flex-col items-center">
                                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm text-purple-300">
                                                            <Beaker size={32} />
                                                        </div>
                                                        <h4 className="font-black text-lg text-purple-900 uppercase tracking-tighter">Sin Componentes Definidos</h4>
                                                        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mt-1">Este producto no descontará materiales adicionales al ser fabricado</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {data.ingredientes.map((ingrediente, index) => (
                                                            <div key={index} className="bg-white p-6 rounded-[2rem] border border-purple-100 shadow-sm relative group animate-in slide-in-from-bottom-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeIngrediente(index)}
                                                                    className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                                <div className="space-y-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-purple-600 uppercase ml-1">Seleccionar Insumo</label>
                                                                        <select
                                                                            value={ingrediente.insumo_id}
                                                                            onChange={e => updateIngrediente(index, 'insumo_id', e.target.value)}
                                                                            className="w-full bg-purple-50 border-purple-100 rounded-2xl px-5 py-4 font-bold text-slate-800 text-sm focus:ring-purple-500"
                                                                            required
                                                                        >
                                                                            <option value="">Buscar material...</option>
                                                                            {insumos.map(ins => (
                                                                                <option key={ins.id} value={ins.id}>
                                                                                    {ins.codigo} - {ins.nombre}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-black text-purple-600 uppercase ml-1">Cantidad</label>
                                                                            <input
                                                                                type="number" step="0.0001"
                                                                                value={ingrediente.cantidad}
                                                                                onChange={e => updateIngrediente(index, 'cantidad', e.target.value)}
                                                                                className="w-full bg-purple-50 border-purple-100 rounded-2xl px-5 py-4 font-black text-purple-700"
                                                                                required
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-black text-purple-600 uppercase ml-1">U. Medida</label>
                                                                            <select
                                                                                value={ingrediente.unidad}
                                                                                onChange={e => updateIngrediente(index, 'unidad', e.target.value)}
                                                                                className="w-full bg-purple-50 border-purple-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
                                                                            >
                                                                                <option value="UND">Unidades</option>
                                                                                <option value="cm2">cm2</option>
                                                                                <option value="mt2">mt2</option>
                                                                                <option value="ml">Mililitros</option>
                                                                                <option value="gr">Gramos</option>
                                                                                <option value="inch2">sq in</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer Action Bar */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
                                <Link
                                    href={route('items.index')}
                                    className="px-8 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition"
                                >
                                    Cancelar y Volver
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 max-w-[400px] bg-slate-900 border-b-8 border-slate-700 active:border-b-0 active:translate-y-2 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando cambios...' : (isEditing ? 'Actualizar Producto' : 'Registrar en Catálogo')}
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </AuthenticatedLayout>
    );
}
