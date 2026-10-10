import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { qrcode } from 'vite-plugin-qrcode'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    qrcode(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'firebase-messaging-sw.js'],
      manifest: {
        name: 'RCCG Heghizbah Chapel',
        short_name: 'Heghizbah',
        description: 'Church App for RCCG Heghizbah Chapel',
        theme_color: '#1e3a8a',
        background_color: '#fdfaf3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
            { src: 'icons/Rccg_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/Rccg_logo.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/firebase-messaging-sw\.js$/]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})