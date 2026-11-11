<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import { useCatalog } from '@/stores/catalog';
import { useProgress } from '@/stores/progress';
import { toastMsg } from '@/lib/toast';

const catalog = useCatalog();
const progress = useProgress();
const router = useRouter();

router.afterEach((to) => {
  if (to.name === 'problem' || to.name === 'quiz') progress.lastRoute = to.fullPath;
});

onMounted(() => catalog.init());
</script>

<template>
  <div class="shell">
    <a href="#main" class="sr-only">Lompat ke konten</a>
    <AppHeader />
    <main id="main" class="stack">
      <div v-if="catalog.error" class="panel empty" role="alert">
        <p>Data soal gagal dimuat: {{ catalog.error }}</p>
        <p style="margin-top: 10px"><button class="btn" @click="catalog.init()">Coba lagi</button></p>
      </div>
      <RouterView v-else />
    </main>
    <footer class="footer">
      Ngoding5 · kode kamu dijalankan di browser, tidak dikirim ke mana pun ·
      <RouterLink to="/tentang">Tentang</RouterLink>
    </footer>
    <div v-if="toastMsg" class="toast" role="status" aria-live="polite">{{ toastMsg }}</div>
  </div>
</template>
