// Logica pura degli aggiornamenti (nessuna dipendenza da Electron, così si prova con npm test).
const REPO = { owner: 'G43r0', repo: 'tavola-periodica-3d' };
const RELEASES_URL = `https://github.com/${REPO.owner}/${REPO.repo}/releases`;
const LATEST_API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/releases/latest`;

/** «v1.2.3» o «1.2.3-beta.1» → { nums: [1, 2, 3], pre: 'beta.1' | null }; null se non è una versione. */
function parseVersion(text) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(String(text ?? '').trim());
  return m ? { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null } : null;
}

/** Confronto semantico: −1, 0, 1. Una versione di prova (1.0.0-rc.1) viene prima della finale (1.0.0). */
function compareVersions(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  if (!x || !y) return 0;
  for (let i = 0; i < 3; i++) if (x.nums[i] !== y.nums[i]) return x.nums[i] < y.nums[i] ? -1 : 1;
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  return x.pre.localeCompare(y.pre, 'en', { numeric: true }) < 0 ? -1 : 1;
}

const isNewer = (candidate, current) => compareVersions(candidate, current) > 0;

/** Dalla risposta di GitHub (`releases/latest`) la versione e la pagina da aprire, o null se non vale la pena. */
function latestFromRelease(json, current) {
  if (!json || typeof json !== 'object' || json.draft || json.prerelease) return null;
  const version = parseVersion(json.tag_name) ? String(json.tag_name).replace(/^v/, '') : null;
  if (!version || !isNewer(version, current)) return null;
  // si apre solo una pagina del nostro repository, qualunque cosa risponda la rete
  const url = typeof json.html_url === 'string' && json.html_url.startsWith(`${RELEASES_URL}/`) ? json.html_url : RELEASES_URL;
  return { version, url };
}

/** Impostazioni lette dal file (testo JSON): solo i campi noti, con i valori predefiniti se manca o è rotto. */
function parseSettings(text) {
  let raw = {};
  try {
    raw = JSON.parse(text);
  } catch {
    /* file assente o rovinato: valori predefiniti */
  }
  return { autoUpdate: raw && typeof raw === 'object' && raw.autoUpdate === false ? false : true };
}

module.exports = { REPO, RELEASES_URL, LATEST_API, parseVersion, compareVersions, isNewer, latestFromRelease, parseSettings };
