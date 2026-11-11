<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCatalog } from '@/stores/catalog';
import { setHead } from '@/lib/head';

const router = useRouter();
const catalog = useCatalog();
setHead('Halaman tidak ditemukan');

async function random() {
  await catalog.init();
  const list = catalog.problems;
  if (list.length) router.push(`/soal/${list[Math.floor(Math.random() * list.length)].id}`);
  else router.push('/');
}
</script>

<template>
  <div class="panel empty">
    <h1 class="problem-title">Halaman tidak ditemukan</h1>
    <p>Tautan ini tidak mengarah ke soal mana pun. Coba soal acak saja.</p>
    <p style="margin-top: 14px" class="row" :style="{ justifyContent: 'center' }">
      <button class="btn primary" @click="random">Ke soal acak</button>
      <RouterLink class="btn" to="/">Ke beranda</RouterLink>
    </p>
  </div>
</template>
