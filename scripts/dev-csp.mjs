// Content-Security-Policy in sviluppo: index.html permette solo 'self' (così resta nell'eseguibile); con `vite` serve anche
// il WebSocket del ricaricamento automatico sulla porta del server. Usato da vite.config.js (transformIndexHtml).

/** Aggiunge `ws://127.0.0.1:<porta>` a connect-src (una volta sola). */
export function devCsp(html, port) {
  const ws = `ws://127.0.0.1:${port}`;
  return html.replace(/connect-src 'self'(?! ws:)/, `connect-src 'self' ${ws}`);
}
