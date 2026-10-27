// Scarica da Freesound i suoni di src/game/audio/sound-list.js, controlla che la licenza sia Creative Commons 0
// e li prepara per il gioco con ffmpeg: mono a 44,1 kHz, tagliati, picco a -1 dB, Ogg Vorbis.
// I suoni ad anello hanno gli ultimi 0,4 s sfumati sui primi, così ripetendosi non fanno scatti.
// Uso: node scripts/sounds.mjs   (servono ffmpeg nel PATH e la rete; gli originali restano in data-sources/sounds-raw)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SOUNDS, soundPage } from '../src/game/audio/sound-list.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data-sources', 'sounds-raw');
const OUT = path.join(ROOT, 'src', 'game', 'audio', 'sfx');
const XF = 0.4;
const UA = { 'User-Agent': 'Mozilla/5.0 (Tavola Periodica 3D)' };

fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ffmpeg = (args) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'pipe' });

async function download(s) {
  const file = path.join(RAW, `${s.name}.mp3`);
  if (fs.existsSync(file)) return file;
  const page = await (await fetch(soundPage(s), { headers: UA })).text();
  const license = (page.match(/full license text" href="([^"]+)"/) || [])[1] || '';
  if (!license.includes('publicdomain/zero')) throw new Error(`${s.name}: licenza non CC0 (${license || 'non trovata'})`);
  const url = (page.match(new RegExp(`https://cdn\\.freesound\\.org/previews/\\d+/${s.id}_\\d+-hq\\.mp3`)) || [])[0];
  if (!url) throw new Error(`${s.name}: anteprima non trovata`);
  fs.writeFileSync(file, Buffer.from(await (await fetch(url, { headers: UA })).arrayBuffer()));
  await sleep(2000);
  return file;
}

// volumedetect scrive il risultato su stderr
function maxVolume(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = r.stderr.match(/max_volume: (-?[\d.]+) dB/);
  return m ? Number(m[1]) : 0;
}

for (const s of SOUNDS) {
  const raw = await download(s);
  const tmp = path.join(RAW, `${s.name}.wav`);
  const [a, b] = s.cut;
  if (s.loop) {
    const graph = [
      '[0]aformat=channel_layouts=mono,asplit=3[s1][s2][s3]',
      `[s1]atrim=${a}:${a + XF},asetpts=PTS-STARTPTS,afade=t=in:d=${XF}[h]`,
      `[s2]atrim=${a + XF}:${b},asetpts=PTS-STARTPTS[m]`,
      `[s3]atrim=${b}:${b + XF},asetpts=PTS-STARTPTS,afade=t=out:d=${XF}[t]`,
      '[h][t]amix=inputs=2:normalize=0[x]',
      '[m][x]concat=n=2:v=0:a=1,aresample=44100',
    ].join(';');
    ffmpeg(['-i', raw, '-filter_complex', graph, tmp]);
  } else {
    const d = b - a;
    ffmpeg(['-i', raw, '-af', `aformat=channel_layouts=mono,atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.005,afade=t=out:st=${(d - 0.05).toFixed(3)}:d=0.05,aresample=44100`, tmp]);
  }
  const gain = -1 - maxVolume(tmp);
  const out = path.join(OUT, `${s.name}.ogg`);
  ffmpeg(['-i', tmp, '-af', `volume=${gain.toFixed(2)}dB`, '-c:a', 'libvorbis', '-q:a', '4', out]);
  fs.rmSync(tmp);
  console.log(`${s.name.padEnd(13)} ${(fs.statSync(out).size / 1024).toFixed(0).padStart(4)} kB  ${soundPage(s)}`);
}
