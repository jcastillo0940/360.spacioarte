import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'HPOS 360 Ruta',
                short_name: 'HPOS Ruta',
                description: 'Módulo de Venta en Ruta HPOS 360',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: '/android-chrome-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/android-chrome-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                // Estrategia de caché para API requests
                runtimeCaching: [{
                    urlPattern: ({ url }) => url.pathname.startsWith('/pwa/sync'),
                    handler: 'NetworkFirst',
                    options: {
                        cacheName: 'api-cache',
                        expiration: {
                            maxEntries: 10,
                            maxAgeSeconds: 60 * 60 * 24 // 24 horas
                        },
                    },
                }]
            }
        })
    ],
});