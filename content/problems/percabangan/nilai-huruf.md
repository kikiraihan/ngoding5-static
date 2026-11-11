## Ide

Validasi dulu, baru klasifikasikan dari batas tertinggi ke terendah. Karena cabang sebelumnya sudah menyaring nilai yang lebih tinggi, setiap cabang cukup memakai `>=` saja.

## Langkah

1. Kembalikan "Tidak valid" bila `nilai < 0` atau `nilai > 100`.
2. Cek `>= 85`, `>= 70`, `>= 55`, `>= 40` berurutan.
3. Sisanya "E".

## Kompleksitas

- Waktu: O(1).
- Ruang: O(1).

## Variasi latihan

- Simpan batas dalam daftar pasangan (batas, huruf) agar mudah diubah.
