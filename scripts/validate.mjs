#!/usr/bin/env node
// ngoding validate [path|id...] [--lock] [--strict]
// Cek JSON Schema, slug unik, tema/level valid, judul/kode duplikat, file MD pembahasan ada,
// dan ID yang sudah tayang tidak hilang (content/meta/id-lock.json).
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import {
  ROOT, META_DIR, loadMeta, loadProblems, loadQuizzes, problemFiles, quizFiles, resolveTargets, readJson, writeJson, rel, c,
} from './lib/content.mjs';

const LOCK_FILE = path.join(META_DIR, 'id-lock.json');

export function normTitle(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Validasi seluruh konten. Mengembalikan { errors: [{file, msg}], warnings: [...] }.
 * `only` (opsional) = Set file yang dilaporkan; cek lintas file tetap memakai semua konten.
 */
export function validateAll({ only = null, checkLock = true, requireVerified = false } = {}) {
  const meta = loadMeta();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const vProblem = ajv.compile(readJson(path.join(ROOT, 'schemas/problem.schema.json')));
  const vQuiz = ajv.compile(readJson(path.join(ROOT, 'schemas/quiz.schema.json')));
  const errors = [];
  const warnings = [];
  const err = (file, msg) => (!only || only.has(file)) && errors.push({ file, msg });
  const warn = (file, msg) => (!only || only.has(file)) && warnings.push({ file, msg });

  const temaBySlug = new Map(meta.temas.map((t) => [t.slug, t]));
  const levelIds = new Set(meta.levels.map((l) => l.id));
  const langById = new Map(meta.languages.map((l) => [l.id, l]));

  const ids = new Map();
  const titles = new Map();
  let problems = [];
  let quizzes = [];
  try {
    problems = loadProblems();
    quizzes = loadQuizzes();
  } catch (e) {
    errors.push({ file: '-', msg: e.message });
    return { errors, warnings, problems, quizzes };
  }

  for (const { file, data } of problems) {
    if (!vProblem(data)) {
      for (const e of vProblem.errors) err(file, `schema: ${e.instancePath || '/'} ${e.message}${e.params?.allowedValues ? ' ' + JSON.stringify(e.params.allowedValues) : ''}`);
      continue;
    }
    const base = path.basename(file, '.json');
    const folder = path.basename(path.dirname(file));
    if (base !== data.id) err(file, `nama file (${base}) harus sama dengan id (${data.id})`);
    const tema = temaBySlug.get(data.tema);
    if (!tema) err(file, `tema "${data.tema}" tidak ada di meta/temas.json`);
    else if (tema.mode !== 'code') err(file, `tema "${data.tema}" bukan tema Tulis Kode`);
    if (folder !== data.tema) err(file, `folder (${folder}) harus sama dengan tema (${data.tema})`);
    if (!levelIds.has(data.level)) err(file, `level "${data.level}" tidak valid`);
    if (ids.has(data.id)) err(file, `id "${data.id}" duplikat dengan ${rel(ids.get(data.id))}`);
    ids.set(data.id, file);
    const nt = normTitle(data.title);
    if (titles.has(nt)) err(file, `judul "${data.title}" duplikat dengan ${rel(titles.get(nt))}`);
    titles.set(nt, file);
    const md = path.join(path.dirname(file), data.explanation);
    if (data.explanation !== `${data.id}.md`) warn(file, `explanation sebaiknya "${data.id}.md"`);
    if (!fs.existsSync(md)) err(file, `file pembahasan ${rel(md)} tidak ada`);
    else if (fs.readFileSync(md, 'utf8').trim().length < 80) warn(file, 'pembahasan masih tipis (< 80 karakter)');
    for (const lang of Object.keys(data.solutions)) if (!langById.has(lang)) err(file, `bahasa solusi "${lang}" tidak ada di meta/languages.json`);
    for (const p of data.function.params) for (const lang of meta.languages) if (!lang.types[p.type]) err(file, `tipe ${p.type} belum dipetakan untuk ${lang.id}`);
    data.tests.forEach((t, i) => {
      if (t.args.length !== data.function.params.length) err(file, `tests[${i}]: jumlah args (${t.args.length}) ≠ jumlah parameter (${data.function.params.length})`);
    });
    if (data.level !== 'Mudah' && !data.tests.some((t) => t.hidden)) warn(file, 'level Sedang/Sulit sebaiknya punya ≥ 1 kasus tersembunyi');
    if (data.tests.every((t) => t.hidden)) err(file, 'minimal satu kasus uji harus terlihat');
    if (data.hints.length < 2) warn(file, 'petunjuk sebaiknya 2–3');
    if ((data.commonMistakes || []).length < 2) warn(file, 'kesalahan umum sebaiknya ≥ 2');
    for (const m of data.commonMistakes || []) if (m.failsTest != null && m.failsTest >= data.tests.length) err(file, `commonMistakes.failsTest ${m.failsTest} di luar jumlah tests`);
    for (const lang of ['javascript', 'python']) {
      if (data.verification?.[lang]?.passed !== true) (requireVerified ? err : warn)(file, `belum terverifikasi ${lang} (jalankan \`ngoding verify\`)`);
    }
  }

  const codes = new Map();
  for (const { file, data } of quizzes) {
    if (!vQuiz(data)) {
      for (const e of vQuiz.errors) err(file, `schema: ${e.instancePath || '/'} ${e.message}`);
      continue;
    }
    const base = path.basename(file, '.json');
    const temaFolder = path.basename(path.dirname(file));
    const langFolder = path.basename(path.dirname(path.dirname(file)));
    if (base !== data.id) err(file, `nama file (${base}) harus sama dengan id (${data.id})`);
    const lang = langById.get(data.lang);
    if (!lang) err(file, `bahasa "${data.lang}" tidak dikenal`);
    else if (!data.id.startsWith(lang.prefix + '-')) err(file, `id quiz ${data.lang} harus berawalan "${lang.prefix}-"`);
    if (langFolder !== data.lang) err(file, `folder bahasa (${langFolder}) harus sama dengan lang (${data.lang})`);
    if (temaFolder !== data.tema) err(file, `folder (${temaFolder}) harus sama dengan tema (${data.tema})`);
    const tema = temaBySlug.get(data.tema);
    if (!tema) err(file, `tema "${data.tema}" tidak ada di meta/temas.json`);
    else if (tema.mode !== 'quiz') err(file, `tema "${data.tema}" bukan tema Tebak Output`);
    if (ids.has(data.id)) err(file, `id "${data.id}" duplikat dengan ${rel(ids.get(data.id))}`);
    ids.set(data.id, file);
    const nc = data.lang + ':' + data.code.replace(/\s+/g, ' ').trim();
    if (codes.has(nc)) err(file, `kode quiz duplikat dengan ${rel(codes.get(nc))}`);
    codes.set(nc, file);
    if (data.verification?.passed !== true) (requireVerified ? err : warn)(file, 'belum terverifikasi (jalankan `ngoding verify`)');
  }

  if (checkLock && fs.existsSync(LOCK_FILE)) {
    const lock = readJson(LOCK_FILE);
    for (const id of lock.ids) {
      if (!ids.has(id)) errors.push({ file: rel(LOCK_FILE), msg: `id "${id}" sudah tayang tapi filenya hilang. ID tidak boleh diganti; pakai \`ngoding remove ${id} --yes\` bila memang ingin dihapus.` });
    }
  }
  return { errors, warnings, problems, quizzes, ids };
}

export function updateLock(ids) {
  const lock = fs.existsSync(LOCK_FILE) ? readJson(LOCK_FILE) : { note: '', ids: [], removed: [] };
  const set = new Set(lock.ids);
  let added = 0;
  for (const id of ids) if (!set.has(id)) (set.add(id), added++);
  lock.note = 'Dikelola otomatis oleh `ngoding check`. ID di sini sudah tayang dan tidak boleh hilang/berganti.';
  lock.ids = [...set].sort();
  lock.removed = [...new Set(lock.removed || [])].sort();
  if (added) writeJson(LOCK_FILE, lock);
  return added;
}

export function removeFromLock(id) {
  if (!fs.existsSync(LOCK_FILE)) return;
  const lock = readJson(LOCK_FILE);
  if (!lock.ids.includes(id)) return; // belum pernah tayang: tidak perlu dicatat
  lock.ids = lock.ids.filter((x) => x !== id);
  lock.removed = [...new Set([...(lock.removed || []), id])].sort();
  writeJson(LOCK_FILE, lock);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const argv = process.argv.slice(2);
  const positional = argv.filter((a) => !a.startsWith('--'));
  let only = null;
  if (positional.length) {
    const t = resolveTargets(positional);
    only = new Set([...t.problems, ...t.quizzes]);
  }
  const { errors, warnings, ids } = validateAll({ only, requireVerified: argv.includes('--require-verified') });
  const byFile = new Map();
  for (const e of errors) byFile.set(e.file, [...(byFile.get(e.file) || []), c.bad('✗ ') + e.msg]);
  if (!argv.includes('--no-warn')) for (const w of warnings) byFile.set(w.file, [...(byFile.get(w.file) || []), c.warn('! ') + w.msg]);
  for (const [file, msgs] of byFile) {
    console.log(c.bold(path.isAbsolute(file) ? rel(file) : file));
    for (const m of msgs) console.log('  ' + m);
  }
  const total = only ? only.size : problemFiles().length + quizFiles().length;
  console.log(`\nValidasi: ${total} file, ${errors.length ? c.bad(errors.length + ' error') : c.ok('0 error')}, ${warnings.length} peringatan.`);
  if (errors.length || (argv.includes('--strict') && warnings.length)) process.exit(1);
  if (argv.includes('--lock') && ids) {
    const added = updateLock(ids.keys());
    if (added) console.log(`id-lock: ${added} id baru dicatat.`);
  }
}
