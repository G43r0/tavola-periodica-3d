// Rigenera i salvataggi di prova delle versioni passate in tests/fixtures/salvataggi/ con il codice vero di quelle
// versioni: per ogni tag estrae `src/` con `git archive` in una cartella temporanea e gioca una piccola partita con le
// sue funzioni pure (migrate, recordResult, recordChallenge, buy, addProfile, recordReaction…), come faceva la sua vista.
// Il risultato è il testo che la vista scriveva in localStorage (`tp3d.game`) e, nell'app desktop dalla 0.9.0, nel file
// simulatore-salvataggio.json.
//
//   node scripts/make-save-fixtures.mjs
//
// La 0.8.0 non aveva save.js: il suo oggetto si scrive qui com'era scritto in src/game/game-view.js di allora (vedi
// LEGGIMI.md accanto ai file). I file vanno rigenerati solo se cambia la partita qui sotto: le versioni vecchie non
// cambiano più.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'tests', 'fixtures', 'salvataggi');
const iso = (t) => new Date(t).toISOString();
const write = (name, data) => {
  fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(data)}\n`);
  console.log(`scritto ${name}`);
};

/** `src/` del tag in una cartella temporanea. */
function checkout(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `tp3d-${tag}-`));
  const tar = execFileSync('git', ['archive', '--format=tar', tag, 'src'], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  return dir;
}

// ---------------------------------------------------------------- 0.8.0
// src/game/game-view.js della 0.8.0: { career: { index, money, stars[] }, chemMode, legend } in localStorage. index è
// la prossima consegna (le cinque di orders.js), stars[i] le stelle della consegna i; chemMode e legend si scrivevano
// solo dopo averli cambiati nel menu.
write('0.8.0.json', { career: { index: 3, money: 145.5, stars: [3, 2, 3] }, chemMode: 'simple', legend: false });

// ---------------------------------------------------------------- 0.9.x
const TAGS = [
  ['v0.9.0', Date.UTC(2026, 9, 27, 15)],
  ['v0.9.1', Date.UTC(2026, 9, 29, 18)],
  ['v0.9.2', Date.UTC(2026, 9, 30, 17)],
];

for (const [tag, T0] of TAGS) {
  const dir = checkout(tag);
  try {
    const mod = (p) => import(pathToFileURL(path.join(dir, 'src', 'game', p)).href);
    const S = await mod('save.js');
    const C = await mod('career.js');
    const N = await mod('notebook.js');
    const name = (n) => `Studente ${n}`;
    const min = (m) => iso(T0 + m * 60_000);

    // primo avvio e impostazioni cambiate dal menu (come i pulsanti di game-view.js: save.settings = {...})
    let save = S.migrate(null, min(0), name);
    save = {
      ...save,
      settings: { ...save.settings, chemMode: 'simple', fov: 72, volume: 0.6, muted: false, shake: false },
    };
    save = S.renameProfile(save, save.active, 'Giulia');
    const giulia = save.active;

    // Giulia: il tutorial (capitolo 0), la prima esercitazione del capitolo 1 rifatta senza incidenti, una sfida a tempo,
    // gli occhiali dal negozio e una verifica (se la versione le ha)
    let c = S.activeProfile(save).career;
    for (const ex of C.chapterExercises(0))
      c = C.recordResult(c, ex.id, { stars: 3, report: 2, money: c.money + 12.5 });
    const [first] = C.chapterExercises(1);
    c = C.recordResult(c, first.id, { stars: 2, report: 1, money: c.money + 8, incidents: 1 });
    c = C.recordResult(c, first.id, { stars: 4, report: 3, money: c.money + 20.25, incidents: 0 });
    const exam = C.EXERCISES.find((e) => e.exam);
    if (exam) c = C.recordResult(c, exam.id, { stars: 3, report: 2, money: c.money + 30, incidents: 0, quality: 0.81 });
    if (C.recordChallenge && C.CHALLENGES?.length)
      c = C.recordChallenge(c, C.CHALLENGES[0].id, { medal: 2, elapsed: 95.4 });
    c = C.buy(c, 'goggles') ?? c;
    save = S.updateActive(save, { career: c });

    // il suo quaderno: tre reazioni scoperte, una vista due volte
    const nb = N.emptyNotebook();
    N.recordReaction(nb, 'nacl', { mode: 'career', aq: true, tags: ['heat'], now: T0 + 5 * 60_000 });
    N.recordReaction(nb, 'hcl', { mode: 'free', aq: false, tags: ['gas'], now: T0 + 9 * 60_000 });
    N.recordReaction(nb, 'acqua', { mode: 'free', now: T0 + 12 * 60_000 });
    N.recordReaction(nb, 'nacl', { mode: 'free', aq: true, now: T0 + 14 * 60_000 });
    save = S.updateActive(save, { notebook: nb });

    // Marco, un secondo profilo con il tutorial a metà; poi si torna a Giulia
    save = S.addProfile(save, 'Marco', min(30));
    let m = S.activeProfile(save).career;
    const [carry] = C.chapterExercises(0);
    m = C.recordResult(m, carry.id, { stars: 1, report: 0, money: 2, incidents: 2 });
    save = S.updateActive(save, { career: m, notebook: N.emptyNotebook() });
    save = S.selectProfile(save, giulia);

    write(`${tag.slice(1)}.json`, { ...save, savedAt: min(45) });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
