#!/usr/bin/env node
// ngoding stats [--json] — jumlah soal per tema × level × bahasa, soal tanpa solusi Python/pembahasan.
import fs from 'node:fs';
import path from 'node:path';
import { loadMeta, loadProblems, loadQuizzes, c } from './lib/content.mjs';

const meta = loadMeta();
const problems = loadProblems().map((p) => p.data);
const quizzes = loadQuizzes().map((q) => q.data);
const asJson = process.argv.includes('--json');
const levels = meta.levels.map((l) => l.id);

const code = meta.temas.filter((t) => t.mode === 'code').map((t) => {
  const row = { tema: t.slug, label: t.label };
  for (const lv of levels) row[lv] = problems.filter((p) => p.tema === t.slug && p.level === lv).length;
  row.total = levels.reduce((s, lv) => s + row[lv], 0);
  return row;
});
const quiz = meta.temas.filter((t) => t.mode === 'quiz').map((t) => {
  const row = { tema: t.slug, label: t.label };
  for (const l of meta.languages) row[l.id] = quizzes.filter((q) => q.tema === t.slug && q.lang === l.id).length;
  for (const lv of levels) row[lv] = quizzes.filter((q) => q.tema === t.slug && q.level === lv).length;
  return row;
});
const missingPy = problems.filter((p) => !p.solutions?.python).map((p) => p.id);
const unverified = problems.filter((p) => !p.verification?.javascript?.passed || !p.verification?.python?.passed).map((p) => p.id);
const noExplanation = loadProblems()
  .filter(({ file, data }) => {
    const f = path.join(path.dirname(file), data.explanation);
    return !fs.existsSync(f) || fs.readFileSync(f, 'utf8').trim().length < 80;
  })
  .map((p) => p.data.id);
const fewMistakes = problems.filter((p) => (p.commonMistakes || []).length < 2).map((p) => p.id);
const fewHints = problems.filter((p) => p.hints.length < 2).map((p) => p.id);

if (asJson) {
  console.log(JSON.stringify({ code, quiz, missingPy, unverified, noExplanation, fewMistakes, fewHints, totals: { problems: problems.length, quiz: quizzes.length } }, null, 2));
  process.exit(0);
}

function table(rows, cols, headers) {
  const w = cols.map((col, i) => Math.max(headers[i].length, ...rows.map((r) => String(r[col]).length)));
  const line = (vals) => vals.map((v, i) => (i ? String(v).padStart(w[i]) : String(v).padEnd(w[i]))).join('  ');
  console.log(c.bold(line(headers)));
  for (const r of rows) console.log(line(cols.map((col) => r[col])));
}

console.log(c.bold('\nTulis Kode') + c.dim(` (${problems.length} soal)`));
const totalRow = { label: 'Total', total: problems.length };
for (const lv of levels) totalRow[lv] = code.reduce((s, r) => s + r[lv], 0);
table([...code, totalRow], ['label', ...levels, 'total'], ['Tema', ...levels, 'Total']);

console.log(c.bold('\nTebak Output') + c.dim(` (${quizzes.length} soal)`));
const qt = { label: 'Total' };
for (const k of [...meta.languages.map((l) => l.id), ...levels]) qt[k] = quiz.reduce((s, r) => s + r[k], 0);
table([...quiz, qt], ['label', ...meta.languages.map((l) => l.id), ...levels], ['Tema', ...meta.languages.map((l) => l.label), ...levels]);

const list = (title, arr) => console.log(`\n${arr.length ? c.warn('!') : c.ok('✓')} ${title}: ${arr.length}${arr.length ? c.dim(' — ' + arr.slice(0, 15).join(', ') + (arr.length > 15 ? ', …' : '')) : ''}`);
list('Soal tanpa solusi Python', missingPy);
list('Soal belum terverifikasi JS+Python', unverified);
list('Soal tanpa/tipis pembahasan', noExplanation);
list('Soal dengan < 2 kesalahan umum', fewMistakes);
list('Soal dengan < 2 petunjuk', fewHints);
