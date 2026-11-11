// Perbandingan hasil vs harapan. Logika yang sama dipakai di src/lib/format.ts.

export function deepEq(a, b, mode = 'exact') {
  if (mode === 'unordered' && Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const key = (v) => JSON.stringify(v);
    const sa = a.map(key).sort();
    const sb = b.map(key).sort();
    return sa.every((v, i) => v === sb[i]);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    if (mode === 'float') return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
    return a === b || (Number.isNaN(a) && Number.isNaN(b));
  }
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEq(v, b[i], mode === 'unordered' ? 'exact' : mode));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEq(a[k], b[k], mode === 'unordered' ? 'exact' : mode));
}

/** Normalisasi output Tebak Output: buang spasi di ujung baris & baris kosong di awal/akhir. */
export function normalizeOutput(s) {
  return String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export function toSnake(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
}
