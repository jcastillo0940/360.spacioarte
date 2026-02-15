import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const [items, setItems] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'Inventariable',
        precio_venta: '',
        costo_promedio: '',
        stock_actual: 0,
        stock_minimo: 0,
        stock_maximo: 0,
        tax_id: '',
        categoria: '',
        unidad_medida: 'UND'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/inventario/items')
            .then(res => res.json())
            .then(data => {
                setItems(data.items || []);
                setTaxes(data.taxes || []);
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
        setData(item);
        setEditingId(item.id);
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
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Código / SKU</label>
                                <input 
                                    type="text"
                                    value={data.codigo}
                                    onChange={e => setData('codigo', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    placeholder="PROD-001"
                                    required
                                />
                                {errors.codigo && <span className="text-red-500 text-xs">{errors.codigo}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nombre del Producto</label>
                                <input 
                                    type="text"
                                    value={data.nombre}
                                    onChange={e => setData('nombre', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Descripción</label>
                                <textarea 
                                    value={data.descripcion || ''}
                                    onChange={e => setData('descripcion', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo</label>
                                <select 
                                    value={data.tipo}
                                    onChange={e => setData('tipo', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                >
                                    <option value="Inventariable">Producto Físico</option>
                                    <option value="Servicio">Servicio</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Precio Venta</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={data.precio_venta}
                                        onChange={e => setData('precio_venta', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Costo</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={data.costo_promedio}
                                        onChange={e => setData('costo_promedio', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                            </div>

                            {data.tipo === 'Inventariable' && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Stock Actual</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={data.stock_actual}
                                            onChange={e => setData('stock_actual', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Stock Mín</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={data.stock_minimo}
                                            onChange={e => setData('stock_minimo', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Stock Máx</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={data.stock_maximo}
                                            onChange={e => setData('stock_maximo', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Impuesto</label>
                                    <select 
                                        value={data.tax_id}
                                        onChange={e => setData('tax_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                    >
                                        {taxes.length === 0 && <option value="">Cargando impuestos...</option>}
                                        {taxes.map(tax => (
                                            <option key={tax.id} value={tax.id}>
                                                {tax.nombre} ({tax.tasa}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Unidad</label>
                                    <select 
                                        value={data.unidad_medida}
                                        onChange={e => setData('unidad_medida', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    >
                                        <option value="UND">Unidad</option>
                                        <option value="KG">Kilogramo</option>
                                        <option value="LB">Libra</option>
                                        <option value="LT">Litro</option>
                                        <option value="MT">Metro</option>
                                        <option value="CJ">Caja</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Categoría</label>
                                <input 
                                    type="text"
                                    value={data.categoria || ''}
                                    onChange={e => setData('categoria', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    placeholder="Electrónica, Alimentos, etc."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {editingId ? 'Actualizar' : 'Guardar'}
                                </button>
                                {editingId && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            reset();
                                            setEditingId(null);
                                        }}
                                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
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
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{item.nombre}</div>
                                                    <div className="text-sm text-slate-500">{item.categoria || 'Sin categoría'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {item.tipo === 'Inventariable' ? (
                                                        <span className={`font-bold ${
                                                            item.stock_actual <= item.stock_minimo 
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
        </AuthenticatedLayout>
    );
}