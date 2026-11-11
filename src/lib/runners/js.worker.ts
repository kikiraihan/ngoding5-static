/// <reference lib="webworker" />
// Menjalankan kode JavaScript peserta di Web Worker (tanpa akses DOM).
// Batas waktu dijaga oleh pemanggil lewat worker.terminate().

interface Job {
  code: string;
  fnName: string;
  tests: { args: unknown[] }[];
}

function show(v: unknown, depth = 0): string {
  if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return `[Function ${v.name || '(anonim)'}]`;
  if (typeof v === 'bigint') return v + 'n';
  if (v === null || typeof v !== 'object') return String(v);
  if (depth > 3) return Array.isArray(v) ? '[Array]' : '[Object]';
  if (Array.isArray(v)) return '[' + v.map((x) => show(x, depth + 1)).join(', ') + ']';
  if (v instanceof Map) return `Map(${v.size}) {${[...v].map(([k, x]) => show(k, depth + 1) + ' => ' + show(x, depth + 1)).join(', ')}}`;
  if (v instanceof Set) return `Set(${v.size}) {${[...v].map((x) => show(x, depth + 1)).join(', ')}}`;
  const e = Object.entries(v as Record<string, unknown>);
  return e.length ? '{ ' + e.map(([k, x]) => k + ': ' + show(x, depth + 1)).join(', ') + ' }' : '{}';
}

function plain(v: unknown): unknown {
  // Ubah hasil menjadi data JSON murni agar bisa dibandingkan (Map/Set ditolak secara eksplisit).
  if (v === undefined) return null;
  if (v instanceof Map || v instanceof Set) throw new Error('Kembalikan array/objek biasa, bukan Map/Set');
  return JSON.parse(JSON.stringify(v));
}

self.onmessage = (ev: MessageEvent<Job>) => {
  const { code, fnName, tests } = ev.data;
  const logs: string[] = [];
  const log = (...a: unknown[]) => logs.push(a.map((x) => show(x)).join(' '));
  const fakeConsole = { log, info: log, warn: log, error: log, debug: log, table: log };
  let fn: (...a: unknown[]) => unknown;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function('console', `${code}\n;return typeof ${fnName} === "function" ? ${fnName} : undefined;`);
    fn = factory(fakeConsole);
    if (typeof fn !== 'function') throw new Error(`Fungsi ${fnName} tidak ditemukan. Pastikan namanya tidak diubah.`);
  } catch (e) {
    self.postMessage({ fatal: errText(e), logs: logs.join('\n') });
    return;
  }
  const results = tests.map((t) => {
    try {
      const value = fn(...structuredClone(t.args));
      return { ok: true, value: plain(value) };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  });
  self.postMessage({ results, logs: logs.join('\n') });
};

function errText(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return String(e);
}
