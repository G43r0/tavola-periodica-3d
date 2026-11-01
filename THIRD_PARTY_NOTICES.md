# Avvisi di terze parti

Tavola Periodica 3D è software libero con licenza MIT (vedi [LICENSE](LICENSE)). L'app include o usa i componenti
elencati qui sotto, ciascuno con la propria licenza: software, caratteri, suoni e fonti dei dati. Lo stesso elenco si
legge nell'app, nella finestra «Fonti e guida», sezione «Licenze».

Un test (`tests/docs/licenses.test.mjs`) controlla che questo file, l'elenco dell'app (`src/data/third-party.js`), le
licenze dei pacchetti in `node_modules` e l'elenco dei suoni dicano le stesse cose. Gli strumenti di sviluppo (Vite,
electron-builder, ecc.) non entrano nell'app e non sono elencati.

## Software e caratteri

### three

Licenza **MIT** · <https://threejs.org/>. Grafica 3D del visualizzatore, del laboratorio e del simulatore. Copyright ©
2010-2026 three.js authors.

### @dimforge/rapier3d-compat

Licenza **Apache-2.0** · <https://rapier.rs/>. Fisica del simulatore di laboratorio: collisioni, oggetti che cadono e si
urtano. Rapier è di Sébastien Crozet e dei collaboratori (Dimforge). Il testo della licenza:
<https://www.apache.org/licenses/LICENSE-2.0.txt>.

### @fontsource/ibm-plex-sans

Licenza **OFL-1.1** (SIL Open Font License, versione 1.1) · <https://github.com/IBM/plex>. Carattere dell'interfaccia
(IBM Plex Sans), incluso nell'app tramite il pacchetto Fontsource. Copyright 2019 IBM Corp. Il testo della licenza:
<https://openfontlicense.org/open-font-license-official-text/>.

### @fontsource/ibm-plex-mono

Licenza **OFL-1.1** (SIL Open Font License, versione 1.1) · <https://github.com/IBM/plex>. Carattere dei numeri e delle
formule (IBM Plex Mono), incluso nell'app tramite il pacchetto Fontsource. Copyright 2017 IBM Corp. Il testo della
licenza: <https://openfontlicense.org/open-font-license-official-text/>.

### electron

Licenza **MIT** · <https://www.electronjs.org/>. Finestra e motore dell'app desktop. Copyright (c) Electron
contributors; Copyright (c) 2013-2020 GitHub Inc. Electron include Chromium e altre librerie, ciascuna con la sua
licenza: l'elenco completo è nel file `LICENSES.chromium.html` della cartella dell'app installata.

### electron-updater

Licenza **MIT** · <https://www.electron.build/auto-update>. Aggiornamenti automatici dell'app desktop. Fa parte di
electron-builder. Copyright (c) 2015 Loopline Systems.

### Testo della licenza MIT

Vale per three, electron ed electron-updater, con i rispettivi avvisi di copyright riportati sopra.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Suoni

### Freesound

Licenza **CC0-1.0** (Creative Commons Zero, pubblico dominio) · <https://freesound.org/>. 21 suoni del simulatore, tutti
con licenza Creative Commons 0, controllata sulla pagina di ogni suono. La licenza CC0 non chiede di citare l'autore,
ma lo facciamo per riconoscenza. Il testo della licenza: <https://creativecommons.org/publicdomain/zero/1.0/>.

`scripts/sounds.mjs` scarica ogni registrazione, la taglia nel tratto usato, rende senza scatti quelle ad anello e la
salva in `src/game/audio/sfx/<nome>.ogg`.

