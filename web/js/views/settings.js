import { Store } from '../store.js?v20261013b';
import { mascotImg, initMascotAnims } from '../mascot.js?v20261012k';
import { showToast } from '../ui.js?v20261015a';
import { exportCsv } from '../export.js?v20261015a';

export function initSettingsView(container) {
  let target = Store.getTargetCalories();
  let profile = Store.getProfile();
  let macros = Store.getMacroTargets();
  const savedCalculation = Store.getSavedCalorieCalculation();
  let calculatorResult = savedCalculation
    ? { tdee: savedCalculation.tdee, goals: getGoalSuggestions(savedCalculation.tdee) }
    : null;

  function renderTarget() {
    return `${target.toLocaleString('id-ID')} <span class="font-label-lg text-label-lg font-semibold text-muted-foreground">kkal</span>`;
  }

  function macroRow(key, label, dotClass) {
    const val = macros[key] || 0;
    return `
      <div class="flex items-center justify-between gap-3 bg-background rounded-xl p-2.5 border border-border" data-macro="${key}">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full ${dotClass} inline-block shrink-0"></span>
          <span class="font-label-lg text-label-lg font-semibold text-on-surface truncate">${label}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button aria-label="Kurangi ${label}" class="macro-minus w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-on-surface active:scale-95 transition-transform" type="button">
            <span class="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <span class="w-12 text-center font-label-lg text-label-lg font-bold text-on-surface tabular-nums" data-macro-value>${val}</span>
          <span class="font-label-md text-label-md text-muted-foreground">g</span>
          <button aria-label="Tambah ${label}" class="macro-plus w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-on-surface active:scale-95 transition-transform" type="button">
            <span class="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>`;
  }

  container.innerHTML = `
    <header class="app-header ft-hdr">
      <div class="ft-row back">
      <button aria-label="Tutup" class="ft-ibtn soft" id="btn-settings-back" type="button">
        <svg aria-hidden="true"><use href="#ft-icon-close"></use></svg>
      </button>
      <h1 class="ft-title">Pengaturan</h1>
      </div>
    </header>

    <main class="px-4 space-y-4 pt-1 pb-32">
      <!-- Section 1: Target Kalori Harian -->
      <section class="bg-card rounded-2xl border border-border p-4">
        <div class="flex items-start justify-between mb-1">
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Target kalori harian</h2>
          <span class="material-symbols-outlined text-primary text-xl">track_changes</span>
        </div>
        <p class="font-label-md text-label-md text-muted-foreground mb-4">Digunakan sebagai acuan lingkaran capaian gizi setiap hari.</p>
        <div class="bg-background rounded-xl p-3 border border-border flex items-center justify-between mb-3">
          <button aria-label="Kurang 50 kkal" class="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-transform duration-150" id="btn-cal-minus" type="button">
            <span class="material-symbols-outlined">remove</span>
          </button>
          <div class="text-center">
            <div class="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight" id="calorie-target-display">
              ${renderTarget()}
            </div>
            <span class="font-label-md text-label-md text-muted-foreground">Kelipatan 50 kkal</span>
          </div>
          <button aria-label="Tambah 50 kkal" class="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-transform duration-150" id="btn-cal-plus" type="button">
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>
        <div class="flex items-center gap-2 justify-center">
          <button class="px-3.5 py-1.5 rounded-full bg-background border border-border font-label-md text-label-md text-on-surface hover:bg-surface-container active:scale-95 transition-transform quick-adjust" data-delta="-100" type="button">-100</button>
          <button class="px-3.5 py-1.5 rounded-full bg-background border border-border font-label-md text-label-md text-on-surface hover:bg-surface-container active:scale-95 transition-transform quick-adjust" data-delta="50" type="button">+50</button>
          <button class="px-3.5 py-1.5 rounded-full bg-background border border-border font-label-md text-label-md text-on-surface hover:bg-surface-container active:scale-95 transition-transform quick-adjust" data-delta="100" type="button">+100</button>
        </div>
      </section>

      <!-- Section 2: Target Makro Harian -->
      <section class="bg-card rounded-2xl border border-border p-4">
        <div class="flex items-start justify-between mb-1">
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Target makro harian</h2>
          <span class="material-symbols-outlined text-primary text-xl">monitor_weight</span>
        </div>
        <p class="font-label-md text-label-md text-muted-foreground mb-4">Opsional. Atur target protein, karbohidrat, dan lemak (gram) — progresnya tampil di halaman Hari Ini.</p>
        <div class="space-y-2.5" id="macro-targets">
          ${macroRow('protein_g', 'Protein', 'bg-protein')}
          ${macroRow('karbo_g', 'Karbohidrat', 'bg-carb')}
          ${macroRow('lemak_g', 'Lemak', 'bg-fat')}
        </div>
        <button class="w-full mt-3 h-11 rounded-full bg-background border border-border text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-surface-container active:scale-95 transition-all duration-150" id="btn-macro-auto" type="button">
          <span class="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          <span>Isi otomatis dari target kalori</span>
        </button>
        <p class="font-label-md text-label-md text-muted-foreground mt-2 text-center">Saran: 30% protein · 45% karbo · 25% lemak</p>
      </section>

      <!-- Section 3: Kalkulator Kebutuhan Kalori -->
      <section class="bg-card rounded-2xl border border-border p-4">
        <div class="flex items-start justify-between mb-1">
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Kalkulator kebutuhan kalori</h2>
          <span class="material-symbols-outlined text-muted-foreground text-xl">calculate</span>
        </div>
        <p class="font-label-md text-label-md text-muted-foreground mb-4">Hitung estimasi pengeluaran energi harian (TDEE) berdasarkan profil tubuhmu.</p>
        <form class="space-y-3.5" id="calc-form">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1" for="input-bb">Berat badan</label>
              <div class="relative flex items-center">
                <input class="w-full bg-card border border-border rounded-xl px-3 py-2.5 pr-10 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring" id="input-bb" type="number" value="${profile.weight}" min="30" max="300"/>
                <span class="absolute right-3 font-label-md text-label-md text-muted-foreground pointer-events-none">kg</span>
              </div>
            </div>
            <div>
              <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1" for="input-tb">Tinggi badan</label>
              <div class="relative flex items-center">
                <input class="w-full bg-card border border-border rounded-xl px-3 py-2.5 pr-10 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring" id="input-tb" type="number" value="${profile.height}" min="100" max="250"/>
                <span class="absolute right-3 font-label-md text-label-md text-muted-foreground pointer-events-none">cm</span>
              </div>
            </div>
          </div>
          <div>
            <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1" for="input-usia">Usia</label>
            <div class="relative flex items-center">
              <input class="w-full bg-card border border-border rounded-xl px-3 py-2.5 pr-14 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring" id="input-usia" type="number" value="${profile.age}" min="10" max="120"/>
              <span class="absolute right-3 font-label-md text-label-md text-muted-foreground pointer-events-none">tahun</span>
            </div>
          </div>
          <div>
            <span class="block font-label-md text-label-md font-semibold text-on-surface mb-1.5">Jenis kelamin</span>
            <div class="grid grid-cols-2 gap-2.5">
              <label id="label-pria" class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border cursor-pointer transition-colors font-label-lg text-label-lg font-semibold ${profile.gender === 'M' ? 'border-[#8CCB2F] bg-[#8CCB2F] text-[#335200]' : 'border-border bg-card text-on-surface'}">
                <input class="sr-only" name="gender" type="radio" value="M" ${profile.gender === 'M' ? 'checked' : ''}/>
                <span>Pria</span>
              </label>
              <label id="label-wanita" class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border cursor-pointer transition-colors font-label-lg text-label-lg font-semibold ${profile.gender === 'F' ? 'border-[#8CCB2F] bg-[#8CCB2F] text-[#335200]' : 'border-border bg-card text-on-surface'}">
                <input class="sr-only" name="gender" type="radio" value="F" ${profile.gender === 'F' ? 'checked' : ''}/>
                <span>Wanita</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1" for="select-aktivitas">Tingkat aktivitas</label>
            <div class="relative">
              <select class="w-full bg-card border border-border rounded-xl px-3 py-2.5 pr-8 font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-ring" id="select-aktivitas">
                <option value="1.2" ${profile.activity == 1.2 ? 'selected' : ''}>Jarang bergerak</option>
                <option value="1.375" ${profile.activity == 1.375 ? 'selected' : ''}>Ringan (1-3 hari/minggu)</option>
                <option value="1.55" ${profile.activity == 1.55 ? 'selected' : ''}>Sedang (3-5 hari/minggu)</option>
                <option value="1.725" ${profile.activity == 1.725 ? 'selected' : ''}>Berat (6-7 hari/minggu)</option>
                <option value="1.9" ${profile.activity == 1.9 ? 'selected' : ''}>Sangat berat (atlet/pekerja fisik)</option>
              </select>
              <span class="material-symbols-outlined absolute right-2.5 top-3 text-muted-foreground pointer-events-none">arrow_drop_down</span>
            </div>
          </div>
          <button class="w-full h-12 rounded-full bg-card border border-border text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-surface-container active:scale-95 transition-all duration-150" id="btn-hitung" type="button">
            <span class="material-symbols-outlined text-primary text-xl">calculate</span>
            <span>Hitung saran</span>
          </button>
        </form>
        <!-- Result (hidden initially) -->
        <div class="mt-4 p-4 rounded-2xl bg-[#E6F5C9] border border-[#CFE8A0] hidden" id="calc-result">
          <div class="flex items-center gap-1.5 text-secondary font-label-md text-label-md font-medium mb-1">
            <span class="material-symbols-outlined text-base">insights</span>
            <span>Estimasi kebutuhan harian (TDEE)</span>
          </div>
          <div class="font-headline-sm text-headline-sm font-bold text-on-primary-fixed mb-3" id="calc-tdee-text">-</div>
          <div class="space-y-2.5" id="calc-goal-list"></div>
          <p class="mt-3 text-xs text-stone-600 leading-relaxed text-center">Perkiraan umum, bukan saran medis; konsultasikan ke tenaga kesehatan untuk kebutuhan khusus.</p>
          <button class="w-full mt-3 h-11 rounded-full bg-primary-container text-on-primary-container font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform" id="btn-calc-save" type="button">
            <span class="material-symbols-outlined text-[20px]">save</span>
            <span>Simpan hasil perhitungan</span>
          </button>
        </div>
      </section>

      <!-- Section 4: Ekspor Data -->
      <section class="bg-card rounded-2xl border border-border p-4">
        <div class="flex items-start justify-between mb-1">
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Ekspor data</h2>
          <span class="material-symbols-outlined text-primary text-xl">download</span>
        </div>
        <p class="font-label-md text-label-md text-muted-foreground mb-4">Unduh semua catatanmu sebagai file CSV — bisa dibuka di Excel, Google Sheets, atau Numbers.</p>
        <button class="w-full h-12 rounded-full bg-background border border-border text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-surface-container active:scale-95 transition-all duration-150" id="btn-export-csv" type="button">
          <span class="material-symbols-outlined text-primary text-xl">download</span>
          <span>Ekspor CSV</span>
        </button>
        <p class="font-label-md text-label-md text-muted-foreground mt-2 text-center">Foto tidak ikut — hanya tanggal, makanan, gizi, dan catatan.</p>
      </section>

      <!-- Section 5: Privasi -->
      <section class="bg-card rounded-2xl border border-border p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-primary text-xl">security</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Privasi</h2>
        </div>
        <p class="font-body-md text-body-md font-bold text-on-surface mb-1">Foto lengkap tidak disimpan. Hanya pratinjau kecil yang disimpan bersama catatanmu.</p>
        <p class="font-label-md text-label-md text-muted-foreground leading-relaxed">FoodThings tidak menyimpan foto makanan berukuran penuh di server maupun galeri cloud. Foto hanya dikirim untuk dianalisis lalu dibuang; yang tersimpan hanyalah pratinjau kecil agar catatanmu menampilkan foto yang dipindai.</p>
      </section>

      <!-- Disclaimer Banner -->
      <aside class="rounded-xl bg-[#E6F5C9] border border-[#CFE8A0] p-3.5 flex items-center gap-3">
        <span class="material-symbols-outlined text-primary text-xl shrink-0">info</span>
        <p class="font-label-md text-label-md text-on-primary-fixed leading-snug">Hasil dari foto hanyalah perkiraan, bukan saran medis.</p>
      </aside>

      <footer class="pt-2 pb-4 text-center">
        <p class="font-label-md text-label-md text-muted-foreground">FoodThings v1.0.0 • Dibuat dengan ramah 🍋</p>
      </footer>
    </main>
  `;

  // --- Wire all interactions ---

  // Back button
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    window.location.hash = '#/';
  });

  // Calorie stepper
  function updateCalDisplay() {
    document.getElementById('calorie-target-display').innerHTML = renderTarget();
    Store.setTargetCalories(target);
  }

  document.getElementById('btn-cal-minus').addEventListener('click', () => {
    target = Math.max(500, target - 50);
    updateCalDisplay();
  });
  document.getElementById('btn-cal-plus').addEventListener('click', () => {
    target = Math.min(9999, target + 50);
    updateCalDisplay();
  });
  document.querySelectorAll('.quick-adjust').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.delta);
      target = Math.max(500, Math.min(9999, target + delta));
      updateCalDisplay();
    });
  });

  // Macro targets
  function refreshMacroRows() {
    document.querySelectorAll('#macro-targets [data-macro]').forEach(row => {
      row.querySelector('[data-macro-value]').textContent = macros[row.dataset.macro] || 0;
    });
    Store.setMacroTargets(macros);
  }
  document.querySelectorAll('#macro-targets .macro-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.closest('[data-macro]').dataset.macro;
      macros[key] = Math.max(0, (macros[key] || 0) - 5);
      refreshMacroRows();
    });
  });
  document.querySelectorAll('#macro-targets .macro-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.closest('[data-macro]').dataset.macro;
      macros[key] = Math.min(1000, (macros[key] || 0) + 5);
      refreshMacroRows();
    });
  });
  document.getElementById('btn-macro-auto').addEventListener('click', () => {
    const round5 = (v) => Math.max(0, Math.round(v / 5) * 5);
    macros.protein_g = round5(target * 0.30 / 4);
    macros.karbo_g = round5(target * 0.45 / 4);
    macros.lemak_g = round5(target * 0.25 / 9);
    refreshMacroRows();
  });

  // Gender radio visual
  document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const labelPria = document.getElementById('label-pria');
      const labelWanita = document.getElementById('label-wanita');
      if (radio.value === 'M') {
        labelPria.className = labelPria.className.replace('border-border bg-card text-on-surface', 'border-[#8CCB2F] bg-[#8CCB2F] text-[#335200]');
        labelWanita.className = labelWanita.className.replace('border-[#8CCB2F] bg-[#8CCB2F] text-[#335200]', 'border-border bg-card text-on-surface');
      } else {
        labelWanita.className = labelWanita.className.replace('border-border bg-card text-on-surface', 'border-[#8CCB2F] bg-[#8CCB2F] text-[#335200]');
        labelPria.className = labelPria.className.replace('border-[#8CCB2F] bg-[#8CCB2F] text-[#335200]', 'border-border bg-card text-on-surface');
      }
    });
  });

  // Mifflin-St Jeor calculator
  function applyTarget(kcal) {
    target = kcal;
    updateCalDisplay();
    container.scrollTop = 0;
    const display = document.getElementById('calorie-target-display');
    display?.classList.add('text-primary');
    setTimeout(() => display?.classList.remove('text-primary'), 1000);
  }

  function getGoalSuggestions(tdee) {
    const round50 = (value) => Math.max(500, Math.min(9999, Math.round(value / 50) * 50));
    return [
      { label: 'Jaga berat', desc: 'Kalori pemeliharaan', kcal: round50(tdee) },
      { label: 'Diet (turunkan berat)', desc: 'Defisit ~500 kkal · ±0,5 kg/minggu', kcal: round50(Math.max(1200, tdee - 500)) },
      { label: 'Bulking (naikkan massa)', desc: 'Surplus ~300 kkal · naik bertahap', kcal: round50(tdee + 300) }
    ];
  }

  function renderCalculatorResult(result) {
    document.getElementById('calc-tdee-text').textContent = `TDEE: ${result.tdee.toLocaleString('id-ID')} kkal`;
    const listEl = document.getElementById('calc-goal-list');
    listEl.innerHTML = result.goals.map(g => `
      <div class="flex items-center justify-between gap-3 bg-card rounded-xl p-3 border border-border">
        <div class="min-w-0">
          <p class="font-label-lg text-label-lg font-semibold text-on-surface">${g.label}</p>
          <p class="font-label-md text-label-md text-muted-foreground leading-snug">${g.desc}</p>
        </div>
        <div class="flex flex-col items-end shrink-0">
          <span class="font-label-lg text-label-lg font-extrabold text-on-surface">${g.kcal.toLocaleString('id-ID')} <span class="font-normal text-muted-foreground text-xs">kkal</span></span>
          <button class="mt-1 px-3.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold active:scale-95 transition-transform duration-150 btn-pakai-goal" data-kcal="${g.kcal}" type="button">Pakai</button>
        </div>
      </div>`).join('');

    listEl.querySelectorAll('.btn-pakai-goal').forEach(btn => {
      btn.addEventListener('click', () => applyTarget(parseInt(btn.dataset.kcal)));
    });
    document.getElementById('calc-result').classList.remove('hidden');
  }

  if (calculatorResult) renderCalculatorResult(calculatorResult);

  document.getElementById('btn-calc-save').addEventListener('click', () => {
    if (!calculatorResult) return;
    try {
      Store.setSavedCalorieCalculation(calculatorResult);
      showToast('Hasil kalkulator berhasil disimpan.', { type: 'success' });
    } catch (err) {
      console.error('Gagal menyimpan hasil kalkulator:', err);
      showToast('Hasil kalkulator gagal disimpan. Periksa penyimpanan perangkat.', { type: 'error' });
    }
  });

  document.getElementById('btn-hitung').addEventListener('click', () => {
    const bb = parseFloat(document.getElementById('input-bb').value);
    const tb = parseFloat(document.getElementById('input-tb').value);
    const usia = parseFloat(document.getElementById('input-usia').value);
    const genderVal = document.querySelector('input[name="gender"]:checked')?.value || 'M';
    const activity = parseFloat(document.getElementById('select-aktivitas').value);

    if (!bb || !tb || !usia || bb < 30 || tb < 100 || usia < 10) {
      showToast('Masukkan data yang valid (berat, tinggi, usia).', { type: 'error' });
      return;
    }

    // Mifflin-St Jeor
    let bmr;
    if (genderVal === 'M') {
      bmr = 10 * bb + 6.25 * tb - 5 * usia + 5;
    } else {
      bmr = 10 * bb + 6.25 * tb - 5 * usia - 161;
    }
    const tdee = Math.round(bmr * activity / 50) * 50; // round to nearest 50

    // Save profile
    Store.setProfile({ weight: bb, height: tb, age: usia, gender: genderVal, activity });
    profile = Store.getProfile();

    const goals = getGoalSuggestions(tdee);
    calculatorResult = { tdee, goals };
    renderCalculatorResult(calculatorResult);
  });

  // Export CSV
  document.getElementById('btn-export-csv').addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-csv');
    if (btn.disabled) return;
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Menyiapkan…</span>`;
    try {
      await exportCsv();
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });

  initMascotAnims(container);
}
