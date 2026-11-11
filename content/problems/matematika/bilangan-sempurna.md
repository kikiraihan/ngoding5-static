## Ide

Jumlahkan pembagi sejati. Agar cepat, manfaatkan pasangan pembagi `(d, n/d)` sehingga cukup sampai √n.

## Langkah

1. n < 2 → false (1 tidak punya pembagi sejati selain... tidak ada).
2. `total = 1`; untuk d = 2..√n yang membagi n, tambahkan d dan n/d (sekali saja jika sama).
3. Bandingkan dengan n.

## Kompleksitas

- Waktu: O(√n).
- Ruang: O(1).

## Variasi latihan

- Klasifikasikan bilangan: berlimpah, sempurna, atau kurang.
