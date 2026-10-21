import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'app-icon.png', 'ringtone.wav', 'icon-192.png', 'icon-512.png', 'badge.png'],
      manifest: {
        short_name: 'RemindIQ',
        name: 'RemindIQ — Customer Follow-up & Call Reminder',
        description: 'Customer Follow-up & Call Reminder System with real-time Australian alerts and mobile alarms.',
        id: '/',
        start_url: '/reminders',
        scope: '/',
        background_color: '#070b14',
        theme_color: '#4f46e5',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay'],
        orientation: 'portrait',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable',
          },
          {
            src: '/app-icon.png',
            type: 'image/png',
            sizes: '192x192 512x512',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Add Reminder',
            short_name: 'Add',
            description: 'Schedule a new customer call reminder',
            url: '/add',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
          {
            name: 'All Reminders',
            short_name: 'Reminders',
            description: 'View all customer call reminders',
            url: '/reminders',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        importScripts: ['/sw-push.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' ||
              url.pathname === '/' ||
              url.pathname === '/index.html',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true, // Listen on all local IPs (127.0.0.1 and localhost)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`[Vite Proxy] Backend temporarily unavailable (${err.code || err.message}) for ${req.method} ${req.url}`);
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  message: 'Backend server is restarting or temporarily unreachable. Please retry.',
                })
              );
            }
          });
        },
      },
    },
  },
});
