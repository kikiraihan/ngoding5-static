<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfigPanel from '@/components/ConfigPanel.vue';
import ProblemPicker from '@/components/ProblemPicker.vue';
import ProblemPanel from '@/components/ProblemPanel.vue';
import CodeEditor from '@/components/CodeEditor.vue';
import TestResults from '@/components/TestResults.vue';
import AskAiCopy from '@/components/AskAiCopy.vue';
import { useCatalog } from '@/stores/catalog';
import { useSettings } from '@/stores/settings';
import { useProgress } from '@/stores/progress';
import { useRunner } from '@/stores/runner';
import { starter } from '@/lib/signature';
import { setHead } from '@/lib/head';
import { save } from '@/lib/storage';
import { toast } from '@/lib/toast';
import { preloadPython } from '@/lib/runners/python';
import type { LangId, Problem } from '@/lib/types';

const route = useRoute();
const router = useRouter();
const catalog = useCatalog();
const settings = useSettings();
const progress = useProgress();
const runner = useRunner();

settings.mode = 'code';
const id = computed(() => String(route.params.id));
const langId = computed<LangId>(() => (route.query.lang === 'python' ? 'python' : route.query.lang === 'javascript' ? 'javascript' : settings.lang));
const lang = computed(() => catalog.lang(langId.value));
watch(langId, (l) => (settings.lang = l), { immediate: true });

// ---- Filter (FE-04: tercermin di URL query) ----
if (typeof route.query.tema === 'string') settings.temaCode = route.query.tema;
if (typeof route.query.level === 'string') {
  const lv = route.query.level.toLowerCase();
  settings.level = lv === 'mudah' ? 'Mudah' : lv === 'sedang' ? 'Sedang' : lv === 'sulit' ? 'Sulit' : '';
}
const filtered = computed(() => {
  const q = settings.query.trim().toLowerCase();
  return catalog.problems.filter(
    (p) => (!settings.temaCode || p.tema === settings.temaCode) && (!settings.level || p.level === settings.level) && (!q || p.title.toLowerCase().includes(q)),
  );
});
const pickItems = computed(() => filtered.value.map((p) => ({ id: p.id, title: p.title, tema: p.tema, level: p.level, done: progress.isSolved(p.id) })));

function go(pid: string) {
  router.push({ path: `/soal/${pid}`, query: { ...route.query } });
}
function goRandom() {
  const pool = filtered.value.filter((p) => p.id !== id.value);
  const unsolved = pool.filter((p) => !progress.isSolved(p.id, langId.value));
  const list = unsolved.length ? unsolved : pool;
  if (!list.length) return toast('Tidak ada soal lain dalam filter ini.');
  go(list[Math.floor(Math.random() * list.length)].id);
}

// Saat filter berubah oleh pengguna: tulis ke URL, dan buka soal pertama bila soal aktif keluar dari filter.
watch(
  () => [settings.temaCode, settings.level] as const,
  ([tema, level]) => {
    const query = { ...route.query, tema: tema || undefined, level: level ? level.toLowerCase() : undefined };
    const inFilter = filtered.value.some((p) => p.id === id.value);
    if (!inFilter && filtered.value.length) router.push({ path: `/soal/${filtered.value[0].id}`, query });
    else router.replace({ query });
  },
);

// ---- Muat detail soal ----
const problem = ref<Problem | null>(null);
const notFound = ref(false);
const code = ref('');
const explanationOpen = ref(false);
const unlocked = ref(false);

async function loadProblem() {
  notFound.value = false;
  await catalog.init();
  const summary = catalog.problems.find((p) => p.id === id.value);
  if (!summary) {
    problem.value = null;
    notFound.value = catalog.loaded;
    setHead('Soal tidak ditemukan');
    return;
  }
  // Soal dibuka lewat tautan tapi tidak masuk filter aktif → kosongkan filter.
  if (!filtered.value.some((p) => p.id === summary.id)) {
    settings.temaCode = '';
    settings.level = '';
    settings.query = '';
  }
  try {
    const p = await catalog.problem(id.value);
    if (p.id !== id.value) return;
    problem.value = p;
    save('lastProblem', p.id);
    setHead(`${p.title} (${p.level})`, p.desc);
    unlocked.value = progress.isSolved(p.id);
    explanationOpen.value = false;
    loadCode();
  } catch (e) {
    toast((e as Error).message);
  }
}

function loadCode() {
  if (!problem.value || !lang.value) return;
  code.value = progress.getDraft(problem.value.id, langId.value) ?? starter(problem.value.function, lang.value);
}

watch(id, loadProblem, { immediate: true });
watch(langId, () => {
  loadCode();
  if (langId.value === 'python') preloadPython();
});
if (langId.value === 'python') preloadPython();

let draftTimer: ReturnType<typeof setTimeout> | undefined;
watch(code, (v) => {
  if (!problem.value) return;
  const pid = problem.value.id;
  const l = langId.value;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    if (lang.value && v === starter(problem.value!.function, lang.value)) progress.clearDraft(pid, l);
    else progress.setDraft(pid, l, v);
  }, 400);
});
onBeforeUnmount(() => clearTimeout(draftTimer));

function resetCode() {
  if (!problem.value || !lang.value) return;
  if (!window.confirm('Ganti kode kamu dengan template awal? Draft untuk bahasa ini akan dihapus.')) return;
  progress.clearDraft(problem.value.id, langId.value);
  code.value = starter(problem.value.function, lang.value);
}

