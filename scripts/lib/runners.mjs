// Menjalankan kode di proses terpisah (tanpa jaringan, dengan batas waktu).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './content.mjs';
import { toSnake } from './compare.mjs';
import { runGo, goAvailable, goVersion } from './run_go.mjs';

const TIMEOUT_MS = 3000;
const PYTHON = process.env.NGODING_PYTHON || 'python3';

function run(cmd, args, job) {
  const r = spawnSync(cmd, args, {
    input: JSON.stringify(job),
    encoding: 'utf8',
    timeout: TIMEOUT_MS + 1000,
    maxBuffer: 8 * 1024 * 1024,
    env: { PATH: process.env.PATH, PYTHONIOENCODING: 'utf-8', PYTHONHASHSEED: '0' },
  });
  if (r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM') return { fatal: `Waktu habis (${TIMEOUT_MS / 1000} detik)` };
  if (r.error) return { fatal: r.error.message };
  try {
    return JSON.parse(r.stdout);
  } catch {
    return { fatal: (r.stderr || r.stdout || 'keluaran tidak terbaca').trim().split('\n').slice(-3).join(' | ') };
  }
}

export function runJs(job) {
  return run(process.execPath, ['--no-experimental-fetch', path.join(ROOT, 'scripts/lib/run_js.mjs')], job);
}

export function runPy(job) {
  return run(PYTHON, ['-I', path.join(ROOT, 'scripts/verify_py.py')], job);
}

export const RUNNERS = {
  javascript: { run: runJs, fnName: (n) => n, runtime: () => `node ${process.versions.node.split('.')[0]}` },
  python: { run: runPy, fnName: toSnake, runtime: () => pyVersion() },
  // Go opsional: bila `go` tidak terpasang, verifikasi Go dilewati (bukan gagal).
  go: { run: (job) => runGo(job, TIMEOUT_MS), fnName: (n) => n, runtime: () => goVersion(), available: goAvailable, optional: true },
};

let _pyv;
function pyVersion() {
  if (_pyv) return _pyv;
  const r = spawnSync(PYTHON, ['-c', 'import sys;print("%d.%d"%sys.version_info[:2])'], { encoding: 'utf8' });
  _pyv = `python ${(r.stdout || '?').trim()}`;
  return _pyv;
}
