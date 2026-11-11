import JsWorker from './js.worker?worker';
import type { RawRun } from './types';

/** Jalankan kode JS di worker baru dengan batas waktu (FE-14). */
export function runJs(code: string, fnName: string, tests: { args: unknown[] }[], timeoutMs = 3000): Promise<RawRun> {
  return new Promise((resolve) => {
    const w = new JsWorker();
    const timer = setTimeout(() => {
      w.terminate();
      resolve({ fatal: `Waktu habis (${timeoutMs / 1000} detik). Kemungkinan ada perulangan yang tidak pernah berhenti.`, timeout: true, logs: '' });
    }, timeoutMs);
    w.onmessage = (ev) => {
      clearTimeout(timer);
      w.terminate();
      resolve(ev.data as RawRun);
    };
    w.onerror = (ev) => {
      clearTimeout(timer);
      w.terminate();
      resolve({ fatal: ev.message || 'Error tak dikenal di worker', logs: '' });
    };
    w.postMessage({ code, fnName, tests: JSON.parse(JSON.stringify(tests.map((t) => ({ args: t.args })))) });
  });
}
