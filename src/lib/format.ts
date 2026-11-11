// lit(), callStr(), deepEq() — tampilan nilai per bahasa dan perbandingan hasil.
// Logika deepEq sama dengan scripts/lib/compare.mjs (dipakai CLI verify).
import type { CompareMode, LangId } from './types';
import { fnNameFor } from './signature';

export function deepEq(a: unknown, b: unknown, mode: CompareMode = 'exact'): boolean {
  if (mode === 'unordered' && Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const key = (v: unknown) => JSON.stringify(v);
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
  const inner: CompareMode = mode === 'unordered' ? 'exact' : mode;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((v, i) => deepEq(v, bb[i], inner));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ka = Object.keys(ao);
  return ka.length === Object.keys(bo).length && ka.every((k) => Object.prototype.hasOwnProperty.call(bo, k) && deepEq(ao[k], bo[k], inner));
}

function pyStr(s: string): string {
  // repr() Python: pakai kutip tunggal kecuali string berisi kutip tunggal tanpa kutip ganda
  const q = s.includes("'") && !s.includes('"') ? '"' : "'";
  return q + s.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q).replace(/\n/g, '\\n').replace(/\t/g, '\\t') + q;
}

/** Tulis nilai sebagai literal bahasa tertentu: JS → ["a", true, null], Python → ['a', True, None]. */
export function lit(v: unknown, lang: LangId): string {
  if (v === undefined) return lang === 'python' ? 'None' : 'undefined';
  if (v === null) return lang === 'python' ? 'None' : 'null';
  if (typeof v === 'boolean') return lang === 'python' ? (v ? 'True' : 'False') : String(v);
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return lang === 'python' ? "float('nan')" : 'NaN';
    return String(v);
  }
  if (typeof v === 'string') return lang === 'python' ? pyStr(v) : JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map((x) => lit(x, lang)).join(', ') + ']';
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    if (!entries.length) return '{}';
    if (lang === 'python') return '{' + entries.map(([k, x]) => pyStr(k) + ': ' + lit(x, lang)).join(', ') + '}';
    const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
    return '{ ' + entries.map(([k, x]) => key(k) + ': ' + lit(x, lang)).join(', ') + ' }';
  }
  return String(v);
}

export function callStr(fnName: string, args: unknown[], lang: LangId): string {
  return `${fnNameFor(fnName, lang)}(${args.map((a) => lit(a, lang)).join(', ')})`;
}

/** Normalisasi jawaban Tebak Output (FE-21). */
export function normalizeOutput(s: string): string {
  return String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export function isRecent(date: string, days = 14, now = Date.now()): boolean {
  const t = Date.parse(date + 'T00:00:00Z');
  return Number.isFinite(t) && now - t <= days * 86400000;
}
