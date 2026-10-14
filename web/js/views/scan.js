import { resizeImage, makeThumbnail } from '../image.js?v20261012k';
import { fetchApi } from '../api.js?v20261012k';
import { mascotImg, LOADING_CAPTIONS, initMascotAnims } from '../mascot.js?v20261012k';
import { saveThumb } from '../thumbs.js?v20261012k';
import { Store } from '../store.js?v20261012k';
import { showToast } from '../ui.js?v20261015a';

const SAVE_BACKEND_VERSION = '2026-10-14e16';

// ----- Scan state machine -----
// State: 'init' | 'loading' | 'result' | 'error'

let currentState = 'init';
let base64Image = null;
let analyzeResult = null;
let selectedMealTime = 'makan-siang';
let selectedType = 'makanan';

const TYPE_HINTS = {
  makanan: 'Foto seluruh piringmu dari atas supaya semua makanan terlihat.',
  label: 'Foto tabel gizi pada kemasan sampai angkanya terbaca jelas.',
};
let filePreviewUrl = null;

function scanHeader(backId, title, { backLabel = 'Kembali', right = 'empty' } = {}) {
  const trailing = right === 'settings'
    ? `<button aria-label="Pengaturan" class="ft-ibtn lime" type="button" id="btn-scan-settings"><svg aria-hidden="true"><use href="#ft-icon-gear"></use></svg></button>`
    : right === 'processing'
      ? `<div class="ft-status"><span class="ft-status-dot"></span><span>Memproses</span></div>`
      : '<span class="ft-header-spacer" aria-hidden="true"></span>';
  return `
    <header class="app-header ft-hdr">
      <div class="ft-row${right === 'processing' ? ' ft-row-status' : ''}">
        <button aria-label="${backLabel}" class="ft-ibtn soft" id="${backId}" type="button">
          <svg aria-hidden="true"><use href="#ft-icon-close"></use></svg>
        </button>
        <h1 class="ft-title">${title}</h1>
        ${trailing}
      </div>
    </header>`;
}

// Auto-select meal time based on current hour
function defaultMealTime() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'sarapan';
  if (h >= 10 && h < 15) return 'makan-siang';
  if (h >= 15 && h < 21) return 'makan-malam';
  return 'camilan';
}

