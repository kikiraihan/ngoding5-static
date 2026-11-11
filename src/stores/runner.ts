import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LangId, Problem, RunOutcome, CaseResult, Language } from '@/lib/types';
import { deepEq } from '@/lib/format';
import { fnNameFor } from '@/lib/signature';
import { runJs } from '@/lib/runners/js';
import { runPython, onPyStatus, type PyStatus } from '@/lib/runners/python';
import type { RawRun } from '@/lib/runners/types';

export const useRunner = defineStore('runner', () => {
  const running = ref(false);
  const pyStatus = ref<PyStatus>('idle');
  onPyStatus((s) => (pyStatus.value = s));

  async function run(problem: Problem, lang: Language, code: string): Promise<RunOutcome> {
    running.value = true;
    try {
      const fnName = fnNameFor(problem.function.name, lang.id);
      let raw: RawRun;
      if (lang.id === 'javascript') raw = await runJs(code, fnName, problem.tests, lang.timeoutMs);
      else if (lang.id === 'python') raw = await runPython(code, fnName, problem.tests, lang.timeoutMs);
      else raw = { fatal: `${lang.label} belum bisa dijalankan di browser.`, logs: '' };
      return toOutcome(problem, lang.id, raw);
    } finally {
      running.value = false;
    }
  }

  return { running, pyStatus, run };
});

function toOutcome(problem: Problem, lang: LangId, raw: RawRun): RunOutcome {
  const cases: CaseResult[] = problem.tests.map((t, i) => {
    const r = raw.results?.[i];
    const base = { index: i, hidden: !!t.hidden, args: t.args, expected: t.expected };
    if (!r) return { ...base, ok: false, error: raw.fatal, pass: false };
    if (!r.ok) return { ...base, ok: false, error: r.error, pass: false };
    return { ...base, ok: true, value: r.value, pass: deepEq(r.value, t.expected, problem.compare) };
  });
  return {
    lang,
    cases,
    passed: cases.filter((c) => c.pass).length,
    total: cases.length,
    logs: raw.logs || '',
    fatal: raw.fatal,
    at: Date.now(),
  };
}
