<script setup lang="ts">
import { ref } from 'vue';
import { useProgress, type ProgressExport } from '@/stores/progress';
import { useSettings } from '@/stores/settings';
import { useCatalog } from '@/stores/catalog';
import { storageAvailable } from '@/lib/storage';
import { setHead } from '@/lib/head';
import { toast } from '@/lib/toast';
import { REPO_URL } from '@/lib/config';

const progress = useProgress();
const settings = useSettings();
const catalog = useCatalog();
const fileInput = ref<HTMLInputElement | null>(null);
const canStore = storageAvailable();
setHead('Tentang & cara pakai');

function exportProgress() {
  const data = progress.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ngoding5-progres-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importProgress(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text()) as ProgressExport;
    const n = progress.importData(data);
    toast(n ? `Progres digabung: ${n} entri diperbarui.` : 'Tidak ada yang baru dari file ini.');
  } catch (err) {
    toast(`Impor gagal: ${(err as Error).message}`);
  } finally {
    if (fileInput.value) fileInput.value.value = '';
  }
}

function resetProgress() {
  if (window.confirm('Hapus semua progres, statistik, dan draft kode di perangkat ini? Tidak bisa dibatalkan.')) {
    progress.resetAll();
    toast('Progres dihapus.');
  }
}
</script>

<template>
  <article class="panel stack" style="max-width: 820px; width: 100%; margin: 0 auto">
    <h1 class="problem-title" style="margin-top: 0">Tentang Ngoding5</h1>
    <p class="desc">
      Ngoding5 adalah tempat latihan pemrograman berbahasa Indonesia untuk mengasah <b>logika</b> (menulis fungsi yang lulus kasus uji) dan
      <b>pemahaman syntax</b> (menebak output program). Semua gratis, tanpa login. Kode kamu dijalankan di browser kamu sendiri dan tidak dikirim ke
      server mana pun.
    </p>
    <p class="muted tnum" v-if="catalog.loaded">
      Saat ini ada {{ catalog.problems.length }} soal tulis kode dan
      {{ Object.values(catalog.quizzes).reduce((s, l) => s + l.length, 0) }} soal tebak output (JavaScript & Python).
    </p>

    <section class="stack" style="gap: 8px">
      <h2 style="font-size: 1.15rem">Cara pakai</h2>
      <ol class="desc" style="padding-left: 1.2em; margin: 0">
        <li>Buka <b>Pengaturan</b>, pilih bahasa, mode, tema, dan level.</li>
        <li>Pilih soal dari daftar, pakai tombol ‹ ›, atau <b>Acak soal</b> (soal yang belum tuntas diutamakan).</li>
        <li>Mode <b>Tulis kode</b>: lengkapi fungsi, lalu <b>Jalankan tes</b> (<kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd>).</li>
        <li>Buntu? Buka petunjuk satu per satu, cek kesalahan umum, atau <b>Salin untuk tanya AI</b> lalu tempel ke Claude/ChatGPT.</li>
        <li>Mode <b>Tebak output</b>: baca kode, tulis output persis, lalu <b>Cek jawaban</b>.</li>
        <li>Tautan setiap soal bisa dibagikan, misalnya <code>/soal/palindrom</code>.</li>
      </ol>
    </section>

    <section class="stack" style="gap: 10px">
      <h2 style="font-size: 1.15rem">Progres kamu</h2>
      <p v-if="!canStore" class="warn-note">Penyimpanan browser diblokir. Aplikasi tetap bisa dipakai, tetapi progres tidak tersimpan.</p>
      <p class="tnum">
        {{ progress.solvedCount }} soal tuntas · {{ progress.quizCorrect }} tebakan benar · beruntun {{ progress.streak }} (terbaik {{ progress.bestStreak }})
      </p>
      <p class="muted" style="font-size: 14px">Progres disimpan di perangkat ini. Pindah perangkat? Ekspor di sini, lalu impor di perangkat lain. Progres akan digabung (yang terbaru per soal dipakai).</p>
      <div class="row">
        <button class="btn" @click="exportProgress">Ekspor progres</button>
        <button class="btn" @click="fileInput?.click()">Impor progres</button>
        <input ref="fileInput" type="file" accept="application/json,.json" class="sr-only" aria-label="Pilih file progres" @change="importProgress" />
        <button class="btn ghost danger" @click="resetProgress">Hapus progres</button>
      </div>
    </section>

    <section class="stack" style="gap: 8px">
      <h2 style="font-size: 1.15rem">Tampilan</h2>
      <label class="field" style="max-width: 260px">
        <span>Tema warna</span>
        <select v-model="settings.theme" class="select">
          <option value="system">Ikuti sistem</option>
          <option value="light">Terang</option>
          <option value="dark">Gelap</option>
        </select>
      </label>
    </section>

    <section class="stack" style="gap: 8px">
      <h2 style="font-size: 1.15rem">Soal & kontribusi</h2>
      <p class="desc">
        Setiap soal diverifikasi otomatis: solusi rujukan JavaScript dan Python harus lulus semua kasus uji, dan output tebakan diambil dari eksekusi asli.
        Menemukan soal yang salah? Klik "Soal ini salah?" di halaman soal, atau buka
        <a :href="`${REPO_URL}/issues`" target="_blank" rel="noopener">GitHub Issues</a>.
      </p>
      <p class="muted" style="font-size: 13px">Runtime Python di browser memakai Skulpt; beberapa fitur Python tingkat lanjut mungkin belum didukung.</p>
    </section>
  </article>
</template>
