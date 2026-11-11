# Panduan bersama skill konten Ngoding5

Dibaca oleh semua skill `ngoding5-*`. Sumber kebenaran konten ada di `content/`; aplikasi hanya membaca hasil build.

## Alur wajib (semua skill)

1. Baca `content/meta/temas.json`, `languages.json`, `levels.json`, lalu jalankan `scripts/ngoding stats`.
2. Baca daftar judul/ID yang sudah ada agar tidak membuat duplikat:
   `node -e "for (const p of require('./public/data/index.json')) console.log(p.id, '|', p.title, '|', p.tema, p.level)"`
   (jalankan `scripts/ngoding build` dulu bila `public/data/` belum ada).
3. Tulis file mengikuti schema (`schemas/*.schema.json`). Contoh lengkap: `content/problems/percabangan/fizzbuzz.json` + `fizzbuzz.md`,
   dan `content/quiz/python/string-koleksi/py-0010.json`.
4. Jalankan `scripts/ngoding validate <file...>` lalu `scripts/ngoding verify <file...>`.
5. Soal yang gagal: perbaiki maksimal 2 kali. Masih gagal → hapus filenya (`scripts/ngoding remove <id> --yes`) dan laporkan.
6. Jalankan `scripts/ngoding check` (validate + verify + build + id-lock). Harus hijau.
7. Tambahkan ringkasan batch di **atas** `CHANGELOG-content.md` (tanggal, skill, jumlah baru/diubah/dibuang, topik).
8. Tampilkan ringkasan: dibuat, dibuang + alasan, dan perintah git yang disarankan.
   **Jangan** commit/push kecuali pengelola memintanya. Bila diminta, buat branch + PR, bukan push ke `main`.

## Aturan soal Tulis Kode (`content/problems/<tema>/<id>.json` + `<id>.md`)

- `id`: kebab-case, unik, sama dengan nama file, **tidak boleh diganti** setelah tayang (dikunci `content/meta/id-lock.json`).
- `function.name` camelCase; nama Python diturunkan otomatis ke snake_case (`fizzBuzz` → `fizz_buzz`). Nama parameter sebaiknya satu kata huruf kecil.
- Tipe yang didukung: `int`, `float`, `bool`, `str`, `int[]`, `str[]`, `int[][]`, `dict<str,int>`. Kunci dict selalu string.
- `tests`: 4–8 kasus, minimal 1 kasus tepi (kosong, nol, negatif, satu elemen). Level Sedang/Sulit: ≥ 1 `"hidden": true`. Minimal satu kasus terlihat.
- `compare`: `exact` (bawaan), `float` (toleransi 1e-6), `unordered` (urutan array tidak penting).
- `solutions.javascript` dan `solutions.python` wajib, ditulis **independen** (boleh beda algoritma) — verify membandingkan keduanya.
- Fungsi harus murni: tanpa input(), tanpa akses jaringan/file, selesai < 3 detik. Jangan kembalikan `set`, `Map`, atau tuple yang dimaksud sebagai objek.
- `expected` ditulis tangan berdasarkan deskripsi. Bila ragu, pakai `scripts/ngoding fix-expected <id> --from py` lalu **periksa diff**.
- `hints`: 2–3, bertingkat. Petunjuk 1 arah umum, 2 lebih spesifik, 3 boleh hampir memberi solusi. Jangan menulis kode lengkap.
- `commonMistakes`: ≥ 2, `failsTest` = indeks kasus uji (mulai 0) yang biasanya gagal karena kesalahan itu.
- `revision`: 1 untuk soal baru; naik 1 setiap isi soal/kasus uji berubah. `updatedAt` = hari ini.
- `source`: `"generated"`, `generator`: `{ "by": "claude-skill", "topik": <topik atau null> }`. Jangan tulis field `verification` manual.
- Pembahasan `<id>.md` berurutan: `## Ide` → `## Langkah` → `## Kompleksitas` → `## Variasi latihan` (heading ini dipakai tombol pertanyaan cepat).

## Aturan soal Tebak Output (`content/quiz/<lang>/<tema>/<id>.json`)

- Buat kerangka dengan `scripts/ngoding new quiz --lang js|py --tema <slug> --level <Lv> [--count N]` (ID berikutnya otomatis).
- `answer` diisi dari **eksekusi asli**: tulis kode, isi `answer` sementara, jalankan `scripts/ngoding verify <id>`, salin "output asli" bila penjelasanmu memang sesuai.
- JavaScript: cetak hanya string/angka/boolean, atau pakai `join`/`JSON.stringify` — format `console.log` objek berbeda antar runtime.
- Python: deterministik (hindari `set` berisi string, `id()`, waktu, acak).
- `explain`: jelaskan *kenapa*, sebut jebakannya. `concepts`: 1–3 istilah.

## Gaya bahasa

- Bahasa Indonesia baku tapi santai, kalimat pendek, istilah teknis tetap (array, string, return).
- Deskripsi tidak ambigu: format keluaran, urutan, dan perlakuan kasus tepi dijelaskan.
- Sapaan "kamu", tanpa minta maaf.

## Checklist review (Lampiran E PRD)

- [ ] Deskripsi bisa dipahami tanpa melihat kasus uji
- [ ] Format keluaran dan urutan jelas
- [ ] Minimal satu kasus tepi
- [ ] Solusi JS & Python lulus semua kasus, termasuk tersembunyi
- [ ] Petunjuk tidak membocorkan solusi
- [ ] Pembahasan berisi kompleksitas
- [ ] `scripts/ngoding dedupe` bersih
