## Ide

Elemen besar "menggelembung" ke kanan lewat pertukaran bertetangga. Setelah putaran ke-i, i elemen terakhir sudah di tempatnya.

## Langkah

1. Salin array.
2. Untuk i = 0..n-2: untuk j = 0..n-2-i, tukar jika `a[j] > a[j+1]`.
3. Jika satu putaran tanpa pertukaran, berhenti.

## Kompleksitas

- Waktu: O(n²) terburuk, O(n) terbaik (sudah terurut).
- Ruang: O(n) untuk salinan.

## Variasi latihan

- Urutkan turun.
- Hitung jumlah pertukaran yang terjadi.
