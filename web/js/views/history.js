import { fetchApi } from '../api.js?v20261012k';
import { initMascotAnims } from '../mascot.js?v20261012k';
import { Store } from '../store.js?v20261014b';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export async function initHistoryView(container) {
  const navId = container.dataset.navId;
  container.innerHTML = `
    <header class="app-header ft-hdr">
      <div class="ft-row">
        <button aria-label="Kembali" id="btn-history-back" class="ft-ibtn soft" type="button">
          <svg aria-hidden="true"><use href="#ft-icon-close"></use></svg>
        </button>
        <h1 class="ft-title">Riwayat</h1>
        <button aria-label="Pengaturan" id="btn-history-settings" class="ft-ibtn lime" type="button">
          <svg aria-hidden="true"><use href="#ft-icon-gear"></use></svg>
        </button>
      </div>
    </header>

    <main class="px-4 pt-3 flex flex-col gap-4 pb-32" id="history-main">
      <!-- Loading skeleton -->
      <div class="animate-pulse space-y-4" aria-hidden="true">
        <div class="pt-1">
          <div class="h-6 w-32 rounded-full bg-on-surface/10"></div>
          <div class="h-3 w-56 rounded-full bg-on-surface/10 mt-2"></div>
        </div>
        <div class="bg-card rounded-[20px] border border-border p-4">
          <div class="h-3 w-40 rounded-full bg-on-surface/10 mb-4"></div>
          <div class="h-32 rounded-xl bg-on-surface/10"></div>
        </div>
      </div>
    </main>
  `;

  document.getElementById('btn-history-back').addEventListener('click', () => {
    window.location.hash = '#/';
  });

  document.getElementById('btn-history-settings').addEventListener('click', () => {
    window.location.hash = '#/settings';
  });

  const today = new Date();
  const todayStr = formatDate(today);
  const weekAgoStr = formatDate(daysAgo(6));

  const resp = await fetchApi({ action: 'history', dari: weekAgoStr, sampai: todayStr });

  // The user may have navigated away while the request was in flight.
  if (container.dataset.navId !== navId) return;
  const mainEl = container.querySelector('#history-main');
  if (!mainEl) return;

  if (!resp.ok || !resp.data || !Array.isArray(resp.data.rows)) {
    mainEl.innerHTML = `
      <section class="ft-history-error" role="alert">
        <h2>Riwayat tidak dapat dimuat</h2>
        <p>${esc(resp.error?.pesan || 'Terjadi masalah saat mengambil data riwayat.')}</p>
        <button type="button" id="btn-history-retry">Coba lagi</button>
      </section>
    `;
    mainEl.querySelector('#btn-history-retry').addEventListener('click', () => initHistoryView(container));
    return;
  }
  const rows = resp.data.rows;

  // Group by date
  const byDate = {};
  rows.forEach(r => {
    if (!byDate[r.tanggal]) byDate[r.tanggal] = [];
    byDate[r.tanggal].push(r);
  });

  // Build 7-day bar chart data
  const chartDays = [];
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const dStr = formatDate(d);
    const dayRows = byDate[dStr] || [];
    const kal = dayRows.reduce((s, r) => s + (r.kalori || 0), 0);
    chartDays.push({ label: days[d.getDay()], dateStr: dStr, kal });
  }

  const loggedDays = chartDays.filter(d => d.kal > 0);
  const weeklyTotal = chartDays.reduce((sum, day) => sum + day.kal, 0);
  const averageLoggedDay = loggedDays.length ? Math.round(weeklyTotal / loggedDays.length) : 0;
  const targetCalories = Store.getTargetCalories();
  const macroTotals = rows.reduce((totals, row) => ({
    protein: totals.protein + (Number(row.protein_g) || 0),
    carbs: totals.carbs + (Number(row.karbo_g) || 0),
    fat: totals.fat + (Number(row.lemak_g) || 0),
  }), { protein: 0, carbs: 0, fat: 0 });
  const macroGrams = macroTotals.protein + macroTotals.carbs + macroTotals.fat;
  const macroPercent = {
    protein: macroGrams ? Math.round(macroTotals.protein / macroGrams * 100) : 0,
    carbs: macroGrams ? Math.round(macroTotals.carbs / macroGrams * 100) : 0,
    fat: macroGrams ? 100 - Math.round(macroTotals.protein / macroGrams * 100) - Math.round(macroTotals.carbs / macroGrams * 100) : 0,
  };
  const weeklyTargetPercent = targetCalories > 0 ? Math.round(weeklyTotal / targetCalories * 100) : 0;
  const chartScale = Math.max(targetCalories, 1);
  const weeklyInsight = loggedDays.length === 7
    ? 'Kamu mencatat makanan setiap hari minggu ini. Pertahankan kebiasaan baik ini!'
    : loggedDays.length >= 4
      ? `Konsistensimu makin baik, ${loggedDays.length} dari 7 hari sudah tercatat.`
      : loggedDays.length > 0
        ? `${loggedDays.length} dari 7 hari tercatat. Sedikit demi sedikit, kebiasaan baik terbentuk.`
        : 'Mulai catat makanan hari ini untuk membangun kebiasaan baik.';
  mainEl.innerHTML = `
    <section class="ft-history-intro">
      <p>Perkiraan konsumsi &amp; catatan nutrisi</p>
    </section>

    <section id="history-chart" class="ft-history-card">
      <div class="ft-history-chart-heading">
        <div>
          <p class="ft-history-muted">7 hari terakhir</p>
          <p><b class="ft-history-average">${averageLoggedDay.toLocaleString('id-ID')}</b> <span class="ft-history-muted">kkal/hari rata-rata</span></p>
        </div>
      </div>
      <div class="ft-history-chart">
        <div class="ft-history-goal" style="top:${Math.max(0, 100 - Math.min(1, targetCalories / chartScale) * 100)}%">
          <span>Target ${targetCalories.toLocaleString('id-ID')}</span>
        </div>
        <div class="ft-history-bars" id="history-bars" role="group" aria-label="Kalori per hari">
          ${chartDays.map((day, index) => {
            const height = day.kal > 0 ? Math.max(8, Math.min(100, day.kal / chartScale * 100)) : 8;
            return `
              <button type="button" class="ft-history-bar ${day.kal > 0 ? 'has' : 'empty'}" data-chart-date="${day.dateStr}" aria-pressed="${index === chartDays.length - 1}" aria-label="${day.label} ${new Date(`${day.dateStr}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}, ${day.kal ? `${day.kal.toLocaleString('id-ID')} kkal` : 'belum ada catatan'}">
                <span class="ft-history-fill" style="height:${height}%"></span>
                <small>${day.label}</small>
              </button>
            `;
          }).join('')}
        </div>
      </div>
      <div class="ft-history-detail" id="history-detail" aria-live="polite"></div>
    </section>

    <section class="ft-history-card">
      <h2>Ringkasan 7 hari</h2>
      <div class="ft-history-stats">
        <div><b>${weeklyTotal.toLocaleString('id-ID')}</b><span>kkal total</span></div>
        <div><b>${loggedDays.length}/7</b><span>hari tercatat</span></div>
        <div><b>${weeklyTargetPercent}%</b><span>dari target</span></div>
      </div>
      <div class="ft-history-dots" role="img" aria-label="${loggedDays.length} dari 7 hari memiliki catatan">
        ${chartDays.map(day => `<i class="${day.kal > 0 ? 'on' : ''}" aria-hidden="true"></i>`).join('')}
      </div>
      <p class="ft-history-insight"><b>${loggedDays.length ? (loggedDays.length === 7 ? 'Hebat, kamu konsisten!' : 'Kamu sudah mulai!') : 'Belum ada catatan.'}</b> ${weeklyInsight}</p>
      <div class="ft-history-macro">
        <p>Komposisi makro</p>
        <div class="ft-history-split" role="img" aria-label="Komposisi makro: protein ${macroPercent.protein} persen, karbo ${macroPercent.carbs} persen, lemak ${macroPercent.fat} persen">
          <i class="protein" style="width:${macroPercent.protein}%"></i>
          <i class="carbs" style="width:${macroPercent.carbs}%"></i>
          <i class="fat" style="width:${macroPercent.fat}%"></i>
        </div>
        <div class="ft-history-keys">
          <span><i class="protein"></i>Protein <b>${macroPercent.protein}%</b></span>
          <span><i class="carbs"></i>Karbo <b>${macroPercent.carbs}%</b></span>
          <span><i class="fat"></i>Lemak <b>${macroPercent.fat}%</b></span>
        </div>
      </div>
      <p class="ft-history-note">Rata-rata dihitung dari hari yang memiliki catatan. Berdasarkan data tercatat, bukan saran medis.</p>
    </section>
  `;

  const renderSelectedDay = (dateStr) => {
    const day = chartDays.find(item => item.dateStr === dateStr);
    const dayRows = byDate[dateStr] || [];
    const dayMacros = dayRows.reduce((totals, row) => ({
      protein: totals.protein + (Number(row.protein_g) || 0),
      carbs: totals.carbs + (Number(row.karbo_g) || 0),
      fat: totals.fat + (Number(row.lemak_g) || 0),
    }), { protein: 0, carbs: 0, fat: 0 });
    const date = new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const detail = mainEl.querySelector('#history-detail');
    detail.innerHTML = `
      <div class="ft-history-detail-heading">
        <div>
          <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
          <b>${day.label}, ${date}</b>
        </div>
        <span class="ft-history-entry-count">${dayRows.length} catatan</span>
      </div>
      ${dayRows.length ? `
        <div class="ft-history-day-macros">
          <span>Protein <b>${dayMacros.protein.toFixed(1)}g</b></span>
          <span>Karbo <b>${dayMacros.carbs.toFixed(1)}g</b></span>
          <span>Lemak <b>${dayMacros.fat.toFixed(1)}g</b></span>
        </div>
      ` : '<p class="ft-history-day-empty">Belum ada makanan tercatat pada tanggal ini.</p>'}
    `;
  };
  renderSelectedDay(todayStr);

  mainEl.querySelectorAll('[data-chart-date]').forEach(bar => {
    bar.addEventListener('click', () => {
      const dateStr = bar.dataset.chartDate;
      mainEl.querySelectorAll('[data-chart-date]').forEach(dayBar => {
        const isSelected = dayBar.dataset.chartDate === dateStr;
        dayBar.setAttribute('aria-pressed', String(isSelected));
      });
      renderSelectedDay(dateStr);
    });
  });

  initMascotAnims(container);
}
