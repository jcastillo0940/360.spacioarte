import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import BottomNav from '@/Components/PWA/BottomNav';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export default function Home({ auth }) {
    // Estadísticas rápidas offline
    const ordenesPendientes = useLiveQuery(() => db.ordenes_pendientes.count());
    const visitasHoy = useLiveQuery(() => db.visitas_pendientes.count());

    // Componente de Botón Grande
    const MenuCard = ({ title, icon, color, href, badge }) => (
        <Link 
            href={route(href)}
            className={`${color} text-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform relative`}
        >
            <div className="text-4xl">{icon}</div>
            <div className="font-bold text-lg text-center leading-tight">{title}</div>
            {badge > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                    {badge}
                </div>
            )}
        </Link>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Hola, {auth.user.name.split(' ')[0]} 👋
                    </h2>
                    <p className="text-xs text-gray-500">Vamos a trabajar.</p>
                </div>
            }
        >
            <Head title="Inicio PWA" />

            <div className="py-6 px-4 pb-24 max-w-md mx-auto">
                
                {/* Resumen Rápido */}
                <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-white p-3 rounded-xl shadow border-l-4 border-blue-500">
                        <p className="text-gray-500 text-xs uppercase font-bold">Ventas Pend.</p>
                        <p className="text-2xl font-bold text-gray-800">{ordenesPendientes || 0}</p>
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-xl shadow border-l-4 border-green-500">
                        <p className="text-gray-500 text-xs uppercase font-bold">Visitas Hoy</p>
                        <p className="text-2xl font-bold text-gray-800">{visitasHoy || 0}</p>
                    </div>
                </div>

                {/* Grid de Menú Principal */}
                <div className="grid grid-cols-2 gap-4">
                    
                    {/* 1. Ruta / Clientes */}
                    <MenuCard 
                        title="Mi Ruta" 
                        icon="🚚" 
                        color="bg-blue-600" 
                        href="pwa.ruta"
                    />

                    {/* 2. Crear Pedido (Redirige a ruta para seleccionar cliente) */}
                    <MenuCard 
                        title="Crear Pedido" 
                        icon="🛒" 
                        color="bg-green-600" 
                        href="pwa.ruta"
                    />

                    {/* 3. Inventario */}
                    <MenuCard 
                        title="Inventario" 
                        icon="📦" 
                        color="bg-indigo-600" 
                        href="pwa.inventario"
                    />

                    {/* 4. Notas de Crédito (Redirige a módulo futuro) */}
                    <MenuCard 
                        title="Devoluciones / NC" 
                        icon="📄" 
                        color="bg-orange-500" 
                        href="pwa.ruta" // Temporalmente a ruta, luego a módulo NC
                    />

                    {/* 5. Gastos */}
                    <MenuCard 
                        title="Registrar Gastos" 
                        icon="💸" 
                        color="bg-purple-600" 
                        href="pwa.inventario" // Placeholder hasta crear pantalla gastos
                    />

                    {/* 6. Cierre del Día */}
                    <MenuCard 
                        title="Cierre del Día" 
                        icon="🏁" 
                        color="bg-gray-700" 
                        href="dashboard" // Placeholder
                    />

                </div>
            </div>

            <BottomNav active="inicio" />
        </AuthenticatedLayout>
    );
}