import { initTodayView } from './views/today.js?v20261015a';
import { initScanView } from './views/scan.js?v20261015d';
import { initHistoryView } from './views/history.js?v20261014e';
import { initSettingsView } from './views/settings.js?v20261015a';
import { initMascotAnims } from './mascot.js?v20261013g';

const routes = {
  '/': initTodayView,
  '/scan': initScanView,
  '/history': initHistoryView,
  '/settings': initSettingsView
};

function getPath() {
  // Strip any query string (e.g. "#/?d=2026-10-06") so route lookup still works.
  return (window.location.hash.slice(1) || '/').split('?')[0];
}

// Every navigation gets a monotonically increasing id, stored on the content
// container. Async views read it before and after their network calls and
// bail if it changed, so a slow request from a page you already left can never
// render over (or blow up) the page you are on now.
let navSeq = 0;
let activeTabIndex = 0;
let navAnimationFrame;

const TAB_ROUTES = ['#/', '#/scan', '#/history'];

function drawNavShape(index, progress) {
  const nav = document.getElementById('nav');
  const bar = nav?.querySelector('.bar');
  if (!nav || !bar) return;

  const width = nav.offsetWidth;
  if (width === 0) return;
  const center = (index + .5) / 3 * width;
  const radius = Math.max(32 * progress, .5);
  const shoulder = Math.max(12 * progress, .5);
  const distance = Math.sqrt((radius + shoulder) ** 2 - shoulder ** 2);
  const tangentX = radius * distance / (radius + shoulder);
  const tangentY = radius * shoulder / (radius + shoulder);
  const height = 70;

  // Full-bleed bar: flush with the bottom, left and right edges of the screen
  // (square corners) so no page background can show around it. Only the curved
  // notch that follows the active icon is drawn.
  bar.style.clipPath = `path('M0 0L${center - distance} 0A${shoulder} ${shoulder} 0 0 1 ${center - tangentX} ${tangentY}A${radius} ${radius} 0 0 0 ${center + tangentX} ${tangentY}A${shoulder} ${shoulder} 0 0 1 ${center + distance} 0L${width} 0L${width} ${height}L0 ${height}Z')`;
}

function setActiveTab(index) {
  const nav = document.getElementById('nav');
  if (!nav) return;

  activeTabIndex = index;
  nav.style.setProperty('--x', `${((index + .5) / 3) * 100}%`);
  nav.querySelectorAll('.tab').forEach((tab, tabIndex) => {
    if (tabIndex === index) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  nav.querySelectorAll('.bubble svg').forEach((icon, iconIndex) => {
    icon.classList.toggle('on', iconIndex === index);
  });
  drawNavShape(index, 1);
}

function animateNavShape(index) {
  cancelAnimationFrame(navAnimationFrame);
  const start = performance.now();
  const duration = 420;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step(now) {
    const progress = reduceMotion ? 1 : Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    drawNavShape(index, progress < 1 ? eased + Math.sin(progress * Math.PI) * .06 : 1);
    if (progress < 1) navAnimationFrame = requestAnimationFrame(step);
  }

  step(start);
}

function initBottomNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  nav.querySelectorAll('.tab').forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const bubble = nav.querySelector('.bubble');
      nav.style.setProperty('--x', `${((index + .5) / 3) * 100}%`);
      activeTabIndex = index;
      nav.querySelectorAll('.tab').forEach((item, itemIndex) => {
        if (itemIndex === index) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });
      nav.querySelectorAll('.bubble svg').forEach((icon, iconIndex) => {
        icon.classList.toggle('on', iconIndex === index);
      });
      bubble?.classList.remove('pop');
      if (bubble) {
        void bubble.offsetWidth;
        bubble.classList.add('pop');
      }
      animateNavShape(index);
      nav.dispatchEvent(new CustomEvent('tabchange', { detail: index }));
      const route = TAB_ROUTES[index];
      if (window.location.hash !== route) {
        window.history.pushState(null, '', route);
        router();
      }
    });
  });

  window.addEventListener('resize', () => drawNavShape(activeTabIndex, 1));
  setActiveTab(activeTabIndex);
}

