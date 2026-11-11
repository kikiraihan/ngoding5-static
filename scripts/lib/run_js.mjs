// Dijalankan sebagai proses anak oleh verify.mjs (node --no-experimental-fetch).
// Masukan (stdin, JSON): { kind: "problem", code, fn, tests } atau { kind: "quiz", code }
// Keluaran (stdout, JSON): { results: [{ ok, value?, error? }], logs } atau { stdout, error? }
import vm from 'node:vm';
import util from 'node:util';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  const job = JSON.parse(input);
  const lines = [];
  const fmt = (...a) => lines.push(util.format(...a));
  const fakeConsole = { log: fmt, info: fmt, warn: fmt, error: fmt, debug: fmt };
  const sandbox = vm.createContext({ console: fakeConsole });
  const write = (obj) => process.stdout.write(JSON.stringify(obj));

  if (job.kind === 'quiz') {
    try {
      vm.runInContext(job.code, sandbox, { timeout: 3000 });
      write({ stdout: lines.join('\n') });
    } catch (e) {
      write({ stdout: lines.join('\n'), error: String(e && e.stack ? e.stack.split('\n')[0] : e) });
    }
    return;
  }

  let fn;
  try {
    vm.runInContext(job.code, sandbox, { timeout: 3000 });
    fn = vm.runInContext(`typeof ${job.fn} === 'function' ? ${job.fn} : undefined`, sandbox);
    if (!fn) throw new Error(`Fungsi ${job.fn} tidak ditemukan`);
  } catch (e) {
    write({ fatal: String(e && e.message ? e.message : e) });
    return;
  }
  const results = job.tests.map((t) => {
    try {
      sandbox.__fn = fn;
      // argumen dibuat di dalam konteks agar `instanceof Array` di kode soal tetap benar
      sandbox.__argsJson = JSON.stringify(t.args);
      const value = vm.runInContext('__fn(...JSON.parse(__argsJson))', sandbox, { timeout: 3000 });
      return { ok: true, value: value === undefined ? null : JSON.parse(JSON.stringify(value)) };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });
  write({ results, logs: lines });
});
