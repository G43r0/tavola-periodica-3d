## Tavola Periodica 3D v0.9.2 — Aggiornamenti automatici e barra che ci sta sempre

Prima versione del cammino verso la 1.0 (vedi il [piano](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.2/docs/superpowers/specs/2026-10-29-versione-1.0-piano.md)).
Dettagli nel [CHANGELOG](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.2/CHANGELOG.md).

### Aggiornamenti automatici
- **Installer**: l'app cerca da sola le versioni nuove (poco dopo l'avvio e poi ogni 6 ore), le scarica in sottofondo e
  le installa alla chiusura. Un avviso in basso a destra offre anche «Riavvia e aggiorna» subito.
- **Versione portabile**: non può sostituirsi da sola, ma ti avvisa quando esce una versione nuova e apre la pagina per
  scaricarla.
- In **Informazioni** (`i` nella barra) c'è la sezione «Aggiornamenti»: versione installata, «Controlla ora» e
  l'interruttore per spegnere la ricerca automatica.
- Internet serve solo per questo: senza rete l'app funziona come sempre.

> Chi ha la 0.9.1 o una versione precedente deve installare la 0.9.2 a mano una volta: da lì in poi si aggiorna da sola.

### Barra in alto
Fino alla 0.9.1 la barra usciva dallo schermo a quasi tutte le larghezze tra 1024 e 1920 px (a 1366×768 mancavano
Simulatore, Spiega, Grafica, Lingua e Informazioni). Ora si stringe da sola a livelli e tutti i pulsanti restano
raggiungibili, in tutte e tre le lingue.

### Sicurezza e dipendenze
Electron 44.10 al posto della 44.7 (avviso di gravità alta sui certificati), electron-builder 26.18 e Vite 8.3.5.

### Limiti noti
- L'eseguibile non è firmato: Windows SmartScreen chiede conferma al primo avvio («Ulteriori informazioni → Esegui comunque»).
  Gli aggiornamenti automatici funzionano comunque.
- Il tempo del calore scorre 4 volte più veloce del reale; le rese e i tempi delle reazioni sono semplificati.
- Le traduzioni «Spiegamelo come se avessi 6 anni» coprono i testi principali; gli altri ricadono sull'italiano.

### Download
- `TavolaPeriodica3D-Setup-0.9.2.exe` — installer per Windows (x64), con aggiornamenti automatici
- `TavolaPeriodica3D-portable-0.9.2.exe` — versione portabile, senza installazione
- `latest.yml` e `TavolaPeriodica3D-Setup-0.9.2.exe.blockmap` — servono agli aggiornamenti automatici, non vanno scaricati

Dal codice sorgente:

```bash
npm install
npm start        # avvio
npm run dist     # installer e versione portabile in release/
```

Vedi il [README](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.2/README.md) per i dettagli.
