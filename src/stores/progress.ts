import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { load, save, remove, keys } from '@/lib/storage';
import type { LangId, RunOutcome } from '@/lib/types';

interface SolvedEntry {
  at: string;
  revision: number;
}
type SolvedMap = Record<string, Partial<Record<LangId, SolvedEntry>>>;
interface QuizEntry {
  correct: boolean;
  at: string;
  revision: number;
}
interface Draft {
  code: string;
  at: string;
}

export interface ProgressExport {
  app: 'ngoding5';
  version: 1;
  exportedAt: string;
  solved: SolvedMap;
  quiz: Record<string, QuizEntry>;
  streak: number;
  bestStreak: number;
  drafts: Record<string, Draft>;
}

const now = () => new Date().toISOString();

export const useProgress = defineStore('progress', () => {
  const solved = ref<SolvedMap>(load('solved', {}));
  const quiz = ref<Record<string, QuizEntry>>(load('quiz', {}));
  const streak = ref<number>(load('streak', 0));
  const bestStreak = ref<number>(load('bestStreak', 0));
  // Hasil run terakhir per soal+bahasa (hanya di memori; dipakai "Salin untuk tanya AI").
  const lastRuns = ref<Record<string, RunOutcome>>({});

  watch(solved, (v) => save('solved', v), { deep: true });
  watch(quiz, (v) => save('quiz', v), { deep: true });
  watch(streak, (v) => {
    save('streak', v);
    if (v > bestStreak.value) bestStreak.value = v;
  });
  watch(bestStreak, (v) => save('bestStreak', v));

  const solvedCount = computed(() => Object.values(solved.value).filter((e) => Object.keys(e).length > 0).length);
  const quizCorrect = computed(() => Object.values(quiz.value).filter((q) => q.correct).length);

  const isSolved = (id: string, lang?: LangId) => {
    const e = solved.value[id];
    if (!e) return false;
    return lang ? !!e[lang] : Object.keys(e).length > 0;
  };
  /** Soal sudah tuntas tetapi isinya diperbarui setelah itu (F9). */
  const isOutdated = (id: string, revision: number, lang?: LangId) => {
    const e = solved.value[id];
    if (!e) return false;
    const list = lang ? [e[lang]] : Object.values(e);
    return list.some((x) => x && x.revision < revision);
  };

  function recordRun(id: string, revision: number, outcome: RunOutcome) {
    const key = `${id}:${outcome.lang}`;
    const prev = lastRuns.value[key];
    lastRuns.value[key] = outcome;
    const allPass = !outcome.fatal && outcome.total > 0 && outcome.passed === outcome.total;
    if (allPass) {
      const already = prev && !prev.fatal && prev.passed === prev.total;
      if (!already) streak.value++;
      solved.value[id] = { ...(solved.value[id] ?? {}), [outcome.lang]: { at: now(), revision } };
    } else {
      streak.value = 0;
    }
    return allPass;
  }

  function recordQuiz(id: string, revision: number, correct: boolean) {
    const prev = quiz.value[id];
    // Jawaban benar yang sudah pernah benar tidak mengubah apa pun (hindari menambah beruntun berulang).
    if (correct && prev?.correct) return;
    quiz.value[id] = { correct: correct || !!prev?.correct, at: now(), revision };
    streak.value = correct ? streak.value + 1 : 0;
  }

  // Draft kode per soal per bahasa (FE-17)
  const draftKey = (id: string, lang: LangId) => `draft:${id}:${lang}`;
  const getDraft = (id: string, lang: LangId) => load<Draft | null>(draftKey(id, lang), null)?.code ?? null;
  const setDraft = (id: string, lang: LangId, code: string) => save(draftKey(id, lang), { code, at: now() });
  const clearDraft = (id: string, lang: LangId) => remove(draftKey(id, lang));

  const lastRoute = ref<string | null>(load('lastRoute', null));
  watch(lastRoute, (v) => save('lastRoute', v));

  function exportData(): ProgressExport {
    const drafts: Record<string, Draft> = {};
    for (const k of keys('draft:')) {
      const d = load<Draft | null>(k, null);
      if (d) drafts[k.slice('draft:'.length)] = d;
    }
    return {
      app: 'ngoding5',
      version: 1,
      exportedAt: now(),
      solved: solved.value,
      quiz: quiz.value,
      streak: streak.value,
      bestStreak: bestStreak.value,
      drafts,
    };
  }

  /** Gabungkan progres impor: ambil yang terbaru per soal (F5). Mengembalikan jumlah entri yang berubah. */
  function importData(data: ProgressExport): number {
    if (!data || data.app !== 'ngoding5' || data.version !== 1) throw new Error('File bukan ekspor progres Ngoding5 yang dikenali.');
    let changed = 0;
    const s = { ...solved.value };
    for (const [id, langs] of Object.entries(data.solved ?? {})) {
      const cur = { ...(s[id] ?? {}) };
      for (const [l, e] of Object.entries(langs ?? {}) as [LangId, SolvedEntry][]) {
        if (!cur[l] || cur[l]!.at < e.at) {
          cur[l] = e;
          changed++;
        }
      }
      s[id] = cur;
    }
    solved.value = s;
    const q = { ...quiz.value };
    for (const [id, e] of Object.entries(data.quiz ?? {})) {
      if (!q[id] || q[id].at < e.at) {
        q[id] = e;
        changed++;
      }
    }
    quiz.value = q;
    for (const [k, d] of Object.entries(data.drafts ?? {})) {
      const cur = load<Draft | null>('draft:' + k, null);
      if (!cur || cur.at < d.at) {
        save('draft:' + k, d);
        changed++;
      }
    }
    bestStreak.value = Math.max(bestStreak.value, data.bestStreak ?? 0);
    return changed;
  }

  function resetAll() {
    for (const k of keys('draft:')) remove(k);
    solved.value = {};
    quiz.value = {};
    streak.value = 0;
    bestStreak.value = 0;
  }

  return {
    solved, quiz, streak, bestStreak, lastRuns, solvedCount, quizCorrect, isSolved, isOutdated,
    recordRun, recordQuiz, getDraft, setDraft, clearDraft, lastRoute, exportData, importData, resetAll,
  };
});
