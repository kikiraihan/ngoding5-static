<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfigPanel from '@/components/ConfigPanel.vue';
import ProblemPicker from '@/components/ProblemPicker.vue';
import QuizPanel from '@/components/QuizPanel.vue';
import { useCatalog } from '@/stores/catalog';
import { useSettings } from '@/stores/settings';
import { useProgress } from '@/stores/progress';
import { setHead } from '@/lib/head';
import { load, save } from '@/lib/storage';
import { toast } from '@/lib/toast';
import { asLangId, type LangId, type Quiz } from '@/lib/types';

const route = useRoute();
const router = useRouter();
const catalog = useCatalog();
const settings = useSettings();
const progress = useProgress();

settings.mode = 'quiz';
const langId = computed<LangId>(() => asLangId(route.params.lang) ?? 'javascript');
watch(langId, (l) => (settings.lang = l), { immediate: true });
const lang = computed(() => catalog.lang(langId.value));
const id = computed(() => (route.params.id ? String(route.params.id) : ''));

if (typeof route.query.tema === 'string') settings.temaQuiz = route.query.tema;

const all = computed(() => catalog.quizList(langId.value));
const filtered = computed(() => {
  const q = settings.query.trim().toLowerCase();
  return all.value.filter(
    (x) => (!settings.temaQuiz || x.tema === settings.temaQuiz) && (!settings.level || x.level === settings.level) && (!q || x.title.toLowerCase().includes(q)),
  );
});
const pickItems = computed(() => filtered.value.map((x) => ({ id: x.id, title: x.title, tema: x.tema, level: x.level, done: !!progress.quiz[x.id]?.correct })));

function go(qid: string, replace = false) {
  const to = { path: `/tebak/${langId.value}/${qid}`, query: { ...route.query } };
  return replace ? router.replace(to) : router.push(to);
}
function goRandom() {
  const pool = filtered.value.filter((x) => x.id !== id.value);
  const fresh = pool.filter((x) => !progress.quiz[x.id]?.correct);
  const list = fresh.length ? fresh : pool;
  if (!list.length) return toast('Tidak ada soal lain dalam filter ini.');
  go(list[Math.floor(Math.random() * list.length)].id);
}
function goNext() {
  const list = filtered.value;
  if (!list.length) return;
  const i = list.findIndex((x) => x.id === id.value);
  // utamakan soal berikutnya yang belum benar
  for (let k = 1; k <= list.length; k++) {
    const cand = list[(i + k) % list.length];
    if (!progress.quiz[cand.id]?.correct) return go(cand.id);
  }
  go(list[(i + 1) % list.length].id);
}

watch(
  () => [settings.temaQuiz, settings.level] as const,
  ([tema, level]) => {
    const query = { ...route.query, tema: tema || undefined, level: level ? level.toLowerCase() : undefined };
    if (!filtered.value.some((x) => x.id === id.value) && filtered.value.length) router.push({ path: `/tebak/${langId.value}/${filtered.value[0].id}`, query });
    else router.replace({ query });
  },
);

const quiz = ref<Quiz | null>(null);
const notFound = ref(false);

async function loadQuiz() {
  notFound.value = false;
  await catalog.init();
  if (!id.value) {
    const last = load<string | null>(`lastQuiz:${langId.value}`, null);
    const target = (last && all.value.find((x) => x.id === last)) || filtered.value[0] || all.value[0];
    if (target) go(target.id, true);
    else notFound.value = true;
    return;
  }
  const summary = all.value.find((x) => x.id === id.value);
  if (!summary) {
    quiz.value = null;
    notFound.value = true;
    setHead('Soal tidak ditemukan');
    return;
  }
  if (!filtered.value.some((x) => x.id === summary.id)) {
    settings.temaQuiz = '';
    settings.level = '';
    settings.query = '';
  }
  try {
    const q = await catalog.quiz(id.value);
    if (q.id !== id.value) return;
    quiz.value = q;
    save(`lastQuiz:${langId.value}`, q.id);
    setHead(`Tebak output: ${q.title} (${lang.value?.label ?? q.lang})`, `Apa output program ${lang.value?.label ?? ''} ini? Latihan tebak output level ${q.level}.`);
  } catch (e) {
    toast((e as Error).message);
  }
}
watch([id, langId], loadQuiz, { immediate: true });

const isNew = computed(() => {
  const s = all.value.find((x) => x.id === id.value);
  return s ? catalog.isNew(s.createdAt) : false;
});
</script>

<template>
  <ConfigPanel />
  <ProblemPicker :items="pickItems" :current-id="id" :total="all.length" @select="go" @random="goRandom" />
  <div v-if="notFound" class="panel empty">
    <p>Soal tebak output "<b>{{ id }}</b>" tidak ditemukan.</p>
    <p style="margin-top: 12px"><button class="btn primary" @click="goRandom">Ke soal acak</button></p>
  </div>
  <div v-else-if="!quiz || !lang" class="work" aria-busy="true">
    <div class="panel stack"><div class="skeleton" style="width: 40%" /><div class="skeleton" style="height: 120px" /></div>
    <div class="panel stack"><div class="skeleton" style="height: 110px" /></div>
  </div>
  <QuizPanel v-else :quiz="quiz" :lang="lang" :is-new="isNew" @next="goNext" />
</template>
