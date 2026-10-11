// Notifiche brevi non bloccanti.

let host = null;

export function toast(message, { duration = 3200 } = {}) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  host.append(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => {
    t.classList.remove('is-in');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 600);
  }, duration);
}
