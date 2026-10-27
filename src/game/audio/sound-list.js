// Suoni del simulatore: tutti da Freesound (freesound.org) con licenza Creative Commons 0 (pubblico dominio),
// controllata sulla pagina di ogni suono. `scripts/sounds.mjs` li scarica, li taglia nel tratto [da, a] (in secondi),
// rende senza scatti quelli ad anello e li salva in `src/game/audio/sfx/<nome>.ogg`.
// `gain` è il volume di partenza nel gioco (0–1), `loop` dice se il suono si ripete finché dura la sua causa.

export const SOUNDS = [
  { name: 'pour', id: 316686, user: 'Alex_hears_things', title: 'water pour into glass_near_nm.wav', cut: [1.02, 10.4], loop: true, gain: 0.55 },
  { name: 'fizz', id: 202094, user: 'spookymodem', title: 'Acid Bubbling.wav', cut: [0, 1.7], loop: true, gain: 0.5 },
  { name: 'bubbles', id: 539823, user: 'ristooooo1', title: 'Bubbles 001.wav', cut: [0, 3.8], loop: true, gain: 0.45 },
  { name: 'boil', id: 420228, user: '14FPanska_Nemec_Petr', title: '37 - 17 Boiling water.wav', cut: [4, 14], loop: true, gain: 0.45 },
  { name: 'bunsen', id: 244230, user: 'SyntaxSeed', title: 'Gas Torch Burn', cut: [2, 11], loop: true, gain: 0.22 },
  { name: 'ignite', id: 260554, user: 'LookIMadeAThing', title: 'Basic Fire whoosh', cut: [0, 2.2], loop: false, gain: 0.5 },
  { name: 'fire', id: 181563, user: 'kingsrow', title: 'Fire Crackling 01.wav', cut: [0, 12], loop: true, gain: 0.6 },
  { name: 'glass-break', id: 212698, user: 'dasebr', title: 'Breaking a glass bottle', cut: [0.42, 1.6], loop: false, gain: 0.7 },
  { name: 'glass-down', id: 466791, user: 'HogantheLogan', title: 'Setting Down Glass On Table', cut: [0.86, 1.5], loop: false, gain: 0.45 },
  { name: 'clink', id: 416288, user: 'Fugeni', title: 'Empty Beer Bottles Clinking, Clanking.wav', cut: [0, 0.74], loop: false, gain: 0.35 },
  { name: 'bell', id: 221515, user: 'AlaskaRobotics', title: 'service bell ring', cut: [0, 2.4], loop: false, gain: 0.55 },
  { name: 'alarm', id: 319413, user: 'pushkin', title: 'Fire alarm', cut: [2.814, 6.414], loop: true, gain: 0.3 },
  { name: 'explosion', id: 315826, user: 'bevibeldesign', title: 'small explosion', cut: [0, 0.95], loop: false, gain: 0.8 },
  { name: 'pop', id: 202230, user: 'deraj', title: 'Pop sound', cut: [0, 0.65], loop: false, gain: 0.7 },
  { name: 'tap', id: 212177, user: 'OwlStorm', title: 'Tap Water 1', cut: [1.45, 10.3], loop: true, gain: 0.4 },
  { name: 'hiss', id: 365071, user: 'sniperous', title: 'Steam.wav', cut: [0.5, 6.5], loop: true, gain: 0.3 },
  { name: 'extinguisher', id: 155516, user: 'Planet-Leader', title: 'FireExtinguisher.wav', cut: [0.2, 3.4], loop: true, gain: 0.5 },
  { name: 'cap', id: 541063, user: 'cdh001', title: 'unscrew cap.WAV', cut: [0.25, 1.35], loop: false, gain: 0.4 },
  { name: 'click', id: 253168, user: 'suntemple', title: 'SFX UI Button Click', cut: [0, 0.158], loop: false, gain: 0.5 },
  { name: 'ping', id: 220212, user: 'GameAudio', title: 'Ping Bing', cut: [0, 0.6], loop: false, gain: 0.4 },
  { name: 'zap', id: 556717, user: 'NachtmahrTV', title: 'Electricity Sound', cut: [0, 0.97], loop: false, gain: 0.35 },
];

export const soundPage = (s) => `https://freesound.org/people/${s.user}/sounds/${s.id}/`;
