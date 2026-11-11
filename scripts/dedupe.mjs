#!/usr/bin/env node
// ngoding dedupe [--threshold 0.6] — mencari soal mirip (judul + tanda tangan + kasus uji serupa).
import { loadProblems, loadQuizzes, rel, c } from './lib/content.mjs';

const argv = process.argv.slice(2);
const threshold = argv.includes('--threshold') ? Number(argv[argv.indexOf('--threshold') + 1]) : 0.6;

const STOP = new Set(['dan', 'atau', 'yang', 'di', 'ke', 'dari', 'dengan', 'untuk', 'the', 'of', 'a']);
const tokens = (s) => new Set(s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w && !STOP.has(w)));
const jaccard = (a, b) => {
  if (!a.size && !b.size) return 0;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i);
};

const problems = loadProblems();
const pairs = [];
for (let i = 0; i < problems.length; i++) {
  for (let j = i + 1; j < problems.length; j++) {
    const A = problems[i].data;
    const B = problems[j].data;
    const title = jaccard(tokens(A.title), tokens(B.title));
    const desc = jaccard(tokens(A.desc), tokens(B.desc));
    const sigA = A.function.params.map((p) => p.type).join(',') + '→' + A.function.returns;
    const sigB = B.function.params.map((p) => p.type).join(',') + '→' + B.function.returns;
    const sig = sigA === sigB ? 1 : 0;
    const argsA = new Set(A.tests.map((t) => JSON.stringify(t.args)));
    const sameTests = B.tests.filter((t) => argsA.has(JSON.stringify(t.args)) && A.tests.some((u) => JSON.stringify(u.args) === JSON.stringify(t.args) && JSON.stringify(u.expected) === JSON.stringify(t.expected))).length;
    const tests = sameTests / Math.max(A.tests.length, B.tests.length);
    const score = 0.35 * title + 0.3 * desc + 0.1 * sig + 0.25 * tests;
    if (score >= threshold || A.function.name === B.function.name) pairs.push({ score, A: problems[i], B: problems[j], detail: { title, desc, sig, tests } });
  }
}
const quizzes = loadQuizzes();
for (let i = 0; i < quizzes.length; i++) {
  for (let j = i + 1; j < quizzes.length; j++) {
    const A = quizzes[i].data;
    const B = quizzes[j].data;
    if (A.lang !== B.lang) continue;
    const score = jaccard(tokens(A.code), tokens(B.code));
    if (score >= Math.max(threshold, 0.8)) pairs.push({ score, A: quizzes[i], B: quizzes[j], detail: { code: score } });
  }
}
pairs.sort((a, b) => b.score - a.score);
for (const p of pairs) {
  console.log(`${c.warn('≈')} ${p.score.toFixed(2)}  ${p.A.data.id} ↔ ${p.B.data.id}  ${c.dim(rel(p.A.file) + ' | ' + rel(p.B.file))}`);
  console.log(c.dim('     ' + Object.entries(p.detail).map(([k, v]) => `${k}=${v.toFixed ? v.toFixed(2) : v}`).join(' ')));
}
console.log(pairs.length ? `\n${pairs.length} pasangan mirip (ambang ${threshold}). Review manual sebelum menghapus.` : c.ok('✓ ') + 'tidak ada soal yang mirip.');
