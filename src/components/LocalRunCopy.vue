<script setup lang="ts">
// Untuk bahasa tanpa runtime browser (saat ini Go): salin program uji lengkap (kode kamu + semua kasus uji)
// lalu jalankan dengan `go run main.go` atau di Go Playground.
import { computed, ref } from 'vue';
import type { Language, Problem } from '@/lib/types';
import { goTestProgram } from '@/lib/goProgram';
import { copyText } from '@/lib/prompt';
import { toast } from '@/lib/toast';

const props = defineProps<{ problem: Problem; lang: Language; code: string }>();
const fallbackText = ref<string | null>(null);
const supported = computed(() => props.lang.id === 'go');

async function copy() {
  const text = goTestProgram(props.problem, props.code);
  if (await copyText(text)) {
    fallbackText.value = null;
    toast('Program uji tersalin. Tempel ke main.go lalu jalankan `go run main.go`, atau ke go.dev/play.');
  } else {
    fallbackText.value = text;
    requestAnimationFrame(() => {
      const el = document.getElementById('local-run-fallback') as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    });
  }
}

function download() {
  const blob = new Blob([goTestProgram(props.problem, props.code)], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'main.go';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
</script>

<template>
  <div class="stack" style="gap: 8px; margin-top: 10px">
    <p class="warn-note" style="margin: 0">
      {{ lang.label }} belum bisa dijalankan di browser.
      <template v-if="supported">
        Salin <b>program uji</b> (kode kamu + semua kasus uji), lalu jalankan <code>go run main.go</code> di komputermu atau tempel di
        <a href="https://go.dev/play" target="_blank" rel="noopener">go.dev/play</a>.
      </template>
    </p>
    <div v-if="supported" class="row" style="gap: 10px">
      <button class="btn primary" type="button" @click="copy">Salin program uji</button>
      <button class="btn" type="button" @click="download">Unduh main.go</button>
    </div>
    <div v-if="fallbackText" class="stack" style="gap: 6px; width: 100%">
      <p class="muted" style="font-size: 13px">Browser menolak menyalin otomatis. Teks sudah diseleksi, tekan Ctrl/⌘+C.</p>
      <textarea id="local-run-fallback" class="answer" readonly :value="fallbackText" rows="10" />
    </div>
  </div>
</template>
