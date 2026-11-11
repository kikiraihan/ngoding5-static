#!/usr/bin/env node
// ngoding new problem --tema <slug> --level <lv> --id <slug> [--title "..."]
// ngoding new quiz --lang <js|py|go> --tema <slug> --level <lv>
import fs from 'node:fs';
import path from 'node:path';
import { PROBLEMS_DIR, QUIZ_DIR, loadMeta, quizFiles, findById, writeJson, rel, today, c } from './lib/content.mjs';

const [kind, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) opt[rest[i].slice(2)] = rest[i + 1]?.startsWith('--') ? true : rest[++i];

const meta = loadMeta();
const fail = (m) => (console.error(c.bad('✗ ') + m), process.exit(1));
const level = opt.level ? opt.level[0].toUpperCase() + opt.level.slice(1).toLowerCase() : 'Mudah';
if (!meta.levels.some((l) => l.id === level)) fail(`level "${opt.level}" tidak valid (Mudah/Sedang/Sulit)`);

function needTema(mode) {
  const t = meta.temas.find((x) => x.slug === opt.tema);
  if (!t) fail(`--tema wajib, salah satu dari: ${meta.temas.filter((x) => x.mode === mode).map((x) => x.slug).join(', ')}`);
  if (t.mode !== mode) fail(`tema "${opt.tema}" bukan untuk mode ${mode}`);
  return t;
}

if (kind === 'problem') {
  const tema = needTema('code');
  const id = opt.id;
  if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail('--id wajib, format kebab-case (mis. "tahun-kabisat")');
  if (findById(id)) fail(`id "${id}" sudah dipakai`);
  const dir = path.join(PROBLEMS_DIR, tema.slug);
  const file = path.join(dir, `${id}.json`);
  const fnName = id.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase()).replace(/^[0-9]+/, 'f');
  writeJson(file, {
    id,
    schemaVersion: 1,
    revision: 1,
    tema: tema.slug,
    level,
    title: opt.title || id.replace(/-/g, ' ').replace(/^./, (s) => s.toUpperCase()),
    desc: 'TODO: tulis deskripsi soal yang jelas (format keluaran, urutan, kasus tepi).',
    tags: [],
    function: { name: fnName, params: [{ name: 'n', type: 'int' }], returns: 'int' },
    tests: [
      { args: [1], expected: 1 },
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
      { args: [0], expected: 0, hidden: true },
    ],
    compare: 'exact',
    hints: ['TODO: petunjuk 1 (arah umum).', 'TODO: petunjuk 2 (lebih spesifik).'],
    explanation: `${id}.md`,
    commonMistakes: [],
    solutions: {
      javascript: `function ${fnName}(n) {\n  return n;\n}`,
      python: `def ${fnName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}(n):\n    return n`,
    },
    source: opt.by && opt.by !== 'manual' ? 'generated' : 'bank',
    generator: { by: opt.by || 'manual', topik: opt.topik || null },
    createdAt: today(),
    updatedAt: today(),
  });
  const mdFile = path.join(dir, `${id}.md`);
  if (!fs.existsSync(mdFile))
    fs.writeFileSync(mdFile, '## Ide\n\nTODO\n\n## Langkah\n\n1. TODO\n\n## Kompleksitas\n\n- Waktu: O(?)\n- Ruang: O(?)\n\n## Variasi latihan\n\n- TODO\n');
  console.log(`${c.ok('✓')} dibuat ${rel(file)} dan ${rel(mdFile)}`);
} else if (kind === 'quiz') {
  const alias = { js: 'javascript', py: 'python', golang: 'go' };
  const lang = meta.languages.find((l) => l.id === (alias[opt.lang] || opt.lang));
  if (!lang) fail('--lang wajib: js, py, atau go');
  const tema = needTema('quiz');
  const used = quizFiles()
    .map((f) => path.basename(f, '.json'))
    .filter((id) => id.startsWith(lang.prefix + '-'))
    .map((id) => Number(id.split('-')[1]));
  const count = Math.max(1, Number(opt.count || opt.jumlah || 1));
  let next = (used.length ? Math.max(...used) : 0) + 1;
  for (let k = 0; k < count; k++, next++) {
    const id = `${lang.prefix}-${String(next).padStart(4, '0')}`;
    const file = path.join(QUIZ_DIR, lang.id, tema.slug, `${id}.json`);
    writeJson(file, {
      id,
      schemaVersion: 1,
      revision: 1,
      lang: lang.id,
      tema: tema.slug,
      level,
      title: 'TODO judul singkat',
      code:
        lang.id === 'python'
          ? `print("TODO ${id}")`
          : lang.id === 'go'
            ? `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("TODO ${id}")\n}`
            : `console.log("TODO ${id}");`,
      answer: 'TODO',
      explain: 'TODO: jelaskan kenapa outputnya begitu.',
      concepts: [],
      source: opt.by && opt.by !== 'manual' ? 'generated' : 'bank',
      generator: { by: opt.by || 'manual', topik: opt.topik || null },
      createdAt: today(),
      updatedAt: today(),
    });
    console.log(`${c.ok('✓')} dibuat ${rel(file)}`);
  }
} else {
  fail('pakai: ngoding new problem|quiz ...');
}
