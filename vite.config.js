import { defineConfig } from 'vite';

// Percorsi relativi: l'app viene caricata da file:// dentro Electron.
export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/release/**', '**/data-sources/**'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome120',
    // il più grande è il motore fisico del simulatore (Rapier, con il WebAssembly incluso), caricato solo quando serve
    chunkSizeWarningLimit: 2400,
  },
});
