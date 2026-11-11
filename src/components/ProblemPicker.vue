<script setup lang="ts">
import { computed } from 'vue';
import { useCatalog } from '@/stores/catalog';

export interface PickItem {
  id: string;
  title: string;
  tema: string;
  level: string;
  done: boolean;
}

const props = defineProps<{ items: PickItem[]; currentId: string; total: number; unit?: string }>();
const emit = defineEmits<{ select: [id: string]; random: [] }>();
const catalog = useCatalog();

const idx = computed(() => props.items.findIndex((i) => i.id === props.currentId));
const groups = computed(() => {
  const out: { tema: string; label: string; items: PickItem[] }[] = [];
  for (const it of props.items) {
    let g = out.find((x) => x.tema === it.tema);
    if (!g) out.push((g = { tema: it.tema, label: catalog.temaLabel(it.tema), items: [] }));
    g.items.push(it);
  }
  return out;
});
const doneCount = computed(() => props.items.filter((i) => i.done).length);

function step(d: number) {
  if (!props.items.length) return;
  const i = idx.value < 0 ? 0 : (idx.value + d + props.items.length) % props.items.length;
  emit('select', props.items[i].id);
}
</script>

<template>
  <section class="panel" style="padding-top: 12px; padding-bottom: 12px" aria-label="Pemilih soal">
    <div class="picker">
      <button class="btn icon" :disabled="!items.length" aria-label="Soal sebelumnya" @click="step(-1)">‹</button>
      <label class="sr-only" for="pick-select">Pilih soal</label>
      <select id="pick-select" class="select" :value="idx >= 0 ? currentId : ''" :disabled="!items.length" @change="emit('select', ($event.target as HTMLSelectElement).value)">
        <option v-if="idx < 0" value="" disabled>{{ items.length ? '— pilih soal —' : 'Tidak ada soal' }}</option>
        <optgroup v-for="g in groups" :key="g.tema" :label="g.label">
          <option v-for="it in g.items" :key="it.id" :value="it.id">{{ it.done ? '✓ ' : '' }}{{ it.title }} · {{ it.level }}</option>
        </optgroup>
      </select>
      <button class="btn icon" :disabled="!items.length" aria-label="Soal berikutnya" @click="step(1)">›</button>
      <button class="btn random" :disabled="!items.length" @click="emit('random')">Acak soal</button>
    </div>
    <p class="picker-note tnum" aria-live="polite">
      <template v-if="items.length">{{ items.length }} dari {{ total }} {{ unit ?? 'soal' }} · {{ doneCount }} sudah tuntas</template>
      <template v-else>Belum ada soal untuk pilihan ini. Ubah tema atau level.</template>
    </p>
  </section>
</template>
