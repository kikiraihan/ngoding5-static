## Ide

Algoritma Kadane: subarray terbaik yang berakhir di posisi `i` adalah `arr[i]` sendiri, atau subarray terbaik yang berakhir di `i-1` ditambah `arr[i]`. Ambil yang lebih besar.

## Langkah

1. `saatIni = terbaik = arr[0]`.
2. Untuk i ≥ 1: `saatIni = max(arr[i], saatIni + arr[i])`, `terbaik = max(terbaik, saatIni)`.

## Kompleksitas

- Kadane: waktu O(n), ruang O(1).
- Coba semua pasangan (i, j): waktu O(n²).

## Variasi latihan

- Kembalikan juga indeks awal dan akhir subarray.
