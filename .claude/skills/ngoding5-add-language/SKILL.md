---
name: ngoding5-add-language
description: Menambah solusi rujukan bahasa baru (mis. php) ke soal Ngoding5 yang belum punya, dengan filter tema/level. Gunakan saat pengelola ingin mendukung bahasa pemrograman tambahan.
---

# ngoding5-add-language

Argumen: `bahasa` (id, mis. `php`), `tema`, `level` (opsional), `jumlah` (opsional, batas soal per batch).

Contoh: `/ngoding5-add-language bahasa=php tema=string`

## Langkah

1. Baca `.claude/skills/CONTENT-GUIDE.md`.
2. Pastikan bahasa ada di `content/meta/languages.json`. Bila belum, tambahkan entri dengan `"runnable": false`, `label`, `short`, `ext`,
   `prefix`, `timeoutMs`, `indent`, `comment`, `naming`, dan **semua** tipe di `types` (lihat Lampiran B PRD).
   Bahasa `runnable: false` tidak muncul di pilihan bahasa sampai runtime browser tersedia; solusinya tetap tampil sebagai fallback.
3. Cari soal yang belum punya `solutions.<bahasa>` (filter tema/level).
4. Tulis solusi idiomatis dengan nama fungsi sesuai konvensi bahasa (`naming`).
5. Verifikasi:
   - Bila `scripts/lib/runners.mjs` sudah punya runner untuk bahasa itu (saat ini: javascript, python, go), jalankan `scripts/ngoding verify --lang <bahasa> <file...>`.
   - Bila belum, beri tahu pengelola bahwa solusi **belum terverifikasi** dan sarankan menambah runner (pola: `scripts/verify_py.py`, atau `scripts/lib/run_go.mjs` untuk bahasa yang dikompilasi).
     Jangan menulis field `verification` manual.
6. `scripts/ngoding check`, `CHANGELOG-content.md`, ringkasan.
