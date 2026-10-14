import { Store } from '../store.js?v20261012k';
import { fetchApi } from '../api.js?v20261012k';
import { mascotImg, MASCOT_TEXT, initMascotAnims } from '../mascot.js?v20261013g';
import { getThumb } from '../thumbs.js?v20261012k';
import { openItemEditSheet } from '../editItem.js?v20261015a';
import { showConfirm, showToast } from '../ui.js?v20261015a';

// Week strip for the current week (Mon–Sun) with selection state.
function getWeekDates(selectedDateStr, todayStr) {
  const today = new Date();
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const result = [];
  // Start from Monday of current week
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDate(d);
    result.push({
      label: days[d.getDay()],
      date: d.getDate(),
      dateStr,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      isFuture: dateStr > todayStr,
    });
  }
  return result;
}

// The viewed day comes from the URL ("#/?d=2026-10-06"); defaults to today.
// Invalid, future, or older-than-90-days values fall back to today.
function readSelectedDate(todayStr) {
  const m = (window.location.hash || '').match(/[?&]d=(\d{4}-\d{2}-\d{2})/);
  const d = m ? m[1] : todayStr;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return todayStr;
  if (d > todayStr) return todayStr;
  if (d < formatDate(daysAgo(89))) return todayStr;
  return d;
}

