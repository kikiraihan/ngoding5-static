#!/usr/bin/env node
// ngoding remove <id> [--yes]  — menghapus soal beserta MD-nya.
import fs from 'node:fs';
import path from 'node:path';
import { findById, readJson, rel, c } from './lib/content.mjs';
import { removeFromLock } from './validate.mjs';

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const found = id && findById(id);
if (!found) {
  console.error(c.bad('✗ ') + `soal "${id ?? ''}" tidak ditemukan`);
  process.exit(1);
}
const files = [found.file];
if (found.kind === 'problem') {
  const data = readJson(found.file);
  const mdFile = path.join(path.dirname(found.file), data.explanation);
  if (fs.existsSync(mdFile)) files.push(mdFile);
}
if (!argv.includes('--yes')) {
  console.log(`Akan menghapus:\n${files.map((f) => '  ' + rel(f)).join('\n')}\n${c.warn('Progres pengguna untuk soal ini tidak bisa dipakai lagi.')} Ulangi dengan --yes untuk menghapus.`);
  process.exit(0);
}
for (const f of files) fs.rmSync(f);
removeFromLock(id);
console.log(c.ok('✓ ') + `dihapus: ${files.map(rel).join(', ')}`);
