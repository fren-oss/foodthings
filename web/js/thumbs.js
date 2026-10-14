// On-device thumbnail store.
//
// Photos are never uploaded or stored on the server. When a scan is saved we
// keep only a small preview (a few KB) in localStorage on this device, keyed
// by the logged item id, so Today/History can show the scanned photo next to
// each item. Clearing the browser storage simply removes the previews.

const MAP_KEY = 'ft_thumb_map';
const IMG_PREFIX = 'ft_thumb_img_';
const MAX_ENTRIES = 4000;

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch (err) {
    // Quota exceeded or storage disabled: silently skip (preview is optional).
  }
}

// Drop the oldest mappings (and their images) once we cross MAX_ENTRIES.
function prune(map) {
  const ids = Object.keys(map);
  if (ids.length <= MAX_ENTRIES) return;
  const drop = ids.slice(0, ids.length - MAX_ENTRIES);
  const used = {};
  drop.forEach(function (id) {
    const key = map[id];
    if (key) used[key] = true;
    delete map[id];
  });
  Object.keys(used).forEach(function (key) {
    try { localStorage.removeItem(key); } catch (err) { /* noop */ }
  });
}

// Store one preview (a data: URL) and map it to every item id from that scan.
export function saveThumb(ids, dataUrl) {
  if (!dataUrl || !Array.isArray(ids) || ids.length === 0) return;
  const key = IMG_PREFIX + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  try {
    localStorage.setItem(key, dataUrl);
  } catch (err) {
    return;
  }
  const map = readMap();
  ids.forEach(function (id) { if (id) map[id] = key; });
  prune(map);
  writeMap(map);
}

// Return the preview data: URL for an item id, or null when none is stored.
export function getThumb(id) {
  if (!id) return null;
  const map = readMap();
  const key = map[id];
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}
