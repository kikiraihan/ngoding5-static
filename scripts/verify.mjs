#!/usr/bin/env node
// ngoding verify [path|id...] [--lang js,py] [--dry]
// Menjalankan solusi rujukan terhadap semua kasus uji, dan kode quiz terhadap jawabannya.
// Menulis field `verification` ke file (kecuali --dry). Kode keluar 1 jika ada yang gagal.
import path from 'node:path';
import { resolveTargets, readJson, writeJson, rel, today, c } from './lib/content.mjs';
import { deepEq, normalizeOutput } from './lib/compare.mjs';
import { RUNNERS } from './lib/runners.mjs';

const argv = process.argv.slice(2);
const flags = { dry: argv.includes('--dry'), quiet: argv.includes('--quiet') };
let langs = ['javascript', 'python', 'go'];
const li = argv.indexOf('--lang');
if (li >= 0) {
  const alias = { js: 'javascript', py: 'python', golang: 'go' };
  langs = argv[li + 1].split(',').map((l) => alias[l] || l);
}
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--lang');
const { problems, quizzes } = resolveTargets(positional);

let failed = 0;
let passed = 0;
const failures = [];
const skipped = new Set();

function short(v) {
  const s = JSON.stringify(v);
  return s && s.length > 60 ? s.slice(0, 57) + '...' : s;
}

export function verifyProblem(data) {
  const report = {};
  const verification = { ...(data.verification || {}) };
  const outputs = {};
  for (const lang of langs) {
    const code = data.solutions?.[lang];
    const runner = RUNNERS[lang];
    if (!runner) continue;
    if (!code) {
      // Solusi bahasa opsional (mis. Go) boleh belum ada.
      if (!runner.optional) report[lang] = { passed: false, reason: 'solusi tidak ada' };
      continue;
    }
    if (runner.available && !runner.available()) {
      skipped.add(lang);
      continue;
    }
    const res = runner.run({ kind: 'problem', code, fn: runner.fnName(data.function.name), tests: data.tests, sig: data.function });
    if (res.fatal) {
      report[lang] = { passed: false, reason: res.fatal };
    } else {
      const bad = [];
      res.results.forEach((r, i) => {
        const t = data.tests[i];
        if (!r.ok) bad.push(`#${i} error: ${r.error}`);
        else if (!deepEq(r.value, t.expected, data.compare || 'exact'))
          bad.push(`#${i} ${data.function.name}(${short(t.args).slice(1, -1)}) → ${short(r.value)}, diharapkan ${short(t.expected)}`);
      });
      outputs[lang] = res.results.map((r) => r.value);
      report[lang] = bad.length ? { passed: false, reason: bad.join('\n      ') } : { passed: true };
    }
    const prev = verification[lang];
    const runtime = runner.runtime();
    // Tulis ulang hanya bila status berubah, agar beda versi runtime (lokal vs CI) tidak membuat diff.
    if (!prev || prev.passed !== report[lang].passed)
      verification[lang] = { passed: report[lang].passed, at: today(), runtime };
  }
  // Verifikasi silang: dua implementasi independen harus memberi hasil sama.
  if (outputs.javascript && outputs.python) {
    outputs.javascript.forEach((v, i) => {
      if (!deepEq(v, outputs.python[i], data.compare || 'exact') && report.python.passed && report.javascript.passed) {
        report.python = { passed: false, reason: `#${i} hasil JS dan Python berbeda` };
      }
    });
  }
  if (outputs.javascript && outputs.go) {
    outputs.javascript.forEach((v, i) => {
      if (!deepEq(v, outputs.go[i], data.compare || 'exact') && report.go.passed && report.javascript.passed) {
        report.go = { passed: false, reason: `#${i} hasil JS dan Go berbeda` };
      }
    });
  }
  return { report, verification };
}

export function verifyQuiz(data) {
  const runner = RUNNERS[data.lang];
  if (runner.available && !runner.available()) {
    skipped.add(data.lang);
    return { report: { passed: true, skipped: true }, verification: data.verification };
  }
  const res = runner.run({ kind: 'quiz', code: data.code });
  let report;
  if (res.fatal) report = { passed: false, reason: res.fatal };
  else if (res.error) report = { passed: false, reason: `error saat dijalankan: ${res.error}` };
  else if (normalizeOutput(res.stdout) !== normalizeOutput(data.answer))
    report = { passed: false, reason: `output asli:\n${indent(normalizeOutput(res.stdout))}\n      jawaban di file:\n${indent(normalizeOutput(data.answer))}`, actual: res.stdout };
  else report = { passed: true };
  const prev = data.verification;
  const runtime = runner.runtime();
  const verification =
    !prev || prev.passed !== report.passed ? { passed: report.passed, at: today(), runtime } : prev;
  return { report, verification, stdout: res.stdout };
}

function indent(s) {
  return s.split('\n').map((l) => '        ' + l).join('\n');
}

function save(file, data, verification) {
  if (flags.dry) return;
  if (JSON.stringify(data.verification) === JSON.stringify(verification)) return;
  writeJson(file, { ...data, verification });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  for (const file of problems) {
    const data = readJson(file);
    const { report, verification } = verifyProblem(data);
    const ok = Object.values(report).every((r) => r.passed);
    save(file, data, verification);
    if (ok) passed++;
    else {
      failed++;
      failures.push(file);
    }
    if (!ok || !flags.quiet) {
      const langsTxt = Object.entries(report).map(([l, r]) => (r.passed ? c.ok(l) : c.bad(l))).join(' ');
      console.log(`${ok ? c.ok('✓') : c.bad('✗')} ${data.id} ${c.dim(rel(file))} ${langsTxt}`);
      for (const [l, r] of Object.entries(report)) if (!r.passed) console.log(`    ${c.bad(l)}: ${r.reason}`);
    }
  }
  for (const file of quizzes) {
    const data = readJson(file);
    const { report, verification } = verifyQuiz(data);
    save(file, data, verification);
    if (report.passed) passed++;
    else {
      failed++;
      failures.push(file);
    }
    if (!report.passed || !flags.quiet) {
      console.log(`${report.passed ? c.ok('✓') : c.bad('✗')} ${data.id} ${c.dim(rel(file))}`);
      if (!report.passed) console.log(`    ${report.reason}`);
    }
  }
  if (skipped.size) console.log(c.warn(`\n! Runtime ${[...skipped].join(', ')} tidak ditemukan: verifikasinya dilewati (status lama dipertahankan).`));
  console.log(`\nVerifikasi: ${c.ok(passed + ' lolos')}, ${failed ? c.bad(failed + ' gagal') : '0 gagal'} dari ${passed + failed} soal.`);
  if (failed) process.exit(1);
}
