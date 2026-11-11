## Ide

Karena terurut, membandingkan dengan elemen tengah langsung memberi tahu separuh mana yang bisa dibuang. Ruang pencarian mengecil setengah setiap langkah.

## Langkah

1. `kiri = 0`, `kanan = n - 1`.
2. Selama `kiri <= kanan`: hitung `tengah`.
3. Sama → kembalikan; lebih kecil → `kiri = tengah + 1`; lebih besar → `kanan = tengah - 1`.
4. Kembalikan -1.

## Kompleksitas

- Waktu: O(log n).
- Ruang: O(1).

## Variasi latihan

- Cari posisi sisip (indeks tempat target seharusnya berada).
