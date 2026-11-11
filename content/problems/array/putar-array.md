## Ide

Putaran ke kanan sebanyak k sama dengan memindahkan k elemen terakhir ke depan. Karena memutar n kali kembali ke awal, cukup `k % n`.

## Langkah

1. Jika kosong, kembalikan [].
2. `k = k % n`.
3. Gabungkan `arr[n-k:]` dengan `arr[:n-k]`.

## Kompleksitas

- Waktu: O(n).
- Ruang: O(n).

## Variasi latihan

- Putar ke kiri.
- Putar di tempat (in-place) dengan trik membalik tiga kali.
