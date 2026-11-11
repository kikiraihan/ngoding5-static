<script setup lang="ts">
import { useProgress } from '@/stores/progress';
const progress = useProgress();
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <RouterLink to="/" class="logo" aria-label="Ngoding5, ke beranda"><span class="br">{</span> Ngoding5 <span class="br">}</span></RouterLink>
      <span class="sub">Asah logika & syntax, langsung di browser</span>
    </div>
    <div class="stats" aria-label="Statistik latihan">
      <span class="stat" title="Soal tulis kode yang sudah tuntas"><b>{{ progress.solvedCount }}</b> tuntas</span>
      <span class="stat" title="Tebak output yang benar"><b>{{ progress.quizCorrect }}</b> benar</span>
      <span class="stat streak" :title="`Beruntun saat ini. Terbaik: ${progress.bestStreak}`"><b>{{ progress.streak }}</b> beruntun</span>
      <RouterLink to="/tentang" class="nav-link">Tentang</RouterLink>
    </div>
  </header>
</template>
