#!/usr/bin/env node
// ngoding fix-expected <id> [--from js|py] [--yes]
// Mengisi ulang `expected` dari hasil solusi rujukan. Dipakai hati-hati: WAJIB review diff.
import { findById, readJson, writeJson, today, rel, c } from './lib/content.mjs';
import { deepEq } from './lib/compare.mjs';
import { RUNNERS } from './lib/runners.mjs';

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--from');
const fromArg = argv.includes('--from') ? argv[argv.indexOf('--from') + 1] : 'js';
const lang = { js: 'javascript', py: 'python' }[fromArg] || fromArg;
const found = id && findById(id);
if (!found || found.kind !== 'problem') {
  console.error(c.bad('✗ ') + 'pakai: ngoding fix-expected <id-soal-tulis-kode> [--from js|py]');
  process.exit(1);
}
const data = readJson(found.file);
const runner = RUNNERS[lang];
const res = runner.run({ kind: 'problem', code: data.solutions[lang], fn: runner.fnName(data.function.name), tests: data.tests });
if (res.fatal) {
  console.error(c.bad('✗ ') + res.fatal);
  process.exit(1);
}
let changed = 0;
const tests = data.tests.map((t, i) => {
  const r = res.results[i];
  if (!r.ok) {
    console.error(c.bad(`✗ tests[${i}] error: ${r.error}`));
    process.exit(1);
  }
  if (deepEq(r.value, t.expected, data.compare || 'exact')) return t;
  changed++;
  console.log(`  tests[${i}]: ${JSON.stringify(t.expected)} → ${c.warn(JSON.stringify(r.value))}`);
  return { ...t, expected: r.value };
});
if (!changed) {
  console.log(c.ok('✓ ') + 'semua expected sudah sesuai, tidak ada perubahan.');
  process.exit(0);
}
if (!argv.includes('--yes')) {
  console.log(c.warn(`\n${changed} expected akan berubah. Ulangi dengan --yes untuk menulis, lalu review diff.`));
  process.exit(0);
}
writeJson(found.file, { ...data, tests, revision: data.revision + 1, updatedAt: today() });
console.log(c.ok('✓ ') + `${rel(found.file)} diperbarui (revision ${data.revision + 1}). Jalankan \`ngoding verify ${id}\` dan review diff.`);
