import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        // Pure TypeScript logic tests — no DOM APIs needed, use node environment
        // to avoid jsdom ESM compatibility issues
        environment: 'node',
        globals: true,
    },
    resolve: {
        alias: {
            // Match the same @ alias used in the main app
            '@': path.resolve(__dirname, './src'),
        },
    },
});
