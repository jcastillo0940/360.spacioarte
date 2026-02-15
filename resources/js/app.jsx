import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { route as ziggyRoute } from 'ziggy-js';
// Importamos el registro manual del Service Worker
import { registerSW } from 'virtual:pwa-register';

const appName = import.meta.env.VITE_APP_NAME || 'ERP Pro';

window.route = ziggyRoute;

// Registro del Service Worker para PWA
if ("serviceWorker" in navigator) {
    registerSW({
        immediate: true,
        onNeedRefresh() {
            // Opcional: Recargar automáticamente o mostrar aviso
            // window.location.reload(); 
        },
        onOfflineReady() {
            console.log("App lista para trabajar offline.");
        },
    });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4F46E5',
    },
});