function humanDayLabel(dateStr, todayStr) {
  if (dateStr === todayStr) return 'Hari Ini';
  if (dateStr === formatDate(daysAgo(1))) return 'Kemarin';
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${days[dt.getDay()]}, ${d} ${months[m - 1]}`;
}

function dateFromStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatMonthYear(date) {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const MEAL_CARD_CONFIG = {
  'Sarapan': {
    key: 'sarapan',
    scene: '<rect width="360" height="170" fill="#B8434F"/><circle cx="335" cy="0" r="150" fill="#CE5A48"/><circle cx="340" cy="0" r="106" fill="#E0733F"/><circle cx="346" cy="-2" r="58" fill="#F2B33A"/>',
  },
  'Makan Siang': {
    key: 'siang',
    scene: '<rect width="360" height="170" fill="#2F6FC4"/><path d="M110 170C170 110 215 160 258 100C298 46 330 90 360 36V170Z" fill="#3B8CC0"/><path d="M200 170C250 132 292 168 360 104V170Z" fill="#4DAFB0"/><circle cx="332" cy="24" r="24" fill="#FFD84D"/>',
  },
  'Makan Malam': {
    key: 'malam',
    scene: '<rect width="360" height="170" fill="#1B2E5C"/><circle cx="332" cy="34" r="84" fill="#25407A"/><circle cx="332" cy="34" r="62" fill="#2F4F94"/><circle cx="332" cy="34" r="38" fill="#F4C94A"/><g fill="#F4C94A"><circle cx="190" cy="22" r="2"/><circle cx="236" cy="64" r="2.4"/><circle cx="150" cy="70" r="1.8"/><circle cx="268" cy="18" r="2"/><circle cx="214" cy="118" r="2"/><circle cx="120" cy="30" r="2.2"/><circle cx="290" cy="110" r="2"/><circle cx="180" cy="140" r="1.8"/></g>',
  },
  'Camilan': {
    key: 'camilan',
    scene: '<rect width="360" height="170" fill="#8B3A8F"/><path d="M130 0C185 44 228 8 280 52C322 86 340 62 360 94V0Z" fill="#A5479B"/><path d="M190 170C236 124 282 160 332 112C346 99 354 100 360 94V170Z" fill="#C2549A"/><g fill="#F5B3D2" opacity=".55"><circle cx="300" cy="30" r="5"/><circle cx="326" cy="52" r="3"/><circle cx="270" cy="20" r="3"/></g>',
  },
};

function mealThumbSrc(it) {
  if (it.foto_thumb) return 'data:image/jpeg;base64,' + it.foto_thumb;
  return getThumb(it.id);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMealCard(label, items, target, dateStr) {
  const config = MEAL_CARD_CONFIG[label];
  const key = config.key;
  const total = items.reduce((s, it) => s + (it.kalori || 0), 0);
  const percent = target > 0 ? Math.round(total / target * 100) : 0;
  const date = dateFromStr(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const itemRows = items.map(it => {
    return `
    <li class="ft-meal-item" data-id="${esc(it.id)}">
      <span class="ft-meal-name">${esc(it.makanan)}</span>
      <em>${Number(it.kalori || 0).toLocaleString('id-ID')} kkal</em>
      <button class="btn-edit-item ft-meal-action" type="button" data-id="${esc(it.id)}" aria-label="Edit ${esc(it.makanan)}">
        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
      </button>
      <button class="btn-delete-item ft-meal-action" type="button" data-id="${esc(it.id)}" aria-label="Hapus ${esc(it.makanan)}">
        <span class="material-symbols-outlined" aria-hidden="true">delete</span>
      </button>
    </li>
  `;
  }).join('');
  const latestPhoto = [...items].reverse().find(it => mealThumbSrc(it));
  const photo = latestPhoto ? mealThumbSrc(latestPhoto) : '';

  return `
    <article class="ft-meal-card ${key}">
      <svg class="ft-meal-scene" viewBox="0 0 360 170" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">${config.scene}</svg>
      <div class="ft-meal-top">
        <div>
          <div class="ft-meal-title">
            <svg aria-hidden="true"><use href="#ft-meal-icon-${key}"></use></svg>${label}
          </div>
          <div class="ft-meal-kcal"><b>${total.toLocaleString('id-ID')}</b><span>kkal</span></div>
        </div>
        <div class="ft-meal-progress">
          <div class="ft-meal-percent">${percent}%</div>
          <div class="ft-meal-small">dari target <span>${target.toLocaleString('id-ID')}</span> kkal</div>
          <div class="ft-meal-small">${date}</div>
        </div>
      </div>
      <ul class="ft-meal-items">${itemRows}</ul>
      <div class="ft-meal-strip">
        <span class="ft-meal-hint">${items.length ? `${items.length} item tercatat` : 'Belum ada catatan makanan'}</span>
        <div class="ft-meal-photo"${photo ? '' : ' hidden'}>${photo ? `<img src="${esc(photo)}" alt="Foto ${esc(latestPhoto.makanan)}">` : ''}</div>
      </div>
    </article>
  `;
}

export async function initTodayView(container) {
  const navId = container.dataset.navId;
  const target = Store.getTargetCalories();
  const today = new Date();
  const todayStr = formatDate(today);
  const selectedDateStr = readSelectedDate(todayStr);
  const isToday = selectedDateStr === todayStr;
  const weekDates = getWeekDates(selectedDateStr, todayStr);

  // Render skeleton immediately
  container.innerHTML = `
    <header class="app-header ft-hdr">
      <div class="ft-hi">
        <div>
          <h1 id="hh">${humanDayLabel(selectedDateStr, todayStr)}</h1>
          <div class="ft-date">
            <svg class="ic" aria-hidden="true"><use href="#ft-icon-calendar"></use></svg>
            <span id="bulan">${formatMonthYear(dateFromStr(selectedDateStr))}</span>
          </div>
        </div>
        <button aria-label="Pengaturan" class="ft-ibtn lime" type="button" id="btn-settings">
          <svg aria-hidden="true"><use href="#ft-icon-gear"></use></svg>
        </button>
      </div>
      <div class="ft-week" id="week" role="group" aria-label="Pilih tanggal">
        ${weekDates.map(d => {
          return `
          <button type="button" class="ft-day" data-week-date="${d.dateStr}" aria-pressed="${d.isSelected}" ${d.isFuture ? 'disabled' : ''} aria-label="${d.dateStr}">
            <small>${d.label}</small><b>${d.date}</b>
          </button>
        `;
        }).join('')}
      </div>
    </header>

    <main class="px-4 flex flex-col gap-5 mt-2" id="today-main">
      <!-- Loading skeleton -->
      <div class="animate-pulse" aria-hidden="true">
        <section class="bg-surface-container-low border border-primary-tint rounded-[28px] p-5 flex flex-col items-center">
          <div class="w-44 h-44 rounded-full border-[11px] border-on-surface/10 my-1"></div>
          <div class="h-3 w-40 rounded-full bg-on-surface/10 mt-3"></div>
        </section>
        <section class="flex flex-col gap-3 mt-5">
          <div class="h-5 w-44 rounded-full bg-on-surface/10 ml-1"></div>
          ${Array(4).fill(`
          <div class="bg-card border border-border rounded-[20px] p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-on-surface/10 shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3.5 w-2/3 rounded-full bg-on-surface/10"></div>
              <div class="h-3 w-1/3 rounded-full bg-on-surface/10"></div>
            </div>
          </div>`).join('')}
        </section>
      </div>
    </main>
  `;

  // Wire settings button
  document.getElementById('btn-settings').addEventListener('click', () => {
    window.location.hash = '#/settings';
  });

  // Tap a day in the week strip: put it in the URL so the router reloads the
  // view for that day (and the browser back button works too).
  container.querySelectorAll('[data-week-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.weekDate;
      if (!d || btn.disabled || d === selectedDateStr) return;
      const week = container.querySelector('#week');
      week?.querySelectorAll('.ft-day').forEach(day => {
        day.classList.remove('pop');
        day.setAttribute('aria-pressed', String(day === btn));
      });
      void btn.offsetWidth;
      btn.classList.add('pop');
      week?.dispatchEvent(new CustomEvent('datechange', { detail: dateFromStr(d) }));
      window.location.hash = (d === todayStr) ? '#/' : ('#/?d=' + d);
    });
  });

  // Fetch the viewed day's data plus a lightweight 90-day window (no previews
  // needed) so we can compute the logging streak.
  const streakFromStr = formatDate(daysAgo(89));
  const [resp, streakResp] = await Promise.all([
    fetchApi({ action: 'history', dari: selectedDateStr, sampai: selectedDateStr }),
    fetchApi({ action: 'history', dari: streakFromStr, sampai: todayStr, ringkas: true }),
  ]);

  // The user may have navigated away while the request was in flight.
  if (container.dataset.navId !== navId) return;
  const mainEl = container.querySelector('#today-main');
  if (!mainEl) return;

  if (!resp.ok) {
    mainEl.innerHTML = `
      <section class="bg-card border border-border rounded-[20px] p-5 text-center" role="alert">
        <p class="text-body-md text-on-surface">${esc(resp.error?.pesan || 'Gagal memuat catatan. Coba lagi.')}</p>
        <button id="btn-today-retry" class="mt-4 px-5 py-2 rounded-full bg-primary-container text-on-primary-container font-semibold" type="button">Coba lagi</button>
      </section>`;
    mainEl.querySelector('#btn-today-retry').addEventListener('click', () => initTodayView(container));
    return;
  }

  let rows = [];
  if (resp.data && resp.data.rows) {
    rows = resp.data.rows;
  }

  // Consecutive days with at least one log, counting back from today (or from
  // yesterday when today has no entry yet, so an unlogged morning doesn't
  // reset the streak).
  let streak = 0;
  const loggedDates = new Set();
  if (streakResp.ok && streakResp.data && streakResp.data.rows) {
    streakResp.data.rows.forEach(r => { if (r.tanggal) loggedDates.add(r.tanggal); });
    const cursor = new Date();
    if (!loggedDates.has(formatDate(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (loggedDates.has(formatDate(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const totalKalori = rows.reduce((s, r) => s + (r.kalori || 0), 0);
  const percent = Math.min(100, Math.round((totalKalori / target) * 100));

  const mealGroups = { Sarapan: [], 'Makan Siang': [], 'Makan Malam': [], Camilan: [] };
  rows.forEach(r => {
    if (mealGroups[r.waktu_makan]) mealGroups[r.waktu_makan].push(r);
  });

  const totalProtein = rows.reduce((s, r) => s + (r.protein_g || 0), 0);
  const totalKarbo = rows.reduce((s, r) => s + (r.karbo_g || 0), 0);
  const totalLemak = rows.reduce((s, r) => s + (r.lemak_g || 0), 0);

  const isEmpty = rows.length === 0;

  const macroTargets = Store.getMacroTargets();
  const ringMacroTargets = {
    protein_g: macroTargets.protein_g || 100,
    karbo_g: macroTargets.karbo_g || 250,
    lemak_g: macroTargets.lemak_g || 67,
  };
  const ringMetrics = [
    { id: 'calories', radius: 108, value: totalKalori, target, color: 'var(--today-ring-calories)', label: 'Kalori', unit: 'kkal' },
    { id: 'protein', radius: 92, value: totalProtein, target: ringMacroTargets.protein_g, color: 'var(--today-ring-protein)', label: 'Protein', unit: 'g' },
    { id: 'carbs', radius: 76, value: totalKarbo, target: ringMacroTargets.karbo_g, color: 'var(--today-ring-carbs)', label: 'Karbo', unit: 'g' },
    { id: 'fat', radius: 60, value: totalLemak, target: ringMacroTargets.lemak_g, color: 'var(--today-ring-fat)', label: 'Lemak', unit: 'g' },
  ];
  const ringAria = ringMetrics.map(metric => {
    const percent = metric.target > 0 ? Math.round(metric.value / metric.target * 100) : 0;
    return `${metric.label} ${metric.value.toFixed(metric.unit === 'kkal' ? 0 : 1)} ${metric.unit}, ${percent} persen`;
  }).join('. ');
  const ringCircles = ringMetrics.map(metric => {
    const circumference = 2 * Math.PI * metric.radius;
    const ratio = metric.target > 0 ? Math.min(1, Math.max(0, metric.value / metric.target)) : 0;
    return `
      <circle class="ft-today-ring-track" cx="120" cy="120" r="${metric.radius}"></circle>
      <circle class="ft-today-ring-arc" id="today-ring-${metric.id}" cx="120" cy="120" r="${metric.radius}"
        stroke="${metric.color}" stroke-dasharray="${circumference.toFixed(2)}"
        stroke-dashoffset="${circumference.toFixed(2)}" data-offset="${(circumference * (1 - ratio)).toFixed(2)}"></circle>`;
  }).join('');
  const macroChips = [
    { label: 'Protein', value: totalProtein, target: ringMacroTargets.protein_g, color: 'protein' },
    { label: 'Karbo', value: totalKarbo, target: ringMacroTargets.karbo_g, color: 'carbs' },
    { label: 'Lemak', value: totalLemak, target: ringMacroTargets.lemak_g, color: 'fat' },
  ].map(macro => `
    <div class="ft-today-macro-chip">
      <i class="ft-today-macro-mark ${macro.color}" aria-hidden="true"></i>
      <small>${macro.label}</small>
      <b>${macro.value.toFixed(1)}g</b>
      <em>/ ${macro.target}g</em>
    </div>`).join('');

  const macroBars = [];
  const macroBar = (label, value, target, colorClass) => {
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    return `
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between font-label-md text-label-md">
          <span class="flex items-center gap-1.5 text-on-surface font-semibold">
            <span class="w-2.5 h-2.5 rounded-full ${colorClass} inline-block"></span>${label}
          </span>
          <span class="text-muted-foreground tabular-nums">${value.toFixed(1)} / ${target} g</span>
        </div>
        <div class="h-2 rounded-full bg-surface-container-high overflow-hidden">
          <div class="h-full rounded-full bg-primary transition-all duration-500" style="width:${pct}%"></div>
        </div>
      </div>`;
  };
  if (macroTargets.protein_g > 0) macroBars.push(macroBar('Protein', totalProtein, macroTargets.protein_g, 'bg-protein'));
  if (macroTargets.karbo_g > 0) macroBars.push(macroBar('Karbohidrat', totalKarbo, macroTargets.karbo_g, 'bg-carb'));
  if (macroTargets.lemak_g > 0) macroBars.push(macroBar('Lemak', totalLemak, macroTargets.lemak_g, 'bg-fat'));

  let companionPose = percent >= 100 ? 'senang' : percent >= 50 ? 'semangat' : 'santai';
  let companionText = percent >= 100
    ? 'Target tercapai! Limo ikut senang, mantap!'
    : percent >= 50
      ? 'Lebih dari separuh jalan! Tetap semangat penuhi nutrisi.'
      : 'Awali harimu dengan asupan gizi yang seimbang.';
  if (streak >= 3) {
    companionPose = 'semangat';
    companionText = `${streak} hari berturut-turut mencatat, keren! ${companionText}`;
  }

  const streakChip = streak >= 2
    ? `<div class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-card border border-primary-tint">
         <span class="material-symbols-outlined text-[16px] text-primary" style="font-variation-settings:'FILL' 1;">local_fire_department</span>
         <span class="font-label-md text-label-md font-bold text-on-surface">${streak} hari berturut-turut</span>
       </div>`
    : '';

  mainEl.innerHTML = `
    <!-- Progress Ring Card -->
    <section class="ft-today-progress-card">
      <div class="ft-today-ringbox" role="img" aria-label="${ringAria}">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          ${ringCircles}
        </svg>
        <div class="ft-today-ring-center">
          <b>${totalKalori.toLocaleString('id-ID')}</b>
          <span>kkal</span>
        </div>
      </div>
      <p class="ft-today-percent">
        ${percent}% tercapai • dari ${target.toLocaleString('id-ID')} kkal
      </p>
      <div class="ft-today-macro-legend">${macroChips}</div>
      ${streakChip}

      ${isEmpty ? (isToday ? `
        <div class="relative inline-flex items-center justify-center my-3">
          ${mascotImg('salam', { className: 'w-[136px] h-[136px] limo-rest', anim: 'none', id: 'limo-mascot-today' })}
        </div>
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold px-2 mt-1 leading-snug">
          ${MASCOT_TEXT.salam}
        </h2>
        <p class="font-body-md text-body-md text-muted-foreground px-4 mt-1 mb-5 text-[14px]">
          Cukup foto piringmu, Limo akan bantu perkirakan nutrisinya secara praktis.
        </p>
        <a href="#/scan" class="w-full h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform duration-150">
          <span class="material-symbols-outlined text-[20px]">photo_camera</span>
          <span>Foto Makanan</span>
        </a>
      ` : `
        <div class="relative inline-flex items-center justify-center my-3">
          ${mascotImg('tidur', { className: 'w-[120px] h-[120px] limo-rest', anim: 'none', id: 'limo-mascot-today' })}
        </div>
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold px-2 mt-1 leading-snug">
          Belum ada catatan
        </h2>
        <p class="font-body-md text-body-md text-muted-foreground px-4 mt-1 mb-5 text-[14px]">
          Tidak ada makanan yang tercatat pada hari ini.
        </p>
        <a href="#/" class="w-full h-12 rounded-full bg-card border border-border text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform duration-150">
          <span class="material-symbols-outlined text-[20px]">today</span>
          <span>Kembali ke Hari Ini</span>
        </a>
      `) : `
        <div class="ft-today-tip">
          ${mascotImg(companionPose, { className: 'w-[56px] h-[56px] limo-rest shrink-0', anim: 'none', id: 'limo-companion-today' })}
          <p>
            ${companionText}
          </p>
        </div>
      `}
    </section>

    ${!isEmpty ? `
    <!-- Macro progress (only when targets are set) -->
    <section class="bg-card rounded-[20px] border border-border p-4 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold text-[16px]">Progres Makro</h3>
        <a href="#/settings" class="font-label-md text-label-md text-secondary font-semibold">Atur</a>
      </div>
      ${macroBars.length
        ? macroBars.join('')
        : '<p class="font-label-md text-label-md text-muted-foreground">Target makro belum diatur. Buka Pengaturan untuk mengisinya.</p>'}
    </section>` : ''}

    <section class="flex flex-col gap-3 pb-8" id="meal-cards">
      <div class="flex items-baseline justify-between px-1">
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold text-[18px]">Catatan Makanan</h3>
        <span class="font-label-md text-label-md text-muted-foreground">${rows.length} item</span>
      </div>
      <div class="ft-meal-cards">
        ${buildMealCard('Sarapan', mealGroups['Sarapan'], target, selectedDateStr)}
        ${buildMealCard('Makan Siang', mealGroups['Makan Siang'], target, selectedDateStr)}
        ${buildMealCard('Makan Malam', mealGroups['Makan Malam'], target, selectedDateStr)}
        ${buildMealCard('Camilan', mealGroups['Camilan'], target, selectedDateStr)}
      </div>
    </section>
  `;

  requestAnimationFrame(() => {
    mainEl.querySelectorAll('.ft-today-ring-arc').forEach(arc => {
      arc.style.strokeDashoffset = arc.dataset.offset;
    });
  });

  // Wire delete buttons
  mainEl.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.dataset.id;
      const row = rows.find(r => String(r.id) === String(id));
      const confirmed = await showConfirm({
        title: 'Hapus catatan ini?',
        message: row ? `"${row.makanan}" akan dihapus.` : 'Catatan ini akan dihapus.',
        confirmLabel: 'Hapus',
        destructive: true,
      });
      if (!confirmed) return;
      if (container.dataset.navId !== navId) return;
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>`;
      const res = await fetchApi({ action: 'delete', id });
      if (container.dataset.navId !== navId) return;
      if (res.ok) {
        showToast('Catatan dihapus.', { type: 'success' });
        initTodayView(container);
      } else {
        showToast(res.error?.pesan || 'Gagal menghapus item.', { type: 'error' });
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">delete</span>`;
      }
    });
  });

  // Wire edit buttons (open the shared edit sheet, then refresh)
  mainEl.querySelectorAll('.btn-edit-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const row = rows.find(r => String(r.id) === String(id));
      if (!row) return;
      openItemEditSheet(container, row, () => initTodayView(container));
    });
  });

  // Activate the mascot animation for this render
  initMascotAnims(container);
}
