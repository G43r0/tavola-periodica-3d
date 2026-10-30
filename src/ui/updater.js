// Aggiornamenti dell'app desktop: avviso quando la versione nuova è pronta (o, nella versione portabile, disponibile) e
// sezione «Aggiornamenti» della finestra Informazioni. Nel browser e in sviluppo non c'è nulla da fare.
import { createT } from '../i18n/index.js';
import { esc } from '../chem/format.js';
import { toast } from './toast.js';

const t = createT({
  it: {
    ready: 'La versione {v} è pronta.',
    install: 'Riavvia e aggiorna',
    later: 'Più tardi',
    available: 'È uscita la versione {v}.',
    download: 'Scarica',
    downloading: 'Scarico la versione {v}…',
    downloadingPct: 'Scarico la versione {v}… {p} %',
    title: 'Aggiornamenti',
    version: 'Versione installata: <b>{v}</b>',
    auto: 'Cerca gli aggiornamenti da solo',
    checkNow: 'Controlla ora',
    checking: 'Controllo…',
    upToDate: 'È già la versione più recente.',
    error: 'Non riesco a controllare gli aggiornamenti (serve Internet solo per questo).',
    portable: 'Questa è la versione portabile: non si aggiorna da sola, ma ti avviso quando ne esce una nuova.',
    off: 'Gli aggiornamenti funzionano nell\'app installata.',
    installReady: 'Installa la {v} e riavvia',
  },
  en: {
    ready: 'Version {v} is ready.',
    install: 'Restart and update',
    later: 'Later',
    available: 'Version {v} is out.',
    download: 'Download',
    downloading: 'Downloading version {v}…',
    downloadingPct: 'Downloading version {v}… {p}%',
    title: 'Updates',
    version: 'Installed version: <b>{v}</b>',
    auto: 'Check for updates automatically',
    checkNow: 'Check now',
    checking: 'Checking…',
    upToDate: 'You have the latest version.',
    error: 'Could not check for updates (the internet is needed only for this).',
    portable: 'This is the portable version: it cannot update itself, but it tells you when a new one is out.',
    off: 'Updates work in the installed app.',
    installReady: 'Install {v} and restart',
  },
});

const api = () => window.desktop?.updater ?? null;

let banner = null;
const closeBanner = () => {
  banner?.remove();
  banner = null;
};

function showBanner(text, actionLabel, onAction) {
  closeBanner();
  banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = `<span>${esc(text)}</span><button type="button" class="btn-primary" data-act="go">${esc(actionLabel)}</button><button type="button" class="btn-ghost" data-act="later">${esc(t('later'))}</button>`;
  banner.addEventListener('click', (ev) => {
    const act = ev.target.closest('[data-act]')?.dataset.act;
    if (act === 'go') onAction();
    if (act) closeBanner();
  });
  document.body.append(banner);
}

/** Si abbona agli avvisi del processo principale; da chiamare una volta all'avvio. */
export function initUpdater() {
  const u = api();
  if (!u) return;
  let announced = '';
  u.onStatus((s) => {
    const key = `${s.state}:${s.version ?? ''}`;
    if (s.state === 'ready' && announced !== key) showBanner(t('ready', { v: s.version }), t('install'), () => u.install());
    else if (s.state === 'available' && announced !== key) showBanner(t('available', { v: s.version }), t('download'), () => u.openRelease());
    else if (s.state === 'downloading' && announced !== key) toast(t('downloading', { v: s.version }));
    if (['ready', 'available', 'downloading'].includes(s.state)) announced = key;
  });
}

/** Sezione «Aggiornamenti» per la finestra Informazioni; restituisce null fuori dall'app desktop. */
export function createUpdateSection() {
  const u = api();
  if (!u) return null;
  const el = document.createElement('section');
  el.className = 'update-section';
  el.innerHTML = `
    <h3>${t('title')}</h3>
    <p class="update-section__version"></p>
    <label class="update-section__auto"><input type="checkbox" data-act="auto" /> ${esc(t('auto'))}</label>
    <div class="update-section__row">
      <button type="button" class="btn-ghost" data-act="check">${esc(t('checkNow'))}</button>
      <button type="button" class="btn-primary" data-act="act" hidden></button>
      <span class="update-section__msg" aria-live="polite"></span>
    </div>`;
  const $ = (sel) => el.querySelector(sel);
  const version = $('.update-section__version');
  const auto = $('[data-act="auto"]');
  const check = $('[data-act="check"]');
  const act = $('[data-act="act"]');
  const msg = $('.update-section__msg');
  let mode = 'off';

  const paint = (s) => {
    act.hidden = true;
    check.disabled = mode === 'off' || s.state === 'checking' || s.state === 'downloading';
    if (mode === 'off') msg.textContent = t('off');
    else if (s.state === 'checking') msg.textContent = t('checking');
    else if (s.state === 'downloading') msg.textContent = t(s.percent ? 'downloadingPct' : 'downloading', { v: s.version, p: s.percent });
    else if (s.state === 'error') msg.textContent = t('error');
    else if (s.state === 'none') msg.textContent = s.checkedAt ? t('upToDate') : mode === 'manual' ? t('portable') : '';
    else msg.textContent = '';
    if (s.state === 'ready') {
      act.hidden = false;
      act.textContent = t('installReady', { v: s.version });
      act.onclick = () => u.install();
    } else if (s.state === 'available') {
      msg.textContent = t('available', { v: s.version });
      act.hidden = false;
      act.textContent = t('download');
      act.onclick = () => u.openRelease();
    }
  };

  u.onStatus(paint);
  check.addEventListener('click', async () => paint(await u.check()));
  auto.addEventListener('change', () => u.setAuto(auto.checked));
  return {
    el,
    /** Rilegge lo stato ogni volta che la finestra si apre. */
    async refresh() {
      const info = await u.get();
      mode = info.mode;
      version.innerHTML = t('version', { v: esc(info.version) });
      auto.checked = info.autoUpdate;
      auto.disabled = mode === 'off';
      paint(info.status);
    },
  };
}
