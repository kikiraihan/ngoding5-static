## Ide

Rekursi biasa membentuk pohon panggilan yang tumbuh eksponensial (≈ 1,6ⁿ). Dengan **memoisasi**, setiap F(k) dihitung sekali saja.

## Langkah

1. Basis: `n < 2` → `n`.
2. Jika `memo[n]` ada, pakai.
3. Hitung `F(n-1) + F(n-2)`, simpan ke memo.

Versi iteratif: geser pasangan `(a, b) → (b, a + b)` sebanyak n kali.

## Kompleksitas

- Memoisasi/iteratif: waktu O(n).
- Rekursi polos: O(φⁿ).

## Variasi latihan

- Kembalikan daftar n bilangan Fibonacci pertama.
