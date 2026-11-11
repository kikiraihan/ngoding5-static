## Ide

Ambil digit satu per satu dari belakang dengan `% 10`, lalu buang digit itu dengan pembagian bulat `// 10`. Alternatif: ubah ke string lalu jumlahkan tiap karakter.

## Langkah

1. `n = |n|`.
2. Selama `n > 0`: tambahkan `n % 10`, lalu `n = floor(n / 10)`.
3. Kembalikan total.

## Kompleksitas

- Waktu: O(d), d = jumlah digit.
- Ruang: O(1).

## Variasi latihan

- Akar digital: ulangi penjumlahan digit sampai tersisa satu digit.
