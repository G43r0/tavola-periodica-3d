## Tavola Periodica 3D v0.9.1 — Gas delle combustioni e spatola più precisa

Versione di correzioni: risolve le due segnalazioni arrivate dopo la 0.9.0
([#13](https://github.com/G43r0/tavola-periodica-3d/issues/13) e
[#14](https://github.com/G43r0/tavola-periodica-3d/issues/14)). Dettagli nel
[CHANGELOG](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.1/CHANGELOG.md).

### Sandbox: i gas delle combustioni (#13)

Prima ogni combustione liberava solo un generico «Fumo». Ora chi brucia libera i suoi prodotti veri:

- **legno**: anidride carbonica e vapore acqueo, più un po' di fuliggine; **carbone**: CO₂; **zolfo**: SO₂;
  **fosforo**: il fumo bianco di P₄O₁₀, che si posa come polvere; **arsenico**: As₄O₆;
- **composti della libreria**: i gas che vengono dai loro atomi (C → CO₂, H → H₂O, S → SO₂, N → N₂,
  alogeni → HF/HCl/HBr/HI, Si → SiO₂);
- **poca aria**: parte del carbonio diventa **monossido di carbonio** (che può bruciare a sua volta nella fiamma) o
  **fuliggine** («Fumo nero»); nell'ossigeno puro brucia tutto in CO₂.

I gas di combustione si disperdono nell'aria dopo qualche secondo. Passando il cursore sopra una cella si legge
quale gas è («gas di combustione»; il vapore compare come «Vapore acqueo»). Nel registro, le combustioni dei composti
che non sono nel catalogo hanno l'equazione bilanciata (per esempio 2 CO + O₂ → 2 CO₂).

### Simulatore: pesare con la spatola (#14)

- **Dosi più regolari**: nella chimica realistica un cucchiaino pesa 1 g ± 5 % e un pizzico 0,1 g ± 20 % (prima un
  cucchiaino poteva andare da 0,6 a 1,25 g).
- **Versare con precisione**: sopra il recipiente il cucchiaio va sulla bocca e il solido si vede cadere a granelli.
  - `E`: versa tutto il solido, come prima;
  - `E` tenuto premuto: il solido scivola piano, prima adagio e poi più svelto, finché non si lascia il tasto;
  - `Maiusc+E`: un colpetto, cadono pochi centesimi di grammo, per arrivare alla massa voluta guardando la bilancia.
- **Nuova spatola**: acciaio spazzolato, lama arrotondata, manico che si stringe e cucchiaio concavo in cui il
  mucchietto di polvere cresce con la quantità presa.

Legenda dei comandi, aiuto, tutorial «Pesare» e libro «Come si fa» spiegano i nuovi gesti.

### Limiti noti
- Il tempo del calore scorre 4 volte più veloce del reale; le rese e i tempi delle reazioni sono semplificati.
- Le traduzioni «Spiegamelo come se avessi 6 anni» coprono i testi principali; gli altri ricadono sull'italiano.
- L'eseguibile non è firmato: Windows SmartScreen chiede conferma al primo avvio («Ulteriori informazioni → Esegui comunque»).

### Download
- `Tavola.Periodica.3D.Setup.0.9.1.exe` — installer per Windows (x64)
- `TavolaPeriodica3D-portable-0.9.1.exe` — versione portabile, senza installazione

Dal codice sorgente:

```bash
npm install
npm start        # avvio
npm run dist     # installer e versione portabile in release/
```

Vedi il [README](https://github.com/G43r0/tavola-periodica-3d/blob/v0.9.1/README.md) per i dettagli.