function formatNum(n) {
  return Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

function confidenceBadge(k) {
  if (k === 'tinggi') return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6F5C9] text-[#3A730E] text-[12px] font-label-md font-semibold"><span class="material-symbols-outlined text-[15px]">check_circle</span>Yakin tinggi</span>`;
  if (k === 'sedang') return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-soft text-warning text-[12px] font-label-md font-semibold"><span class="material-symbols-outlined text-[15px]">info</span>Yakin sedang</span>`;
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-soft text-warning text-[12px] font-label-md font-semibold"><span class="material-symbols-outlined text-[15px]">warning</span>Perlu dicek</span>`;
}

// ----- Item card helpers (shared by the result screen and manual entry) -----

function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function numVal(n) {
  const v = Number(n);
  return Number.isFinite(v) ? String(v) : '0';
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

let manualSeq = 0;

function itemCardHtml(it, idx) {
  const per = it._per_gram || { kalori: 0, protein_g: 0, karbo_g: 0, lemak_g: 0 };
  const badge = it._manual
    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-muted-foreground text-[12px] font-label-md font-semibold"><span class="material-symbols-outlined text-[15px]">edit_note</span>Manual</span>`
    : confidenceBadge(it.keyakinan);
  return `
    <article class="bg-card rounded-[20px] border border-border p-4 shadow-none" data-idx="${idx}"
      data-manual="${it._manual ? '1' : '0'}"
      data-base-weight="${it.berat_g}"
      data-per-gram-kal="${per.kalori}"
      data-per-gram-prot="${per.protein_g}"
      data-per-gram-karbo="${per.karbo_g}"
      data-per-gram-lemak="${per.lemak_g}">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          <input class="item-name w-full min-w-0 bg-transparent border-0 p-0 text-body-lg font-bold text-on-surface focus:outline-none focus:ring-0" type="text" maxlength="100" placeholder="Nama makanan" aria-label="Nama makanan" value="${escapeAttr(it.nama)}" />
          <span class="material-symbols-outlined text-[18px] text-muted-foreground shrink-0" aria-hidden="true">edit</span>
        </div>
        ${badge}
      </div>
      <div class="mt-3.5 flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-1">
          <input class="item-cal-input w-16 bg-transparent border-0 p-0 text-headline-md font-headline-md font-bold text-on-surface tabular-nums focus:outline-none focus:ring-0" type="number" inputmode="numeric" min="0" max="5000" aria-label="Kalori" value="${Math.round(Number(it.kalori) || 0)}" />
          <span class="text-label-md font-label-md text-muted-foreground">kkal</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="flex items-center bg-background rounded-full p-1 border border-border">
            <button aria-label="Kurangi porsi" class="btn-minus w-8 h-8 rounded-full bg-card hover:bg-surface-container active:scale-90 transition-transform flex items-center justify-center text-on-surface border border-border/80" type="button">
              <span class="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <div class="flex items-center px-2">
              <input class="w-11 text-center bg-transparent border-0 p-0 text-label-lg font-label-lg font-bold text-on-surface tabular-nums focus:ring-0 item-weight-input" type="number" inputmode="numeric" min="0" max="3000" step="5" aria-label="Berat gram" value="${numVal(it.berat_g)}" />
              <span class="text-label-md font-label-md text-muted-foreground ml-0.5">g</span>
            </div>
            <button aria-label="Tambah porsi" class="btn-plus w-8 h-8 rounded-full bg-card hover:bg-surface-container active:scale-90 transition-transform flex items-center justify-center text-on-surface border border-border/80" type="button">
              <span class="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
          <button aria-label="Hapus item" class="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-error-container/40 active:scale-95 transition-all btn-delete" type="button">
            <span class="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-3 pt-2.5 border-t border-surface-container flex-wrap">
        <span class="inline-flex items-center gap-1 text-[12px] font-label-md text-muted-foreground bg-surface px-2 py-1 rounded-full border border-border">
          <span class="w-1.5 h-1.5 rounded-full bg-protein"></span> Prot
          <input class="item-prot-input w-11 bg-transparent border-0 p-0 text-center text-[12px] font-label-md text-on-surface tabular-nums focus:ring-0" type="number" inputmode="decimal" min="0" max="500" step="0.1" aria-label="Protein gram" value="${numVal(it.protein_g)}" /> g
        </span>
        <span class="inline-flex items-center gap-1 text-[12px] font-label-md text-muted-foreground bg-surface px-2 py-1 rounded-full border border-border">
          <span class="w-1.5 h-1.5 rounded-full bg-carb"></span> Karbo
          <input class="item-karbo-input w-11 bg-transparent border-0 p-0 text-center text-[12px] font-label-md text-on-surface tabular-nums focus:ring-0" type="number" inputmode="decimal" min="0" max="500" step="0.1" aria-label="Karbohidrat gram" value="${numVal(it.karbo_g)}" /> g
        </span>
        <span class="inline-flex items-center gap-1 text-[12px] font-label-md text-muted-foreground bg-surface px-2 py-1 rounded-full border border-border">
          <span class="w-1.5 h-1.5 rounded-full bg-fat"></span> Lemak
          <input class="item-lemak-input w-11 bg-transparent border-0 p-0 text-center text-[12px] font-label-md text-on-surface tabular-nums focus:ring-0" type="number" inputmode="decimal" min="0" max="500" step="0.1" aria-label="Lemak gram" value="${numVal(it.lemak_g)}" /> g
        </span>
      </div>
    </article>
  `;
}

function createManualCard() {
  const it = {
    nama: '', berat_g: 100, kalori: 0, protein_g: 0, karbo_g: 0, lemak_g: 0,
    _manual: true,
    _per_gram: { kalori: 0, protein_g: 0, karbo_g: 0, lemak_g: 0 },
  };
  const wrap = document.createElement('div');
  wrap.innerHTML = itemCardHtml(it, manualSeq++).trim();
  return wrap.firstElementChild;
}

function refreshItemCount() {
  const el = document.getElementById('item-count');
  if (el) el.textContent = `${document.querySelectorAll('#food-items-container article').length} item`;
}

function updateTotals() {
  let tKal = 0, tProt = 0, tKarbo = 0, tLemak = 0;
  document.querySelectorAll('#food-items-container article').forEach((art) => {
    tKal += parseFloat(art.querySelector('.item-cal-input').value) || 0;
    tProt += parseFloat(art.querySelector('.item-prot-input').value) || 0;
    tKarbo += parseFloat(art.querySelector('.item-karbo-input').value) || 0;
    tLemak += parseFloat(art.querySelector('.item-lemak-input').value) || 0;
  });
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('total-kal', Math.round(tKal).toLocaleString('id-ID'));
  set('total-prot', formatNum(tProt));
  set('total-karbo', formatNum(tKarbo));
  set('total-lemak', formatNum(tLemak));
}

// Rescale calories and macros from the stored per-gram basis. Cards without a
// basis (a fresh manual card the user hasn't filled in) are left untouched.
function recalcFromWeight(article) {
  const w = parseFloat(article.querySelector('.item-weight-input').value) || 0;
  const pk = parseFloat(article.dataset.perGramKal) || 0;
  const pp = parseFloat(article.dataset.perGramProt) || 0;
  const pc = parseFloat(article.dataset.perGramKarbo) || 0;
  const pl = parseFloat(article.dataset.perGramLemak) || 0;
  if (pk || pp || pc || pl) {
    article.querySelector('.item-cal-input').value = Math.round(w * pk);
    article.querySelector('.item-prot-input').value = numVal(round1(w * pp));
    article.querySelector('.item-karbo-input').value = numVal(round1(w * pc));
    article.querySelector('.item-lemak-input').value = numVal(round1(w * pl));
  }
  updateTotals();
}

// Editing a number directly re-derives that value's per-gram basis so a later
// weight change still scales proportionally.
function onNumberEdit(article, datasetKey, selector) {
  const w = parseFloat(article.querySelector('.item-weight-input').value) || 0;
  const v = parseFloat(article.querySelector(selector).value) || 0;
  article.dataset[datasetKey] = w > 0 ? String(v / w) : '0';
  updateTotals();
}

function wireItem(article) {
  article.querySelector('.btn-minus').addEventListener('click', () => {
    const inp = article.querySelector('.item-weight-input');
    inp.value = Math.max(0, (parseFloat(inp.value) || 0) - 5);
    recalcFromWeight(article);
  });
  article.querySelector('.btn-plus').addEventListener('click', () => {
    const inp = article.querySelector('.item-weight-input');
    inp.value = (parseFloat(inp.value) || 0) + 5;
    recalcFromWeight(article);
  });
  article.querySelector('.item-weight-input').addEventListener('input', () => recalcFromWeight(article));
  article.querySelector('.item-cal-input').addEventListener('input', () => onNumberEdit(article, 'perGramKal', '.item-cal-input'));
  article.querySelector('.item-prot-input').addEventListener('input', () => onNumberEdit(article, 'perGramProt', '.item-prot-input'));
  article.querySelector('.item-karbo-input').addEventListener('input', () => onNumberEdit(article, 'perGramKarbo', '.item-karbo-input'));
  article.querySelector('.item-lemak-input').addEventListener('input', () => onNumberEdit(article, 'perGramLemak', '.item-lemak-input'));
  article.querySelector('.btn-delete').addEventListener('click', () => {
    article.remove();
    refreshItemCount();
    updateTotals();
  });
}

function addManualItemCard() {
  const list = document.getElementById('food-items-container');
  if (!list) return null;
  const card = createManualCard();
  list.appendChild(card);
  wireItem(card);
  refreshItemCount();
  updateTotals();
  const nameInput = card.querySelector('.item-name');
  if (nameInput) nameInput.focus();
  return card;
}

function renderInit(container) {
  currentState = 'init';
  selectedMealTime = defaultMealTime();
  const quotaSisa = Store.getQuotaSisa();

  container.innerHTML = `
    <div class="ft-scan">
      ${scanHeader('btn-scan-back', 'Scan Makanan', { right: 'settings' })}

      <main class="ft-scan-content">
        <section class="ft-scan-hello">
          <div class="ft-scan-mascot">
            ${mascotImg('makan', { className: 'ft-scan-mascot-img', anim: 'none', interactive: true, decorative: false, id: 'limo-mascot-scan-card' })}
          </div>
          <div class="ft-scan-bubble">
            <strong>Foto makananmu, aku siap!</strong>
            <span>Aku hitung nutrisi &amp; kalorinya secara otomatis.</span>
          </div>
        </section>

        <section class="ft-scan-mode" role="group" aria-label="Jenis foto">
          <button id="btn-type-makanan" class="ft-scan-mode-btn" type="button" aria-pressed="${selectedType === 'makanan'}">
            <span class="material-symbols-outlined" aria-hidden="true">restaurant</span>
            Makanan/Piring
          </button>
          <button id="btn-type-label" class="ft-scan-mode-btn" type="button" aria-pressed="${selectedType === 'label'}">
            <span class="material-symbols-outlined" aria-hidden="true">document_scanner</span>
            Label Gizi
          </button>
        </section>
        <p class="ft-scan-tip">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          <span id="type-hint-text">${TYPE_HINTS[selectedType]}</span>
        </p>

        ${quotaSisa != null ? `
        <section class="ft-scan-quota">
          <span class="material-symbols-outlined" aria-hidden="true">bolt</span>
          <p>Sisa analisis gratis hari ini: <strong>${quotaSisa}</strong></p>
        </section>` : ''}

        <section class="ft-scan-card" aria-label="Unggah foto">
          <div class="ft-scan-drop" id="dropzone">
            <div class="ft-scan-drop-icon">
              <span class="material-symbols-outlined" aria-hidden="true">add</span>
            </div>
            <p>Seret foto ke sini atau unggah dari perangkatmu.</p>
          </div>
          <div class="ft-scan-upload-actions">
            <button id="btn-camera" class="ft-scan-button primary" type="button">
              <span class="material-symbols-outlined" aria-hidden="true">photo_camera</span>
              Foto Makanan
            </button>
            <button id="btn-gallery" class="ft-scan-button secondary" type="button">
              <span class="material-symbols-outlined" aria-hidden="true">photo_library</span>
              Pilih dari Galeri
            </button>
          </div>
        </section>
        <input type="file" id="photo-input" accept="image/*" hidden />

        <section class="ft-scan-card ft-scan-form">
          <div class="ft-scan-field">
            <div class="ft-scan-section-title">
              <span class="ft-scan-section-icon"><span class="material-symbols-outlined" aria-hidden="true">edit</span></span>
              <span>
                <strong><label for="catatan">Catatan <em>(opsional)</em></label></strong>
                <small>Membantu akurasi hitungan kalori</small>
              </span>
            </div>
            <textarea class="ft-scan-note" id="catatan" maxlength="80" rows="2" placeholder="Mis. porsi setengah, digoreng"></textarea>
            <div class="ft-scan-suggestions">
              <div class="ft-scan-suggestion-list" id="scan-suggestions" role="group" aria-label="Catatan cepat">
                <button type="button" data-note="Porsi setengah" aria-pressed="false">Porsi setengah</button>
                <button type="button" data-note="Digoreng" aria-pressed="false">Digoreng</button>
                <button type="button" data-note="Pakai santan" aria-pressed="false">Pakai santan</button>
                <button type="button" data-note="Tanpa gula" aria-pressed="false">Tanpa gula</button>
              </div>
              <span class="ft-scan-count" id="scan-note-count">0/80</span>
            </div>
          </div>
          <div class="ft-scan-divider"></div>
          <div class="ft-scan-field">
            <div class="ft-scan-section-title">
              <span class="ft-scan-section-icon"><span class="material-symbols-outlined" aria-hidden="true">schedule</span></span>
              <span>
                <strong>Waktu makan</strong>
                <small>Pilih kapan kamu makan ini</small>
              </span>
            </div>
            <div class="ft-scan-meals" id="scan-meal-grid" role="group" aria-label="Waktu makan">
              <button type="button" class="ft-meal-card ft-scan-meal sarapan" data-meal="sarapan" aria-pressed="${selectedMealTime === 'sarapan'}">
                <svg class="ft-meal-scene" viewBox="0 0 360 170" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><rect width="360" height="170" fill="#B8434F"/><circle cx="335" cy="0" r="150" fill="#CE5A48"/><circle cx="340" cy="0" r="106" fill="#E0733F"/><circle cx="346" cy="-2" r="58" fill="#F2B33A"/></svg>
                <span class="ft-scan-meal-content"><span class="ft-meal-title"><svg aria-hidden="true"><use href="#ft-meal-icon-sarapan"></use></svg>Sarapan</span><span class="ft-meal-small">${selectedMealTime === 'sarapan' ? 'Waktu dipilih' : 'Pilih waktu makan'}</span></span>
                <span class="ft-scan-check"><span class="material-symbols-outlined" aria-hidden="true">check</span></span>
              </button>
              <button type="button" class="ft-meal-card ft-scan-meal siang" data-meal="makan-siang" aria-pressed="${selectedMealTime === 'makan-siang'}">
                <svg class="ft-meal-scene" viewBox="0 0 360 170" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><rect width="360" height="170" fill="#2F6FC4"/><path d="M110 170C170 110 215 160 258 100C298 46 330 90 360 36V170Z" fill="#3B8CC0"/><path d="M200 170C250 132 292 168 360 104V170Z" fill="#4DAFB0"/><circle cx="332" cy="24" r="24" fill="#FFD84D"/></svg>
                <span class="ft-scan-meal-content"><span class="ft-meal-title"><svg aria-hidden="true"><use href="#ft-meal-icon-siang"></use></svg>Makan Siang</span><span class="ft-meal-small">${selectedMealTime === 'makan-siang' ? 'Waktu dipilih' : 'Pilih waktu makan'}</span></span>
                <span class="ft-scan-check"><span class="material-symbols-outlined" aria-hidden="true">check</span></span>
              </button>
              <button type="button" class="ft-meal-card ft-scan-meal malam" data-meal="makan-malam" aria-pressed="${selectedMealTime === 'makan-malam'}">
                <svg class="ft-meal-scene" viewBox="0 0 360 170" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><rect width="360" height="170" fill="#1B2E5C"/><circle cx="332" cy="34" r="84" fill="#25407A"/><circle cx="332" cy="34" r="62" fill="#2F4F94"/><circle cx="332" cy="34" r="38" fill="#F4C94A"/><g fill="#F4C94A"><circle cx="190" cy="22" r="2"/><circle cx="236" cy="64" r="2.4"/><circle cx="150" cy="70" r="1.8"/><circle cx="268" cy="18" r="2"/><circle cx="214" cy="118" r="2"/><circle cx="120" cy="30" r="2.2"/><circle cx="290" cy="110" r="2"/><circle cx="180" cy="140" r="1.8"/></g></svg>
                <span class="ft-scan-meal-content"><span class="ft-meal-title"><svg aria-hidden="true"><use href="#ft-meal-icon-malam"></use></svg>Makan Malam</span><span class="ft-meal-small">${selectedMealTime === 'makan-malam' ? 'Waktu dipilih' : 'Pilih waktu makan'}</span></span>
                <span class="ft-scan-check"><span class="material-symbols-outlined" aria-hidden="true">check</span></span>
              </button>
              <button type="button" class="ft-meal-card ft-scan-meal camilan" data-meal="camilan" aria-pressed="${selectedMealTime === 'camilan'}">
                <svg class="ft-meal-scene" viewBox="0 0 360 170" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><rect width="360" height="170" fill="#8B3A8F"/><path d="M130 0C185 44 228 8 280 52C322 86 340 62 360 94V0Z" fill="#A5479B"/><path d="M190 170C236 124 282 160 332 112C346 99 354 100 360 94V170Z" fill="#C2549A"/><g fill="#F5B3D2" opacity=".55"><circle cx="300" cy="30" r="5"/><circle cx="326" cy="52" r="3"/><circle cx="270" cy="20" r="3"/></g></svg>
                <span class="ft-scan-meal-content"><span class="ft-meal-title"><svg aria-hidden="true"><use href="#ft-meal-icon-camilan"></use></svg>Camilan</span><span class="ft-meal-small">${selectedMealTime === 'camilan' ? 'Waktu dipilih' : 'Pilih waktu makan'}</span></span>
                <span class="ft-scan-check"><span class="material-symbols-outlined" aria-hidden="true">check</span></span>
              </button>
            </div>
            <input type="hidden" id="waktu-makan" value="${selectedMealTime}" />
          </div>
          <button id="btn-analyze" class="ft-scan-button primary" type="button" hidden disabled>
            <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
            Analisis Foto
          </button>
        </section>
      </main>
    </div>
  `;

  // Type toggle
  const btnTypeMakanan = document.getElementById('btn-type-makanan');
  const btnTypeLabel = document.getElementById('btn-type-label');
  const typeSelector = btnTypeMakanan.closest('.ft-scan-mode');
  const hintText = document.getElementById('type-hint-text');
  function setTypeButton(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
  }
  function applyType(type) {
    selectedType = type;
    const onMakanan = type === 'makanan';
    setTypeButton(btnTypeMakanan, onMakanan);
    setTypeButton(btnTypeLabel, !onMakanan);
    typeSelector.dataset.active = type;
    if (hintText) hintText.textContent = TYPE_HINTS[type];
  }
  btnTypeMakanan.addEventListener('click', () => applyType('makanan'));
  btnTypeLabel.addEventListener('click', () => applyType('label'));
  applyType(selectedType);

  const noteInput = document.getElementById('catatan');
  const noteCount = document.getElementById('scan-note-count');
  const suggestions = document.getElementById('scan-suggestions');
  const noteParts = () => noteInput.value.split(',').map(value => value.trim()).filter(Boolean);
  function syncNoteSuggestions() {
    const parts = noteParts();
    suggestions.querySelectorAll('[data-note]').forEach(button => {
      button.setAttribute('aria-pressed', String(parts.includes(button.dataset.note)));
    });
    noteCount.textContent = `${noteInput.value.length}/80`;
  }
  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-note]');
    if (!button) return;
    const parts = noteParts();
    const index = parts.indexOf(button.dataset.note);
    if (index >= 0) parts.splice(index, 1);
    else parts.push(button.dataset.note);
    noteInput.value = parts.join(', ').slice(0, 80);
    syncNoteSuggestions();
  });
  noteInput.addEventListener('input', syncNoteSuggestions);

  const mealInput = document.getElementById('waktu-makan');
  document.getElementById('scan-meal-grid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-meal]');
    if (!button) return;
    selectedMealTime = button.dataset.meal;
    mealInput.value = selectedMealTime;
    document.querySelectorAll('#scan-meal-grid [data-meal]').forEach(mealButton => {
      const selected = mealButton === button;
      mealButton.setAttribute('aria-pressed', String(selected));
      mealButton.querySelector('.ft-meal-small').textContent = selected ? 'Waktu dipilih' : 'Pilih waktu makan';
    });
  });

  // Back button
  document.getElementById('btn-scan-back').addEventListener('click', () => {
    window.location.hash = '#/';
  });

  // Settings
  document.getElementById('btn-scan-settings').addEventListener('click', () => {
    window.location.hash = '#/settings';
  });

  // Camera & gallery
  const photoInput = document.getElementById('photo-input');
  document.getElementById('btn-camera').addEventListener('click', () => {
    photoInput.setAttribute('capture', 'environment');
    photoInput.value = '';
    photoInput.click();
  });
  document.getElementById('btn-gallery').addEventListener('click', () => {
    photoInput.removeAttribute('capture');
    photoInput.value = '';
    photoInput.click();
  });

  const analyzeBtn = document.getElementById('btn-analyze');
  const dropzone = document.getElementById('dropzone');
  let photoReady = false;

  async function selectPhoto(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar yang valid.', { type: 'error' });
      return;
    }

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    base64Image = null;
    photoReady = false;
    filePreviewUrl = URL.createObjectURL(file);
    analyzeBtn.hidden = false;
    dropzone.innerHTML = `
      <img src="${filePreviewUrl}" class="ft-scan-preview" alt="Pratinjau foto makanan" />
      <div class="ft-scan-preview-actions">
        <button id="btn-change-photo" class="ft-scan-button secondary" type="button">
          <span class="material-symbols-outlined" aria-hidden="true">refresh</span>Ganti foto
        </button>
      </div>
    `;
    document.getElementById('btn-change-photo').addEventListener('click', () => {
      photoInput.value = '';
      photoInput.click();
    });
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">hourglass_top</span>Menyiapkan foto';
    try {
      base64Image = await resizeImage(file, 800);
      photoReady = true;
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>Analisis Foto';
    } catch (err) {
      photoReady = false;
      analyzeBtn.disabled = true;
      showToast('Gagal memproses gambar. Format tidak didukung.', { type: 'error' });
    }
  }

  photoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) selectPhoto(file);
  });
  ['dragover', 'dragenter'].forEach(type => dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add('over');
  }));
  ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.remove('over');
  }));
  dropzone.addEventListener('drop', event => {
    const file = [...(event.dataTransfer?.files || [])].find(candidate => candidate.type.startsWith('image/'));
    if (file) selectPhoto(file);
  });

  analyzeBtn.addEventListener('click', () => {
    if (!photoReady || !base64Image) return;
    const catatan = noteInput.value;
    const waktuMakan = mealInput.value || 'makan-siang';
    selectedMealTime = waktuMakan;
    renderLoading(container, filePreviewUrl);
    doAnalyze(container, catatan, waktuMakan);
  });

  initMascotAnims(container);
}

