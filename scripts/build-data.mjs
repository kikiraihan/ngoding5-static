#!/usr/bin/env node
// content/ → public/data/ (index ringan + file detail per soal) + public/sitemap.xml
// Build gagal jika data tidak valid (NF-06).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { ROOT, loadMeta, rel, c } from './lib/content.mjs';
import { validateAll } from './validate.mjs';

const OUT = path.join(ROOT, 'public', 'data');
const SITE_URL = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://ngoding5.vercel.app')).replace(/\/$/, '');

const md = new MarkdownIt({ html: false, linkify: true, typographer: false });
// id pada heading agar bisa dijadikan anchor ("Kenapa kasus gagal?", "Kompleksitas", ...)
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
md.core.ruler.push('heading_ids', (state) => {
  const toks = state.tokens;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].type === 'heading_open') toks[i].attrSet('id', 'bahas-' + slug(toks[i + 1].content));
  }
});

function renderMd(src) {
  return sanitizeHtml(md.render(src), {
    allowedTags: ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'],
    allowedAttributes: { a: ['href', 'title'], h2: ['id'], h3: ['id'], h4: ['id'], code: ['class'] },
    allowedSchemes: ['http', 'https'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' }) },
  });
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function write(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj));
}

const t0 = Date.now();
const { errors, warnings, problems, quizzes } = validateAll();
if (errors.length) {
  for (const e of errors) console.error(c.bad('✗ ') + (path.isAbsolute(e.file) ? rel(e.file) : e.file) + ': ' + e.msg);
  console.error(c.bad(`\nBuild data gagal: ${errors.length} error. Jalankan \`ngoding validate\`.`));
  process.exit(1);
}

const meta = loadMeta();
rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

const temaOrder = new Map(meta.temas.map((t) => [t.slug, t.order]));
const levelOrder = new Map(meta.levels.map((l) => [l.id, l.order]));
const sortKey = (a, b) =>
  temaOrder.get(a.tema) - temaOrder.get(b.tema) || levelOrder.get(a.level) - levelOrder.get(b.level) || a.title.localeCompare(b.title, 'id');

const index = [];
for (const { file, data } of problems) {
  const mdFile = path.join(path.dirname(file), data.explanation);
  const explanationHtml = fs.existsSync(mdFile) ? renderMd(fs.readFileSync(mdFile, 'utf8')) : '';
  const langs = Object.keys(data.solutions).filter((l) => data.verification?.[l]?.passed !== false);
  index.push({
    id: data.id,
    title: data.title,
    tema: data.tema,
    level: data.level,
    tags: data.tags || [],
    langs,
    revision: data.revision,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
  write(path.join(OUT, 'problems', `${data.id}.json`), {
    id: data.id,
    revision: data.revision,
    tema: data.tema,
    level: data.level,
    title: data.title,
    desc: data.desc,
    tags: data.tags || [],
    function: data.function,
    tests: data.tests,
    compare: data.compare || 'exact',
    hints: data.hints,
    commonMistakes: data.commonMistakes || [],
    solutions: data.solutions,
    explanationHtml,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}
index.sort(sortKey);

const quizIndex = { javascript: [], python: [] };
for (const { data } of quizzes) {
  (quizIndex[data.lang] ||= []).push({
    id: data.id,
    title: data.title || data.id,
    tema: data.tema,
    level: data.level,
    revision: data.revision,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
  write(path.join(OUT, 'quiz', `${data.id}.json`), {
    id: data.id,
    revision: data.revision,
    lang: data.lang,
    tema: data.tema,
    level: data.level,
    title: data.title || data.id,
    code: data.code,
    answer: data.answer,
    explain: data.explain,
    concepts: data.concepts || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}
for (const l of Object.keys(quizIndex)) quizIndex[l].sort((a, b) => temaOrder.get(a.tema) - temaOrder.get(b.tema) || levelOrder.get(a.level) - levelOrder.get(b.level) || a.id.localeCompare(b.id));

write(path.join(OUT, 'index.json'), index);
write(path.join(OUT, 'quiz-index.json'), quizIndex);
const dataVersion = crypto.createHash('sha1').update(JSON.stringify([index, quizIndex])).digest('hex').slice(0, 10);
write(path.join(OUT, 'meta.json'), {
  dataVersion,
  builtAt: new Date().toISOString(),
  temas: meta.temas,
  languages: meta.languages.map(({ types, ...l }) => ({ ...l, types })),
  levels: meta.levels,
  counts: { problems: index.length, quiz: Object.fromEntries(Object.entries(quizIndex).map(([k, v]) => [k, v.length])) },
});

// sitemap.xml (NF-08)
const urls = ['/', '/tentang', ...index.map((p) => `/soal/${p.id}`), ...Object.entries(quizIndex).flatMap(([l, list]) => list.map((q) => `/tebak/${l}/${q.id}`))];
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), sitemap);

const qTotal = Object.values(quizIndex).reduce((s, l) => s + l.length, 0);
console.log(
  `${c.ok('✓')} Build data: ${index.length} soal tulis kode, ${qTotal} soal tebak output → ${rel(OUT)} ` +
    c.dim(`(dataVersion ${dataVersion}, ${warnings.length} peringatan, ${Date.now() - t0} ms)`),
);
