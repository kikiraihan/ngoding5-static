<script setup lang="ts">
// Mode Tebak Output (FE-20–FE-22).
import { computed, nextTick, ref, watch } from 'vue';
import type { Language, Quiz } from '@/lib/types';
import { normalizeOutput } from '@/lib/format';
import { useCatalog } from '@/stores/catalog';
import { useProgress } from '@/stores/progress';
import { reportIssueUrl } from '@/lib/config';

const props = defineProps<{ quiz: Quiz; lang: Language; isNew: boolean }>();
const emit = defineEmits<{ next: [] }>();
const catalog = useCatalog();
const progress = useProgress();

const answer = ref('');
const state = ref<null | 'correct' | 'wrong' | 'gaveup'>(null);
watch(
  () => props.quiz.id,
  () => {
    answer.value = '';
    state.value = null;
  },
);

const done = computed(() => !!progress.quiz[props.quiz.id]?.correct);

async function check() {
  if (state.value || !answer.value.trim()) return;
  const ok = normalizeOutput(answer.value) === normalizeOutput(props.quiz.answer);
  state.value = ok ? 'correct' : 'wrong';
  progress.recordQuiz(props.quiz.id, props.quiz.revision, ok);
  await nextTick();
  document.getElementById('verdict')?.focus();
}
function giveUp() {
  if (state.value) return;
  state.value = 'gaveup';
  progress.recordQuiz(props.quiz.id, props.quiz.revision, false);
  nextTick(() => document.getElementById('verdict')?.focus());
}
function tryAgain() {
  state.value = null;
  nextTick(() => (document.getElementById('quiz-answer') as HTMLTextAreaElement | null)?.focus());
}
function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    check();
  }
}
</script>

<template>
  <div class="work">
    <article class="panel problem stack" aria-labelledby="q-title">
      <div>
        <div class="row">
          <span class="tag">{{ catalog.temaLabel(quiz.tema) }}</span>
          <span class="tag" :class="quiz.level.toLowerCase()">{{ quiz.level }}</span>
          <span v-if="done" class="tag done">✓ Benar</span>
          <span v-if="isNew" class="tag new">Baru</span>
        </div>
        <h1 id="q-title" class="problem-title">{{ quiz.title }}</h1>
        <p class="desc">Apa output program {{ lang.label }} berikut? Tulis persis seperti yang tercetak, satu baris per baris.</p>
      </div>
      <div>
        <div class="workbench-head" style="margin-bottom: 6px">
          <span class="filename">program.{{ lang.ext }}</span>
          <span class="pill info">{{ quiz.id }}</span>
        </div>
        <pre class="codebox" :aria-label="`Kode ${lang.label}`">{{ quiz.code }}</pre>
      </div>
      <p v-if="quiz.concepts.length" class="row" style="gap: 6px">
        <span class="muted" style="font-size: 13px">Konsep:</span>
        <span v-for="c in quiz.concepts" :key="c" class="chip">{{ c }}</span>
      </p>
      <p style="font-size: 13px">
        <a :href="reportIssueUrl('quiz', quiz.id, quiz.title)" target="_blank" rel="noopener">Soal ini salah?</a>
      </p>
    </article>

    <section class="panel" aria-label="Jawaban">
      <label for="quiz-answer" class="section-label" style="display: block">Tebakan output kamu</label>
      <textarea
        id="quiz-answer"
        v-model="answer"
        class="answer"
        rows="5"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :readonly="!!state"
        placeholder="Tulis output di sini…"
        @keydown="onKey"
      />
      <p class="editor-hint kbd-hint">Spasi di ujung baris dan baris kosong di awal/akhir diabaikan. <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> cek jawaban.</p>
      <div class="actions">
        <template v-if="!state">
          <button class="btn primary" :disabled="!answer.trim()" @click="check">Cek jawaban</button>
          <button class="btn ghost" @click="giveUp">Menyerah, lihat jawaban</button>
        </template>
        <template v-else>
          <button class="btn primary" @click="emit('next')">Soal berikutnya ›</button>
          <button v-if="state === 'wrong'" class="btn" @click="tryAgain">Coba lagi</button>
        </template>
      </div>

      <div v-if="state" id="verdict" tabindex="-1" class="stack verdict" :class="state === 'correct' ? 'ok' : 'bad'" style="margin-top: 16px; outline: none" aria-live="polite">
        <div class="summary" :class="state === 'correct' ? 'allpass' : 'error'">
          <h3>{{ state === 'correct' ? 'Tepat!' : state === 'wrong' ? 'Belum tepat' : 'Ini jawabannya' }}</h3>
          <p class="msg">
            {{ state === 'correct' ? `Beruntun ${progress.streak}.` : state === 'wrong' ? 'Bandingkan tebakanmu dengan output sebenarnya.' : 'Pelajari penjelasannya, lalu coba soal berikutnya.' }}
          </p>
        </div>
        <div>
          <p class="section-label">Output sebenarnya</p>
          <pre class="codebox">{{ quiz.answer }}</pre>
        </div>
        <div>
          <p class="section-label">Penjelasan</p>
          <p class="desc">{{ quiz.explain }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
