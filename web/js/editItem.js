// Reusable bottom-sheet editor for an already-saved log row.
//
// Opened from Hari Ini and Riwayat. Sends an `update` request so the row is
// edited in place (id, tanggal, waktu, and photo preview stay the same).
// If the Apps Script backend has not been redeployed yet and therefore does
// not know the `update` action, it transparently falls back to deleting the
// old row and logging a fresh one with the same values.

import { fetchApi } from './api.js?v20261012k';
import { getThumb, saveThumb } from './thumbs.js?v20261012k';
import { showToast } from './ui.js?v20261015a';

const MEAL_TIMES = ['Sarapan', 'Makan Siang', 'Makan Malam', 'Camilan'];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function numValue(n) {
  const v = Number(n);
  return Number.isFinite(v) ? String(v) : '0';
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function numberField(id, label, value) {
  return `
    <div class="flex flex-col gap-1.5">
      <label class="font-label-md text-label-md font-semibold text-on-surface" for="${id}">${label}</label>
      <input id="${id}" type="number" inputmode="decimal" min="0" step="any" value="${esc(numValue(value))}"
        class="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>`;
}

// Older backend (no `update` action): delete + re-log with the same values.
async function updateViaRelog(row, payload) {
  const del = await fetchApi({ action: 'delete', id: row.id });
  if (!del.ok) return del;

  const logResp = await fetchApi({
    action: 'log',
    tanggal: row.tanggal || todayStr(),
    waktu_makan: payload.waktu_makan,
    catatan: payload.catatan,
    items: [{
      nama: payload.makanan,
      berat_g: payload.berat_g,
      kalori: payload.kalori,
      protein_g: payload.protein_g,
      karbo_g: payload.karbo_g,
      lemak_g: payload.lemak_g,
    }],
  });

  // Carry the on-device photo preview over to the new id, if there was one.
  if (logResp.ok) {
    const newIds = (logResp.data && logResp.data.ids) || [];
    const thumb = getThumb(row.id);
    if (thumb && newIds.length) saveThumb(newIds, thumb);
  }
  return logResp;
}

/**
 * @param {HTMLElement} container - the current view container (sheet lives inside it)
 * @param {object} row - the log row: id, tanggal, makanan, berat_g, kalori,
 *                       protein_g, karbo_g, lemak_g, catatan, waktu_makan
 * @param {Function} onSaved - called after a successful save (refresh the view)
 */
export function openItemEditSheet(container, row, onSaved) {
  if (!container || !row || !row.id) return;
  if (container.querySelector('#item-edit-sheet')) return;

  const mealOptions = MEAL_TIMES.map((m) =>
    `<option value="${esc(m)}"${row.waktu_makan === m ? ' selected' : ''}>${esc(m)}</option>`
  ).join('');

  const sheet = document.createElement('div');
  sheet.id = 'item-edit-sheet';
  sheet.className = 'fixed inset-0 z-[120] flex items-end justify-center bg-black/40';
  sheet.innerHTML = `
    <div class="w-full max-w-[375px] bg-background rounded-t-[28px] border-t border-border shadow-2xl max-h-[92dvh] overflow-y-auto">
      <div class="sticky top-0 z-10 bg-background/95 backdrop-blur px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <div class="min-w-0">
          <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Edit catatan</h2>
          <p class="font-label-md text-label-md text-muted-foreground truncate">Perbaiki nama, porsi, atau catatan</p>
        </div>
        <button id="edit-close" type="button" aria-label="Tutup"
          class="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-container active:scale-95 transition-all shrink-0">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div class="px-5 py-4 flex flex-col gap-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-label-md font-semibold text-on-surface" for="edit-nama">Nama makanan</label>
          <input id="edit-nama" type="text" maxlength="100" value="${esc(row.makanan)}"
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-label-md font-semibold text-on-surface" for="edit-waktu">Waktu makan</label>
          <select id="edit-waktu"
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
            ${mealOptions}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          ${numberField('edit-berat', 'Berat (g)', row.berat_g)}
          ${numberField('edit-kalori', 'Kalori (kkal)', row.kalori)}
          ${numberField('edit-prot', 'Protein (g)', row.protein_g)}
          ${numberField('edit-karbo', 'Karbohidrat (g)', row.karbo_g)}
          ${numberField('edit-lemak', 'Lemak (g)', row.lemak_g)}
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-label-md font-semibold text-on-surface" for="edit-catatan">Catatan</label>
          <input id="edit-catatan" type="text" maxlength="200" value="${esc(row.catatan || '')}" placeholder="Mis. porsi setengah, warung dekat kantor"
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <p id="edit-error" class="hidden font-label-md text-label-md text-destructive" role="alert"></p>
      </div>

      <div class="sticky bottom-0 bg-background/95 backdrop-blur px-5 pb-5 pt-3 border-t border-border flex gap-2">
        <button id="edit-cancel" type="button"
          class="flex-1 h-12 rounded-full bg-card border border-border text-on-surface font-label-lg text-label-lg font-semibold active:scale-[0.98] transition-transform">
          Batal
        </button>
        <button id="edit-save" type="button"
          class="flex-1 h-12 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <span class="material-symbols-outlined text-[20px]">save</span>
          <span>Simpan</span>
        </button>
      </div>
    </div>
  `;

  container.appendChild(sheet);

  const errEl = sheet.querySelector('#edit-error');
  const saveBtn = sheet.querySelector('#edit-save');

  const close = () => sheet.remove();
  const showError = (msg) => {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  };

  sheet.querySelector('#edit-close').addEventListener('click', close);
  sheet.querySelector('#edit-cancel').addEventListener('click', close);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });

  saveBtn.addEventListener('click', async () => {
    errEl.classList.add('hidden');

    const makanan = (sheet.querySelector('#edit-nama').value || '').trim();
    if (!makanan) {
      showError('Nama makanan tidak boleh kosong.');
      return;
    }

    const payload = {
      makanan,
      waktu_makan: sheet.querySelector('#edit-waktu').value,
      catatan: (sheet.querySelector('#edit-catatan').value || '').trim(),
      berat_g: parseFloat(sheet.querySelector('#edit-berat').value) || 0,
      kalori: parseFloat(sheet.querySelector('#edit-kalori').value) || 0,
      protein_g: parseFloat(sheet.querySelector('#edit-prot').value) || 0,
      karbo_g: parseFloat(sheet.querySelector('#edit-karbo').value) || 0,
      lemak_g: parseFloat(sheet.querySelector('#edit-lemak').value) || 0,
    };

    saveBtn.disabled = true;
    const original = saveBtn.innerHTML;
    saveBtn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Menyimpan…</span>`;

    let res = await fetchApi(Object.assign({ action: 'update', id: row.id }, payload));

    // Backend not redeployed yet: emulate the edit with delete + re-log.
    if (!res.ok && res.error && res.error.kode === 'ACTION_TIDAK_DIKENAL') {
      res = await updateViaRelog(row, payload);
    }

    if (res.ok) {
      close();
      showToast('Perubahan disimpan.', { type: 'success' });
      if (typeof onSaved === 'function') onSaved();
      return;
    }

    showError(res.error?.pesan || 'Gagal menyimpan perubahan.');
    saveBtn.disabled = false;
    saveBtn.innerHTML = original;
  });
}
