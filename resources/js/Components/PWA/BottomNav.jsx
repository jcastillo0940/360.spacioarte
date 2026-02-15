import React from 'react';
import { Link } from '@inertiajs/react';

export default function BottomNav({ active }) {
    const navItems = [
        { label: 'Inicio', route: 'pwa.home', icon: '🏠', id: 'inicio' },
        { label: 'Ruta', route: 'pwa.ruta', icon: '🚚', id: 'ruta' },
        { label: 'Inventario', route: 'pwa.inventario', icon: '📦', id: 'inventario' },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        href={route(item.route)}
                        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                            active === item.id 
                                ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <span className="text-2xl mb-0.5 leading-none">{item.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}