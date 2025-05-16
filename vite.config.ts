
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Build to public directory for Netlify
    outDir: "public",
    sourcemap: true,
    minify: "terser",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Properly handle Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Other chunk configurations
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      external: [
        '@rollup/rollup-linux-x64-gnu'
      ]
    }
  },
  // More specific optimizeDeps to ensure all Radix components are pre-bundled
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu'
    ]
  }
}));
