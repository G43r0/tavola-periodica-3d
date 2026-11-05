# Salvataggi

Che cosa salva l'app, dove, in che formato e che cosa garantisce. Il codice è in `src/game/save.js` (formato e
migrazione), `electron/save-file.cjs` (il file dell'app desktop e le sue copie) e `src/game/profile-file.js` (il file di
profilo da portare su un altro computer).

## La promessa

La 1.0 e tutte le 1.x aprono ogni salvataggio scritto dalla 0.8.0 in poi, senza perdere profili, Carriera, quaderno e
impostazioni. Un file per ogni versione pubblicata è in `tests/fixtures/salvataggi/` e `npm test` li apre tutti
(`tests/game/save-compat.test.mjs`): una versione nuova che non li aprisse non passerebbe i controlli.

Un salvataggio rovinato (un file troncato, un valore cambiato a mano, un campo del tipo sbagliato) non blocca mai il
simulatore: si apre sempre un salvataggio valido, tenendo tutto quello che si legge. Lo prova
`tests/game/save-fuzz.test.mjs` con migliaia di salvataggi rovinati a caso.

Una versione più vecchia apre un salvataggio di una più nuova, ma i campi che non conosce non si conservano quando lo
riscrive (il quaderno di una versione più nuova, invece, resta com'è).

## Dove

| | Dove | Copie |
|---|---|---|
| Versione web | `localStorage` del browser, chiave `tp3d.game` | nessuna: si usa «Esporta» |
| App desktop | `simulatore-salvataggio.json` nella cartella dei dati dell'utente (su Windows `%APPDATA%\Tavola Periodica 3D`), e anche `localStorage` | `.1`, `.2`, `.3` accanto al file |
| App su chiavetta | la cartella `dati` accanto all'eseguibile (vedi il README, «Su una chiavetta») | come l'app desktop |

Nell'app desktop vince il più recente tra il file e `localStorage` (campo `savedAt`).

Le copie dell'app desktop: la `.1` è sempre il salvataggio precedente; la `.2` si rinfresca con la `.1` quando ha almeno
10 minuti, e la `.2` di prima passa alla `.3`. Se il file non si legge si usa la prima copia valida tra `.1`, `.2`, `.3`
e il `.bak` delle 0.9.x. Un file rotto sul disco non scaccia le copie buone.

Gli altri dati restano dove erano, in `localStorage`: la lingua (`tp3d.lang`), il preset grafico (`tp3d.gfx`), il banco
del laboratorio e la scena della sandbox. Passeranno in un salvataggio con la versione insieme alla finestra
«Impostazioni» (fase R3 del piano 1.0).

## Formato 2 (dalla 0.9.0)

Un oggetto JSON:

```json
{
  "version": 2,
  "savedAt": "2026-11-05T10:30:00.000Z",
  "settings": { "chemMode": "real", "legend": true, "fov": 72, "volume": 0.8, "muted": false, "shake": true },
  "active": "p1",
  "profiles": [{ "id": "p1", "name": "Giulia", "created": "2026-10-27T15:00:00.000Z", "career": {}, "notebook": null }]
}
```

| Campo | Tipo | Note |
|---|---|---|
| `version` | `2` | |
| `savedAt` | testo ISO 8601 | quando è stato scritto; facoltativo |
| `settings.chemMode` | `"real"` o `"simple"` | chimica realistica o semplificata |
| `settings.legend` | sì/no | legenda dei comandi |
| `settings.fov` | numero | campo visivo in gradi; facoltativo |
| `settings.volume` | numero da 0 a 1 | dalla 0.9.0 (G8) |
| `settings.muted` | sì/no | dalla 0.9.0 (G8) |
| `settings.shake` | sì/no | scossa della camera; chi non l'ha mai scelta la ha spenta se il sistema chiede di ridurre il movimento |
| `active` | testo | l'`id` del profilo attivo |
| `profiles` | da 1 a 8 profili | |
| `profiles[].id` | testo | unico (`p1`, `p2`…) |
| `profiles[].name` | testo | al massimo 24 caratteri, senza caratteri di controllo |
| `profiles[].created` | testo ISO 8601 | |
| `profiles[].career` | oggetto | vedi sotto |
| `profiles[].notebook` | oggetto o `null` | il quaderno, vedi sotto |

La Carriera (`career`):

| Campo | Tipo | Note |
|---|---|---|
| `results` | `{ [esercitazione]: risultato }` | il migliore per ogni esercitazione |
| `results[].stars` | da 0 a 5 | |
| `results[].report` | numero ≥ 0 | risposte giuste della relazione |
| `results[].tries` | numero ≥ 0 | tentativi |
| `results[].mark` | da 4 a 10 | voto di una verifica; facoltativo |
| `results[].incidents` | intero > 0 | incidenti del tentativo più pulito (dalla 1.0); facoltativo |
| `results[].migrated` | `true` | tutorial dato per fatto a chi veniva dalla 0.8; facoltativo |
| `challenges` | `{ [sfida]: { medal: 0–3, best: secondi o null, tries } }` | sfide a tempo |
| `money` | numero | soldi |
| `incidents` | numero ≥ 0 | incidenti di tutto l'anno (solo statistica) |
| `owned` | lista di testi | acquisti del negozio |
| `last` | testo o `null` | l'ultima esercitazione fatta |

Il quaderno (`notebook`): `{ "v": 1, "rx": { [reazione]: { "first": ms, "count": n ≥ 1, "mode": "career" o "free",
"aq": sì/no, "tags": [testi] } } }`.

Le chiavi `__proto__`, `constructor` e `prototype` dentro `results`, `challenges` e `rx` si scartano.

## Formato 1 (0.8.0)

`{ "career": { "index": n, "money": n, "stars": [n, …] }, "chemMode": …, "legend": …, "fov": … }`, senza `version`:
`stars[i]` sono le stelle delle cinque consegne di allora (`nacl`, `titration`, `goldrain`, `crystals`, `flame`).
Diventa un profilo con quei risultati; a chi aveva cominciato la Carriera il tutorial risulta superato.

## File di profilo

«Esporta» nella schermata dei profili del simulatore scrive un profilo in un file
`tp3d-profilo-<nome>-<data>.json`, per portarlo a casa o su un altro computer (nella versione web è l'unica copia di
sicurezza):

```json
{
  "format": "tp3d-profilo",
  "version": 1,
  "app": "0.9.2",
  "exported": "2026-11-05T10:30:00.000Z",
  "settings": { "chemMode": "real", "legend": true, "fov": 72, "volume": 0.8, "muted": false, "shake": true },
  "profile": { "id": "p1", "name": "Giulia", "created": "…", "career": {}, "notebook": null },
  "check": "crc32:1a2b3c4d"
}
```

`check` è il CRC-32 del file senza `check`, scritto in JSON con le chiavi in ordine alfabetico: scopre un file troncato o
modificato (non protegge da chi lo falsifica di proposito). «Importa» rifiuta un file che non è JSON, che non è un
profilo, che viene da un'app più nuova, con il controllo sbagliato o più grande di 2 MB. Il profilo importato passa da
`migrate()` come ogni salvataggio. Se è lo stesso profilo (stesso `id` e stessa data di creazione) sostituisce quello
che c'è, dopo una conferma; altrimenti si aggiunge (al massimo 8 profili).
