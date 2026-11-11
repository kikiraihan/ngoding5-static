import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { load, save } from '@/lib/storage';
import type { LangId, Level, Mode } from '@/lib/types';

export type ThemePref = 'system' | 'light' | 'dark';

export const useSettings = defineStore('settings', () => {
  const lang = ref<LangId>(load<LangId>('lang', 'javascript'));
  const mode = ref<Mode>(load<Mode>('mode', 'code'));
  // Filter tema terpisah per mode karena daftar temanya berbeda.
  const temaCode = ref<string>('');
  const temaQuiz = ref<string>('');
  const level = ref<Level | ''>('');
  const query = ref('');
  const wideDefault = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 900px)').matches;
  const panelOpen = ref<boolean>(load<boolean | null>('panelOpen', null) ?? !!wideDefault);
  const theme = ref<ThemePref>(load<ThemePref>('theme', 'system'));

  watch(lang, (v) => save('lang', v));
  watch(mode, (v) => save('mode', v));
  watch(panelOpen, (v) => save('panelOpen', v));
  watch(
    theme,
    (v) => {
      save('theme', v);
      if (typeof document === 'undefined') return;
      if (v === 'system') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', v);
    },
    { immediate: true },
  );

  return { lang, mode, temaCode, temaQuiz, level, query, panelOpen, theme };
});
