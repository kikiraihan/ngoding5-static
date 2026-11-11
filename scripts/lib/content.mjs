// Util bersama untuk membaca & menulis folder content/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT = path.join(ROOT, 'content');
export const PROBLEMS_DIR = path.join(CONTENT, 'problems');
export const QUIZ_DIR = path.join(CONTENT, 'quiz');
export const META_DIR = path.join(CONTENT, 'meta');

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Gagal membaca JSON ${rel(file)}: ${e.message}`);
  }
}

export function rel(file) {
  return path.relative(ROOT, file);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function loadMeta() {
  return {
    temas: readJson(path.join(META_DIR, 'temas.json')),
    languages: readJson(path.join(META_DIR, 'languages.json')),
    levels: readJson(path.join(META_DIR, 'levels.json')),
  };
}

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p, ext));
    else if (ent.name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

export function problemFiles() {
  return walk(PROBLEMS_DIR, '.json');
}

export function quizFiles() {
  return walk(QUIZ_DIR, '.json');
}

/** Muat semua soal: [{ file, data }] */
export function loadProblems(files = problemFiles()) {
  return files.map((file) => ({ file, data: readJson(file) }));
}

export function loadQuizzes(files = quizFiles()) {
  return files.map((file) => ({ file, data: readJson(file) }));
}

/**
 * Pisahkan argumen path menjadi file soal & quiz. Folder ditelusuri.
 * Tanpa argumen = semua.
 */
export function resolveTargets(args) {
  if (!args.length) return { problems: problemFiles(), quizzes: quizFiles() };
  const problems = [];
  const quizzes = [];
  for (const a of args) {
    const p = path.resolve(a);
    const list = fs.existsSync(p) && fs.statSync(p).isDirectory() ? walk(p, '.json') : [p];
    for (const f of list) {
      if (!f.endsWith('.json')) continue;
      if (f.startsWith(PROBLEMS_DIR + path.sep)) problems.push(f);
      else if (f.startsWith(QUIZ_DIR + path.sep)) quizzes.push(f);
    }
  }
  // Izinkan juga memberi id soal langsung, mis. `ngoding verify fizzbuzz js-0001`
  for (const a of args) {
    if (a.includes('/') || a.endsWith('.json')) continue;
    const byId = findById(a);
    if (byId?.kind === 'problem') problems.push(byId.file);
    if (byId?.kind === 'quiz') quizzes.push(byId.file);
  }
  return { problems: [...new Set(problems)], quizzes: [...new Set(quizzes)] };
}

export function findById(id) {
  for (const f of problemFiles()) if (path.basename(f, '.json') === id) return { kind: 'problem', file: f };
  for (const f of quizFiles()) if (path.basename(f, '.json') === id) return { kind: 'quiz', file: f };
  return null;
}

/**
 * Format JSON yang ramah diff: objek/array pendek ditulis satu baris,
 * sisanya diuraikan dengan indentasi 2 spasi.
 */
function inline(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(inline).join(', ') + ']';
  const keys = Object.keys(value);
  if (!keys.length) return '{}';
  return '{ ' + keys.map((k) => JSON.stringify(k) + ': ' + inline(value[k])).join(', ') + ' }';
}

export function formatJson(value, indent = '', width = 100) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  // objek tingkat atas selalu diuraikan; selebihnya satu baris bila muat
  const listOfObjects = Array.isArray(value) && value.some((v) => v && typeof v === 'object' && !Array.isArray(v));
  if (indent !== '' && !listOfObjects) {
    const one = inline(value);
    if (one.length + indent.length <= width) return one;
  }
  const next = indent + '  ';
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return '[\n' + value.map((v) => next + formatJson(v, next, width)).join(',\n') + '\n' + indent + ']';
  }
  const keys = Object.keys(value);
  if (!keys.length) return '{}';
  return '{\n' + keys.map((k) => next + JSON.stringify(k) + ': ' + formatJson(value[k], next, width)).join(',\n') + '\n' + indent + '}';
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, formatJson(value) + '\n');
}

export const c = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
