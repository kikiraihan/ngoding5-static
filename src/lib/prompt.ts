// Susun teks "Salin untuk tanya AI" (Lampiran C PRD).
import type { Language, Problem, RunOutcome } from './types';
import { callStr, lit } from './format';
import { signature } from './signature';

export function buildPrompt(opts: {
  problem: Problem;
  lang: Language;
  temaLabel: string;
  code: string;
  run?: RunOutcome | null;
  includeSolution: boolean;
  solution?: { code: string; lang: Language } | null;
}): string {
  const { problem, lang, code, run } = opts;
  const lines: string[] = [];
  lines.push('Saya sedang latihan di Ngoding5. Bantu saya memahami soal ini tanpa langsung memberi solusi lengkap, kecuali saya minta.');
  lines.push('');
  lines.push(`SOAL: ${problem.title} (${problem.level}, ${opts.temaLabel}) — ${lang.label}`);
  lines.push(problem.desc);
  lines.push(`Tanda tangan: ${signature(problem.function, lang)}`);
  lines.push('');
  lines.push('KODE SAYA:');
  lines.push('```' + lang.ext);
  lines.push(code.replace(/\s+$/, ''));
  lines.push('```');
  lines.push('');
  lines.push('HASIL TES TERAKHIR:');
  if (!run) lines.push('(belum dijalankan)');
  else {
    if (run.fatal) lines.push(`Error: ${run.fatal}`);
    lines.push(`Skor ${run.passed}/${run.total}`);
    for (const c of run.cases) {
      const call = callStr(problem.function.name, c.args, lang.id);
      const got = c.ok ? lit(c.value, lang.id) : `error: ${c.error ?? '-'}`;
      lines.push(`- ${c.hidden ? '(tersembunyi) ' : ''}${call} → diharapkan ${lit(c.expected, lang.id)}, hasil saya ${got} [${c.pass ? 'LULUS' : 'GAGAL'}]`);
    }
    if (run.logs) {
      lines.push('Output print/console.log:');
      lines.push(run.logs.split('\n').slice(0, 30).join('\n'));
    }
  }
  if (opts.includeSolution && opts.solution) {
    lines.push('');
    lines.push(`SOLUSI RUJUKAN (${opts.solution.lang.label}):`);
    lines.push('```' + opts.solution.lang.ext);
    lines.push(opts.solution.code);
    lines.push('```');
  }
  lines.push('');
  lines.push('Pertanyaan saya:');
  lines.push('');
  return lines.join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* lanjut ke fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
