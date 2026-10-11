import { defineConfig } from 'vite';

// Percorsi relativi: l'app viene caricata da file:// dentro Electron e da un sottopercorso
// su GitHub Pages (https://<utente>.github.io/tavola-periodica-3d/).
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
    chunkSizeWarningLimit: 1500,
  },
});
