## Ide

Setiap fungsi rekursif butuh **basis** (kapan berhenti) dan **langkah** yang mendekati basis. Di sini `n` berkurang 1 setiap panggilan sampai 0.

## Langkah

1. Jika `n == 0` kembalikan 1.
2. Kembalikan `a * pangkat(a, n - 1)`.

Versi cepat: `aⁿ = (a^(n/2))²`, dikali `a` sekali lagi bila n ganjil.

## Kompleksitas

- Versi sederhana: waktu O(n), ruang O(n) (tumpukan panggilan).
- Versi cepat: O(log n).

## Variasi latihan

- Dukung n negatif (hasil pecahan).