function renderLoading(container, imgUrl) {
  currentState = 'loading';
  container.innerHTML = `
    ${scanHeader('btn-cancel', 'Pindai Makanan', { backLabel: 'Batal', right: 'processing' })}

    <main class="flex-1 px-4 space-y-5 pt-1 pb-8">
      <section class="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden border border-border bg-card shadow-none">
        <img alt="Foto makanan sedang dianalisis" class="w-full h-full object-cover brightness-[0.82] contrast-[1.05]" src="${imgUrl}"/>
        <div class="absolute inset-0 bg-primary-container/10 mix-blend-multiply pointer-events-none"></div>
        <div class="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent animate-scan pointer-events-none z-10" id="scan-beam" style="top:0%"></div>
        <div class="absolute top-3 left-3 bg-card/90 backdrop-blur-md px-3 py-1 rounded-full border border-border flex items-center space-x-1.5">
          <span class="material-symbols-outlined text-[16px] text-primary" style="font-variation-settings:'FILL' 1;">auto_awesome</span>
          <span class="text-label-md font-label-md text-on-surface font-semibold">Menganalisis foto...</span>
        </div>
      </section>

      <section class="flex flex-col items-center justify-center text-center pt-1 pb-1">
        ${mascotImg('mikir', { className: 'w-[132px] h-[132px]', anim: 'think' })}
        <div class="mt-3 flex items-center justify-center space-x-1">
          <h2 class="text-headline-sm font-headline-sm text-on-surface font-bold tracking-tight" id="loading-text">${LOADING_CAPTIONS[0]}</h2>
          <div class="flex items-center space-x-1 pl-0.5 pt-1.5">
            <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style="animation-delay:0s"></span>
            <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style="animation-delay:0.15s"></span>
            <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style="animation-delay:0.3s"></span>
          </div>
        </div>
        <p class="text-label-md font-label-md text-muted-foreground mt-0.5">Mengenali komponen hidangan nusantara</p>
        <div class="inline-flex items-center space-x-1 mt-2 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-border">
          <span class="material-symbols-outlined text-[14px] text-muted-foreground">schedule</span>
          <span id="loading-hint" class="text-xs text-muted-foreground font-medium">Biasanya 5–15 detik</span>
        </div>
      </section>
    </main>
  `;

  document.getElementById('btn-cancel').addEventListener('click', () => renderInit(container));

  initMascotAnims(container);

  // Animate scan beam
  let beamPos = 0;
  const beam = document.getElementById('scan-beam');
  const beamInterval = setInterval(() => {
    if (!beam || !document.contains(beam)) { clearInterval(beamInterval); return; }
    beamPos = (beamPos + 2) % 100;
    beam.style.top = beamPos + '%';
  }, 30);

  // Rotate the loading caption in sync with the limo-think cycle
  let captionIdx = 0;
  const captionEl = document.getElementById('loading-text');
  const captionInterval = setInterval(() => {
    if (!captionEl || !document.contains(captionEl)) { clearInterval(captionInterval); return; }
    captionIdx = (captionIdx + 1) % LOADING_CAPTIONS.length;
    captionEl.textContent = LOADING_CAPTIONS[captionIdx];
  }, 2400);

  // Reassure the user (and show elapsed seconds) when the analysis runs long.
  const hintEl = document.getElementById('loading-hint');
  const startedAt = Date.now();
  const hintInterval = setInterval(() => {
    if (!hintEl || !document.contains(hintEl)) { clearInterval(hintInterval); return; }
    if (hintEl.dataset.locked) return;
    const secs = Math.round((Date.now() - startedAt) / 1000);
    if (secs >= 15) hintEl.textContent = `Masih dihitung… (${secs}s) jangan tutup ya`;
  }, 1000);
}

