## Ide

Array terurut naik jika **setiap** pasangan bertetangga terurut. Satu pasangan salah cukup untuk menjawab false.

## Langkah

1. Untuk `i` dari 0 sampai `n-2`: jika `arr[i] > arr[i+1]` kembalikan false.
2. Kembalikan true.

## Kompleksitas

- Waktu: O(n).
- Ruang: O(1).

## Variasi latihan

- Deteksi terurut naik **atau** turun.
