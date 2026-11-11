## Ide

Anagram berarti "kantong huruf" keduanya sama. Bisa dicek dengan menghitung frekuensi (dictionary) atau mengurutkan hurufnya lalu membandingkan.

## Langkah

1. Normalisasi kedua string.
2. Hitung huruf di `a`, kurangi dengan huruf di `b`.
3. Jika ada yang kurang dari nol atau tidak ada → false.

## Kompleksitas

- Penghitungan: waktu O(n), ruang O(k).
- Pengurutan: waktu O(n log n).

## Variasi latihan

- Kelompokkan daftar kata menjadi grup-grup anagram.
