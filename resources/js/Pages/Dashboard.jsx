import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ 
    stats, 
    grafica, 
    ventas_cliente,
    ventas_producto,
    rentabilidad_cliente,
    rentabilidad_producto,
    ventas_vendedor,
    saldos_clientes,
    saldos_proveedores
}) {
    const [periodo, setPeriodo] = useState('mes');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [mostrarFechas, setMostrarFechas] = useState(false);
    
    const format = (val) => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(val || 0);

    const formatNum = (val) => new Intl.NumberFormat('en-US').format(val || 0);

    const maxVal = Math.max(...grafica.map(m => Math.max(m.ventas, m.gastos)), 1);

    const handlePeriodoChange = (nuevoPeriodo) => {
        if (nuevoPeriodo === 'personalizado') {
            setMostrarFechas(true);
            setPeriodo(nuevoPeriodo);
        } else {
            setMostrarFechas(false);
            setPeriodo(nuevoPeriodo);
            router.get('/dashboard', { periodo: nuevoPeriodo }, { preserveState: true });
        }
    };

    const aplicarFechasPersonalizadas = () => {
        if (fechaInicio && fechaFin) {
            router.get('/dashboard', { 
                periodo: 'personalizado',
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            }, { preserveState: true });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-[1600px] mx-auto p-6">
                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                                <p className="text-gray-600 mt-1">Análisis de operaciones y rentabilidad</p>
                            </div>
                            
                            {/* Selector de Período */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={periodo}
                                    onChange={(e) => handlePeriodoChange(e.target.value)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="dia">Hoy</option>
                                    <option value="mes">Este mes</option>
                                    <option value="trimestre">Trimestre</option>
                                    <option value="semestre">Semestre</option>
                                    <option value="anual">Año</option>
                                    <option value="historico">Histórico</option>
                                    <option value="personalizado">Personalizado</option>
                                </select>
                                
                                {mostrarFechas && (
                                    <>
                                        <input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                        />
                                        <span className="text-gray-500">—</span>
                                        <input
                                            type="date"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={aplicarFechasPersonalizadas}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                        >
                                            Aplicar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <KPICard 
                            title="Ventas" 
                            value={format(stats.ventas_mes)} 
                            icon="📈"
                            color="text-green-600"
                            bgColor="bg-green-50"
                        />
                        <KPICard 
                            title="Gastos" 
                            value={format(stats.gastos_mes)} 
                            icon="📉"
                            color="text-red-600"
                            bgColor="bg-red-50"
                        />
                        <KPICard 
                            title="Utilidad Neta" 
                            value={format(stats.ventas_mes - stats.gastos_mes)} 
                            icon="💰"
                            color="text-blue-600"
                            bgColor="bg-blue-50"
                        />
                        <KPICard 
                            title="Por Cobrar" 
                            value={format(stats.cxc_pendiente)} 
                            icon="⏱️"
                            color="text-orange-600"
                            bgColor="bg-orange-50"
                        />
                    </div>

                    {/* Tendencia Financiera - FULL WIDTH */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Tendencia Financiera</h2>
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span className="text-gray-600">Ventas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                    <span className="text-gray-600">Gastos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                    <span className="text-gray-600">Utilidad</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Contenedor con scroll horizontal */}
                        <div className="overflow-x-auto">
                            <div className="min-w-full" style={{ minWidth: `${grafica.length * 60}px` }}>
                                <div className="flex items-end justify-between h-64 gap-2 px-4">
                                    {grafica.map((m, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center group min-w-[50px]">
                                            <div className="w-full flex justify-center gap-1 items-end h-48 relative">
                                                {/* Barra Ventas */}
                                                <div 
                                                    className="w-3 bg-green-500 rounded-t hover:bg-green-600 transition-colors relative" 
                                                    style={{ height: `${(m.ventas / maxVal) * 100}%`, minHeight: '4px' }}
                                                >
                                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity z-10">
                                                        {format(m.ventas)}
                                                    </div>
                                                </div>
                                                {/* Barra Gastos */}
                                                <div 
                                                    className="w-3 bg-red-500 rounded-t hover:bg-red-600 transition-colors relative" 
                                                    style={{ height: `${(m.gastos / maxVal) * 100}%`, minHeight: '4px' }}
                                                >
                                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity z-10">
                                                        {format(m.gastos)}
                                                    </div>
                                                </div>
                                                {/* Barra Utilidad */}
                                                <div 
                                                    className="w-3 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative" 
                                                    style={{ height: `${((m.ventas - m.gastos) / maxVal) * 100}%`, minHeight: '4px' }}
                                                >
                                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity z-10">
                                                        {format(m.ventas - m.gastos)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-600 mt-3 font-medium">{m.mes}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid de 2 columnas */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                        {/* Top Clientes */}
                        <DataCard title="Top Clientes por Ventas">
                            <div className="space-y-3">
                                {ventas_cliente?.slice(0, 8).map((cliente, i) => (
                                    <RankingItem 
                                        key={i}
                                        position={i + 1}
                                        label={cliente.nombre}
                                        value={format(cliente.total)}
                                        subtitle={`${cliente.ordenes} órdenes`}
                                        percentage={(cliente.total / ventas_cliente[0]?.total) * 100}
                                    />
                                ))}
                            </div>
                        </DataCard>

                        {/* Top Productos */}
                        <DataCard title="Top Productos por Ventas">
                            <div className="space-y-3">
                                {ventas_producto?.slice(0, 8).map((prod, i) => (
                                    <RankingItem 
                                        key={i}
                                        position={i + 1}
                                        label={prod.nombre}
                                        value={format(prod.total)}
                                        subtitle={`${formatNum(prod.cantidad)} unidades`}
                                        percentage={(prod.total / ventas_producto[0]?.total) * 100}
                                    />
                                ))}
                            </div>
                        </DataCard>
                    </div>

                    {/* Segunda fila - 2 columnas */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                        {/* Rentabilidad por Cliente */}
                        <DataCard title="Rentabilidad por Cliente">
                            <div className="space-y-3">
                                {rentabilidad_cliente?.slice(0, 8).map((cliente, i) => (
                                    <RankingItem 
                                        key={i}
                                        position={i + 1}
                                        label={cliente.nombre}
                                        value={format(cliente.utilidad)}
                                        subtitle={`Margen: ${cliente.margen}%`}
                                        percentage={(cliente.utilidad / rentabilidad_cliente[0]?.utilidad) * 100}
                                        color="blue"
                                    />
                                ))}
                            </div>
                        </DataCard>

                        {/* Rentabilidad por Producto */}
                        <DataCard title="Rentabilidad por Producto">
                            <div className="space-y-3">
                                {rentabilidad_producto?.slice(0, 8).map((prod, i) => (
                                    <RankingItem 
                                        key={i}
                                        position={i + 1}
                                        label={prod.nombre}
                                        value={format(prod.utilidad)}
                                        subtitle={`Margen: ${prod.margen}%`}
                                        percentage={(prod.utilidad / rentabilidad_producto[0]?.utilidad) * 100}
                                        color="blue"
                                    />
                                ))}
                            </div>
                        </DataCard>
                    </div>

                    {/* Tercera fila - 3 columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Ventas por Vendedor */}
                        <DataCard title="Top Vendedores">
                            <div className="space-y-3">
                                {ventas_vendedor?.slice(0, 6).map((vendedor, i) => (
                                    <RankingItem 
                                        key={i}
                                        position={i + 1}
                                        label={vendedor.nombre}
                                        value={format(vendedor.total)}
                                        subtitle={`${vendedor.ordenes} ventas`}
                                        percentage={(vendedor.total / ventas_vendedor[0]?.total) * 100}
                                        color="green"
                                    />
                                ))}
                            </div>
                        </DataCard>

                        {/* Cuentas por Cobrar */}
                        <DataCard title="Cuentas por Cobrar">
                            <div className="space-y-3">
                                {saldos_clientes?.slice(0, 6).map((cliente, i) => (
                                    <SaldoItem 
                                        key={i}
                                        nombre={cliente.nombre}
                                        saldo={format(cliente.saldo)}
                                        vencido={cliente.vencido}
                                        dias={cliente.dias_promedio}
                                    />
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Total</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {format(saldos_clientes?.reduce((sum, c) => sum + c.saldo, 0))}
                                    </span>
                                </div>
                            </div>
                        </DataCard>

                        {/* Cuentas por Pagar */}
                        <DataCard title="Cuentas por Pagar">
                            <div className="space-y-3">
                                {saldos_proveedores?.slice(0, 6).map((proveedor, i) => (
                                    <SaldoItem 
                                        key={i}
                                        nombre={proveedor.nombre}
                                        saldo={format(proveedor.saldo)}
                                        vencido={proveedor.vencido}
                                        dias={proveedor.dias_promedio}
                                    />
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Total</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {format(saldos_proveedores?.reduce((sum, p) => sum + p.saldo, 0))}
                                    </span>
                                </div>
                            </div>
                        </DataCard>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Componentes auxiliares minimalistas
function KPICard({ title, value, icon, color, bgColor }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl ${bgColor} p-2 rounded-lg`}>{icon}</span>
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
    );
}

function DataCard({ title, children }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
            {children}
        </div>
    );
}

function RankingItem({ position, label, value, subtitle, percentage, color = 'gray' }) {
    const colors = {
        gray: 'bg-gray-500',
        green: 'bg-green-500',
        blue: 'bg-blue-500',
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                    {position}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{label}</div>
                    {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
                </div>
                <div className="text-sm font-semibold text-gray-900">{value}</div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                    className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

function SaldoItem({ nombre, saldo, vencido, dias }) {
    const isVencido = vencido > 0;
    
    return (
        <div className={`p-3 rounded-lg ${isVencido ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{nombre}</div>
                    <div className="flex items-center gap-2 mt-1">
                        {isVencido && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                                {vencido} vencidas
                            </span>
                        )}
                        <span className="text-xs text-gray-500">{dias} días</span>
                    </div>
                </div>
                <div className={`text-sm font-semibold ml-2 ${isVencido ? 'text-red-600' : 'text-gray-900'}`}>
                    {saldo}
                </div>
            </div>
        </div>
    );
}