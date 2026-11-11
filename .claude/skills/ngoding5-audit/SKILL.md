---
name: ngoding5-audit
description: Audit bank soal Ngoding5 — menjalankan stats dan dedupe, lalu mengusulkan tema/level yang masih kurang soal beserta perintah skill untuk mengisinya. Tidak mengubah file.
---

# ngoding5-audit

Tanpa argumen. Skill ini **hanya membaca**.

## Langkah

1. `scripts/ngoding stats` dan `scripts/ngoding stats --json`.
2. `scripts/ngoding dedupe` — laporkan pasangan mirip beserta saran (gabung, ubah, atau biarkan).
3. `scripts/ngoding validate` — laporkan peringatan (soal tanpa kasus tersembunyi, petunjuk < 2, dst.).
4. Bandingkan cakupan dengan target PRD §14 (200 tulis kode, 120 tebak output; tabel per tema × level).
5. Hasilkan laporan singkat:
   - Tabel kekurangan per tema × level (target − ada).
   - Daftar perintah yang disarankan, urut prioritas, mis.
     `/ngoding5-generate-problems jumlah=10 tema=rekursi level=Sulit`
     `/ngoding5-generate-quiz jumlah=11 bahasa=python tema=string-koleksi`
     `/ngoding5-enrich tema=array`
6. Jangan membuat atau mengubah file konten.
