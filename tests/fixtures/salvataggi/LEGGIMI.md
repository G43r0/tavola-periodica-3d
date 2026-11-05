# Salvataggi di prova delle versioni passate

Un salvataggio del simulatore per ogni versione pubblicata dalla 0.8.0, come la versione lo scriveva in `localStorage`
(chiave `tp3d.game`) e, dalla 0.9.0, nel file `simulatore-salvataggio.json` dell'app desktop. La 1.0 e tutte le 1.x
devono aprirli (`tests/game/save-compat.test.mjs`). Il formato è descritto in [docs/salvataggi.md](../../../docs/salvataggi.md).

| File | Formato | Come è stato fatto |
|---|---|---|
| `0.8.0.json` | 1, senza `version` | l'oggetto che scriveva `src/game/game-view.js` della 0.8.0 (`loadSave`/`storeSave`): `career: { index, money, stars[] }` e le impostazioni cambiate dal menu; la 0.8.0 non aveva un modulo dei salvataggi da far girare |
| `0.9.0.json`, `0.9.1.json`, `0.9.2.json` | 2 | `scripts/make-save-fixtures.mjs`: il codice del tag (`git archive`) gioca una piccola partita con le sue funzioni pure, come la sua vista |

La partita: Giulia cambia le impostazioni (chimica semplificata, campo visivo 72°, volume 0,6, scossa spenta), fa il
tutorial, rifà senza incidenti la prima esercitazione del capitolo 1, fa una verifica e una sfida a tempo, compra gli
occhiali e scopre tre reazioni (una due volte); Marco fa male il primo compito del tutorial; si torna a Giulia.

I file non si toccano a mano. Se serve rigenerarli: `node scripts/make-save-fixtures.mjs` (serve la cronologia git con
i tag).
