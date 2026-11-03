import { defineConfig } from 'vite';
import { createRequire } from 'node:module';
import { devCsp } from './scripts/dev-csp.mjs';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const { RELEASES_URL } = require('./electron/update-logic.cjs');

// Percorsi relativi: l'app viene caricata da file:// dentro Electron.
export default defineConfig({
  base: './',
  // versione dell'app e pagina delle release per la finestra «Fonti dei dati e guida» (src/ui/info-dialog.js)
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __RELEASES_URL__: JSON.stringify(RELEASES_URL),
  },
  plugins: [
    {
      // la CSP di index.html permette solo 'self'; il WebSocket del ricaricamento automatico serve solo con `vite`
      name: 'dev-csp',
      apply: 'serve',
      transformIndexHtml: (html, ctx) => devCsp(html, ctx.server?.config.server.port ?? 5173),
    },
  ],
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
    // il più grande è il motore fisico del simulatore (Rapier 0.21, con il WebAssembly incluso: 4,3 MB), caricato solo
    // quando serve
    chunkSizeWarningLimit: 4500,
  },
});
