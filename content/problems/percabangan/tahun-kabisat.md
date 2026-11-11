## Ide

Urutkan aturan dari yang paling khusus: 400, lalu 100, lalu 4. Atau gabungkan dalam satu ekspresi boolean.

## Langkah

1. Jika habis dibagi 400 → kabisat.
2. Jika habis dibagi 100 → bukan kabisat.
3. Selain itu, kabisat jika habis dibagi 4.

Bentuk satu baris: `t % 4 == 0 and (t % 100 != 0 or t % 400 == 0)`.

## Kompleksitas

- Waktu: O(1).
- Ruang: O(1).

## Variasi latihan

- Hitung jumlah hari pada bulan tertentu di tahun tertentu.
