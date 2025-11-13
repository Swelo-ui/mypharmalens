// At the top of vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['*.png', '*.svg', '*.ico', '*.woff2'],
      manifest: {
        name: 'PharmaLens - AI Medication Identifier',
        short_name: 'PharmaLens',
        description: 'AI-Powered Medication Identification & Drug Information',
        theme_color: '#0289C8',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['health', 'medical', 'utilities'],
        lang: 'en-US',
        dir: 'ltr',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,mp3,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for larger assets
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Cache Supabase medication data for offline access
            urlPattern: ({ url }) => {
              return url.pathname.includes('drug_identification_cache') ||
                     url.pathname.includes('medications') ||
                     url.pathname.includes('drug_interactions');
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'medications-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache symptom checker data
            urlPattern: ({ url }) => {
              return url.pathname.includes('symptom_checker') ||
                     url.pathname.includes('symptoms');
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'symptom-checker-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Images and assets
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
          {
            // Fonts
            urlPattern: /\.(woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // Disable in dev for faster reloads
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',        // Output to 'dist' folder
    emptyOutDir: true,     // Clean the 'dist' folder before each build
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query'
          ],
          ui: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
        }
      }
    }
  }
}));