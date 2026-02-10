import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: false, // Use existing manifest.json in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:.*\/api\/patients/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-patients',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https?:.*\/api\/daily-logs/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-daily-logs',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 30 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https?:.*\/api\/reports/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-reports',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 30 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https?:.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-general',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 15 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