function renderError(container, message, onRetry) {
  currentState = 'error';
  container.innerHTML = `
    ${scanHeader('btn-error-back', 'Scan Makanan')}
    <main class="px-4 flex flex-col items-center justify-center gap-5 pt-10 pb-8">
      ${mascotImg('kaget', { className: 'w-[152px] h-[152px]', anim: 'shake' })}
      <div class="text-center">
        <h2 class="text-headline-sm font-headline-sm font-bold text-on-surface mb-2">Waduh, ada kendala!</h2>
        <p class="text-body-md font-body-md text-muted-foreground">${message}</p>
      </div>
      <button id="btn-retry" class="w-full h-12 bg-primary-container text-on-primary-container rounded-full text-label-lg font-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
        <span class="material-symbols-outlined text-[20px]">refresh</span>
        <span>Coba lagi</span>
      </button>
    </main>
  `;
  document.getElementById('btn-error-back').addEventListener('click', () => renderInit(container));
  document.getElementById('btn-retry').addEventListener('click', onRetry || (() => renderInit(container)));
  initMascotAnims(container);
}

function renderNotFood(container, catatan) {
  container.innerHTML = `
    ${scanHeader('btn-notfood-back', 'Scan Makanan')}
    <main class="px-4 flex flex-col items-center gap-5 pt-8 pb-8">
      ${mascotImg('bingung', { className: 'w-[152px] h-[152px]', anim: 'bob' })}
      <div class="text-center">
        <h2 class="text-headline-sm font-headline-sm font-bold text-on-surface mb-2">Hmm, ini kurang jelas...</h2>
        <p class="text-body-md font-body-md text-muted-foreground">${catatan || 'Foto tidak terdeteksi sebagai makanan. Coba foto ulang dengan pencahayaan lebih baik.'}</p>
      </div>
      <button id="btn-refoto" class="w-full h-12 bg-primary-container text-on-primary-container rounded-full text-label-lg font-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
        <span class="material-symbols-outlined text-[20px]">add_a_photo</span>
        <span>Foto Ulang</span>
      </button>
      <button id="btn-manual" class="w-full h-12 bg-card border border-border rounded-full text-on-surface font-label-lg text-label-lg font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
        <span class="material-symbols-outlined text-[20px]">edit_note</span>
        <span>Catat manual saja</span>
      </button>
    </main>
  `;
  document.getElementById('btn-notfood-back').addEventListener('click', () => renderInit(container));
  document.getElementById('btn-refoto').addEventListener('click', () => renderInit(container));
  document.getElementById('btn-manual').addEventListener('click', () => {
    renderResult(container, { items: [], catatan: '' }, selectedMealTime, '', true);
  });
  initMascotAnims(container);
}

