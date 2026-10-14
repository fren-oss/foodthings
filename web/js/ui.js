// Small on-brand UI helpers: toast notifications and a confirm dialog.
//
// Appended to <body> (not the view container) so they keep showing even when
// the router re-renders the current screen right after an action.

let toastRoot = null;

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureToastRoot() {
  if (toastRoot && document.body.contains(toastRoot)) return toastRoot;
  toastRoot = document.createElement('div');
  toastRoot.id = 'ft-toast-root';
  toastRoot.className = 'fixed inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none';
  // Sit just above the bottom navigation bar (and iOS home indicator).
  toastRoot.style.bottom = 'calc(70px + env(safe-area-inset-bottom))';
  document.body.appendChild(toastRoot);
  return toastRoot;
}

const TOAST_STYLE = {
  success: { icon: 'check_circle', color: '#b4f657' },
  error: { icon: 'error', color: '#ffdad6' },
  info: { icon: 'info', color: '#f0f2e7' },
};

/**
 * Show a short auto-dismissing message.
 * @param {string} message
 * @param {{type?: 'success'|'error'|'info', duration?: number}} [opts]
 */
export function showToast(message, opts = {}) {
  const type = TOAST_STYLE[opts.type] ? opts.type : 'info';
  const conf = TOAST_STYLE[type];
  const duration = typeof opts.duration === 'number' ? opts.duration : 2600;
  const root = ensureToastRoot();

  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'max-w-[360px] flex items-center gap-2.5 rounded-full bg-inverse-surface text-inverse-on-surface pl-3.5 pr-4 py-2.5 shadow-lg';
  el.style.opacity = '0';
  el.style.transform = 'translateY(10px)';
  el.style.transition = 'opacity 200ms ease, transform 200ms ease';
  el.innerHTML = `
    <span class="material-symbols-outlined text-[20px] shrink-0" style="color:${conf.color};font-variation-settings:'FILL' 1;">${conf.icon}</span>
    <span class="font-label-lg text-label-lg leading-snug">${escapeHtml(message)}</span>
  `;
  root.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    window.setTimeout(() => el.remove(), 220);
  }, duration);
}

/**
 * On-brand confirm dialog (replaces window.confirm).
 * @param {{title?: string, message?: string, confirmLabel?: string, cancelLabel?: string, destructive?: boolean}} [opts]
 * @returns {Promise<boolean>}
 */
export function showConfirm(opts = {}) {
  return new Promise((resolve) => {
    const title = opts.title || 'Konfirmasi';
    const message = opts.message || '';
    const confirmLabel = opts.confirmLabel || 'Ya';
    const cancelLabel = opts.cancelLabel || 'Batal';
    const confirmBtnClass = opts.destructive
      ? 'bg-destructive text-white'
      : 'bg-primary-container text-on-primary';

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[190] flex items-center justify-center p-6 bg-black/40';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 160ms ease';
    overlay.innerHTML = `
      <div class="w-full max-w-[330px] bg-card rounded-[24px] border border-border p-5 shadow-2xl"
        style="transform:translateY(8px);opacity:0;transition:opacity 160ms ease, transform 160ms ease;">
        <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">${escapeHtml(title)}</h2>
        ${message ? `<p class="font-body-md text-body-md text-muted-foreground mt-1.5 leading-snug">${escapeHtml(message)}</p>` : ''}
        <div class="flex gap-2 mt-5">
          <button type="button" data-act="cancel"
            class="flex-1 h-12 rounded-full bg-background border border-border text-on-surface font-label-lg text-label-lg font-semibold active:scale-[0.98] transition-transform">${escapeHtml(cancelLabel)}</button>
          <button type="button" data-act="confirm"
            class="flex-1 h-12 rounded-full ${confirmBtnClass} font-label-lg text-label-lg font-bold active:scale-[0.98] transition-transform">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;

    const card = overlay.firstElementChild;
    document.body.appendChild(overlay);

    let settled = false;
    const onKey = (ev) => { if (ev.key === 'Escape') close(false); };
    const close = (result) => {
      if (settled) return;
      settled = true;
      overlay.style.opacity = '0';
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      document.removeEventListener('keydown', onKey);
      window.setTimeout(() => overlay.remove(), 180);
      resolve(result);
    };

    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => close(false));
    overlay.querySelector('[data-act="confirm"]').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) close(false); });
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
    window.setTimeout(() => {
      const btn = overlay.querySelector('[data-act="confirm"]');
      if (btn) btn.focus();
    }, 60);
  });
}
