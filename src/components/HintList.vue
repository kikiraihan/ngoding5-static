<script setup lang="ts">
// Petunjuk bertingkat (FE-30): dibuka satu per satu.
import { ref, watch } from 'vue';
const props = defineProps<{ hints: string[]; resetKey: string }>();
const shown = ref(0);
watch(
  () => props.resetKey,
  () => (shown.value = 0),
);
</script>

<template>
  <details class="details">
    <summary>Petunjuk <span class="count tnum">{{ shown }}/{{ hints.length }} dibuka</span></summary>
    <div class="details-body">
      <ol v-if="shown" class="hints">
        <li v-for="(h, i) in hints.slice(0, shown)" :key="i">
          <span class="num">{{ i + 1 }}</span><span>{{ h }}</span>
        </li>
      </ol>
      <p v-else class="muted" style="font-size: 14px">Petunjuk dibuka bertahap. Coba buka satu dulu.</p>
      <div>
        <button v-if="shown < hints.length" class="btn sm" @click="shown++">
          {{ shown === 0 ? 'Buka petunjuk 1' : `Buka petunjuk ${shown + 1}` }}
        </button>
        <span v-else class="muted" style="font-size: 13px">Semua petunjuk sudah dibuka.</span>
      </div>
    </div>
  </details>
</template>
