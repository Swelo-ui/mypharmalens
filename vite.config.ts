
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
        manualChunks: {
          // Split big dependencies into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui'],
        }
      }
    }
  },
  // Enable optimizations for production
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@radix-ui']
  }
}));
