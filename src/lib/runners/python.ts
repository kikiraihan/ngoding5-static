// Runner Python di browser memakai Skulpt (dimuat malas dari CDN, ~1 MB) di Web Worker klasik.
// Worker dipakai ulang antar-run; hanya dibuat ulang setelah waktu habis.
import type { RawRun } from './types';

export const SKULPT_VERSION = '1.2.0';
let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let seq = 0;
const pending = new Map<number, (v: RawRun) => void>();

export type PyStatus = 'idle' | 'loading' | 'ready' | 'error';
let status: PyStatus = 'idle';
const listeners = new Set<(s: PyStatus) => void>();
function setStatus(s: PyStatus) {
  status = s;
  listeners.forEach((f) => f(s));
}
export function onPyStatus(f: (s: PyStatus) => void) {
  listeners.add(f);
  f(status);
  return () => listeners.delete(f);
}

function boot(): Promise<void> {
  if (ready) return ready;
  setStatus('loading');
  worker = new Worker(`/workers/py-worker.js?v=${SKULPT_VERSION}`);
  const w = worker;
  ready = new Promise<void>((resolve, reject) => {
    w.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === 'ready') {
        setStatus('ready');
        resolve();
      } else if (d.type === 'load-error') {
        setStatus('error');
        reset();
        reject(new Error(d.error));
      } else if (d.type === 'result') {
        pending.get(d.id)?.(d.payload);
        pending.delete(d.id);
      }
    };
    w.onerror = (ev) => {
      setStatus('error');
      reset();
      reject(new Error(ev.message || 'Gagal memuat runtime Python'));
    };
    w.postMessage({ type: 'load', version: SKULPT_VERSION });
  });
  return ready;
}

function reset() {
  worker?.terminate();
  worker = null;
  ready = null;
  for (const [, res] of pending) res({ fatal: 'Runtime Python dihentikan.', logs: '' });
  pending.clear();
}

export function preloadPython() {
  boot().catch(() => {});
}

export async function runPython(code: string, fnName: string, tests: { args: unknown[] }[], timeoutMs = 4000): Promise<RawRun> {
  try {
    await boot();
  } catch (e) {
    return {
      fatal: `Runtime Python gagal dimuat (${(e as Error).message}). Periksa koneksi internet lalu coba lagi.`,
      logs: '',
    };
  }
  const id = ++seq;
  return new Promise<RawRun>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reset();
      setStatus('idle');
      resolve({ fatal: `Waktu habis (${timeoutMs / 1000} detik). Kemungkinan ada perulangan yang tidak pernah berhenti.`, timeout: true, logs: '' });
    }, timeoutMs);
    pending.set(id, (v) => {
      clearTimeout(timer);
      resolve(v);
    });
    worker!.postMessage({ type: 'run', id, code, fnName, tests: JSON.parse(JSON.stringify(tests.map((t) => ({ args: t.args })))), timeoutMs });
  });
}