async function router() {
  const path = getPath();
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  const navId = String(++navSeq);
  mainContent.dataset.navId = navId;
  mainContent.innerHTML = '';

  // Hide bottom nav on settings page
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = (path === '/settings') ? 'none' : '';
  }

  const tabIndex = { '/': 0, '/scan': 1, '/history': 2 }[path];
  if (tabIndex !== undefined) setActiveTab(tabIndex);

  const renderFn = routes[path] || initTodayView;
  try {
    await renderFn(mainContent);
  } catch (err) {
    console.error('Gagal memuat halaman:', err);
  }

  // A newer navigation may have started while this one was loading; if so,
  // leave the newest view alone.
  if (mainContent.dataset.navId !== navId) return;
  initMascotAnims(mainContent);
}

// Splash / layar pembuka (desain Stitch "FoodThings - Splash Screen"): sudah ada
// di HTML sehingga tampil seketika saat aplikasi dibuka. Ia murni layar pembuka
// (bukan gerbang), jadi otomatis masuk ke aplikasi dalam sekejap dan juga bisa
// diketuk di mana saja untuk melompat langsung ke aplikasi.
function initSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const MIN_VISIBLE_MS = 2400; // beri waktu animasi Limo dan splash tampil
  const MAX_VISIBLE_MS = 5200; // jaring pengaman bila aset lambat/gagal

  let closed = false;
  const dismiss = () => {
    if (closed) return;
    closed = true;
    splash.style.opacity = '0';
    setTimeout(() => { if (splash.parentNode) splash.remove(); }, 300);
  };

  let minDone = false;
  const limoImage = document.getElementById('splash-limo');
  let limoReady = !limoImage || (limoImage.complete && limoImage.naturalWidth > 0);
  const maybeGo = () => { if (minDone && limoReady) dismiss(); };

  if (limoImage && !limoReady) {
    const stillSrc = 'assets/mascot/limo-melambai-splash-rest.webp';
    const handleLoad = () => {
      limoReady = true;
      maybeGo();
    };
    const handleError = () => {
      if (limoImage.dataset.fallbackApplied) {
        console.warn('Gambar fallback splash Limo gagal dimuat.');
        limoReady = true;
        maybeGo();
        return;
      }
      console.warn('Animasi splash Limo gagal dimuat; memakai gambar statis.');
      limoImage.dataset.fallbackApplied = 'true';
      limoImage.src = stillSrc;
    };

    limoImage.addEventListener('load', handleLoad, { once: true });
    limoImage.addEventListener('error', handleError);
    if (limoImage.complete) {
      if (limoImage.naturalWidth > 0) handleLoad();
      else handleError();
    }
  } else if (limoImage) {
    limoReady = true;
  }

  // Masuk ke aplikasi setelah waktu minimum terlewati DAN Limo sudah tampil.
  setTimeout(() => { minDone = true; maybeGo(); }, MIN_VISIBLE_MS);
  // Jaring pengaman: jangan pernah menahan aplikasi terlalu lama.
  setTimeout(dismiss, MAX_VISIBLE_MS);

  // Ketuk di mana saja untuk langsung masuk tanpa menunggu.
  splash.addEventListener('click', dismiss);
}

window.addEventListener('hashchange', router);
window.addEventListener('popstate', router);

// iOS kadang menampilkan kembali halaman dari snapshot (back/forward cache);
// jika snapshot itu dibuat saat splash masih ada, splash bisa "hidup lagi" —
// buang semuanya agar tidak pernah kembali ke layar awal.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    const s = document.getElementById('splash');
    if (s) s.remove();
  }
});

// Boot once, whether the module ran before or after DOMContentLoaded.
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  initSplash();
  initBottomNav();
  router();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
