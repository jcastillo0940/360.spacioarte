import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [items, setItems] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        es_para_nesting: false,
        es_insumo: false,
        requires_recipe: false,
        tipo_impresion: '',
        ancho_imprimible: '',
        largo_imprimible: '',
        permite_rotacion: true,
        separacion_piezas: 0.50,
        sangrado: 0.30,
        procesos_ids: [],
        papeles_ids: []
    });

    const [procesos, setProcesos] = useState([]);
    const [papeles, setPapeles] = useState([]);
    const [activeTab, setActiveTab] = useState('basico');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/inventario/items')
            .then(res => res.json())
            .then(data => {
                setItems(data.items || []);
                setTaxes(data.taxes || []);
                setProcesos(data.procesos || []);
                setPapeles(data.papeles || []);
                if ((data.taxes || []).length > 0 && !editingId) {
                    setData('tax_id', data.taxes[0].id);
                }
            })
            .catch(error => {
                console.error('Error loading items:', error);
                setItems([]);
                setTaxes([]);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/inventario/items/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                    loadData();
                }
            });
        } else {
            post('/inventario/items', {
                onSuccess: () => {
                    reset();
                    loadData();
                }
            });
        }
    };

    const handleEdit = (item) => {
        setData({
            ...item,
            procesos_ids: item.procesos_compatibles?.map(p => p.id) || [],
            papeles_ids: item.papeles_compatibles?.map(p => p.id) || []
        });
        setEditingId(item.id);
        setActiveTab('basico');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Inventario" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Gestión de Inventario
                    </h1>
                    <p className="text-slate-600 mt-2">Productos y servicios del catálogo</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            {editingId ? 'Editar Item' : 'Nuevo Item'}
                        </h2>
                        <div className="flex border-b border-slate-200 mb-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('basico')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-widest ${activeTab === 'basico' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
                            >
                                Básico
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('produccion')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-widest ${activeTab === 'produccion' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
                            >
                                Producción {data.requires_recipe && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>}
                            </button>
                        </div>

                        {activeTab === 'basico' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 transition-all duration-300">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Código / SKU</label>
                                    <input
                                        type="text"
                                        value={data.codigo}
                                        onChange={e => setData('codigo', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition shadow-sm"
                                        placeholder="PROD-001"
                                        required
                                    />
                                    {errors.codigo && <span className="text-red-500 text-xs font-bold">{errors.codigo}</span>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        value={data.nombre}
                                        onChange={e => setData('nombre', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo</label>
                                    <select
                                        value={data.tipo}
                                        onChange={e => setData('tipo', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition font-bold shadow-sm"
                                    >
                                        <option value="Inventariable">Producto Físico</option>
                                        <option value="Servicio">Servicio</option>
                                        <option value="Materia Prima">Materia Prima / Material</option>
                                        <option value="Producto Terminado">Producto Terminado</option>
                                        <option value="Consumible">Consumible</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Precio Venta</label>
                                        <input
                                            type="number" step="0.01"
                                            value={data.precio_venta}
                                            onChange={e => setData('precio_venta', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Costo</label>
                                        <input
                                            type="number" step="0.01"
                                            value={data.costo_promedio}
                                            onChange={e => setData('costo_promedio', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Impuesto</label>
                                        <select
                                            value={data.tax_id}
                                            onChange={e => setData('tax_id', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition font-bold"
                                            required
                                        >
                                            {taxes.map(tax => (
                                                <option key={tax.id} value={tax.id}>{tax.nombre} ({tax.tasa}%)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Unidad</label>
                                        <select
                                            value={data.unidad_medida}
                                            onChange={e => setData('unidad_medida', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition font-bold"
                                        >
                                            <option value="UND">Unidad</option>
                                            <option value="KG">Kilogramo</option>
                                            <option value="LT">Litro</option>
                                            <option value="MT">Metro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-200">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Opciones de Sistema</h3>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox" id="es_para_nesting"
                                                checked={data.es_para_nesting}
                                                onChange={e => setData('es_para_nesting', e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                            />
                                            <label htmlFor="es_para_nesting" className="text-xs font-black text-slate-700 uppercase cursor-pointer">Disponible para Nesting / Pliegos</label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox" id="es_insumo"
                                                checked={data.es_insumo}
                                                onChange={e => setData('es_insumo', e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                            />
                                            <label htmlFor="es_insumo" className="text-xs font-black text-slate-700 uppercase cursor-pointer">Es Insumo (No venta al público)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 transition-all duration-300">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="requires_recipe"
                                            checked={data.requires_recipe}
                                            onChange={e => setData('requires_recipe', e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="requires_recipe" className="font-black text-sm text-blue-900 uppercase">¿Este producto requiere receta de producción?</label>
                                    </div>
                                    <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase">Activa esto para configurar máquinas, dimensiones y nesting inteligente.</p>
                                </div>

                                {data.requires_recipe && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-slate-500 mb-2">Tipo de Impresión / Tecnología</label>
                                            <select
                                                value={data.tipo_impresion}
                                                onChange={e => setData('tipo_impresion', e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 transition font-black bg-white"
                                                required={data.requires_recipe}
                                            >
                                                <option value="">Seleccione tecnología...</option>
                                                <option value="Sublimación">Sublimación</option>
                                                <option value="Láser">Láser (Tóner)</option>
                                                <option value="Offset">Offset</option>
                                                <option value="UV">Cama Plana UV</option>
                                                <option value="Otros">Otros</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Ancho Fijo (cm)</label>
                                                <input
                                                    type="number" step="0.01"
                                                    value={data.ancho_imprimible}
                                                    onChange={e => setData('ancho_imprimible', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 font-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Alto Fijo (cm)</label>
                                                <input
                                                    type="number" step="0.01"
                                                    value={data.largo_imprimible}
                                                    onChange={e => setData('largo_imprimible', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 font-black"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400">Reglas de Nesting</h4>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox" id="permite_rotacion"
                                                    checked={data.permite_rotacion}
                                                    onChange={e => setData('permite_rotacion', e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                                />
                                                <label htmlFor="permite_rotacion" className="text-xs font-black uppercase text-slate-700">Permitir rotación para optimizar</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Separación (cm)</label>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={data.separacion_piezas}
                                                        onChange={e => setData('separacion_piezas', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sangrado (cm)</label>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={data.sangrado}
                                                        onChange={e => setData('sangrado', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Multi-Selectores filtrados */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Máquinas Compatibles ({data.tipo_impresion || 'Todas'})</label>
                                                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white space-y-1">
                                                    {procesos
                                                        .filter(p => !data.tipo_impresion || p.tipo_maquina.includes(data.tipo_impresion) || p.categoria_tecnologia?.includes(data.tipo_impresion))
                                                        .map(p => (
                                                            <label key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={data.procesos_ids.includes(p.id)}
                                                                    onChange={e => {
                                                                        const ids = e.target.checked
                                                                            ? [...data.procesos_ids, p.id]
                                                                            : data.procesos_ids.filter(id => id !== p.id);
                                                                        setData('procesos_ids', ids);
                                                                    }}
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                                                />
                                                                <span className="text-xs font-bold text-slate-700">{p.nombre}</span>
                                                            </label>
                                                        ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Papeles / Soportes Compatibles</label>
                                                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white space-y-1">
                                                    {papeles.map(p => (
                                                        <label key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.papeles_ids.includes(p.id)}
                                                                onChange={e => {
                                                                    const ids = e.target.checked
                                                                        ? [...data.papeles_ids, p.id]
                                                                        : data.papeles_ids.filter(id => id !== p.id);
                                                                    setData('papeles_ids', ids);
                                                                }}
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                                            />
                                                            <span className="text-xs font-bold text-slate-700">{p.nombre}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 mt-8 pt-6 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-tighter hover:bg-blue-600 transition disabled:opacity-50 shadow-lg shadow-slate-900/10"
                            >
                                {editingId ? 'Actualizar Producto' : 'Registrar Producto'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => { reset(); setEditingId(null); setActiveTab('basico'); }}
                                    className="px-6 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-tighter hover:bg-slate-200 transition"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Listado */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                            <input
                                type="text"
                                placeholder="Buscar por código o nombre..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Código</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Nombre</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Stock</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Precio</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <p className="text-lg font-bold">No hay productos registrados</p>
                                                <p className="text-sm mt-2">Comienza agregando tu primer producto</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-slate-900">{item.codigo}</span>
                                                    {item.es_para_nesting && <span className="block text-[8px] bg-green-100 text-green-700 px-1 rounded-full text-center mt-1 font-black">NESTING</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{item.nombre}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.categoria || 'Sin categoría'}</div>
                                                    <div className="flex gap-1 mt-1">
                                                        {item.es_insumo && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase">Insumo</span>}
                                                        {item.requires_recipe && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">Con Receta</span>}
                                                        {item.tipo_impresion && <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">{item.tipo_impresion}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {item.tipo !== 'Servicio' ? (
                                                        <span className={`font-bold ${item.stock_actual <= item.stock_minimo
                                                            ? 'text-red-600'
                                                            : 'text-slate-900'
                                                            }`}>
                                                            {item.stock_actual} {item.unidad_medida}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-blue-600 font-bold">
                                                    {formatCurrency(item.precio_venta)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-bold text-sm inline-flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout >
    );
}