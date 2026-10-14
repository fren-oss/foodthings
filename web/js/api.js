import { CONFIG } from './config.js?v20261012k';

// Upper bound so the UI never spins forever. Typical analysis is ~5s, but the
// free AI tier occasionally takes 60-70s; 90s still catches the rare hang.
const TIMEOUT_MS = 90000;

export async function fetchApi(payload) {
  const body = { ...payload, token: CONFIG.APP_TOKEN };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CONFIG.WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data;
    } catch (e) {
      throw new Error("Respons bukan JSON. Server sedang bermasalah.");
    }
  } catch (error) {
    console.error("API Error:", error);
    if (error && error.name === 'AbortError') {
      return { ok: false, error: { kode: 'SIBUK', pesan: 'Analisis terlalu lama. Coba lagi ya.' } };
    }
    return { ok: false, error: { kode: 'ERROR_SERVER', pesan: error.message || 'Koneksi gagal, coba lagi.' } };
  } finally {
    clearTimeout(timer);
  }
}
