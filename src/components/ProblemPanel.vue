<script setup lang="ts">
import { computed } from 'vue';
import type { Language, Problem } from '@/lib/types';
import { callStr, lit } from '@/lib/format';
import { signature } from '@/lib/signature';
import { useCatalog } from '@/stores/catalog';
import { reportIssueUrl } from '@/lib/config';
import HintList from './HintList.vue';
import Explanation from './Explanation.vue';

const props = defineProps<{
  problem: Problem;
  lang: Language;
  solved: boolean;
  outdated: boolean;
  isNew: boolean;
  explanationOpen: boolean;
  explanationUnlocked: boolean;
}>();
const emit = defineEmits<{ 'update:explanationOpen': [v: boolean]; unlock: []; jumpMistakes: [] }>();
const catalog = useCatalog();

const visible = computed(() => props.problem.tests.filter((t) => !t.hidden));
const hiddenCount = computed(() => props.problem.tests.length - visible.value.length);
const sig = computed(() => signature(props.problem.function, props.lang));
const paramTypes = computed(() => props.problem.function.params.map((p) => p.type));

const solution = computed(() => {
  const own = props.problem.solutions[props.lang.id];
  if (own) return { code: own, lang: props.lang, fallback: false };
  for (const l of catalog.languages) {
    const c = props.problem.solutions[l.id];
    if (c) return { code: c, lang: l, fallback: true };
  }
  return null;
});
</script>

<template>
  <article class="panel problem stack" aria-labelledby="p-title">
    <div>
      <div class="row">
        <span class="tag">{{ catalog.temaLabel(problem.tema) }}</span>
        <span class="tag" :class="problem.level.toLowerCase()">{{ problem.level }}</span>
        <span v-if="solved" class="tag done">✓ Tuntas</span>
        <span v-if="outdated" class="tag updated" title="Soal diperbarui setelah kamu menuntaskannya. Jalankan tes lagi.">Diperbarui</span>
        <span v-if="isNew" class="tag new">Baru</span>
      </div>
      <h1 id="p-title" class="problem-title">{{ problem.title }}</h1>
      <p class="desc">{{ problem.desc }}</p>
    </div>

    <div>
      <p class="section-label">Tanda tangan fungsi</p>
      <pre class="codebox">{{ sig }}</pre>
    </div>

    <div>
      <p class="section-label">Kasus uji</p>
      <ul class="case-list">
        <li v-for="(t, i) in visible" :key="i">
          {{ callStr(problem.function.name, t.args, lang.id, paramTypes) }}<span class="arrow">→</span>{{ lit(t.expected, lang.id, problem.function.returns) }}
        </li>
      </ul>
      <p v-if="hiddenCount" class="muted" style="font-size: 13px; margin-top: 6px">+ {{ hiddenCount }} kasus tersembunyi ikut dijalankan.</p>
    </div>

    <HintList :hints="problem.hints" :reset-key="problem.id" />

    <details v-if="solution" class="details">
      <summary>Contoh solusi</summary>
      <div class="details-body">
        <p class="warn-note">Coba sendiri dulu. Melihat solusi tidak menandai soal tuntas.</p>
        <p v-if="solution.fallback" class="muted" style="font-size: 13px">Solusi {{ lang.label }} belum ada. Ini versi {{ solution.lang.label }}:</p>
        <p v-else class="muted" style="font-size: 13px">Solusi rujukan {{ solution.lang.label }}:</p>
        <pre class="codebox">{{ solution.code }}</pre>
      </div>
    </details>

    <Explanation
      :html="problem.explanationHtml"
      :unlocked="explanationUnlocked"
      :open="explanationOpen"
      @update:open="emit('update:explanationOpen', $event)"
      @unlock="emit('unlock')"
      @jump-mistakes="emit('jumpMistakes')"
    />

    <p style="font-size: 13px">
      <a :href="reportIssueUrl('soal', problem.id, problem.title)" target="_blank" rel="noopener">Soal ini salah?</a>
      <span class="muted"> · revisi {{ problem.revision }}</span>
    </p>
  </article>
</template>
