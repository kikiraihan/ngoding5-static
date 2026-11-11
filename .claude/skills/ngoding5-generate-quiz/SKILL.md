---
name: ngoding5-generate-quiz
description: Membuat soal Tebak Output baru (JavaScript atau Python) untuk Ngoding5, dengan jawaban diambil dari eksekusi asli. Argumen jumlah, bahasa, tema, level, topik. Gunakan saat pengelola minta menambah soal tebak output.
---

# ngoding5-generate-quiz

Argumen: `jumlah` (wajib), `bahasa` (`javascript`|`python`, wajib), `tema` (slug tema mode `quiz`), `level`, `topik` (teks bebas).

Contoh: `/ngoding5-generate-quiz jumlah=15 bahasa=python tema=string-koleksi`

## Langkah

1. Baca `.claude/skills/CONTENT-GUIDE.md` dan ikuti "Alur wajib".
2. Lihat soal quiz yang ada untuk bahasa itu (`ls content/quiz/<bahasa>/*/`) dan baca beberapa supaya jebakan tidak berulang.
3. Buat kerangka: `scripts/ngoding new quiz --lang <js|py> --tema <slug> --level <Lv> --count <jumlah> --by claude-skill --topik "<topik>"`.
4. Isi `title`, `code` (pendek: 3–12 baris, satu konsep utama), `explain`, `concepts`. Isi `answer` dengan tebakanmu.
5. `scripts/ngoding verify <id...>`. Untuk yang gagal, bandingkan "output asli" dengan penjelasanmu:
   - Penjelasan salah → perbaiki penjelasan, salin output asli ke `answer`.
   - Kode tidak menunjukkan jebakan yang dimaksud → ubah kode.
   Maksimal 2 kali per soal, lalu buang.
6. `scripts/ngoding check`, `CHANGELOG-content.md`, ringkasan + perintah git yang disarankan. Tidak commit tanpa diminta.
