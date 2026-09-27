import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/demosdk.js',
        chunkFileNames: 'assets/demosdk-[name].js',
        assetFileNames: 'assets/demosdk.[ext]'
      }
    }
  },
  server: {
    port: 5177
  }
});
