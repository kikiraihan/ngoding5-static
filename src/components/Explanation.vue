<script setup lang="ts">
// Pembahasan (FE-40) + tombol pertanyaan cepat (FE-43).
const props = defineProps<{ html: string; unlocked: boolean; open: boolean }>();
const emit = defineEmits<{ 'update:open': [v: boolean]; unlock: []; jumpMistakes: [] }>();

function jump(anchor: string) {
  emit('unlock');
  emit('update:open', true);
  requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
function onToggle(e: Event) {
  emit('update:open', (e.target as HTMLDetailsElement).open);
}
</script>

<template>
  <details id="pembahasan" class="details" :open="open" @toggle="onToggle">
    <summary>Pembahasan <span v-if="!unlocked" class="count">terkunci</span></summary>
    <div class="details-body">
      <div class="row">
        <button class="btn sm ai" @click="emit('jumpMistakes')">Kenapa kasus gagal?</button>
        <button class="btn sm ai" @click="jump('bahas-ide')">Cara berpikir solusi</button>
        <button class="btn sm ai" @click="jump('bahas-kompleksitas')">Kompleksitas</button>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html — HTML dirender & disanitasi saat build (scripts/build-data.mjs) -->
      <div v-if="unlocked && props.html" class="prose" v-html="props.html" />
      <p v-else-if="unlocked" class="muted">Pembahasan untuk soal ini belum ditulis.</p>
      <div v-else class="stack" style="gap: 8px">
        <p class="muted" style="font-size: 14px">Pembahasan terbuka otomatis setelah semua kasus lulus. Kalau sudah buntu, buka sekarang.</p>
        <div><button class="btn sm" @click="emit('unlock')">Buka pembahasan</button></div>
      </div>
    </div>
  </details>
</template>
