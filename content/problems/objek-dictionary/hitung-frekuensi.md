## Ide

Dictionary sebagai "tabel hitung": kunci = kata, nilai = jumlah.

## Langkah

1. `hasil = {}`.
2. Untuk setiap kata: `hasil[k] = (hasil[k] ?? 0) + 1`.

## Kompleksitas

- Waktu: O(n).
- Ruang: O(k), k = jumlah kata unik.

## Variasi latihan

- Kembalikan kata yang paling sering muncul.
