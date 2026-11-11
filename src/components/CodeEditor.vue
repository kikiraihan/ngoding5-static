<script setup lang="ts">
// Editor ringan (FE-11): nomor baris, Tab/Shift+Tab, auto-indent, Esc lalu Tab untuk keluar,
// Ctrl/⌘+Enter untuk menjalankan. CodeMirror 6 menyusul (FE-12, P1).
import { computed, ref } from 'vue';

const props = defineProps<{ modelValue: string; indent: string; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string]; run: [] }>();

const ta = ref<HTMLTextAreaElement | null>(null);
const gutter = ref<HTMLDivElement | null>(null);
const lineCount = computed(() => props.modelValue.split('\n').length);
let escArmed = false;

function syncScroll() {
  if (gutter.value && ta.value) gutter.value.scrollTop = ta.value.scrollTop;
}

/** Sisipkan teks lewat execCommand agar riwayat undo tetap utuh; fallback setRangeText. */
function insert(text: string, selStart?: number, selEnd?: number) {
  const el = ta.value!;
  el.focus();
  let ok = false;
  try {
    ok = document.execCommand('insertText', false, text);
  } catch {
    ok = false;
  }
  if (!ok) {
    el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (selStart != null) el.setSelectionRange(selStart, selEnd ?? selStart);
}

function lineStartOf(v: string, pos: number) {
  return v.lastIndexOf('\n', pos - 1) + 1;
}

function onKeydown(e: KeyboardEvent) {
  const el = e.currentTarget as HTMLTextAreaElement;
  const v = el.value;
  const s = el.selectionStart;
  const end = el.selectionEnd;
  const unit = props.indent;

  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    emit('run');
    return;
  }
  if (e.key === 'Escape') {
    escArmed = true;
    return;
  }
  if (e.key === 'Tab') {
    if (escArmed) {
      escArmed = false;
      return; // biarkan fokus pindah ke elemen berikutnya
    }
    e.preventDefault();
    const ls = lineStartOf(v, s);
    const multi = v.slice(s, end).includes('\n');
    if (!e.shiftKey && !multi) {
      insert(unit);
      return;
    }
    // indent/dedent semua baris yang terseleksi
    const le = end > s && v[end - 1] === '\n' ? end - 1 : end;
    const blockEnd = v.indexOf('\n', le) === -1 ? v.length : v.indexOf('\n', le);
    const lines = v.slice(ls, blockEnd).split('\n');
    let firstDelta = 0;
    const out = lines.map((line, i) => {
      if (!e.shiftKey) {
        if (i === 0) firstDelta = unit.length;
        return unit + line;
      }
      const m = line.match(/^( +|\t)/);
      const cut = m ? (m[0] === '\t' ? 1 : Math.min(m[0].length, unit.length)) : 0;
      if (i === 0) firstDelta = -cut;
      return line.slice(cut);
    });
    const block = out.join('\n');
    el.setSelectionRange(ls, blockEnd);
    const newStart = multi ? ls : Math.max(ls, s + firstDelta);
    const newEnd = multi ? ls + block.length : Math.max(ls, end + firstDelta);
    insert(block, newStart, newEnd);
    return;
  }
  escArmed = false;
  // Kurung tutup di baris yang hanya berisi spasi → kurangi satu indentasi otomatis.
  if ((e.key === '}' || e.key === ']' || e.key === ')') && s === end && !e.ctrlKey && !e.metaKey) {
    const ls = lineStartOf(v, s);
    const line = v.slice(ls, s);
    if (line.length >= unit.length && line.endsWith(unit) && /^[ \t]*$/.test(line)) {
      e.preventDefault();
      el.setSelectionRange(s - unit.length, s);
      insert(e.key);
      return;
    }
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.isComposing) {
    e.preventDefault();
    const ls = lineStartOf(v, s);
    const line = v.slice(ls, s);
    const base = (line.match(/^[ \t]*/) || [''])[0];
    const before = line.trimEnd();
    const opens = /[:{([]$/.test(before);
    const next = v[end];
    const pairs: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
    if (opens && next && pairs[before.slice(-1)] === next) {
      const text = '\n' + base + unit + '\n' + base;
      const caret = s + 1 + base.length + unit.length;
      insert(text, caret);
      return;
    }
    insert('\n' + base + (opens ? unit : ''));
    return;
  }
}
</script>

<template>
  <div class="editor">
    <div ref="gutter" class="gutter" aria-hidden="true">
      <div v-for="n in lineCount" :key="n">{{ n }}</div>
    </div>
    <textarea
      ref="ta"
      class="code"
      :value="modelValue"
      :aria-label="label"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      wrap="off"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown="onKeydown"
      @scroll="syncScroll"
    />
  </div>
</template>
