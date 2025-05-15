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
    // Improved build settings for better deployment
    outDir: "dist",
    sourcemap: true,
    minify: "terser",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group Radix UI components together
          if (id.includes('@radix-ui')) {
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
      }
    }
  },
  // Enable optimizations for production
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@radix-ui/react-aspect-ratio', '@radix-ui/react-label', '@radix-ui/react-separator', '@radix-ui/react-progress', '@radix-ui/react-scroll-area', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-popover', '@radix-ui/react-radio-group']
  }
}));
