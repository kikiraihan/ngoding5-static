## Ide

Pola **akumulator**: mulai dari 0 lalu tambahkan sedikit demi sedikit. Alternatifnya rumus Gauss `n(n+1)/2`.

## Langkah

1. `total = 0`.
2. Untuk `i` dari 1 sampai `n` (inklusif), `total += i`.
3. Kembalikan `total`. Untuk n < 1 perulangan tidak berjalan sehingga hasilnya 0.

## Kompleksitas

- Perulangan: waktu O(n), ruang O(1).
- Rumus: waktu O(1).

## Variasi latihan

- Jumlahkan hanya bilangan genap.
- Jumlah kuadrat 1² + 2² + … + n².