| Nome | Id | Utente | Titolo |
| --- | --- | --- | --- |
| pour | [316686](https://freesound.org/people/Alex_hears_things/sounds/316686/) | Alex_hears_things | water pour into glass_near_nm.wav |
| fizz | [202094](https://freesound.org/people/spookymodem/sounds/202094/) | spookymodem | Acid Bubbling.wav |
| bubbles | [539823](https://freesound.org/people/ristooooo1/sounds/539823/) | ristooooo1 | Bubbles 001.wav |
| boil | [420228](https://freesound.org/people/14FPanska_Nemec_Petr/sounds/420228/) | 14FPanska_Nemec_Petr | 37 - 17 Boiling water.wav |
| bunsen | [244230](https://freesound.org/people/SyntaxSeed/sounds/244230/) | SyntaxSeed | Gas Torch Burn |
| ignite | [260554](https://freesound.org/people/LookIMadeAThing/sounds/260554/) | LookIMadeAThing | Basic Fire whoosh |
| fire | [181563](https://freesound.org/people/kingsrow/sounds/181563/) | kingsrow | Fire Crackling 01.wav |
| glass-break | [212698](https://freesound.org/people/dasebr/sounds/212698/) | dasebr | Breaking a glass bottle |
| glass-down | [466791](https://freesound.org/people/HogantheLogan/sounds/466791/) | HogantheLogan | Setting Down Glass On Table |
| clink | [416288](https://freesound.org/people/Fugeni/sounds/416288/) | Fugeni | Empty Beer Bottles Clinking, Clanking.wav |
| bell | [221515](https://freesound.org/people/AlaskaRobotics/sounds/221515/) | AlaskaRobotics | service bell ring |
| alarm | [319413](https://freesound.org/people/pushkin/sounds/319413/) | pushkin | Fire alarm |
| explosion | [315826](https://freesound.org/people/bevibeldesign/sounds/315826/) | bevibeldesign | small explosion |
| pop | [202230](https://freesound.org/people/deraj/sounds/202230/) | deraj | Pop sound |
| tap | [212177](https://freesound.org/people/OwlStorm/sounds/212177/) | OwlStorm | Tap Water 1 |
| hiss | [365071](https://freesound.org/people/sniperous/sounds/365071/) | sniperous | Steam.wav |
| extinguisher | [155516](https://freesound.org/people/Planet-Leader/sounds/155516/) | Planet-Leader | FireExtinguisher.wav |
| cap | [541063](https://freesound.org/people/cdh001/sounds/541063/) | cdh001 | unscrew cap.WAV |
| click | [253168](https://freesound.org/people/suntemple/sounds/253168/) | suntemple | SFX UI Button Click |
| ping | [220212](https://freesound.org/people/GameAudio/sounds/220212/) | GameAudio | Ping Bing |
| zap | [556717](https://freesound.org/people/NachtmahrTV/sounds/556717/) | NachtmahrTV | Electricity Sound |

## Fonti dei dati

I valori numerici delle schede, del laboratorio, della sandbox e del simulatore sono fatti scientifici tratti da
pubblicazioni e banche dati. Sono citati per riconoscimento e perché si possano controllare; il diritto d'autore sulle
opere originali (testi, tabelle, articoli) resta ai rispettivi titolari, e dove una fonte dichiara una licenza aperta
vale quella. Per questo la licenza indicata è **Published data**: dati pubblicati, citati con la fonte. Le tabelle di
origine usate da `npm run data` (PubChem, AME2020, X-ray Data Booklet) stanno in `data-sources/`, insieme ai dati
curati a mano.

### IUPAC/CIAAW

Licenza **Published data** · <https://ciaaw.org/>. Pesi atomici standard (valori abbreviati) e composizione isotopica
naturale.

### PubChem (NCBI)

Licenza **Published data** · <https://pubchem.ncbi.nlm.nih.gov/periodic-table/>. Tavola periodica di PubChem: punti di
fusione e di ebollizione, densità, elettronegatività, raggi di van der Waals.

### NIST Atomic Spectra Database

Licenza **Published data** · <https://www.nist.gov/pml/atomic-spectra-database>. Energie di prima ionizzazione e
configurazioni elettroniche.

### NUBASE2020

Licenza **Published data** · <https://amdc.in2p3.fr/web/nubase_en.html>. Emivite dei nuclidi.

### AME2020

Licenza **Published data** · <https://amdc.in2p3.fr/web/masseval.html>. Atomic Mass Evaluation: energie di legame dei
nuclei misurati.

### Cordero et al. (2008)

Licenza **Published data** · <https://doi.org/10.1039/B801115J>. Raggi covalenti (Cordero et al., Dalton Trans. 2008).

### CODATA 2022 (NIST)

Licenza **Published data** · <https://physics.nist.gov/cuu/Constants/>. Masse, cariche e momenti magnetici di protone,
neutrone ed elettrone.

### Particle Data Group 2024

Licenza **Published data** · <https://pdg.lbl.gov/>. Masse dei quark e vita media del neutrone libero.

### X-ray Data Booklet (LBNL)

Licenza **Published data** · <https://xdb.lbl.gov/>. Energie di legame degli elettroni interni, tabella 1-1 (Z =
1–92).

### NIST CCCBDB

Licenza **Published data** · <https://cccbdb.nist.gov/>. Geometrie e momenti dipolari sperimentali delle molecole del
laboratorio.

### NIST Chemistry WebBook

Licenza **Published data** · <https://webbook.nist.gov/chemistry/>. Entalpie di formazione standard ΔHf° (25 °C) per le
reazioni del laboratorio.

### CRC Handbook of Chemistry and Physics

Licenza **Published data** · <https://hbcp.chemnetbase.com/>. Geometrie, momenti dipolari ed entalpie di formazione;
energie di legame medie, anche dai testi di chimica generale (Housecroft & Sharpe, Inorganic Chemistry).

### Shannon (1976)

Licenza **Published data** · <https://doi.org/10.1107/S0567739476001551>. Raggi ionici (Shannon, Acta Cryst. A32, 1976).
