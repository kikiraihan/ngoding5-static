# Ngoding5

Website latihan logika & syntax pemrograman berbahasa Indonesia. **Statis**, dibangun dengan **Vue 3 + Vite**, deploy gratis di **Vercel**.

- **Tulis kode**: lengkapi fungsi, jalankan kasus uji langsung di browser (JavaScript lewat Web Worker, Python lewat Skulpt).
- **Tebak output**: baca program JavaScript, Python, atau Go, lalu tebak output persisnya.
- **Go**: semua soal tulis kode punya template & solusi Go. Go belum bisa dijalankan di browser, jadi tombol
  **Salin program uji** menghasilkan `main.go` berisi kode kamu + semua kasus uji untuk `go run` atau go.dev/play.
- Bantuan statis: petunjuk bertingkat, contoh solusi, pembahasan, kesalahan umum, dan tombol **Salin untuk tanya AI**.
- Tanpa login, tanpa server. Progres di `localStorage` (bisa diekspor/impor).

## Menjalankan

```bash
npm install
npm run dev        # build data + server dev
npm run build      # build data + vite build → dist/
npm run preview
```

Butuh Node ≥ 20 dan Python ≥ 3.10 (untuk verifikasi konten). Go ≥ 1.22 opsional: bila terpasang, `verify` juga
menjalankan solusi & quiz Go; bila tidak, bagian Go dilewati.

## Struktur

```
content/          SUMBER KEBENARAN konten (satu soal = satu file JSON + MD)
  meta/           temas.json, languages.json, levels.json, id-lock.json
  problems/<tema>/<id>.json + <id>.md
  quiz/<lang>/<tema>/<id>.json
schemas/          JSON Schema soal & quiz
scripts/ngoding   CLI pengelola konten (bash → Node/Python)
.claude/skills/   skill Claude Code untuk generate/update/audit konten
src/              aplikasi Vue
public/data/      HASIL BUILD dari content/ (tidak di-commit)
```

## CLI `ngoding`

```bash
scripts/ngoding help
scripts/ngoding new problem --tema array --level Sedang --id dua-jumlah
scripts/ngoding new quiz --lang py --tema string-koleksi --level Mudah
scripts/ngoding new quiz --lang go --tema fungsi-rekursi --level Sedang
scripts/ngoding validate          # schema, slug unik, tema/level, duplikat, MD ada
scripts/ngoding verify            # jalankan solusi JS & Python + kode quiz, tulis field verification
scripts/ngoding fix-expected <id> --from js   # hati-hati, review diff
scripts/ngoding stats             # cakupan tema × level × bahasa
scripts/ngoding dedupe            # cari soal mirip
scripts/ngoding remove <id> --yes
scripts/ngoding check             # validate + verify + build (wajib hijau sebelum commit)
```

`verify` menjalankan kode di proses terpisah dengan batas waktu 3 detik, tanpa jaringan (`node --no-experimental-fetch`, `python3 -I`),
dan membandingkan hasil solusi JS vs Python, serta JS vs Go (verifikasi silang). Solusi Go dikompilasi dengan `go build`
lalu dijalankan bersama harness yang membaca kasus uji (`scripts/lib/run_go.mjs`).

## Menambah soal (alur pengelola)

1. Di Claude Code, jalankan skill, mis. `/ngoding5-generate-problems jumlah=20 tema=rekursi level=Sulit topik="backtracking sederhana"`.
2. Skill menulis file, menjalankan `ngoding check`, dan mencatat `CHANGELOG-content.md`.
3. Review diff → commit → buka PR. CI (`.github/workflows/content-ci.yml`) menjalankan `ngoding check`.
4. Merge ke `main` → Vercel build otomatis → soal tayang.

Skill lain: `ngoding5-generate-quiz`, `ngoding5-update-problem`, `ngoding5-add-language`, `ngoding5-enrich`, `ngoding5-audit`.
Aturan konten bersama ada di `.claude/skills/CONTENT-GUIDE.md`.

## Deploy ke Vercel

Import repo di Vercel (preset Vite). `vercel.json` sudah mengatur build, rewrite SPA, cache `/assets` & `/data`, dan CSP.
Variabel opsional: `SITE_URL` (untuk `sitemap.xml`), `VITE_REPO_URL` (tautan "Soal ini salah?").

## Lisensi

Kode aplikasi: MIT. Lisensi konten soal: belum ditetapkan.
