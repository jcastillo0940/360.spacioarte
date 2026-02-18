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

export default function Form({ item = null, taxes = [], procesos = [], papeles = [], insumos = [] }) {
    const isEditing = !!item;
    const [activeTab, setActiveTab] = useState('basico');

    const { data, setData, post, put, processing, errors } = useForm({
        codigo: item?.codigo || '',
        nombre: item?.nombre || '',
        tipo: item?.tipo || 'Inventariable',
        precio_venta: item?.precio_venta || 0,
        costo_promedio: item?.costo_promedio || 0,
        tax_id: item?.tax_id || (taxes.length > 0 ? taxes[0].id : ''),
        unidad_medida: item?.unidad_medida || 'UND',
        categoria: item?.categoria || '',
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
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                                <input
                                                    type="text"
                                                    value={data.categoria}
                                                    onChange={e => setData('categoria', e.target.value)}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-slate-900 focus:border-slate-900 transition-all border"
                                                    placeholder="Insumos Sublimación"
                                                />
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
                                                        </div>
                                                    </div>

                                                    <div className="p-6 bg-white rounded-3xl border-2 border-dashed border-blue-200 flex items-center gap-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.es_para_nesting}
                                                            onChange={e => setData('es_para_nesting', e.target.checked)}
                                                            className="w-6 h-6 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500"
                                                            id="full_nesting"
                                                        />
                                                        <label htmlFor="full_nesting" className="flex-1 cursor-pointer">
                                                            <span className="font-black text-sm text-blue-900 uppercase block">Optimización por Pliegos (Nesting)</span>
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase">Habilita esta opción si el producto se imprime agrupado en soportes más grandes</span>
                                                        </label>
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
