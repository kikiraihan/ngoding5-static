## Ide

Fungsi `x → x²` naik monoton, jadi kita bisa memakai **pencarian biner** pada jawaban: cari x terbesar yang masih `x*x <= n`.

Alternatif: metode Newton bilangan bulat `x = (x + n // x) // 2` yang konvergen sangat cepat.

## Langkah

1. `lo = 0`, `hi = n`.
2. Tengah `mid`: jika `mid² <= n`, simpan sebagai jawaban dan cari ke kanan; jika tidak, ke kiri.

## Kompleksitas

- Waktu: O(log n).
- Ruang: O(1).

## Variasi latihan

- Akar pangkat tiga bulat.
- Cek apakah n bilangan kuadrat sempurna.
