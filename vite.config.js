import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Relative asset paths ensure clean hosting under /demo/ without 404s
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true
  },
  server: {
    port: 5177
  }
});
