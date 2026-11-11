// Runner Go untuk `ngoding verify`: kompilasi dengan `go build` di folder sementara, lalu jalankan biner dengan batas waktu.
// Soal tulis kode: solusi digabung dengan harness (main) yang membaca args JSON dari stdin dan menulis hasil JSON ke file.
// Soal tebak output: kode quiz adalah program utuh (package main + func main), stdout dibandingkan dengan jawaban.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const GO = process.env.NGODING_GO || 'go';
const BUILD_TIMEOUT_MS = 120000; // kompilasi pertama bisa lambat (cache dingin)

// Pemetaan tipe soal → tipe Go (sama dengan content/meta/languages.json).
export const GO_TYPES = {
  int: 'int',
  float: 'float64',
  bool: 'bool',
  str: 'string',
  'int[]': '[]int',
  'str[]': '[]string',
  'int[][]': '[][]int',
  'dict<str,int>': 'map[string]int',
};

let _available;
export function goAvailable() {
  if (_available === undefined) {
    const r = spawnSync(GO, ['version'], { encoding: 'utf8' });
    _available = !r.error && r.status === 0;
  }
  return _available;
}

let _version;
export function goVersion() {
  if (_version) return _version;
  const r = spawnSync(GO, ['env', 'GOVERSION'], { encoding: 'utf8' });
  const v = (r.stdout || '').trim().replace(/^go/, '');
  _version = `go ${v.split('.').slice(0, 2).join('.') || '?'}`;
  return _version;
}

function goEnv() {
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME || os.homedir(),
    GOTOOLCHAIN: 'local',
    GOFLAGS: '',
    GO111MODULE: 'off',
    CGO_ENABLED: '0',
  };
  for (const k of ['GOCACHE', 'GOPATH', 'GOROOT', 'TMPDIR']) if (process.env[k]) env[k] = process.env[k];
  return env;
}

/** Buang baris `package ...` di awal kode pengguna; harness menulis `package main` sendiri. */
export function stripPackage(code) {
  return code.replace(/^package\s+\w+\s*;?[ \t]*$/m, '');
}

export function goHarness(code, sig) {
  const decls = sig.params
    .map((p, i) => {
      const t = GO_TYPES[p.type];
      if (!t) throw new Error(`tipe ${p.type} belum didukung runner Go`);
      return [
        `\tvar a${i} ${t}`,
        `\tif err := ngodingJSON.Unmarshal(args[${i}], &a${i}); err != nil {`,
        `\t\treturn ngodingHasil{Error: "argumen ${i}: " + err.Error()}`,
        '\t}',
      ].join('\n');
    })
    .join('\n');
  const call = `${sig.name}(${sig.params.map((_, i) => `a${i}`).join(', ')})`;
  return `package main

import (
\tngodingJSON "encoding/json"
\tngodingFmt "fmt"
\tngodingOS "os"
)

${stripPackage(code).trim()}

type ngodingHasil struct {
\tOk    bool   \`json:"ok"\`
\tValue any    \`json:"value"\`
\tError string \`json:"error,omitempty"\`
}

func ngodingPanggil(args []ngodingJSON.RawMessage) (h ngodingHasil) {
\tdefer func() {
\t\tif r := recover(); r != nil {
\t\t\th = ngodingHasil{Error: ngodingFmt.Sprint("panic: ", r)}
\t\t}
\t}()
\tif len(args) != ${sig.params.length} {
\t\treturn ngodingHasil{Error: "jumlah argumen salah"}
\t}
${decls}
\treturn ngodingHasil{Ok: true, Value: ${call}}
}

func main() {
\tvar tests [][]ngodingJSON.RawMessage
\tif err := ngodingJSON.NewDecoder(ngodingOS.Stdin).Decode(&tests); err != nil {
\t\tpanic(err)
\t}
\tout := make([]ngodingHasil, 0, len(tests))
\tfor _, t := range tests {
\t\tout = append(out, ngodingPanggil(t))
\t}
\tb, err := ngodingJSON.Marshal(out)
\tif err != nil {
\t\tpanic(err)
\t}
\tif err := ngodingOS.WriteFile(ngodingOS.Args[1], b, 0o644); err != nil {
\t\tpanic(err)
\t}
}
`;
}

/** Go mengubah slice/map nil menjadi null di JSON; samakan dengan [] / {} sesuai tipe kembalian. */
export function normalizeGoValue(v, type) {
  if (type === 'int[][]') return v === null ? [] : Array.isArray(v) ? v.map((x) => (x === null ? [] : x)) : v;
  if (type === 'int[]' || type === 'str[]') return v === null ? [] : v;
  if (type === 'dict<str,int>') return v === null ? {} : v;
  return v;
}

function runtimeError(stderr, status) {
  const panic = String(stderr || '').match(/^(panic|fatal error): .*$/m);
  return panic ? panic[0] : tail(stderr, 3) || `keluar dengan kode ${status}`;
}

function tail(s, n = 6) {
  return String(s || '')
    .trim()
    .split('\n')
    .filter((l) => !l.startsWith('# command-line-arguments'))
    .slice(-n)
    .join(' | ');
}

export function runGo(job, timeoutMs = 3000) {
  if (!goAvailable()) return { fatal: `Go (${GO}) tidak ditemukan`, skipped: true };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngoding-go-'));
  const env = goEnv();
  try {
    const src = job.kind === 'quiz' ? job.code : goHarness(job.code, job.sig);
    fs.writeFileSync(path.join(dir, 'main.go'), src);
    const bin = path.join(dir, process.platform === 'win32' ? 'prog.exe' : 'prog');
    const b = spawnSync(GO, ['build', '-o', bin, 'main.go'], { cwd: dir, env, encoding: 'utf8', timeout: BUILD_TIMEOUT_MS });
    if (b.error?.code === 'ETIMEDOUT') return { fatal: 'Kompilasi Go terlalu lama' };
    if (b.status !== 0) {
      const msg = `compile error: ${tail((b.stderr || '').replaceAll('./main.go:', 'baris '))}`;
      return job.kind === 'quiz' ? { stdout: '', error: msg } : { fatal: msg };
    }
    const resFile = path.join(dir, 'hasil.json');
    const r = spawnSync(bin, [resFile], {
      cwd: dir,
      env: { PATH: env.PATH },
      input: job.kind === 'quiz' ? '' : JSON.stringify(job.tests.map((t) => t.args)),
      encoding: 'utf8',
      timeout: timeoutMs + 1000,
      maxBuffer: 8 * 1024 * 1024,
    });
    if (r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM') return { fatal: `Waktu habis (${timeoutMs / 1000} detik)` };
    if (job.kind === 'quiz') {
      const out = { stdout: r.stdout || '' };
      if (r.status !== 0) out.error = runtimeError(r.stderr, r.status);
      return out;
    }
    if (r.status !== 0 || !fs.existsSync(resFile)) return { fatal: runtimeError(r.stderr, r.status) };
    const results = JSON.parse(fs.readFileSync(resFile, 'utf8')).map((x) =>
      x.ok ? { ok: true, value: normalizeGoValue(x.value, job.sig.returns) } : { ok: false, error: x.error },
    );
    return { results, logs: r.stdout || '' };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
