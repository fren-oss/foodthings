# FoodThings

Pelacak kalori dan nutrisi **hanya dari foto**. Frontend statis (HTML/CSS/JS murni), backend Google Apps Script + Google Sheets, analisis gambar oleh Google Gemini (vision).

Dokumen produk dan desain: [`docs/PRD.md`](docs/PRD.md) dan [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Ringkasan arsitektur

```
[Browser (statis)]  --POST text/plain JSON-->  [Apps Script Web App]
                                                   |        |
                                                   |        +--> [Google Sheet: log]
                                                   +--> UrlFetchApp --> [Gemini API (vision)]
```

- Foto **tidak pernah disimpan** (tidak di Sheet, Drive, maupun log).
- API key hanya hidup di Script Properties, tidak pernah dikirim ke frontend.
- Pengaman biaya sebenarnya adalah **kuota analisis per hari** di backend.

---

## Struktur folder

```
FoodThings/
├─ README.md
├─ docs/                    # dokumen produk dan desain
│  ├─ PRD.md
│  └─ DESIGN.md
├─ design/references/       # sumber desain Stitch dan cuplikan referensi
├─ scripts/                 # server lokal dan skrip utilitas
├─ web/                     # frontend statis (yang di-deploy)
│  ├─ index.html
│  ├─ css/                  # tokens.css, components.css, mascot-animations.css
│  ├─ js/
│  │  ├─ config.js          # <-- isi WEB_APP_URL & APP_TOKEN di sini
│  │  ├─ api.js  image.js  store.js  mascot.js
│  │  └─ views/             # today.js, scan.js, history.js, settings.js
│  └─ assets/mascot/        # pose Limo (PNG/WebP transparan)
└─ apps-script/
   ├─ Code.gs
   └─ appsscript.json
```

> Folder `web/mascot/` (jika ada) adalah salinan lembar asli berukuran besar untuk kerja desain. **Jangan ikut di-deploy**; yang dipakai frontend hanya `web/assets/mascot/`.

---

## Prasyarat

- Akun Google (untuk Sheet + Apps Script).
- Kunci API Google Gemini (gratis) dari Google AI Studio (<https://aistudio.google.com/apikey>).
- Frontend dijalankan lewat server lokal atau hosting statis (GitHub Pages / Cloudflare Pages). Membuka `index.html` langsung dari `file://` **tidak** bekerja karena ES modules.

---

## Bagian A — Backend (Google Apps Script)

### A1. Buat Google Sheet

1. Buka <https://sheets.google.com> → **Blank spreadsheet**.
2. Beri nama, mis. `FoodThings Data`. Sheet `log` akan dibuat otomatis oleh script, jadi kamu tidak perlu mengetik header.

### A2. Buka editor Apps Script

Di spreadsheet: **Extensions → Apps Script**. Sebuah proyek bernama "Untitled project" terbuka.

### A3. Tempel kode

1. Ganti seluruh isi `Code.gs` di editor dengan isi [`apps-script/Code.gs`](apps-script/Code.gs), lalu simpan (Ctrl/Cmd + S).

> **`appsscript.json` tidak wajib.** Semua yang dibutuhkan sudah ditangani oleh `Code.gs` dan dialog Deploy:
>
> - **Zona waktu:** `Code.gs` menulis `'Asia/Jakarta'` secara eksplisit, jadi tidak bergantung pada manifest.
> - **Scope OAuth** (Sheets + `script.external_request`): dideteksi otomatis oleh Apps Script saat kamu Run/Deploy — layar izin akan menampilkan keduanya.
> - **Akses Web App:** diatur di dialog Deploy (langkah A6), bukan di manifest.
>
> Kalau kamu tetap ingin memakai manifest (opsional): buka **Project Settings** (ikon gerigi) → centang **"Show `appsscript.json` manifest file in editor"** → buka `appsscript.json` dan ganti dengan isi [`apps-script/appsscript.json`](apps-script/appsscript.json).

### A4. Isi Script Properties

**Project Settings → Script Properties → Add script property**:

| Properti              | Nilai                                                                                                                                                                             | Wajib |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `GEMINI_API_KEY`      | kunci API Gemini dari Google AI Studio (`AIza...`)                                                                                                                                | ya    |
| `MODEL_NAME`          | mis. `gemini-3.5-flash-lite` (**tercepat**, disarankan) atau `gemini-3.8-flash` (lebih akurat, lebih lambat)                                                                      | ya    |
| `APP_TOKEN`           | kata sandi acak buatanmu, mis. `ft_` + 24 karakter acak                                                                                                                           | ya    |
| `MAX_ANALYZE_PER_DAY` | angka, default `30`                                                                                                                                                               | tidak |
| `SHEET_ID`            | ID Google Sheet (bagian URL antara `/d/` dan `/edit`), mis. `1abc...`. **Disarankan** agar backend selalu membuka Sheet yang benar saat dijalankan sebagai Web App (lihat A6/A7). | tidak |
| `THINKING_BUDGET`     | angka `0` (default, mematikan "thinking" → jauh lebih cepat). Naikkan (mis. `512`) untuk akurasi lebih, atau `-1` untuk tidak mengirim `thinkingConfig`.                          | tidak |

> Simpan `APP_TOKEN` ini — nilainya harus sama persis dengan yang kamu tulis di `web/js/config.js` nanti.

> **Kecepatan analisis.** Latensi terbesar berasal dari model Gemini. Jika analisis terasa lama, pakai `MODEL_NAME=gemini-3.5-flash-lite` dan biarkan `THINKING_BUDGET=0`. Model "flash" yang besar bisa memakan 30–120 detik per foto.

### A5. Siapkan Sheet & otorisasi pertama

1. Di editor, pilih fungsi **`setupSpreadsheet`** pada dropdown lalu klik **Run**.
2. Google meminta izin → **Review permissions** → pilih akun → **Advanced → Go to (proyek) (unsafe)** → **Allow**.
   (Peringatan "unsafe" wajar karena script dibuat sendiri, belum diverifikasi Google.)
3. Sheet `log` beserta header otomatis dibuat. Header dibekukan, diberi format, dan filter diaktifkan; lebar kolom juga diatur.

Opsional: jalankan `setupRekap` untuk membuat sheet `rekap` (total kalori 7 hari + grafik batang).

### A5b. Aktifkan Google Sheets API (wajib, sekali saja)

Backend membaca/menulis data lewat **Google Sheets API** supaya tidak bentrok dengan fitur "typed column" Google (fitur yang membuat operasi simpan/baca gagal tidak menentu — lihat Troubleshooting). Aktifkan sekali:

1. Di editor Apps Script, buka panel **Services** di sisi kiri (ikon **+**).
2. Klik **+** (Add a service) → pilih **Google Sheets API** → klik **Add**.
3. File `appsscript.json` kini memuat baris `"sheets": {}` — pastikan tersimpan (**Cmd+S**).
4. Pilih `setupSpreadsheet` lalu klik **Run** sekali lagi untuk menerapkan format sheet `log`.

> Tanpa layanan ini setup menampilkan error `SETUP_SHEETS_API`, sedangkan aksi data menampilkan pesan yang sama. Aktifkan, jalankan `setupSpreadsheet` lagi, lalu deploy **New version** (A7).

### A6. Deploy Web App

1. Klik **Deploy → New deployment**.
2. Pilih tipe **Web app**.
3. Isi:
   - **Description**: `FoodThings v1`
   - **Execute as**: **Me** ← harus "Me" (pemilik), **bukan** "User accessing the web app". Jika bukan "Me", script dijalankan tanpa izin membuka Sheet sehingga simpan/baca gagal.
   - **Who has access**: **Anyone**
4. Klik **Deploy**, lalu salin **Web app URL** (berakhiran `/exec`).

> Simpan URL ini. Digunakan sebagai `WEB_APP_URL` di frontend.

### A7. (Penting) Cara mengubah kode setelah deploy

Setiap kali kamu mengubah `Code.gs`, deployment lama **tidak otomatis ikut berubah**:

1. **Deploy → Manage deployments**.
2. Klik ikon pensil pada deployment aktif → **Version: New version** → **Deploy**.

URL `/exec` tetap sama, jadi `config.js` tidak perlu diubah.

> **Perubahan Code.gs terbaru yang perlu di-deploy:** akses data memakai **Google Sheets API** (aktifkan dulu di A5b); tersedia `SHEET_ID` + pesan error Sheet yang jelas, aksi `update` (edit catatan yang sudah tersimpan), dan flag `ringkas` pada `history` (optimasi hitung streak). Data log ditambahkan dengan operasi `values.append` ke tab `log`. Jalankan `setupSpreadsheet` bila perlu membuat sheet/header atau menerapkan format, lalu deploy **New version**. Backend tidak membuat atau mengelola Table bawaan.

> Untuk memastikan deployment aktif, buka URL Web App `/exec` di browser. Respons JSON harus menunjukkan versi backend **`2026-10-14e16`**.

---

## Bagian B — Frontend

### B1. Isi konfigurasi

Edit [`web/js/config.js`](web/js/config.js):

```js
export const CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/XXXXXXXX/exec", // dari A6
  APP_TOKEN: "APP_TOKEN_SAMA_DENGAN_A4",
};
```

`APP_TOKEN` di frontend pastinya terlihat di kode sumber — memang bukan rahasia sejati. Penjaga biaya yang sebenarnya adalah `MAX_ANALYZE_PER_DAY` (A4).

### B2. Jalankan secara lokal

```bash
# dari folder FoodThings/
python3 scripts/serve.py
```

Script ini menyajikan folder `web/` dengan cache **dimatikan** dan mencetak dua alamat:

- `http://localhost:8123` — di komputer
- `http://<ip-lan-komputer>:8123` — di iPhone (WiFi yang sama)

> Pakai `scripts/serve.py`, bukan `python3 -m http.server`, supaya HP tidak "nyangkut" versi lama. Kalau memakai `python3 -m http.server 8123 --directory web`, browser HP bisa menyimpan sebagian file lama (mis. `store.js` balas `304`) sehingga fitur baru tidak muncul — tarik-refresh atau hapus data situs untuk mengatasinya.

> Backend juga bisa diuji lewat `curl` (lihat Bagian C). Jika `WEB_APP_URL` masih placeholder, halaman Hari Ini/Riwayat dan tombol Analisis akan menampilkan pesan error yang ramah; UI dan animasi maskot tetap tampil.

### B3. Deploy frontend (produksi)

**GitHub Pages:**

1. Push folder ini ke sebuah repo GitHub.
2. Repo → **Settings → Pages** → Source: branch `main`, folder `/root` atau `/docs`.
3. Jika memakai root, pastikan sub-folder `web/` diakses sebagai `https://<user>.github.io/<repo>/web/`.

**Cloudflare Pages:**

1. Hubungkan repo, atur **Build output directory** ke `web` (tanpa build command).
2. Setelah deploy, buka domain yang diberikan.

Pastikan memakai HTTPS agar kamera/galeri dan API berjalan baik di ponsel.

---

## Bagian C — Uji cepat dengan curl

Respons Apps Script berupa redirect, jadi gunakan `-L` dan kirim sebagai `text/plain`:

```bash
export WEB_APP_URL="https://script.google.com/macros/s/XXXXXXXX/exec"
export APP_TOKEN="token-kamu"

# history (rentang maksimum 90 hari)
curl -sL -X POST "$WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"history","token":"'"$APP_TOKEN"'","dari":"2026-10-05","sampai":"2026-10-11"}'

# history ringkas: lewati pratinjau foto (foto_thumb) — dipakai untuk hitung streak
curl -sL -X POST "$WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"history","token":"'"$APP_TOKEN"'","dari":"2026-07-15","sampai":"2026-10-11","ringkas":true}'

# log satu item
curl -sL -X POST "$WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"log","token":"'"$APP_TOKEN"'","tanggal":"2026-10-11","waktu_makan":"Makan Siang","catatan":"uji","items":[{"nama":"Nasi putih","berat_g":120,"kalori":156,"protein_g":3,"karbo_g":34,"lemak_g":0.3}]}'

# delete berdasarkan id
curl -sL -X POST "$WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"delete","token":"'"$APP_TOKEN"'","id":"uuid-dari-log"}'

# update: ubah catatan yang sudah tersimpan (id, tanggal, waktu, foto tetap)
curl -sL -X POST "$WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"update","token":"'"$APP_TOKEN"'","id":"uuid-dari-log","waktu_makan":"Makan Siang","makanan":"Nasi putih","berat_g":100,"kalori":130,"protein_g":2.5,"karbo_g":28,"lemak_g":0.2,"catatan":"porsi setengah"}'

# analyze (base64 JPEG tanpa prefix data:)
curl -sL -X POST "$WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"action":"analyze","token":"'"$APP_TOKEN"'","jenis":"makanan","catatan":"porsi setengah","gambar_base64":"'"$(base64 -i foto.jpg | tr -d '\n')"'"}'
```

Balasan sukses: `{"ok":true,"data":{...}}`. Balasan gagal: `{"ok":false,"error":{"kode":"...","pesan":"..."}}`.

---

## Kode hasil (error)

`TOKEN_SALAH`, `ACTION_TIDAK_DIKENAL`, `INPUT_TIDAK_VALID`, `GAMBAR_TERLALU_BESAR`, `TIPE_GAMBAR_TIDAK_DIDUKUNG`, `KUOTA_HABIS`, `AI_GAGAL`, `HASIL_AI_TIDAK_VALID`, `SIBUK`, `TIDAK_DITEMUKAN`, `ERROR_SERVER`.

---

## Menyesuaikan

| Ingin mengubah                        | Lakukan di                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Model Gemini (akurasi vs kuota)       | Script Properties `MODEL_NAME` (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, dll.) |
| Batas analisis harian                 | Script Properties `MAX_ANALYZE_PER_DAY`                                            |
| Rotasi token                          | Script Properties `APP_TOKEN` **dan** `web/js/config.js`                           |
| Nama/tagline maskot                   | `web/js/mascot.js` (`MASCOT_TEXT`, `POSES`)                                        |
| Warna, tipografi, jarak               | `web/css/components.css` + token pada `index.html` (sesuai `docs/DESIGN.md`)       |
| Target & profil kalori (per pengguna) | localStorage, tidak dikirim ke backend                                             |

---

## Sheet data

Sheet `log` (baris 1 = header): `id`, `tanggal` (teks `yyyy-MM-dd`), `waktu` (teks `HH:mm` WIB), `waktu_makan`, `makanan`, `berat_g`, `kalori`, `protein_g`, `karbo_g`, `lemak_g`, `catatan`. Satu baris per item.

Sheet `rekap` (opsional, via `setupRekap`): total kalori 7 hari terakhir + grafik batang.

---

## Privasi & keamanan

- Foto hanya dikirim ke Gemini API untuk dianalisis, lalu dibuang. Tidak disimpan di mana pun.
- **Catatan free tier:** pada tier gratis Gemini, Google menyatakan konten dapat dipakai untuk meningkatkan produk mereka (_"Content used to improve our products: Yes"_). Untuk mencegah ini, aktifkan billing (paid tier). Sisi FoodThings sendiri tidak menyimpan foto.
- Kunci API hanya di Script Properties.
- Semua teks divalidasi; nilai berawalan `=`, `+`, `-`, `@` dinetralkan agar tidak menjadi formula di Sheets.
- Log server hanya berisi aksi, kode hasil, dan durasi.

---

## Troubleshooting

| Gejala                                                                                                            | Penyebab & solusi                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Server sedang bermasalah" di UI                                                                                  | `WEB_APP_URL`/`APP_TOKEN` salah, atau respons bukan JSON (halaman login Google). Cek lewat `curl` (Bagian C).                                                                                                                  |
| Data tidak pernah tersimpan; Riwayat kosong; semua aksi Sheet memberi `ERROR_SERVER`                              | Web App tidak bisa membuka spreadsheet. Tambahkan Script Property `SHEET_ID` (A4) dan deploy **New version** (A7); pastikan deployment "Execute as: Me" (A6).                                                                  |
| Pesan `SHEET_TIDAK_TERHUBUNG` di UI                                                                               | Backend belum bisa menemukan Sheet: isi `SHEET_ID` lalu deploy **New version**.                                                                                                                                                |
| Pesan `SETUP_SHEETS_API` saat menyimpan/membaca                                                                   | Google Sheets API belum diaktifkan di Apps Script — ikuti 3 langkah **A5b**, lalu deploy **New version** (A7).                                                                                                                 |
| Simpan/baca gagal tak menentu dengan `ERROR_SERVER` "You can't set the number format of cells in a typed column." | Fitur "typed column" Google memblokir operasi langsung ke Sheet secara acak. Sudah diatasi: backend kini memakai **Google Sheets API** (A5b + New version).                                                                    |
| Kode masih versi lama                                                                                             | Buat **New version** di Manage deployments (A7).                                                                                                                                                                               |
| Tombol simpan melaporkan versi backend lama                                                                        | Buka URL Web App `/exec` dan pastikan `data.versi` bernilai `2026-10-14e16`; jika belum, paste `Code.gs` terbaru lalu deploy **New version** (A7).                                                                           |
| `TOKEN_SALAH`                                                                                                     | `APP_TOKEN` di `config.js` ≠ Script Properties.                                                                                                                                                                                |
| `KUOTA_HABIS`                                                                                                     | Batas harian tercapai; ubah `MAX_ANALYZE_PER_DAY` atau coba besok.                                                                                                                                                             |
| `AI_GAGAL`                                                                                                        | `GEMINI_API_KEY`/`MODEL_NAME` belum diisi, kunci ditolak, atau model tidak dikenali.                                                                                                                                           |
| `RPM/RPD` terlampaui tapi kode `AI_GAGAL`                                                                         | Kuota **free tier** Gemini habis (per menit/hari); tunggu atau ganti model di `MODEL_NAME`.                                                                                                                                    |
| Analisis foto sangat lama / menggantung (>30 dtk)                                                                 | Pakai model cepat: ubah `MODEL_NAME` ke `gemini-3.5-flash-lite` (efek langsung, tanpa deploy). Pastikan backend ≥ `2026-10-12e8` (tiap panggilan Gemini diberi batas 45 dtk + foto dikirim 800px agar tidak menggantung lama). |
| Kamera tidak muncul di ponsel                                                                                     | Harus diakses lewat HTTPS (bukan `http://` IP lokal).                                                                                                                                                                          |
| Foto HEIC iPhone gagal                                                                                            | Browser tertentu tidak bisa mendekode HEIC; pilih format JPEG atau ubah pengaturan kamera ke "Most Compatible".                                                                                                                |
# Test auto-deploy Thu Oct 15 01:53:06 WIB 2026
