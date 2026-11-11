## Ide

Jika n punya pembagi selain 1 dan n, salah satu pembaginya pasti ≤ √n. Jadi cukup periksa sampai √n.

## Langkah

1. `n < 2` → false.
2. Untuk d dari 2 selama `d * d <= n`: jika habis dibagi → false.
3. true.

## Kompleksitas

- Waktu: O(√n).
- Ruang: O(1).

## Variasi latihan

- Saringan Eratosthenes: daftar semua prima ≤ n.
