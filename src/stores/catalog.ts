import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Meta, Problem, ProblemSummary, Quiz, QuizSummary, LangId, Tema, Language } from '@/lib/types';
import { isRecent } from '@/lib/format';

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Gagal memuat ${url} (${r.status})`);
  return r.json() as Promise<T>;
}

export const useCatalog = defineStore('catalog', () => {
  const meta = ref<Meta | null>(null);
  const problems = ref<ProblemSummary[]>([]);
  const quizzes = ref<Record<string, QuizSummary[]>>({});
  const loaded = ref(false);
  const error = ref<string | null>(null);
  const problemCache = new Map<string, Promise<Problem>>();
  const quizCache = new Map<string, Promise<Quiz>>();
  let loading: Promise<void> | null = null;

  function init() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const [m, idx, qidx] = await Promise.all([
          getJson<Meta>('/data/meta.json'),
          getJson<ProblemSummary[]>('/data/index.json'),
          getJson<Record<string, QuizSummary[]>>('/data/quiz-index.json'),
        ]);
        meta.value = m;
        problems.value = idx;
        quizzes.value = qidx;
        loaded.value = true;
      } catch (e) {
        error.value = (e as Error).message;
        loading = null;
      }
    })();
    return loading;
  }

  const temas = computed<Tema[]>(() => [...(meta.value?.temas ?? [])].sort((a, b) => a.order - b.order));
  const languages = computed<Language[]>(() => meta.value?.languages ?? []);
  const temaLabel = (slug: string) => temas.value.find((t) => t.slug === slug)?.label ?? slug;
  const lang = (id: string) => languages.value.find((l) => l.id === id);

  /** Tanggal terbit paling awal = batch rilis pertama; soal batch itu tidak diberi label "Baru". */
  const firstBatch = computed(() => {
    const all = [...problems.value, ...Object.values(quizzes.value).flat()].map((p) => p.createdAt).sort();
    return all[0] ?? '';
  });
  const isNew = (createdAt: string) => createdAt > firstBatch.value && isRecent(createdAt);

  function problem(id: string): Promise<Problem> {
    if (!problemCache.has(id)) {
      const p = getJson<Problem>(`/data/problems/${encodeURIComponent(id)}.json`);
      p.catch(() => problemCache.delete(id));
      problemCache.set(id, p);
    }
    return problemCache.get(id)!;
  }

  function quiz(id: string): Promise<Quiz> {
    if (!quizCache.has(id)) {
      const p = getJson<Quiz>(`/data/quiz/${encodeURIComponent(id)}.json`);
      p.catch(() => quizCache.delete(id));
      quizCache.set(id, p);
    }
    return quizCache.get(id)!;
  }

  const quizList = (l: LangId) => quizzes.value[l] ?? [];

  return { meta, problems, quizzes, loaded, error, init, temas, languages, temaLabel, lang, isNew, problem, quiz, quizList };
});
