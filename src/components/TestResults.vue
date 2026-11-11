<script setup lang="ts">
// Ringkasan & tabel hasil (FE-15, FE-16). Di ponsel tabel menjadi kartu per kasus (lewat CSS).
import { computed } from 'vue';
import type { RunOutcome } from '@/lib/types';
import { callStr, lit } from '@/lib/format';

const props = defineProps<{ outcome: RunOutcome; fnName: string }>();
const allPass = computed(() => !props.outcome.fatal && props.outcome.passed === props.outcome.total);
const message = computed(() => {
  const o = props.outcome;
  if (o.fatal && !o.cases.some((c) => c.ok)) return 'Kode belum bisa dijalankan. Baca pesan error di bawah.';
  if (allPass.value) return 'Semua kasus lulus, termasuk yang tersembunyi. Mantap!';
  const fail = o.total - o.passed;
  return `${fail} kasus belum lulus. Bandingkan kolom Diharapkan dan Hasil kamu.`;
});
let hiddenNo = 0;
const rows = computed(() => {
  hiddenNo = 0;
  return props.outcome.cases.map((c) => {
    const n = c.hidden ? ++hiddenNo : 0;
    const reveal = !c.hidden || !c.pass;
    return {
      key: c.index,
      label: c.hidden ? `Kasus tersembunyi #${n}` : `#${c.index + 1}`,
      call: reveal ? callStr(props.fnName, c.args, props.outcome.lang) : '•••',
      expected: reveal ? lit(c.expected, props.outcome.lang) : '•••',
      got: c.ok ? (reveal ? lit(c.value, props.outcome.lang) : '•••') : null,
      error: c.ok ? null : c.error,
      pass: c.pass,
    };
  });
});
</script>

<template>
  <section class="stack" style="gap: 10px; margin-top: 14px" aria-label="Hasil tes">
    <div class="summary" :class="{ allpass: allPass, error: !!outcome.fatal && !allPass }">
      <div class="row" style="gap: 14px">
        <span class="score">{{ outcome.passed }}/{{ outcome.total }}</span>
        <span class="msg">{{ message }}</span>
      </div>
      <div class="strip" aria-hidden="true">
        <span v-for="c in outcome.cases" :key="c.index" :class="{ ok: c.pass }" />
      </div>
      <pre v-if="outcome.fatal" class="fatal">{{ outcome.fatal }}</pre>
    </div>

    <div class="table-wrap">
      <table class="results">
        <thead>
          <tr>
            <th scope="col">Panggilan</th>
            <th scope="col">Diharapkan</th>
            <th scope="col">Hasil kamu</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.key">
            <td data-label="Panggilan">
              <span v-if="r.call === '•••'" class="muted">{{ r.label }}</span>
              <span v-else>{{ r.call }}</span>
            </td>
            <td data-label="Diharapkan">{{ r.expected }}</td>
            <td data-label="Hasil kamu">
              <span v-if="r.error" class="err">{{ r.error }}</span>
              <span v-else>{{ r.got }}</span>
            </td>
            <td data-label="Status" class="status">
              <span class="pill" :class="r.pass ? 'pass' : 'fail'">{{ r.pass ? 'Lulus' : 'Gagal' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="outcome.logs">
      <p class="section-label">Output print / console.log</p>
      <pre class="codebox logs">{{ outcome.logs }}</pre>
    </div>
  </section>
</template>