function renderResult(container, data, waktuMakan, userCatatan, startManual) {
  currentState = 'result';
  analyzeResult = data;
  const { items, catatan } = data;
  const totalKal = items.reduce((s, it) => s + it.kalori, 0);
  const totalProt = items.reduce((s, it) => s + it.protein_g, 0);
  const totalKarbo = items.reduce((s, it) => s + it.karbo_g, 0);
  const totalLemak = items.reduce((s, it) => s + it.lemak_g, 0);

  // Store the base weight and per-gram rates for proportional recalculation.
  const itemsWithBase = items.map((it) => ({
    ...it,
    _base_weight: it.berat_g,
    _manual: false,
    _per_gram: {
      kalori: it.berat_g > 0 ? it.kalori / it.berat_g : 0,
      protein_g: it.berat_g > 0 ? it.protein_g / it.berat_g : 0,
      karbo_g: it.berat_g > 0 ? it.karbo_g / it.berat_g : 0,
      lemak_g: it.berat_g > 0 ? it.lemak_g / it.berat_g : 0,
    },
  }));

  const itemCards = itemsWithBase.map((it, idx) => itemCardHtml(it, idx)).join('');

  const manualOnly = !!(startManual && items.length === 0);
  const mascotLine = manualOnly ? 'Isi detail makanannya secara manual ya.' : '"Ketemu! Cek hasilnya dulu ya."';
  const aiNote = manualOnly ? '' : catatan;

  container.innerHTML = `
    ${scanHeader('btn-result-back', 'Hasil Analisis')}

    <main class="px-4 pt-1 space-y-4 pb-8">
      <!-- Mascot + summary -->
      <section class="flex items-center gap-3">
        ${mascotImg('loncat', { className: 'w-[80px] h-[80px] shrink-0', anim: 'hop', interactive: true, id: 'limo-mascot-result' })}
        <div>
          <p class="font-body-md text-body-md font-semibold text-on-surface">${mascotLine}</p>
          ${aiNote ? `<p class="font-label-md text-label-md text-muted-foreground mt-0.5">${aiNote}</p>` : ''}
        </div>
      </section>

      <!-- Total summary -->
      <section class="bg-card rounded-[20px] border border-border p-4">
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-headline-md font-headline-md font-bold text-on-surface tabular-nums" id="total-kal">${Math.round(totalKal)}</span>
          <span class="text-label-md text-muted-foreground">kkal total</span>
        </div>
        <div class="flex gap-3 flex-wrap">
          <span class="inline-flex items-center gap-1 text-[12px] font-label-md text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border">
            <span class="w-1.5 h-1.5 rounded-full bg-protein"></span> Prot <span id="total-prot">${formatNum(totalProt)}</span> g
          </span>
          <span class="inline-flex items-center gap-1 text-[12px] font-label-md text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border">
            <span class="w-1.5 h-1.5 rounded-full bg-carb"></span> Karbo <span id="total-karbo">${formatNum(totalKarbo)}</span> g
          </span>
          <span class="inline-flex items-center gap-1 text-[12px] font-label-md text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border">
            <span class="w-1.5 h-1.5 rounded-full bg-fat"></span> Lemak <span id="total-lemak">${formatNum(totalLemak)}</span> g
          </span>
        </div>
        <p class="text-[11px] text-muted-foreground mt-2 italic">*Semua angka adalah perkiraan dari foto.</p>
      </section>

      <div class="flex items-center justify-between px-1">
        <h2 class="text-headline-sm font-headline-sm font-bold text-on-surface">Komponen Makanan</h2>
        <span class="text-label-md font-label-md text-muted-foreground" id="item-count">${items.length} item</span>
      </div>

      <div class="space-y-3" id="food-items-container">
        ${itemCards}
      </div>

      <button id="btn-add-item" class="w-full h-11 bg-card border-2 border-dashed border-primary-tint rounded-full text-label-lg font-label-lg font-semibold text-secondary flex items-center justify-center gap-2 active:scale-[0.98] transition-all" type="button">
        <span class="material-symbols-outlined text-[20px]">add</span>
        <span>Tambah item manual</span>
      </button>

      <!-- Save button -->
      <button id="btn-save" class="w-full h-14 bg-primary-container text-on-primary-container rounded-full text-label-lg font-label-lg font-bold flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all shadow-md">
        <span class="material-symbols-outlined text-[22px]">save</span>
        <span>Simpan Catatan</span>
      </button>
      <p class="text-center text-[11px] text-muted-foreground italic">Hasil dari foto hanyalah perkiraan, bukan saran medis.</p>
      ${Store.getQuotaSisa() != null ? `<p class="text-center text-[11px] font-semibold text-secondary">Sisa analisis gratis hari ini: ${Store.getQuotaSisa()}</p>` : ''}
    </main>
  `;

  document.getElementById('btn-result-back').addEventListener('click', () => renderInit(container));

  // Every card (AI + manual) shares the same wiring.
  document.querySelectorAll('#food-items-container article').forEach(wireItem);
  document.getElementById('btn-add-item').addEventListener('click', () => addManualItemCard());
  if (startManual) addManualItemCard();

  // Save
  document.getElementById('btn-save').addEventListener('click', async () => {
    const saveBtn = document.getElementById('btn-save');
    const navId = container.dataset.navId;

    const itemsToSave = [];
    let missingName = false;
    document.querySelectorAll('#food-items-container article').forEach(art => {
      const nama = (art.querySelector('.item-name').value || '').trim();
      if (!nama) { missingName = true; return; }
      const w = parseFloat(art.querySelector('.item-weight-input').value) || 0;
      const kal = parseFloat(art.querySelector('.item-cal-input').value) || 0;
      const prot = parseFloat(art.querySelector('.item-prot-input').value) || 0;
      const karbo = parseFloat(art.querySelector('.item-karbo-input').value) || 0;
      const lemak = parseFloat(art.querySelector('.item-lemak-input').value) || 0;
      itemsToSave.push({
        nama,
        berat_g: w,
        kalori: Math.round(kal),
        protein_g: round1(prot),
        karbo_g: round1(karbo),
        lemak_g: round1(lemak),
      });
    });

    if (missingName) {
      showToast('Lengkapi nama semua item dulu ya.', { type: 'error' });
      return;
    }
    if (itemsToSave.length === 0) {
      showToast('Tidak ada item untuk disimpan.', { type: 'error' });
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Menyimpan...</span>`;

    const WAKTU_MAKAN_LABEL = {
      'sarapan': 'Sarapan',
      'makan-siang': 'Makan Siang',
      'makan-malam': 'Makan Malam',
      'camilan': 'Camilan',
    };
    const waktuMakanVal = WAKTU_MAKAN_LABEL[waktuMakan] || 'Makan Siang';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    let thumbDataUrl = null;
    if (base64Image) {
      try { thumbDataUrl = await makeThumbnail(base64Image); } catch (err) { /* best-effort */ }
    }

    const logPayload = {
      action: 'log',
      tanggal: todayStr,
      waktu_makan: waktuMakanVal,
      catatan: '',
      items: itemsToSave
    };
    if (thumbDataUrl) logPayload.foto_thumb = thumbDataUrl.split(',')[1] || '';

    const resp = await fetchApi(logPayload);

    if (container.dataset.navId !== navId) return;

    if (resp.ok) {
      const ids = (resp.data && resp.data.ids) || [];
      if (resp.versi !== SAVE_BACKEND_VERSION) {
        showToast(`Backend belum diperbarui (versi aktif: ${resp.versi || 'tidak diketahui'}). Salin Code.gs terbaru lalu deploy New version.`, { type: 'error' });
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-[22px]">save</span><span>Simpan Catatan</span>`;
      } else if (!Array.isArray(ids) || ids.length !== itemsToSave.length || ids.some(id => !id)) {
        showToast('Respons simpan tidak lengkap. Periksa sheet log sebelum mencoba lagi.', { type: 'error' });
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-[22px]">save</span><span>Simpan Catatan</span>`;
      } else {
        if (thumbDataUrl) saveThumb(ids, thumbDataUrl);
        renderSaved();
      }
    } else {
      showToast(resp.error?.pesan || 'Gagal menyimpan. Coba lagi.', { type: 'error' });
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span class="material-symbols-outlined text-[22px]">save</span><span>Simpan Catatan</span>`;
    }
  });

  initMascotAnims(container);
}

function renderSaved() {
  // Konfirmasi disimpan cukup lewat toast singkat, lalu langsung kembali ke
  // beranda. Sebelumnya ada layar konfirmasi layar-penuh dengan Limo berukuran
  // besar yang tampak persis seperti splash/loading, sehingga terasa seperti
  // aplikasi kembali ke splash screen.
  showToast('Tersimpan! Catatan makananmu berhasil disimpan.', { type: 'success' });
  window.location.hash = '#/';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function doAnalyze(container, catatan, waktuMakan) {
  const maxAttempts = 3;
  const navId = container.dataset.navId;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetchApi({
      action: 'analyze',
      gambar_base64: base64Image,
      jenis: selectedType,
      catatan: catatan
    });

    // Abandon silently if the user left the scan screen mid-analysis.
    if (container.dataset.navId !== navId) return;

    if (response.ok) {
      const data = response.data;
      if (data && data.sisa_kuota_hari_ini != null) {
        Store.setQuotaSisa(data.sisa_kuota_hari_ini);
      }
      if (data.bukan_makanan || !data.items || data.items.length === 0) {
        renderNotFood(container, data.catatan);
      } else {
        renderResult(container, data, waktuMakan, catatan);
      }
      return;
    }

    const kode = response.error?.kode;
    const pesan = response.error?.pesan || 'Gagal menganalisis. Coba lagi.';

    // Server sibuk / koneksi gagal: coba lagi otomatis sebelum menyerah.
    const transient = kode === 'SIBUK' || kode === 'ERROR_SERVER';
    if (transient && attempt < maxAttempts) {
      const hint = document.getElementById('loading-hint');
      if (hint) {
        hint.dataset.locked = '1';
        hint.textContent = `Server sedang ramai… mencoba lagi (${attempt}/${maxAttempts - 1})`;
      }
      await sleep(attempt * 4000);
      if (container.dataset.navId !== navId) return;
      continue;
    }

    if (kode === 'KUOTA_HABIS') {
      container.innerHTML = `
        <main class="flex flex-col items-center justify-center min-h-screen px-6 gap-6 text-center">
          ${mascotImg('tidur', { className: 'w-[168px] h-[168px]', anim: 'bob' })}
          <div>
            <h2 class="text-headline-md font-headline-md font-bold text-on-surface">Limo istirahat dulu...</h2>
            <p class="text-body-md font-body-md text-muted-foreground mt-1">${pesan}</p>
          </div>
          <button id="btn-quota-back" class="px-6 h-12 bg-card border border-border rounded-full text-label-lg font-label-lg font-semibold text-on-surface">Kembali ke beranda</button>
        </main>
      `;
      document.getElementById('btn-quota-back').addEventListener('click', () => { window.location.hash = '#/'; });
      initMascotAnims(container);
    } else {
      renderError(container, pesan, () => {
        renderLoading(container, filePreviewUrl);
        doAnalyze(container, catatan, waktuMakan);
      });
    }
    return;
  }
}

export function initScanView(container) {
  base64Image = null;
  analyzeResult = null;
  if (filePreviewUrl) { URL.revokeObjectURL(filePreviewUrl); filePreviewUrl = null; }
  renderInit(container);
}
