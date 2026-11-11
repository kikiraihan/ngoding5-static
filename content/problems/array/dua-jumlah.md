## Ide

Untuk setiap posisi `j`, pasangannya adalah `target - arr[j]`. Jika nilai itu sudah pernah muncul di kiri, kita selesai. Dictionary membuat pengecekan "pernah muncul" menjadi O(1).

## Langkah

1. `lihat = {}` (nilai → indeks pertama).
2. Untuk `j` dari 0: jika `target - arr[j]` ada di `lihat`, kembalikan `[lihat[...], j]`.
3. Simpan `arr[j]` hanya jika belum ada (agar indeks terkecil terjaga).

## Kompleksitas

- Dengan dictionary: waktu O(n), ruang O(n).
- Dua perulangan: waktu O(n²), ruang O(1).

## Variasi latihan

- Kembalikan semua pasangan unik.
- Versi array terurut dengan dua penunjuk.
