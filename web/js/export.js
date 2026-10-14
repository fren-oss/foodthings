// Export all logged entries as a CSV file the user can open in Excel/Sheets.
//
// Data lives in the Google Sheet, so this is a convenience: it pulls the rows
// (in 90-day windows, which is the backend's max range per request) and saves
// them straight from the phone — no need to open the spreadsheet.

import { fetchApi } from './api.js?v20261012k';
import { showToast } from './ui.js?v20261015a';

const HEADERS = ['tanggal', 'waktu', 'waktu_makan', 'makanan', 'berat_g', 'kalori', 'protein_g', 'karbo_g', 'lemak_g', 'catatan'];
const MAX_WINDOWS = 12; // ~3 years, in 90-day chunks
const MAX_EMPTY_WINDOWS = 2; // stop after this many empty windows in a row

function fmt(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// Quote/escape a CSV cell and neutralise spreadsheet formula injection.
function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Pull every row, walking backwards in 90-day windows (backend limit).
export async function fetchAllRows() {
  const rows = [];
  const seen = new Set();
  let end = new Date();
  let emptyStreak = 0;

  for (let i = 0; i < MAX_WINDOWS; i++) {
    const start = new Date(end);
    start.setDate(start.getDate() - 89);

    const resp = await fetchApi({
      action: 'history',
      dari: fmt(start),
      sampai: fmt(end),
      ringkas: true, // photos are not part of the CSV
    });
    if (!resp.ok) {
      throw new Error(resp.error?.pesan || 'Gagal mengambil data.');
    }

    const batch = (resp.data && resp.data.rows) || [];
    if (batch.length === 0) {
      emptyStreak++;
      if (emptyStreak >= MAX_EMPTY_WINDOWS) break;
    } else {
      emptyStreak = 0;
      batch.forEach((r) => {
        if (r && r.id && !seen.has(r.id)) {
          seen.add(r.id);
          rows.push(r);
        }
      });
    }

    end = new Date(start);
    end.setDate(end.getDate() - 1);
  }

  rows.sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? -1 : 1;
    return (a.waktu || '') < (b.waktu || '') ? -1 : 1;
  });
  return rows;
}

function buildCsv(rows) {
  const lines = [HEADERS.join(',')];
  rows.forEach((r) => {
    lines.push(HEADERS.map((h) => csvCell(r[h])).join(','));
  });
  return lines.join('\r\n');
}

function download(filename, text) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

/** Fetch everything and trigger a .csv download. Shows its own toasts. */
export async function exportCsv() {
  let rows;
  try {
    rows = await fetchAllRows();
  } catch (err) {
    showToast(err.message || 'Gagal mengekspor CSV.', { type: 'error' });
    return;
  }

  if (!rows.length) {
    showToast('Belum ada catatan untuk diekspor.', { type: 'info' });
    return;
  }

  try {
    download('foodthings-' + fmt(new Date()) + '.csv', buildCsv(rows));
    showToast(rows.length + ' catatan diekspor.', { type: 'success' });
  } catch (err) {
    showToast('Gagal membuat file CSV.', { type: 'error' });
  }
}
