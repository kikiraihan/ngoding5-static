---
name: ngoding5-enrich
description: Melengkapi petunjuk, kesalahan umum, dan pembahasan yang kosong atau tipis pada soal Ngoding5. Argumen filter tema/level/id. Gunakan setelah migrasi atau saat stats menunjukkan konten bantuan kurang.
---

# ngoding5-enrich

Argumen: `tema`, `level`, `id` (opsional, bisa beberapa), `jumlah` (batas per batch, bawaan 20).

## Langkah

1. Baca `.claude/skills/CONTENT-GUIDE.md`.
2. `scripts/ngoding stats --json` → ambil daftar `fewHints`, `fewMistakes`, `noExplanation` (dipotong sesuai filter).
3. Untuk setiap soal:
   - Petunjuk menjadi 2–3 dan bertingkat.
   - `commonMistakes` ≥ 2, dengan `failsTest` yang benar. Cek: kesalahan itu memang membuat kasus tersebut gagal
     (boleh buktikan dengan menulis solusi salah sementara di scratchpad dan menjalankannya).
   - Pembahasan MD mengikuti urutan Ide → Langkah → Kompleksitas → Variasi latihan.
   - Jangan ubah `tests`/`solutions`; karena itu `revision` **tidak** naik.
4. `scripts/ngoding check`, `CHANGELOG-content.md`, ringkasan.
