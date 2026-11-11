<script setup lang="ts">
// "Salin untuk tanya AI" (FE-42): menyalin prompt berisi soal, kode, hasil tes, dan (opsional) solusi rujukan.
import { ref } from 'vue';
import { buildPrompt, copyText } from '@/lib/prompt';
import { toast } from '@/lib/toast';
import type { Language, Problem, RunOutcome } from '@/lib/types';
import { useCatalog } from '@/stores/catalog';

const props = defineProps<{ problem: Problem; lang: Language; code: string; run: RunOutcome | null }>();
const catalog = useCatalog();
const includeSolution = ref(false);
const fallbackText = ref<string | null>(null);

function solutionFor() {
  const own = props.problem.solutions[props.lang.id];
  if (own) return { code: own, lang: props.lang };
  for (const l of catalog.languages) if (props.problem.solutions[l.id]) return { code: props.problem.solutions[l.id]!, lang: l };
  return null;
}

async function copy() {
  const text = buildPrompt({
    problem: props.problem,
    lang: props.lang,
    temaLabel: catalog.temaLabel(props.problem.tema),
    code: props.code,
    run: props.run,
    includeSolution: includeSolution.value,
    solution: solutionFor(),
  });
  if (await copyText(text)) {
    fallbackText.value = null;
    toast('Tersalin. Tempel ke Claude atau ChatGPT, lalu tulis pertanyaanmu.');
  } else {
    fallbackText.value = text;
    requestAnimationFrame(() => {
      const el = document.getElementById('ai-fallback') as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    });
  }
}
</script>

<template>
  <div class="row" style="gap: 10px">
    <button class="btn ai wide-mobile" type="button" @click="copy">Salin untuk tanya AI</button>
    <label class="row" style="gap: 6px; font-size: 13px; cursor: pointer">
      <input v-model="includeSolution" type="checkbox" />
      <span class="muted">Sertakan solusi rujukan</span>
    </label>
  </div>
  <div v-if="fallbackText" class="stack" style="gap: 6px; margin-top: 8px; width: 100%">
    <p class="muted" style="font-size: 13px">Browser menolak menyalin otomatis. Teks sudah diseleksi, tekan Ctrl/⌘+C.</p>
    <textarea id="ai-fallback" class="answer" readonly :value="fallbackText" rows="8" />
  </div>
</template>
