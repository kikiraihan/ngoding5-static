## Ide

Telusuri string dengan dua penunjuk: `i` di awal kelompok, `j` maju selama karakternya sama. Panjang kelompok adalah `j - i`.

## Langkah

1. Mulai `i = 0`.
2. Majukan `j` selama `s[j] == s[i]`.
3. Tulis `s[i] + (j - i)`, lalu `i = j`.
4. Kembalikan hasil hanya jika lebih pendek dari asli.

## Kompleksitas

- Waktu: O(n), setiap karakter dilewati sekali.
- Ruang: O(n).

## Variasi latihan

- Tulis fungsi dekompresi: "a4b3c1" → "aaaabbbc".
