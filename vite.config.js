import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: './index.html',
        oauth: './oauth-callback.html',
      },
      output: {
        // Better cache busting with consistent hashing
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Code splitting for better performance
        manualChunks(id) {
          // Vendor chunks (external dependencies)
          if (id.includes('firebase')) {
            return 'firebase-core';
          }
          // Component chunks (internal code)
          if (id.includes('/components/')) {
            return 'components';
          }
          if (id.includes('/services/')) {
            return 'services';
          }
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
});
