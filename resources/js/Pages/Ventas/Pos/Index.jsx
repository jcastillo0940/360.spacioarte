import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search, ShoppingBag, User, CreditCard, Banknote,
    ArrowRight, X, Plus, Minus, Trash2, LayoutGrid, List,
    ClipboardList, LogOut, ChartBar, Receipt, ChevronRight,
    SearchCode, Hash, Percent
} from 'lucide-react';
import axios from 'axios';

export default function PosIndex({ sesion, items: initialItems, bancos, paymentTerms, metodosPago }) {
    const [cart, setCart] = useState([]);
    const [items, setItems] = useState(initialItems);
    const [searchQuery, setSearchQuery] = useState('');
    const [customer, setCustomer] = useState({ id: 1, razon_social: 'CONSUMIDOR FINAL' }); // Mock default
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        metodo: 'Efectivo',
        banco: bancos.length > 0 ? bancos[0].id : '',
        recibido: 0,
        referencia: ''
    });
    const [amount, setAmount] = useState('');

    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [searchOrderQuery, setSearchOrderQuery] = useState('');

    const [showCorteXModal, setShowCorteXModal] = useState(false);
    const [corteXData, setCorteXData] = useState(null);

    // Totales corregidos con descuento por partida
    const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad) - (item.descuento || 0), 0);
    const tax = subtotal * 0.07;
    const total = subtotal + tax;
    const cambio = paymentData.recibido - total;

    // Buscar ítems dinámicamente
    useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounce = setTimeout(() => {
                fetchItems();
            }, 300);
            return () => clearTimeout(delayDebounce);
        } else if (searchQuery.length === 0) {
            setItems(initialItems);
        }
    }, [searchQuery]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('pos.items', { q: searchQuery }));
            setItems(res.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('pos.ordenes', { q: searchOrderQuery }));
            setPendingOrders(res.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const updatePrice = (id, newPrice) => {
        setCart(cart.map(i => i.id === id ? { ...i, precio: parseFloat(newPrice) || 0 } : i));
    };

    const updateDiscount = (id, newDiscount) => {
        setCart(cart.map(i => i.id === id ? { ...i, descuento: parseFloat(newDiscount) || 0 } : i));
    };

    const addToCart = (item) => {
        const exists = cart.find(i => i.id === item.id);
        if (exists) {
            setCart(cart.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i));
        } else {
            setCart([...cart, {
                id: item.id,
                nombre: item.nombre,
                precio: item.precio_venta || item.precio_produccion || 0,
                cantidad: 1,
                descuento: 0
            }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const updateQty = (id, delta) => {
        setCart(cart.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.cantidad + delta);
                return { ...i, cantidad: newQty };
            }
            return i;
        }));
    };

    const handleLoadOrder = (orden) => {
        if (!orden || !orden.detalles) return;

        // Cargar ítems de la orden al carrito
        const orderItems = orden.detalles
            .filter(d => d.item) // Asegurarse de que el ítem existe
            .map(d => ({
                id: d.item_id,
                nombre: d.item.nombre,
                precio: Number(d.precio_unitario) || 0,
                cantidad: Number(d.cantidad) || 1,
                descuento: 0,
                fromOrder: orden.id
            }));

        setCart(orderItems);
        setCustomer(orden.cliente || { id: 1, razon_social: 'CONSUMIDOR FINAL' });

        // Ajustar el pago para que por defecto sea el saldo pendiente
        const saldo = Number(orden.total_num || 0) - Number(orden.abonado_num || 0);
        const initialAmount = saldo > 0 ? Number(saldo).toFixed(2) : '';
        setAmount(initialAmount);
        setPaymentData(prev => ({
            ...prev,
            recibido: initialAmount === '' ? 0 : Number(initialAmount)
        }));

        setShowOrdersModal(false);
    };

    const processCheckout = async () => {
        if (cart.length === 0) return;

        try {
            const res = await axios.post(route('pos.procesar'), {
                contacto_id: customer.id,
                items: cart,
                metodo_pago: paymentData.metodo,
                monto_pago: paymentData.recibido > total ? total : paymentData.recibido,
                bank_account_id: paymentData.banco,
                referencia: paymentData.referencia
            });

            alert('Venta procesada con éxito. Factura #' + res.data.factura_id);
            if (res.data.receipt_url) {
                window.open(res.data.receipt_url, '_blank');
            }
            setCart([]);
            setShowPaymentModal(false);
            setAmount('');
            setPaymentData({ ...paymentData, recibido: 0, referencia: '' });
        } catch (e) {
            alert('Error al procesar la venta: ' + e.response?.data?.error);
        }
    };

    const verCorteX = async () => {
        try {
            const res = await axios.get(route('pos.corte-x'));
            setCorteXData(res.data);
            setShowCorteXModal(true);
        } catch (e) { console.error(e); }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Punto de Venta (POS)" />

            <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-[#F5F5F7]">
                {/* Header Superior POS */}
                <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tight text-slate-900">360 POS SYSTEM</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sucursal: {sesion.caja.nombre}</p>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-slate-200" />

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowOrdersModal(true)}
                                className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-xs font-black transition hover:bg-purple-100"
                            >
                                <ClipboardList size={16} /> CARGAR ORDEN
                            </button>
                            <button
                                onClick={verCorteX}
                                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black transition hover:bg-blue-100"
                            >
                                <ChartBar size={16} /> CORTE X
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{sesion.cajero?.name}</p>
                            <p className="text-[10px] font-bold text-green-600 uppercase">SESIÓN ACTIVA</p>
                        </div>
                        <button
                            onClick={() => router.post(route('pos.cerrar'), { monto_real: 0 })}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                            title="Cerrar Caja (Corte Z)"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Panel Izquierdo: Carrito */}
                    <div className="w-[480px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-10">
                        {/* Selector de Cliente */}
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</h2>
                                <button className="text-[10px] font-black text-blue-600 hover:underline">CAMBIAR</button>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                    <User size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">{customer.razon_social}</p>
                                    <p className="text-[10px] font-bold text-slate-500">CLIENTE GENERAL</p>
                                </div>
                            </div>
                        </div>

                        {/* Listado de Productos en Carrito */}
                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                                    <ShoppingBag size={64} className="mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest">Carrito Vacío</p>
                                    <p className="text-xs font-bold mt-2 font-mono">ESCANEA O BUSCA PRODUCTOS</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="bg-[#F8F9FA] p-4 rounded-3xl border border-transparent hover:border-slate-200 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 pr-4">
                                                    <h4 className="text-xs font-black text-slate-900 uppercase truncate">{item.nombre}</h4>
                                                    {item.fromOrder && <span className="bg-purple-100 text-purple-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block">De Orden #{item.fromOrder}</span>}
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 items-end">
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Cant.</label>
                                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900"><Minus size={12} /></button>
                                                        <span className="flex-1 text-center text-xs font-mono font-black">{item.cantidad}</span>
                                                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900"><Plus size={12} /></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Precio Unit.</label>
                                                    <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                                        <span className="text-[10px] pl-1 font-bold text-slate-300">$</span>
                                                        <input
                                                            type="number"
                                                            value={item.precio}
                                                            onChange={e => updatePrice(item.id, e.target.value)}
                                                            className="w-full border-none p-1 text-xs font-black font-mono focus:ring-0 bg-transparent"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Total Item</label>
                                                    <p className="text-sm font-black text-slate-900 font-mono">${Number((item.precio * item.cantidad) - (item.descuento || 0)).toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase">Dcto:</label>
                                                    <input
                                                        type="number"
                                                        value={item.descuento}
                                                        onChange={e => updateDiscount(item.id, e.target.value)}
                                                        className="w-16 border-none p-0 text-[10px] font-black font-mono focus:ring-0 bg-transparent"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Sin ITBMS</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Totales y Checkout */}
                        <div className="p-8 bg-[#F8F9FA] rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>Subtotal Neto</span>
                                    <span>${Number(subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>ITBMS (7%)</span>
                                    <span>${Number(tax).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-3xl font-black text-slate-900 mt-4 border-t border-slate-200 pt-4 font-mono">
                                    <span>TOTAL</span>
                                    <span>${Number(total).toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPaymentModal(true)}
                                disabled={cart.length === 0}
                                className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                            >
                                PROCESAR COBRO <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Panel Derecho: Items */}
                    <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden bg-white">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Busca productos por nombre o código..."
                                    className="w-full bg-[#F5F5F7] border-none rounded-3xl py-5 pl-14 pr-6 focus:ring-4 focus:ring-purple-100 text-sm font-bold placeholder:text-slate-300 transition-all"
                                />
                            </div>
                            <button className="p-5 bg-white border border-slate-100 rounded-3xl text-slate-500 hover:bg-slate-50 transition shadow-sm">
                                <LayoutGrid size={22} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 pb-8 scrollbar-hide">
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        className="text-left bg-white border border-slate-100 p-5 rounded-[2.5rem] hover:border-purple-600 hover:shadow-2xl hover:shadow-purple-100 transition-all group flex flex-col h-full active:scale-95"
                                    >
                                        <div className="aspect-square bg-slate-50 rounded-[2rem] mb-5 flex items-center justify-center group-hover:bg-purple-50 transition-colors overflow-hidden relative">
                                            <ShoppingBag className="text-slate-200 group-hover:text-purple-300 transition-colors" size={64} strokeWidth={1} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <h3 className="text-[11px] font-black text-slate-900 mb-2 flex-1 leading-relaxed uppercase tracking-tight">{item.nombre}</h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-base font-black text-purple-600 font-mono">${Number(item.precio_venta || item.precio_produccion || 0).toFixed(2)}</span>
                                            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg shadow-purple-200">
                                                <Plus size={20} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Pago */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex animate-in zoom-in duration-300">
                        <div className="w-1/3 bg-slate-900 p-12 flex flex-col justify-between text-white">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10">Resumen de Pago</h3>
                                <div className="space-y-8">
                                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Importe Neto</p>
                                        <p className="text-4xl font-black text-center font-mono">${Number(total).toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-4 px-2">
                                        <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <span>Subtotal</span>
                                            <span className="text-white">${Number(subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <span>Impuestos</span>
                                            <span className="text-white">${Number(tax).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                <Receipt className="text-purple-400" />
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-loose">
                                    IVA Incluido (7%)<br />Panamá
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-12 flex flex-col bg-white">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="font-black text-3xl text-slate-900 tracking-tighter">Pasarela de Cobro</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-10">
                                {metodosPago.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentData({
                                            ...paymentData,
                                            metodo: m.nombre,
                                            banco: m.bank_account_id || paymentData.banco
                                        })}
                                        className={`py-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${paymentData.metodo === m.nombre ? 'border-slate-900 bg-slate-900 text-white shadow-2xl shadow-slate-200' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        {m.tipo === 'Efectivo' && <Banknote size={28} />}
                                        {m.tipo === 'Tarjeta' && <CreditCard size={28} />}
                                        {(m.tipo === 'Transferencia' || m.tipo === 'Electronico') && <ArrowRight size={28} className="rotate-[-45deg]" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest font-mono text-center px-2">{m.nombre}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-8 flex-1">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Importe Recibido</label>
                                    <div className="relative group">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300 group-focus-within:text-purple-200 transition-colors">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => {
                                                const nextValue = e.target.value;
                                                if (nextValue === '' || /^\d*([.]\d{0,2})?$/.test(nextValue)) {
                                                    setAmount(nextValue);
                                                    setPaymentData({
                                                        ...paymentData,
                                                        recibido: nextValue === '' ? 0 : Number(nextValue)
                                                    });
                                                }
                                            }}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full bg-[#F5F5F7] border-none rounded-[2rem] py-8 pl-16 pr-8 text-5xl font-black text-slate-900 focus:ring-0 font-mono transition-all"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {paymentData.metodo !== 'Efectivo' && (
                                    <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Banco Destino</label>
                                            <select
                                                className="w-full bg-[#F5F5F7] border-none rounded-2xl py-5 px-6 font-black text-sm uppercase tracking-tight"
                                                value={paymentData.banco}
                                                onChange={e => setPaymentData({ ...paymentData, banco: e.target.value })}
                                            >
                                                {bancos.map(b => <option key={b.id} value={b.id}>{b.nombre_banco} - {b.numero_cuenta}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nº de Referencia / TXN</label>
                                            <input
                                                type="text"
                                                value={paymentData.referencia}
                                                onChange={e => setPaymentData({ ...paymentData, referencia: e.target.value })}
                                                className="w-full bg-[#F5F5F7] border-none rounded-2xl py-5 px-6 font-black text-sm placeholder:text-slate-300 uppercase"
                                                placeholder="Ej: ACH-990234"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-6 flex items-center justify-between">
                                    <div className="pl-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cambio a entregar</p>
                                        <p className={`text-4xl font-black font-mono transition-colors ${cambio >= 0 ? 'text-green-600' : 'text-red-400'}`}>
                                            ${Number(Math.max(0, cambio)).toFixed(2)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={processCheckout}
                                        disabled={paymentData.recibido < total && paymentData.metodo === 'Efectivo' && total > 0}
                                        className="bg-slate-900 hover:bg-black text-white px-12 py-7 rounded-[2rem] font-black text-lg flex items-center gap-4 transition-all active:scale-95 shadow-2xl shadow-slate-200 disabled:opacity-30"
                                    >
                                        FINALIZAR OPERACIÓN <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Buscar Ordenes */}
            {showOrdersModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
                    <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Ordenes Pendientes</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sincronización con sistema de ventas</p>
                            </div>
                            <button onClick={() => setShowOrdersModal(false)} className="p-3 hover:bg-white rounded-2xl shadow-sm transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-10 flex-1 overflow-hidden flex flex-col">
                            <div className="relative mb-10">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={searchOrderQuery}
                                    onChange={e => setSearchOrderQuery(e.target.value)}
                                    onKeyUp={() => fetchOrders()}
                                    placeholder="Número de orden, cliente o token..."
                                    className="w-full bg-[#F5F5F7] border-none rounded-[2rem] py-5 pl-16 pr-8 focus:ring-4 focus:ring-purple-100 text-sm font-black transition-all"
                                />
                            </div>
                            <div className="space-y-4 overflow-y-auto pr-4 custom-scrollbar">
                                {pendingOrders.map(orden => (
                                    <button
                                        key={orden.id}
                                        onClick={() => handleLoadOrder(orden)}
                                        className="w-full text-left p-6 bg-white border-2 border-slate-50 hover:border-purple-600 rounded-[2.5rem] transition-all flex items-center justify-between group group/card shadow-sm hover:shadow-xl hover:shadow-purple-50"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/card:bg-purple-600 group-hover/card:text-white transition-all">
                                                <Hash size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 tracking-tight leading-none mb-2 underline decoration-purple-200 underline-offset-4">#{orden.numero_orden}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orden.cliente.razon_social}</p>
                                            </div>
                                        </div>
                                        <div className="text-right bg-slate-50 group-hover/card:bg-purple-50 px-6 py-4 rounded-3xl transition-colors">
                                            <p className="text-xl font-black text-purple-600 font-mono tracking-tighter leading-none mb-1">${Number(orden.total_num - (orden.abonado_num || 0)).toFixed(2)}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Monto: ${Number(orden.total_num).toFixed(2)}</p>
                                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest block">Abono: ${Number(orden.abonado_num || 0).toFixed(2)}</p>
                                        </div>
                                    </button>
                                ))}
                                {pendingOrders.length === 0 && (
                                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                        <ClipboardList size={64} className="mx-auto mb-6 text-slate-200" />
                                        <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-400">Sin resultados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Corte X */}
            {showCorteXModal && corteXData && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
                        <div className="bg-slate-900 p-12 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-[60px] rounded-full -mr-10 -mt-10" />
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tighter mb-2">CORTE DE CAJA PARCIAL</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono opacity-80">
                                    {new Date().toLocaleDateString('es-PA')} | {new Date().toLocaleTimeString('es-PA')}
                                </p>
                            </div>
                        </div>
                        <div className="p-12 space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest">
                                <span>Saldo Apertura</span>
                                <span className="text-slate-900">${Number(corteXData.apertura).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest">
                                <span>Ventas en Efectivo</span>
                                <span className="text-green-600">+ ${Number(corteXData.ventas_efectivo).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-slate-50 font-black text-[11px] uppercase text-slate-400 tracking-widest">
                                <span>Retiros Realizados</span>
                                <span className="text-red-500">- ${Number(corteXData.salidas).toFixed(2)}</span>
                            </div>

                            <div className="py-10 text-center bg-[#F5F5F7] rounded-[2.5rem] mt-8 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Efectivo Esperado en Caja</p>
                                <p className="text-6xl font-black text-slate-900 tracking-tighter font-mono">${Number(corteXData.apertura + corteXData.ventas_efectivo - corteXData.salidas).toFixed(2)}</p>
                            </div>

                            <div className="pt-8 grid grid-cols-2 gap-4">
                                <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100/50">
                                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Tarjeta (Elect.)</p>
                                    <p className="text-xl font-black text-purple-700 font-mono tracking-tighter">${Number(corteXData.ventas_tarjeta).toFixed(2)}</p>
                                </div>
                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100/50">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Transferencias</p>
                                    <p className="text-xl font-black text-blue-700 font-mono tracking-tighter">${Number(corteXData.ventas_transferencia).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-12 bg-slate-50 border-t border-slate-100 flex gap-6">
                            <button onClick={() => window.print()} className="flex-1 bg-white border border-slate-200 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:shadow-lg transition-all active:scale-95 shadow-sm">Generar Vale</button>
                            <button onClick={() => setShowCorteXModal(false)} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200">Entendido</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
