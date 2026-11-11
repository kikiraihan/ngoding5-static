---
name: ngoding5-update-problem
description: Memperbarui satu soal Ngoding5 (tulis kode atau tebak output) sesuai instruksi bebas, menaikkan revision, dan memverifikasi ulang. Gunakan saat ada laporan soal salah atau permintaan menambah kasus uji.
---

# ngoding5-update-problem

Argumen: `id` (wajib) dan instruksi perubahan bebas.

Contoh: `/ngoding5-update-problem id=kompres-string "tambahkan kasus uji string satu karakter"`

## Langkah

1. Baca `.claude/skills/CONTENT-GUIDE.md`.
2. Temukan file: `scripts/ngoding verify <id> --dry` (mencetak path) atau cari `content/**/<id>.json`.
3. Terapkan perubahan sesuai instruksi. **Jangan** mengganti `id`, `tema` (folder), atau menghapus kasus uji yang benar tanpa alasan.
4. Naikkan `revision` +1 dan set `updatedAt` ke hari ini bila isi soal/kasus uji/jawaban berubah
   (perubahan typo di pembahasan saja tidak perlu menaikkan revision).
   Pengguna yang sudah tuntas akan melihat label "Diperbarui" sampai menjalankan ulang.
5. Bila solusi rujukan harus diubah, ubah JS dan Python, lalu `scripts/ngoding verify <id>`.
6. `scripts/ngoding check`, catat di `CHANGELOG-content.md` (bagian "Diubah"), tampilkan diff ringkas (`git diff --stat` + inti perubahan).
