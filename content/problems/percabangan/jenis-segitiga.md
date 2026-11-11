## Ide

Validasi lebih dulu, baru klasifikasi. Trik: urutkan sisi menjadi x ≤ y ≤ z, maka cukup cek `x > 0` dan `x + y > z`.

## Langkah

1. Urutkan tiga sisi.
2. Jika sisi terkecil ≤ 0 atau `x + y <= z` → "bukan segitiga".
3. Jika x == z (berarti ketiganya sama) → "sama sisi".
4. Jika ada dua yang sama → "sama kaki", selain itu "sembarang".

## Kompleksitas

- Waktu: O(1).
- Ruang: O(1).

## Variasi latihan

- Tambahkan deteksi segitiga siku-siku dengan Pythagoras.
