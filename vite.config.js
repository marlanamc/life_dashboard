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
    rollupOptions: {
      input: {
        main: './index.html',
        oauth: './oauth-callback.html',
      },
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
});
