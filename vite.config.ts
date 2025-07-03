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
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Pharmalens',
        short_name: 'Pharmalens',
        description: 'AI-Powered Medication Identification',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // Radix UI components chunk
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          
          // Lucide icons chunk
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          
          // Router and query libraries
          if (id.includes('react-router') || id.includes('@tanstack/react-query')) {
            return 'vendor-routing';
          }
          
          // Supabase libraries
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          
          // Drug data files - separate chunk for lazy loading
          if (id.includes('/src/data/') && id.includes('Drugs.ts')) {
            return 'data-drugs';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
    // Increase chunk size warning limit for drug data
    chunkSizeWarningLimit: 600,
  }
}));