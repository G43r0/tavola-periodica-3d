## Tavola Periodica 3D v0.9.0 — Simulatore di laboratorio: il gioco completo

Il simulatore di laboratorio della 0.8.0 era un prototipo con 5 esercitazioni: ora è un gioco completo, con le otto fasi
del piano del gioco base (G1–G8). Dettagli nel [CHANGELOG](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.0/CHANGELOG.md).

### Novità principali

**Carriera di un anno scolastico** — dieci capitoli (comandi e sicurezza, misure, acidi e basi, precipitazioni, gas,
calore e cristalli, ossidoriduzioni, fiamme, chimica organica, esame) con 55 esercitazioni scritte come dati e risolte
dal motore nei test: verifiche con campioni incogniti e voto da 4 a 10, pagella, relazione di laboratorio, reputazione,
negozio, richieste extra (tra cui la pila Daniell e il calore del metano) e sfide a tempo con le medaglie. Profili e
salvataggi con la versione.

**Reazioni al centro** — bolle, gas colorati, precipitati che scendono, cambi di colore, la finestrella con l'equazione e
il ΔH°, il «perché non reagisce?» e il quaderno delle reazioni scoperte; lampada per le reazioni fotochimiche; armadio
della scuola con 47 reagenti in più.

**Strumenti** — termometro, pH-metro, pipetta, buretta, filtrazione, distillazione, bagno di ghiaccio, crogiolo e pinza,
alimentatore per l'elettrolisi, bombole dei gas, pila Daniell con voltmetro e ponte salino, contatore del gas.

**Libro «Come si fa»** — 26 pagine di strumenti, 15 di tecniche e 5 di sicurezza, le pagine dei 118 elementi e 668
ricette generate dal catalogo ed eseguite dal motore, con «Prepara sul banco» e «Segui la ricetta».

**Rifinitura (G8)** — suoni veri del laboratorio (21 registrazioni CC0 da Freesound, posizionali; `M` per l'audio),
dettagli dell'aula (armadi, orologio, cartelli di sicurezza, vista dalle finestre, usura), scintille, lampo e scossa
della camera nelle esplosioni, occlusione ambientale nel preset Professionale, qualità che si adatta da sola.

**Grafica e leggibilità** — aula in toni medi, luce moderata, tone mapping neutro, vetro leggibile, ombre di contatto,
reagenti riconoscibili dal contenitore, dal colore del tappo e dalle etichette con i pittogrammi GHS.

### Limiti noti
- Il tempo del calore scorre 4 volte più veloce del reale; le rese e i tempi delle reazioni sono semplificati.
- Le traduzioni «Spiegamelo come se avessi 6 anni» coprono i testi principali; gli altri ricadono sull'italiano.
- L'eseguibile non è firmato: Windows SmartScreen chiede conferma al primo avvio («Ulteriori informazioni → Esegui comunque»).

### Download
- `Tavola.Periodica.3D.Setup.0.9.0.exe` — installer per Windows (x64)
- `TavolaPeriodica3D-portable-0.9.0.exe` — versione portabile, senza installazione

Dal codice sorgente:

```bash
npm install
npm start        # avvio
npm run dist     # installer e versione portabile in release/
```

Vedi il [README](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.0/README.md) per i dettagli.
