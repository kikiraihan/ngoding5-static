---
name: ngoding5-generate-problems
description: Membuat soal Tulis Kode baru untuk Ngoding5 (JSON + pembahasan MD + solusi JS & Python) yang terverifikasi. Argumen jumlah, tema, level, topik (teks bebas, mis. "variasi FizzBuzz"). Gunakan saat pengelola minta menambah soal tulis kode.
---

# ngoding5-generate-problems

Argumen (format `kunci=nilai`, semua opsional kecuali `jumlah`):

- `jumlah` — banyak soal (disarankan 10–20 per batch)
- `tema` — slug tema mode `code` (lihat `content/meta/temas.json`); kosong = sebar ke tema yang paling kurang
- `level` — `Mudah` | `Sedang` | `Sulit`; kosong = ikuti target sebaran PRD §14.1
- `topik` — teks bebas, mis. `"backtracking sederhana"` atau `"variasi FizzBuzz"`

Contoh: `/ngoding5-generate-problems jumlah=20 tema=rekursi level=Sulit topik="backtracking sederhana"`

## Langkah

1. Baca `.claude/skills/CONTENT-GUIDE.md` sepenuhnya dan ikuti "Alur wajib".
2. Jalankan `scripts/ngoding stats --json`. Bila `tema`/`level` kosong, pilih sel tema × level yang paling jauh dari target
   (target per tema: Percabangan/Perulangan 12/8/5, String/Array/Matematika 10/10/5, Pencarian & Pengurutan/Rekursi/Objek & Dictionary 8/10/7).
3. Susun daftar ide dulu (judul + satu kalimat), cocokkan dengan judul yang sudah ada, buang yang mirip. Bila ada `topik`,
   semua ide harus berkaitan dengan topik itu, tapi tetap berbeda satu sama lain.
4. Untuk setiap ide:
   - `scripts/ngoding new problem --tema <slug> --level <Lv> --id <slug> --title "<Judul>" --by claude-skill --topik "<topik>"`
   - Isi JSON lengkap (deskripsi, tanda tangan, 4–8 kasus uji dengan expected yang dihitung dari deskripsi, hints, commonMistakes, dua solusi independen JS & Python, plus solusi Go bila `go` terpasang) dan MD pembahasan.
5. `scripts/ngoding validate <file baru...>` lalu `scripts/ngoding verify <file baru...>`.
   Bila JS dan Python berbeda hasil, cari mana yang salah terhadap **deskripsi**, bukan sekadar menyamakan.
6. `scripts/ngoding dedupe` — bila soal baru mirip soal lama (skor ≥ 0.6), ganti atau buang.
7. `scripts/ngoding check`, tulis `CHANGELOG-content.md`, tampilkan ringkasan + perintah git yang disarankan:
   ```
   git checkout -b konten/<tanggal>-<tema-atau-topik>
   git add content CHANGELOG-content.md
   git commit -m "Konten: +N soal <tema> (<topik>)"
   ```
