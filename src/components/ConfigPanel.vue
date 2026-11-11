<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSettings, type ThemePref } from '@/stores/settings';
import { useCatalog } from '@/stores/catalog';
import { load } from '@/lib/storage';
import type { LangId, Level, Mode } from '@/lib/types';

const settings = useSettings();
const catalog = useCatalog();
const route = useRoute();
const router = useRouter();

const mode = computed<Mode>(() => (route.name === 'quiz' || route.name === 'quiz-start' ? 'quiz' : 'code'));
const temaOptions = computed(() => catalog.temas.filter((t) => t.mode === mode.value));
const tema = computed({
  get: () => (mode.value === 'code' ? settings.temaCode : settings.temaQuiz),
  set: (v: string) => (mode.value === 'code' ? (settings.temaCode = v) : (settings.temaQuiz = v)),
});
const langs = computed(() => catalog.languages.filter((l) => l.runnable));

function setLang(v: LangId) {
  settings.lang = v;
  if (mode.value === 'quiz') router.push(`/tebak/${v}`);
  else router.replace({ query: { ...route.query, lang: v === 'javascript' ? undefined : v } });
}

function setMode(v: Mode) {
  settings.mode = v;
  if (v === mode.value) return;
  if (v === 'quiz') router.push(`/tebak/${settings.lang}`);
  else {
    const last = load<string | null>('lastProblem', null);
    router.push({ path: `/soal/${last || catalog.problems[0]?.id || 'fizzbuzz'}`, query: settings.lang === 'javascript' ? {} : { lang: settings.lang } });
  }
}

const chips = computed(() => [
  catalog.lang(settings.lang)?.label ?? settings.lang,
  mode.value === 'code' ? 'Tulis kode' : 'Tebak output',
  tema.value ? catalog.temaLabel(tema.value) : 'Semua tema',
  settings.level || 'Semua level',
]);
</script>

<template>
  <section class="panel" aria-labelledby="cfg-title">
    <button class="config-head" :aria-expanded="settings.panelOpen" aria-controls="cfg-body" @click="settings.panelOpen = !settings.panelOpen">
      <h2 id="cfg-title">Pengaturan</h2>
      <span v-if="!settings.panelOpen" class="chips" aria-hidden="true">
        <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
      </span>
      <span v-else class="chips" />
      <svg class="chev" :class="{ open: settings.panelOpen }" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="sr-only">{{ settings.panelOpen ? 'Tutup' : 'Buka' }} pengaturan</span>
    </button>

    <div v-show="settings.panelOpen" id="cfg-body">
      <div class="config-grid">
        <label class="field">
          <span>Bahasa</span>
          <select class="select" :value="settings.lang" @change="setLang(($event.target as HTMLSelectElement).value as LangId)">
            <option v-for="l in langs" :key="l.id" :value="l.id">{{ l.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>Mode</span>
          <select class="select" :value="mode" @change="setMode(($event.target as HTMLSelectElement).value as Mode)">
            <option value="code">Tulis kode</option>
            <option value="quiz">Tebak output</option>
          </select>
        </label>
        <label class="field">
          <span>Tema</span>
          <select v-model="tema" class="select">
            <option value="">Semua tema</option>
            <option v-for="t in temaOptions" :key="t.slug" :value="t.slug">{{ t.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>Level</span>
          <select v-model="settings.level" class="select">
            <option value="">Semua level</option>
            <option v-for="l in catalog.meta?.levels ?? []" :key="l.id" :value="l.id as Level">{{ l.label }}</option>
          </select>
        </label>
      </div>
      <div class="config-extra">
        <label class="field">
          <span>Cari judul soal</span>
          <input v-model="settings.query" class="input" type="search" placeholder="mis. palindrom" autocomplete="off" />
        </label>
        <label class="field">
          <span>Tampilan</span>
          <select v-model="settings.theme" class="select">
            <option :value="'system' as ThemePref">Ikuti sistem</option>
            <option :value="'light' as ThemePref">Terang</option>
            <option :value="'dark' as ThemePref">Gelap</option>
          </select>
        </label>
      </div>
    </div>
  </section>
</template>