const runKey = computed(() => `${id.value}:${langId.value}`);
const lastRun = computed(() => progress.lastRuns[runKey.value] ?? null);

async function runTests() {
  if (!problem.value || !lang.value || runner.running) return;
  const p = problem.value;
  const outcome = await runner.run(p, lang.value, code.value);
  if (p.id !== id.value) return;
  const allPass = progress.recordRun(p.id, p.revision, outcome);
  if (allPass) {
    unlocked.value = true;
    toast(`Tuntas! Beruntun ${progress.streak}.`);
  }
  await nextTick();
  document.getElementById('hasil')?.focus({ preventScroll: true });
}

const failingTests = computed(() => new Set(lastRun.value?.cases.filter((c) => !c.pass).map((c) => c.index) ?? []));
const mistakesOpen = ref(false);
function jumpMistakes() {
  mistakesOpen.value = true;
  nextTick(() => document.getElementById('kesalahan-umum')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

const isNew = computed(() => {
  const s = catalog.problems.find((p) => p.id === id.value);
  return s ? catalog.isNew(s.createdAt) : false;
});
</script>

<template>
  <ConfigPanel />
  <ProblemPicker :items="pickItems" :current-id="id" :total="catalog.problems.length" @select="go" @random="goRandom" />

  <div v-if="notFound" class="panel empty">
    <p>Soal "<b>{{ id }}</b>" tidak ditemukan. Mungkin sudah dihapus atau tautannya salah.</p>
    <p style="margin-top: 12px"><button class="btn primary" @click="goRandom">Ke soal acak</button></p>
  </div>

  <div v-else-if="!problem || !lang" class="work" aria-busy="true">
    <div class="panel stack"><div class="skeleton" style="width: 40%" /><div class="skeleton" style="height: 28px; width: 70%" /><div class="skeleton" /><div class="skeleton" style="width: 85%" /></div>
    <div class="panel stack"><div class="skeleton" style="height: 280px" /></div>
  </div>

  <div v-else class="work">
    <ProblemPanel
      v-model:explanation-open="explanationOpen"
      :problem="problem"
      :lang="lang"
      :solved="progress.isSolved(problem.id, langId)"
      :outdated="progress.isOutdated(problem.id, problem.revision, langId)"
      :is-new="isNew"
      :explanation-unlocked="unlocked"
      @unlock="(unlocked = true), (explanationOpen = true)"
      @jump-mistakes="jumpMistakes"
    />

    <section class="panel" aria-label="Meja kerja">
      <div class="workbench-head">
        <span class="filename">solusi.{{ lang.ext }}</span>
        <span class="row" style="gap: 6px">
          <span v-if="langId === 'python' && runner.pyStatus === 'loading'" class="pill info">Memuat Python…</span>
          <span class="pill info">dijalankan di browser</span>
        </span>
      </div>
      <CodeEditor v-model="code" :indent="lang.indent" :label="`Editor kode ${lang.label}`" @run="runTests" />
      <p class="editor-hint kbd-hint">
        <kbd>Tab</kbd> indentasi · <kbd>Shift</kbd>+<kbd>Tab</kbd> kurangi · <kbd>Esc</kbd> lalu <kbd>Tab</kbd> keluar editor ·
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> jalankan
      </p>
      <div class="actions">
        <button class="btn primary" :disabled="runner.running" @click="runTests">
          <span v-if="runner.running" class="spinner" aria-hidden="true" />
          {{ runner.running ? (langId === 'python' && runner.pyStatus === 'loading' ? 'Memuat Python…' : 'Menjalankan…') : '▶ Jalankan tes' }}
        </button>
        <AskAiCopy :problem="problem" :lang="lang" :code="code" :run="lastRun" />
        <span class="spacer" />
        <button class="btn ghost danger" @click="resetCode">Reset kode</button>
      </div>

      <div id="hasil" tabindex="-1" aria-live="polite" style="outline: none">
        <TestResults v-if="lastRun" :outcome="lastRun" :fn-name="problem.function.name" />
        <p v-else class="muted" style="font-size: 14px; margin-top: 14px">Tulis solusi lalu jalankan tes untuk melihat hasilnya di sini.</p>
      </div>

      <details v-if="problem.commonMistakes.length" id="kesalahan-umum" class="details" style="margin-top: 14px" :open="mistakesOpen" @toggle="mistakesOpen = ($event.target as HTMLDetailsElement).open">
        <summary>Kesalahan umum <span class="count">{{ problem.commonMistakes.length }}</span></summary>
        <div class="details-body">
          <ul class="mistakes">
            <li v-for="(m, i) in problem.commonMistakes" :key="i" :class="{ hit: m.failsTest != null && failingTests.has(m.failsTest) }">
              {{ m.text }}
              <span v-if="m.failsTest != null" class="meta">
                Biasanya membuat kasus {{ problem.tests[m.failsTest]?.hidden ? 'tersembunyi' : '#' + (m.failsTest + 1) }} gagal{{ failingTests.has(m.failsTest) ? ' — dan kasus itu gagal di run terakhirmu.' : '.' }}
              </span>
            </li>
          </ul>
        </div>
      </details>
    </section>
  </div>
</template>
